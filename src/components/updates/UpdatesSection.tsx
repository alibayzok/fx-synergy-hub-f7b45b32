import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, ChevronDown, ChevronUp, Clock, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatFullDateTime } from '@/lib/date-utils';
import type { SignalUpdate } from '@/hooks/useSignalUpdates';

interface UpdatesSectionProps {
  updates: SignalUpdate[];
  language: string;
  /** If provided, shows "Add Update" form (admin only) */
  onAddUpdate?: (content: string) => Promise<boolean>;
}

export const UpdatesSection = ({ updates, language, onAddUpdate }: UpdatesSectionProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);

  if (updates.length === 0 && !onAddUpdate) return null;

  const handleSubmit = async () => {
    if (!newContent.trim() || !onAddUpdate) return;
    setSaving(true);
    const ok = await onAddUpdate(newContent.trim());
    if (ok) { setNewContent(''); setShowForm(false); }
    setSaving(false);
  };

  return (
    <div className="mt-2">
      {/* Toggle button */}
      {updates.length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span>{updates.length} تحديث{updates.length > 1 ? 'ات' : ''}</span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2 border-s-2 border-primary/20 ps-3 ms-1">
              {updates.map((update, idx) => (
                <motion.div
                  key={update.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative"
                >
                  {/* Dot on the border */}
                  <div className="absolute -start-[calc(0.75rem+5px)] top-2 w-2 h-2 rounded-full bg-primary/60" />
                  
                  <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                      {update.content}
                    </p>
                    {update.attachments && update.attachments.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {update.attachments.map((url, i) => (
                          <img key={i} src={url} alt="" className="h-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition" />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground/60">
                      <Clock className="w-3 h-3" />
                      {formatFullDateTime(update.created_at, language)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin add update */}
      {onAddUpdate && (
        <div className="mt-2">
          {!showForm ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowForm(true); setExpanded(true); }}
              className="gap-1.5 text-xs h-7 text-primary/70 hover:text-primary"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              إضافة تحديث
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/30"
            >
              <Textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="اكتب التحديث..."
                rows={2}
                className="text-sm rounded-lg"
              />
              <div className="flex items-center gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="h-7 text-xs">
                  إلغاء
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={saving || !newContent.trim()} className="h-7 text-xs gap-1">
                  <Send className="w-3 h-3" />
                  {saving ? 'جاري...' : 'نشر'}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
