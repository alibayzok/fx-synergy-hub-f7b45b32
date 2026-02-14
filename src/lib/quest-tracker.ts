import { supabase } from '@/integrations/supabase/client';

/**
 * Fire-and-forget quest progress tracking.
 * Does not block the calling action or throw errors.
 */
export const trackQuestProgress = async (userId: string, questKey: string, increment = 1) => {
  try {
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
