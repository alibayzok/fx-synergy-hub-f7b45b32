import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MARQETA_APP_TOKEN = Deno.env.get('MARQETA_APP_TOKEN')!;
const MARQETA_ADMIN_TOKEN = Deno.env.get('MARQETA_ADMIN_TOKEN')!;
const MARQETA_BASE_URL = Deno.env.get('MARQETA_BASE_URL') || 'https://sandbox-api.marqeta.com/v3';

function marqetaHeaders() {
  const credentials = btoa(`${MARQETA_APP_TOKEN}:${MARQETA_ADMIN_TOKEN}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
  };
}

async function marqetaFetch(path: string, options: RequestInit = {}) {
  const url = `${MARQETA_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...marqetaHeaders(), ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Marqeta API error [${res.status}]: ${JSON.stringify(data)}`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!MARQETA_APP_TOKEN || !MARQETA_ADMIN_TOKEN) {
      throw new Error('Marqeta API credentials not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email || `user_${userId.substring(0, 8)}@placeholder.com`;

    const { action, ...params } = await req.json();

    let result;

    switch (action) {
      case 'create_user': {
        const emailToUse = params.email || userEmail;

        // Try to find existing user by email first
        const existing = await marqetaFetch(`/users?email=${encodeURIComponent(emailToUse)}&count=1`, { method: 'GET' });
        const existingUser = existing?.data?.[0];

        if (existingUser?.token) {
          result = { user_token: existingUser.token };
          break;
        }

        // Create a Marqeta user
        const marqetaUser = await marqetaFetch('/users', {
          method: 'POST',
          body: JSON.stringify({
            first_name: params.first_name || 'User',
            last_name: params.last_name || userId.substring(0, 8),
            email: emailToUse,
            active: true,
          }),
        });
        result = { user_token: marqetaUser.token };
        break;
      }

      case 'create_card': {
        // Get or create marqeta user
        let marqetaUserToken = params.marqeta_user_token;

        // Try to reuse existing token from our database
        if (!marqetaUserToken) {
          const { data: existingCards } = await supabase
            .from('virtual_cards')
            .select('marqeta_user_token')
            .eq('user_id', userId)
            .not('marqeta_user_token', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1);

          const existingToken = existingCards?.[0]?.marqeta_user_token as string | undefined;
          if (existingToken) marqetaUserToken = existingToken;
        }

        if (!marqetaUserToken) {
          const emailToUse = params.email || userEmail;

          // Find existing Marqeta user by email (avoids duplicate-email error)
          const existing = await marqetaFetch(`/users?email=${encodeURIComponent(emailToUse)}&count=1`, { method: 'GET' });
          const existingUser = existing?.data?.[0];

          if (existingUser?.token) {
            marqetaUserToken = existingUser.token;
          } else {
            // Create user in Marqeta
            const marqetaUser = await marqetaFetch('/users', {
              method: 'POST',
              body: JSON.stringify({
                first_name: params.first_name || 'User',
                last_name: params.last_name || '',
                email: emailToUse,
                active: true,
              }),
            });
            marqetaUserToken = marqetaUser.token;
          }
        }

        // Get or create card product token
        let cardProductToken = params.card_product_token;
        if (!cardProductToken) {
          // Try to list existing card products
          const products = await marqetaFetch('/cardproducts?count=10', { method: 'GET' });
          if (products.data && products.data.length > 0) {
            cardProductToken = products.data[0].token;
          } else {
            // Create a default card product
            const newProduct = await marqetaFetch('/cardproducts', {
              method: 'POST',
              body: JSON.stringify({
                name: 'Virtual Card',
                start_date: new Date().toISOString().split('T')[0],
                config: {
                  fulfillment: { payment_instrument: 'VIRTUAL_PAN' },
                  poi: { ecommerce: true },
                  card_life_cycle: { activate_upon_issue: true },
                },
              }),
            });
            cardProductToken = newProduct.token;
          }
        }

        // Create virtual card
        const card = await marqetaFetch('/cards', {
          method: 'POST',
          body: JSON.stringify({
            user_token: marqetaUserToken,
            card_product_token: cardProductToken,
          }),
        });

        // Save to database
        const { data: cardData, error: dbError } = await supabase
          .from('virtual_cards')
          .insert({
            user_id: userId,
            marqeta_card_token: card.token,
            marqeta_user_token: marqetaUserToken,
            card_last_four: card.last_four,
            card_status: 'active',
            nickname: params.nickname || 'بطاقتي الافتراضية',
            spending_limit: params.spending_limit || 1000,
          })
          .select()
          .single();

        if (dbError) throw dbError;
        result = { card: cardData, marqeta_card: card };
        break;
      }

      case 'list_cards': {
        const { data: cards, error } = await supabase
          .from('virtual_cards')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        result = { cards };
        break;
      }

      case 'get_card_details': {
        // Get card from DB
        const { data: card, error } = await supabase
          .from('virtual_cards')
          .select('*')
          .eq('id', params.card_id)
          .eq('user_id', userId)
          .single();
        if (error) throw error;

        // Get details from Marqeta
        let marqetaDetails = null;
        if (card.marqeta_card_token) {
          try {
            marqetaDetails = await marqetaFetch(`/cards/${card.marqeta_card_token}/showpan?show_cvv_number=true`);
          } catch (e) {
            console.error('Failed to get Marqeta card details:', e);
          }
        }

        result = { card, marqeta_details: marqetaDetails };
        break;
      }

      case 'freeze_card': {
        const { data: card, error } = await supabase
          .from('virtual_cards')
          .select('*')
          .eq('id', params.card_id)
          .eq('user_id', userId)
          .single();
        if (error) throw error;

        if (card.marqeta_card_token) {
          await marqetaFetch(`/cards/${card.marqeta_card_token}/transitions`, {
            method: 'POST',
            body: JSON.stringify({
              card_token: card.marqeta_card_token,
              channel: 'API',
              state: 'SUSPENDED',
              reason_code: '01',
            }),
          });
        }

        await supabase
          .from('virtual_cards')
          .update({ card_status: 'frozen' })
          .eq('id', params.card_id);

        result = { success: true, status: 'frozen' };
        break;
      }

      case 'unfreeze_card': {
        const { data: card, error } = await supabase
          .from('virtual_cards')
          .select('*')
          .eq('id', params.card_id)
          .eq('user_id', userId)
          .single();
        if (error) throw error;

        if (card.marqeta_card_token) {
          await marqetaFetch(`/cards/${card.marqeta_card_token}/transitions`, {
            method: 'POST',
            body: JSON.stringify({
              card_token: card.marqeta_card_token,
              channel: 'API',
              state: 'ACTIVE',
              reason_code: '01',
            }),
          });
        }

        await supabase
          .from('virtual_cards')
          .update({ card_status: 'active' })
          .eq('id', params.card_id);

        result = { success: true, status: 'active' };
        break;
      }

      case 'cancel_card': {
        const { data: card, error } = await supabase
          .from('virtual_cards')
          .select('*')
          .eq('id', params.card_id)
          .eq('user_id', userId)
          .single();
        if (error) throw error;

        if (card.marqeta_card_token) {
          await marqetaFetch(`/cards/${card.marqeta_card_token}/transitions`, {
            method: 'POST',
            body: JSON.stringify({
              card_token: card.marqeta_card_token,
              channel: 'API',
              state: 'TERMINATED',
              reason_code: '01',
            }),
          });
        }

        await supabase
          .from('virtual_cards')
          .update({ card_status: 'cancelled' })
          .eq('id', params.card_id);

        result = { success: true, status: 'cancelled' };
        break;
      }

      case 'get_transactions': {
        const { data: card, error } = await supabase
          .from('virtual_cards')
          .select('*')
          .eq('id', params.card_id)
          .eq('user_id', userId)
          .single();
        if (error) throw error;

        let transactions = [];
        if (card.marqeta_user_token) {
          try {
            const txData = await marqetaFetch(`/transactions?user_token=${card.marqeta_user_token}&count=20`);
            transactions = txData.data || [];
          } catch (e) {
            console.error('Failed to get transactions:', e);
          }
        }

        result = { transactions };
        break;
      }

      case 'fund_card': {
        // Admin-only: Fund a card via GPA Orders (called after admin approves funding request)
        const { data: card, error } = await supabase
          .from('virtual_cards')
          .select('*')
          .eq('id', params.card_id)
          .single();
        if (error) throw error;

        if (!card.marqeta_user_token) {
          throw new Error('Card has no Marqeta user token');
        }

        // Create GPA Order to fund the card
        const gpaOrder = await marqetaFetch('/gpaorders', {
          method: 'POST',
          body: JSON.stringify({
            user_token: card.marqeta_user_token,
            amount: params.amount,
            currency_code: card.currency || 'USD',
            funding_source_token: params.funding_source_token || undefined,
            memo: params.memo || `Card funding - ${params.amount} USD via USDT`,
          }),
        });

        result = { success: true, gpa_order: gpaOrder };
        break;
      }

      case 'get_balance': {
        const { data: card, error } = await supabase
          .from('virtual_cards')
          .select('*')
          .eq('id', params.card_id)
          .eq('user_id', userId)
          .single();
        if (error) throw error;

        let balance = null;
        if (card.marqeta_user_token) {
          try {
            balance = await marqetaFetch(`/balances/${card.marqeta_user_token}`);
          } catch (e) {
            console.error('Failed to get balance:', e);
          }
        }

        result = { balance };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Marqeta cards error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
