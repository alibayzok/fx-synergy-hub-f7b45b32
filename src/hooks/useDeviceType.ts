import { useState, useEffect } from 'react';

const DESKTOP_BREAKPOINT = 1024;

export type DeviceType = 'desktop' | 'mobile';

function isNative(): boolean {
  try {
    // Check if Capacitor is available on window
    return !!(window as any)?.Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
}

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    if (isNative()) return 'mobile';
    if (typeof window !== 'undefined') {
      return window.innerWidth >= DESKTOP_BREAKPOINT ? 'desktop' : 'mobile';
    }
    return 'mobile';
  });

  useEffect(() => {
    if (isNative()) return;

    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const onChange = () => {
      setDeviceType(mql.matches ? 'desktop' : 'mobile');
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return deviceType;
}
