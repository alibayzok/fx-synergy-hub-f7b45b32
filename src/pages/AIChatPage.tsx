import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Send, ArrowRight, ArrowLeft, Sparkles, 
  Loader2, Trash2, User
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const AIChatPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getBoolean } = useAppSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const isArabic = i18n.language === 'ar';
  const BackArrow = isArabic ? ArrowRight : ArrowLeft;
  const enabled = getBoolean('enable_ai_chat', true);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (!enabled) navigate('/', { replace: true });
  }, [enabled, navigate]);

  if (!enabled) return null;

  const streamChat = async (userMessages: Message[]) => {
    // Get the user's actual session token for authentication
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ 
        messages: userMessages.map(m => ({ role: m.role, content: m.content })) 
      }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      if (resp.status === 429) {
        toast.error(t('ai.rateLimitError'));
        throw new Error('Rate limit exceeded');
      }
      if (resp.status === 402) {
        toast.error(t('ai.paymentError'));
        throw new Error('Payment required');
      }
      throw new Error(errorData.error || 'Failed to start stream');
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";
    const assistantId = `assistant-${Date.now()}`;

    // Add empty assistant message
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => 
              prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m)
            );
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => 
              prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m)
            );
          }
        } catch { /* ignore */ }
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      await streamChat(newMessages);
    } catch (error) {
      console.error('Chat error:', error);
      if (!(error instanceof Error && (error.message.includes('Rate limit') || error.message.includes('Payment')))) {
        toast.error(t('ai.error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const suggestedQuestions = [
    t('ai.suggestion1'),
    t('ai.suggestion2'),
    t('ai.suggestion3'),
  ];

  return (
    <AppLayout showNotifications={false}>
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <BackArrow className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">{t('ai.title')}</h1>
                <p className="text-xs text-muted-foreground">{t('ai.subtitle')}</p>
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={clearChat}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-col h-[calc(100vh-180px)]">
        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center py-12"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">{t('ai.welcome')}</h2>
              <p className="text-muted-foreground text-sm max-w-xs mb-6">{t('ai.welcomeDesc')}</p>
              
              <div className="space-y-2 w-full max-w-sm">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className="w-full p-3 text-sm text-start rounded-xl bg-card/50 border border-border/30 hover:bg-muted/50 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <AnimatePresence>
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3",
                      message.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className={cn(
                        message.role === 'user' 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-gradient-to-br from-primary to-primary/60 text-primary-foreground"
                      )}>
                        {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      message.role === 'user'
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    )}>
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{message.content || '...'}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </motion.div>
                )}
              </div>
            </AnimatePresence>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border/30 bg-background/80 backdrop-blur-sm">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('ai.placeholder')}
              className="flex-1 min-h-[44px] max-h-[150px] resize-none"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-11 w-11"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            {t('ai.disclaimer')}
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default AIChatPage;
