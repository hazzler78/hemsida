'use client';

import { usePathname } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import CampaignBanner from '@/components/CampaignBanner';
import Footer from '@/components/Footer';
import GrokChat from '@/components/GrokChat';
import CheapEnergyChat from '@/components/CheapEnergyChat';

function isAdminPath(pathname: string | null): boolean {
  return pathname?.startsWith('/admin') ?? false;
}

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = isAdminPath(pathname);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <CampaignBanner />
      <div id="app">
        {children}
        <div className="bottom-nav" aria-hidden="false">
          <BottomNav />
        </div>
        <Footer />
      </div>
      <GrokChat />
      <CheapEnergyChat />
    </>
  );
}
