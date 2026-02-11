import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Video, ArrowLeft, Calendar, Users, Play, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLiveSessions, LiveSession } from '@/hooks/useLiveSessions';
import { LiveSessionViewer } from '@/components/live/LiveSessionViewer';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const LiveSessionsPage = () => {
  const { t, i18n } = useTranslation();
  const { user, isVip, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isArabic = i18n.language === 'ar';
  const { sessions, isLoading } = useLiveSessions();
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);

  const isVipUser = isVip || isAdmin;

  const liveSessions = sessions.filter(s => s.status === 'live');
  const scheduledSessions = sessions.filter(s => s.status === 'scheduled');

  if (selectedSession) {
    return (
      <AppLayout>
        <LiveSessionViewer
          session={selectedSession}
          onBack={() => setSelectedSession(null)}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <header className="sticky top-0 z-30 glass-card border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Video className="w-5 h-5 text-red-500" />
          <h1 className="text-xl font-bold text-foreground">
            {isArabic ? 'البث المباشر' : 'Live Sessions'}
          </h1>
        </div>
      </header>

      <div className="px-4 py-4 pb-24 space-y-6">
        {/* Live Now */}
        {liveSessions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="font-bold text-foreground">
                {isArabic ? 'مباشر الآن' : 'Live Now'}
              </h2>
            </div>
            {liveSessions.map((session, i) => (
              <SessionCard
                key={session.id}
                session={session}
                isArabic={isArabic}
                isLocked={session.is_vip && !isVipUser}
                onClick={() => {
                  if (session.is_vip && !isVipUser) return;
                  setSelectedSession(session);
                }}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Scheduled */}
        <div>
          <h2 className="font-bold text-foreground mb-3">
            {isArabic ? 'الجلسات القادمة' : 'Upcoming Sessions'}
          </h2>
          {scheduledSessions.length === 0 && liveSessions.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Video className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {isArabic ? 'لا توجد جلسات مجدولة حالياً' : 'No scheduled sessions'}
              </p>
            </div>
          )}
          {scheduledSessions.map((session, i) => (
            <SessionCard
              key={session.id}
              session={session}
              isArabic={isArabic}
              isLocked={session.is_vip && !isVipUser}
              onClick={() => {}}
              index={i}
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

function SessionCard({
  session,
  isArabic,
  isLocked,
  onClick,
  index,
}: {
  session: LiveSession;
  isArabic: boolean;
  isLocked: boolean;
  onClick: () => void;
  index: number;
}) {
  const isLive = session.status === 'live';

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      disabled={isLocked}
      className={cn(
        'w-full p-4 rounded-xl border text-start mb-3 transition-all',
        isLive ? 'bg-red-500/5 border-red-500/20' : 'bg-card border-border/50',
        isLocked ? 'opacity-60' : 'hover:border-primary/30'
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10 mt-0.5">
          <AvatarImage src={session.host_avatar || ''} />
          <AvatarFallback>{(session.host_name || '?')[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">
              {isArabic ? session.title_ar : session.title_en}
            </h3>
            {isLive && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                🔴 LIVE
              </Badge>
            )}
            {session.is_vip && (
              <Badge className="text-[10px] px-1.5 py-0 bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                👑 VIP
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {isArabic ? session.description_ar : session.description_en}
          </p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {session.host_name}
            </span>
            {session.scheduled_at && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(session.scheduled_at).toLocaleString(isArabic ? 'ar' : 'en', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
            {isLive && (
              <span className="flex items-center gap-1 text-red-500">
                <Play className="w-3 h-3" />
                {session.current_viewers} {isArabic ? 'مشاهد' : 'viewers'}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export default LiveSessionsPage;
