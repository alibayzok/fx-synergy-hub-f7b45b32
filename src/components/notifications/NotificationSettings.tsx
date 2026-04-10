import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Volume2, VolumeX, Smartphone, MessageSquare, Heart, TrendingUp, UserPlus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  isNotificationSoundEnabled, 
  setNotificationSoundEnabled,
  getNotificationVolume,
  setNotificationVolume,
  testNotificationSound,
  NotificationSoundType
} from '@/lib/notification-sound';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  isPushNotificationsEnabled,
  setPushNotificationsEnabled
} from '@/lib/push-notifications';
import { isNativePlatform } from '@/lib/capacitor-push';
import { toast } from 'sonner';

interface SoundTestButton {
  type: NotificationSoundType;
  icon: typeof MessageSquare;
  labelKey: string;
}

export const NotificationSettings = () => {
  const { t } = useTranslation();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const isNative = isNativePlatform();
  const pushSupported = isNative || isPushSupported();

  useEffect(() => {
    setSoundEnabled(isNotificationSoundEnabled());
    setVolume(getNotificationVolume());
    setPushEnabled(isPushNotificationsEnabled());
    if (isNative) {
      // Native platforms use Capacitor Push - permission is handled separately
      setPushPermission('granted');
    } else {
      setPushPermission(getNotificationPermission());
    }
  }, []);

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    setNotificationSoundEnabled(enabled);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setNotificationVolume(newVolume);
  };

  const handleTestSound = async (type: NotificationSoundType = 'default') => {
    await testNotificationSound(type);
  };

  // Sound test buttons configuration
  const soundTestButtons: SoundTestButton[] = [
    { type: 'message', icon: MessageSquare, labelKey: 'notifications.soundMessage' },
    { type: 'comment', icon: MessageSquare, labelKey: 'notifications.soundComment' },
    { type: 'like', icon: Heart, labelKey: 'notifications.soundLike' },
    { type: 'trade', icon: TrendingUp, labelKey: 'notifications.soundTrade' },
    { type: 'friend', icon: UserPlus, labelKey: 'notifications.soundFriend' },
  ];

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled && pushPermission !== 'granted') {
      const permission = await requestNotificationPermission();
      setPushPermission(permission);
      
      if (permission !== 'granted') {
        toast.error(t('notifications.permissionDenied'));
        return;
      }
    }
    
    setPushEnabled(enabled);
    setPushNotificationsEnabled(enabled);
  };

  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    setPushPermission(permission);
    
    if (permission === 'granted') {
      toast.success(t('notifications.permissionGranted'));
      setPushEnabled(true);
      setPushNotificationsEnabled(true);
    } else if (permission === 'denied') {
      toast.error(t('notifications.permissionDenied'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {t('notifications.settings')}
        </CardTitle>
        <CardDescription>
          {t('notifications.settingsDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sound Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <Label htmlFor="sound-toggle">{t('notifications.soundEnabled')}</Label>
            </div>
            <Switch
              id="sound-toggle"
              checked={soundEnabled}
              onCheckedChange={handleSoundToggle}
            />
          </div>
          
          {soundEnabled && (
            <div className="space-y-4">
              <Label className="text-sm text-muted-foreground">
                {t('notifications.volume')}
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-8">
                  {Math.round(volume * 100)}%
                </span>
              </div>

              {/* Sound Test Buttons */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  {t('notifications.testSounds')}
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {soundTestButtons.map(({ type, icon: Icon, labelKey }) => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 text-xs"
                      onClick={() => handleTestSound(type)}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t(labelKey)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Push Notifications */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <Label htmlFor="push-toggle">{t('notifications.pushEnabled')}</Label>
            </div>
            {pushSupported ? (
              <Switch
                id="push-toggle"
                checked={pushEnabled && pushPermission === 'granted'}
                onCheckedChange={handlePushToggle}
                disabled={pushPermission === 'denied'}
              />
            ) : (
              <span className="text-xs text-muted-foreground">
                {t('notifications.notSupported')}
              </span>
            )}
          </div>

          {pushSupported && pushPermission === 'default' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRequestPermission}
              className="w-full"
            >
              {t('notifications.requestPermission')}
            </Button>
          )}

          {pushSupported && pushPermission === 'denied' && (
            <p className="text-xs text-destructive">
              {t('notifications.permissionDeniedHelp')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
