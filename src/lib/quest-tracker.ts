import { supabase } from '@/integrations/supabase/client';

/**
 * Fire-and-forget quest progress tracking.
 * Only works for verified accounts (kyc_status === 'approved').
 * Does not block the calling action or throw errors.
 */
export const trackQuestProgress = async (userId: string, questKey: string, increment = 1) => {
  try {
    // Check if user account is verified before tracking points
    const { data: profile } = await supabase
      .from('profiles')
      .select('kyc_status')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile || profile.kyc_status !== 'approved') {
      console.debug('Quest tracking skipped: account not verified', questKey);
      return;
    }

    await supabase.rpc('increment_quest_progress', {
      p_user_id: userId,
      p_quest_key: questKey,
      p_increment: increment
    });
  } catch (err) {
    // Silent fail - quest tracking should never block user actions
    console.debug('Quest tracking failed:', questKey, err);
  }
};
