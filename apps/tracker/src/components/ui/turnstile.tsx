'use client';
import Script from 'next/script';
import { useEffect, useRef } from 'react';
import { env } from '@/env';

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export function Turnstile({ onVerify, onError, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    const renderWidget = () => {
      if (window.turnstile && containerRef.current && !widgetIdRef.current) {
        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => onVerify(token),
            'error-callback': () => onError?.(),
            'expired-callback': () => onExpire?.(),
            theme: 'dark',
          });
        } catch (e) {
          console.error('Turnstile render error:', e);
        }
      }
    };

    if (window.turnstile) {
      renderWidget();
    }
  }, [siteKey, onVerify, onError, onExpire]);

  if (!siteKey) return null;

  return (
    <div className="flex justify-center my-2 min-h-[65px]">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.turnstile && containerRef.current && !widgetIdRef.current) {
            try {
              widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                callback: (token: string) => onVerify(token),
                'error-callback': () => onError?.(),
                'expired-callback': () => onExpire?.(),
                theme: 'dark',
              });
            } catch (e) {
              console.error('Turnstile render error on load:', e);
            }
          }
        }}
      />
      <div ref={containerRef} />
    </div>
  );
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}
