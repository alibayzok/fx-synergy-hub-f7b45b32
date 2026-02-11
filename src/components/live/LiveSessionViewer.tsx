import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Send, Users, Pin } from 'lucide-react';
import { LiveSession, useLiveSessionChat } from '@/hooks/useLiveSessions';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Props {
  session: LiveSession;
  onBack: () => void;
}

export const LiveSessionViewer = ({ session, onBack }: Props) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isArabic = i18n.language === 'ar';
  const [message, setMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage } = useLiveSessionChat(session.id);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage(message);
    setMessage('');
  };

  // Extract YouTube embed URL
  const getEmbedUrl = (url: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/))([^&?]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
    return url;
  };

  const embedUrl = getEmbedUrl(session.stream_url);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-card border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-2">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-foreground truncate">
              {isArabic ? session.title_ar : session.title_en}
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>{isArabic ? 'مباشر' : 'LIVE'}</span>
              <Users className="w-3 h-3" />
              <span>{session.current_viewers}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Video Player */}
      <div className="w-full aspect-video bg-black">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            {isArabic ? 'بانتظار بدء البث...' : 'Waiting for stream...'}
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-3 py-2 border-b border-border/30">
          <h3 className="text-xs font-semibold text-muted-foreground">
            💬 {isArabic ? 'الدردشة المباشرة' : 'Live Chat'}
          </h3>
        </div>

        <ScrollArea className="flex-1 px-3 py-2">
          <div className="space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className={cn(
                'flex gap-2 items-start',
                msg.is_pinned && 'bg-primary/5 p-2 rounded-lg border border-primary/20'
              )}>
                <Avatar className="w-6 h-6 mt-0.5 shrink-0">
                  <AvatarImage src={msg.user_avatar || ''} />
                  <AvatarFallback className="text-[8px]">
                    {(msg.user_name || '?')[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-primary">
                    {msg.user_name}
                  </span>
                  {msg.is_pinned && <Pin className="w-2.5 h-2.5 inline text-primary mx-1" />}
                  <p className="text-xs text-foreground break-words">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-3 border-t border-border/30">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isArabic ? 'اكتب رسالة...' : 'Type a message...'}
              className="flex-1 h-9 text-sm"
            />
            <Button type="submit" size="sm" className="h-9 px-3" disabled={!message.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
