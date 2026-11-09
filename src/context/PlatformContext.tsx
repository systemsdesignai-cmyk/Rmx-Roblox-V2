import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export type PlatformType = 'ios' | 'android' | 'web';
export type PlatformMode = 'auto' | 'ios' | 'android';

export interface PlatformTokens {
  // Touch hitboxes
  minTouchTarget: string; // 'min-h-[44px] min-w-[44px]' for iOS, 'min-h-[48px] min-w-[48px]' for Android
  
  // Surfaces & Materials
  headerBg: string;
  headerBorder: string;
  navBarBg: string;
  navBarHeight: string;
  
  // Shapes & Elevation
  cardRadius: string;
  modalRadius: string;
  cardElevation: string;
  
  // Typography font family preferences
  fontFamily: string;
  titleTracking: string;
}

interface PlatformContextValue {
  platform: PlatformType; // Resolved platform (ios | android | web)
  platformMode: PlatformMode; // User choice (auto | ios | android)
  setPlatformMode: (mode: PlatformMode) => void;
  isIOS: boolean;
  isAndroid: boolean;
  isTouch: boolean;
  tokens: PlatformTokens;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

function detectNativePlatform(): PlatformType {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'web';
  }

  // 1. Check User Agent Data if available (Chromium on Android / Modern browsers)
  const nav = navigator as any;
  if (nav.userAgentData?.platform) {
    const p = String(nav.userAgentData.platform).toLowerCase();
    if (p.includes('android')) return 'android';
    if (p.includes('ios') || p.includes('iphone') || p.includes('ipad')) return 'ios';
  }

  // 2. User Agent Regex inspection
  const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || '').toLowerCase();
  
  // iOS detection (iPhone, iPod, iPad, or iPadOS desktop UA with touch points)
  const isApple = /iphone|ipad|ipod/.test(ua) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isApple) return 'ios';

  // Android detection
  if (/android/.test(ua)) return 'android';

  return 'web';
}

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [platformMode, setPlatformModeState] = useState<PlatformMode>(() => {
    try {
      const saved = localStorage.getItem('rolodox_platform_mode_v1');
      if (saved === 'ios' || saved === 'android' || saved === 'auto') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'auto';
  });

  const [detectedPlatform, setDetectedPlatform] = useState<PlatformType>(() => detectNativePlatform());
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setDetectedPlatform(detectNativePlatform());
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const setPlatformMode = (mode: PlatformMode) => {
    setPlatformModeState(mode);
    try {
      localStorage.setItem('rolodox_platform_mode_v1', mode);
    } catch {
      // ignore
    }
  };

  // Resolved active platform
  const activePlatform: PlatformType = useMemo(() => {
    if (platformMode === 'ios') return 'ios';
    if (platformMode === 'android') return 'android';
    // When auto, if on desktop web default to iOS aesthetic or detected platform
    if (detectedPlatform === 'ios') return 'ios';
    if (detectedPlatform === 'android') return 'android';
    return 'ios'; // Graceful primary fallback for web preview
  }, [platformMode, detectedPlatform]);

  const isIOS = activePlatform === 'ios';
  const isAndroid = activePlatform === 'android';

  // Platform adaptive tokens following HIG & M3 specifications
  const tokens: PlatformTokens = useMemo(() => {
    if (isAndroid) {
      return {
        minTouchTarget: 'min-h-[48px] min-w-[48px]',
        headerBg: 'bg-neutral-900',
        headerBorder: 'border-b border-neutral-800/60',
        navBarBg: 'bg-neutral-900 border-t border-neutral-800/80',
        navBarHeight: 'h-20',
        cardRadius: 'rounded-2xl',
        modalRadius: 'rounded-t-[28px]',
        cardElevation: 'shadow-md shadow-black/40',
        fontFamily: 'font-sans',
        titleTracking: 'tracking-normal'
      };
    }

    // iOS (HIG) tokens
    return {
      minTouchTarget: 'min-h-[44px] min-w-[44px]',
      headerBg: 'bg-neutral-950/80 backdrop-blur-xl',
      headerBorder: 'border-b border-white/[0.08]',
      navBarBg: 'bg-neutral-950/80 backdrop-blur-2xl border border-white/[0.12]',
      navBarHeight: 'h-14',
      cardRadius: 'rounded-2xl',
      modalRadius: 'rounded-t-[22px]',
      cardElevation: 'shadow-2xl shadow-black/60',
      fontFamily: 'font-sans',
      titleTracking: 'tracking-tight'
    };
  }, [isAndroid]);

  return (
    <PlatformContext.Provider
      value={{
        platform: activePlatform,
        platformMode,
        setPlatformMode,
        isIOS,
        isAndroid,
        isTouch,
        tokens
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};

export function usePlatform(): PlatformContextValue {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
}
