'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import BottomNav from '@/components/BottomNav';
import CampaignBanner from '@/components/CampaignBanner';
import Footer from '@/components/Footer';

const GrokChat = dynamic(() => import('@/components/GrokChat'), { ssr: false });
const CheapEnergyChat = dynamic(() => import('@/components/CheapEnergyChat'), { ssr: false });

const MINIMAL_CHROME_PATHS = new Set([
  '/test-cheap-energy-chat',
  '/glassmorphism-demo',
  '/rorligt-avtal-v2',
  '/partner/test-form',
]);

function isAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isMinimalChromePath(pathname: string) {
  return MINIMAL_CHROME_PATHS.has(pathname);
}

function shouldUsePublicChrome(pathname: string) {
  return !isAdminPath(pathname) && !isMinimalChromePath(pathname);
}

function shouldLoadChat(pathname: string) {
  return shouldUsePublicChrome(pathname);
}

type Props = {
  children: React.ReactNode;
};

export default function ClientSiteShell({ children }: Props) {
  const pathname = usePathname() ?? '/';
  const publicChrome = shouldUsePublicChrome(pathname);
  const [chatReady, setChatReady] = useState(false);

  useEffect(() => {
    if (!shouldLoadChat(pathname)) {
      setChatReady(false);
      return;
    }

    const enableChat = () => setChatReady(true);

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(enableChat, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }

    const timeoutId = setTimeout(enableChat, 2500);
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return (
    <>
      {publicChrome && <CampaignBanner />}
      <div id="app">
        {children}
        {publicChrome && (
          <div className="bottom-nav" aria-hidden="false">
            <BottomNav />
          </div>
        )}
        {publicChrome && <Footer />}
      </div>
      {chatReady && shouldLoadChat(pathname) && (
        <>
          <GrokChat />
          <CheapEnergyChat />
        </>
      )}
    </>
  );
}
