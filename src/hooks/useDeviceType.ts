import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

const DESKTOP_BREAKPOINT = 1024;

export type DeviceType = 'desktop' | 'mobile';

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    // If running as native app (APK), always mobile
    if (Capacitor.isNativePlatform()) return 'mobile';
    // Check initial width
    if (typeof window !== 'undefined') {
      return window.innerWidth >= DESKTOP_BREAKPOINT ? 'desktop' : 'mobile';
    }
    return 'mobile';
  });

  useEffect(() => {
    // Native platform = always mobile, no need to listen
    if (Capacitor.isNativePlatform()) return;

    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const onChange = () => {
      setDeviceType(mql.matches ? 'desktop' : 'mobile');
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return deviceType;
}
