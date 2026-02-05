"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from 'styled-components';
import { withDefaultCtaUtm } from '@/lib/utm';

const Nav = styled.nav<{ offset?: number }>`
  position: fixed;
  bottom: ${(props) => (props.offset ? `${props.offset}px` : '0')};
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0.5rem 0;
  box-shadow: var(--glass-shadow-light);
  z-index: 9999 !important;
`;

const NavItem = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #64748b;
  font-size: 0.75rem;
  padding: 0.5rem;
  position: relative;
  transition: color 0.3s ease;
  
  &.active {
    color: var(--primary);
  }
  
  &:hover {
    color: var(--primary);
  }
`;

const ActiveIndicator = styled.div`
  position: absolute;
  bottom: -0.25rem;
  width: 4px;
  height: 4px;
  background: var(--primary);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(0, 201, 107, 0.5);
`;

function BottomNavContent() {
  const pathname = usePathname();
  const [bottomOffset, setBottomOffset] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Simplified cookie banner detection - only check once on mount and resize
    const updateOffset = () => {
      try {
        // Only check for the most common cookie banner selectors
        const commonSelectors = [
          '#CybotCookiebotDialog',
          '#CookiebotDialog',
          '.CookieConsent',
          '.CookiebotWidget'
        ];
        
        let foundBanner = false;
        for (const selector of commonSelectors) {
          const element = document.querySelector(selector) as HTMLElement;
          if (element && element.offsetHeight > 0) {
            foundBanner = true;
            break;
          }
        }
        
        // Set a small offset if cookie banner is detected
        setBottomOffset(foundBanner ? 20 : 0);
      } catch {
        setBottomOffset(0);
      }
    };

    // Initial check with delay
    const timeoutId = setTimeout(updateOffset, 500);
    
    // Only check on resize
    window.addEventListener('resize', updateOffset);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateOffset);
    };
  }, []);
  
  return (
    <Nav offset={bottomOffset}>
      <NavItem href={withDefaultCtaUtm('/', 'bottomnav', 'home')} className={pathname === '/' ? 'active' : ''}>
        Hem
        {pathname === '/' && <ActiveIndicator />}
      </NavItem>
      <NavItem href={withDefaultCtaUtm('/fakturaanalys', 'bottomnav', 'compare')} className={pathname === '/fakturaanalys' ? 'active' : ''}>
        Fakturaanalys
        {pathname === '/fakturaanalys' && <ActiveIndicator />}
      </NavItem>
      <NavItem href={withDefaultCtaUtm('/media', 'bottomnav', 'media')} className={pathname === '/media' ? 'active' : ''}>
        Elchef i media
        {pathname === '/media' && <ActiveIndicator />}
      </NavItem>
      <NavItem href={withDefaultCtaUtm('/kunskap', 'bottomnav', 'knowledge')} className={pathname?.startsWith('/kunskap') ? 'active' : ''}>
        Kunskap
        {pathname?.startsWith('/kunskap') && <ActiveIndicator />}
      </NavItem>
      <NavItem href={withDefaultCtaUtm('/foretag', 'bottomnav', 'b2b')} className={pathname === '/foretag' ? 'active' : ''}>
        Företag
        {pathname === '/foretag' && <ActiveIndicator />}
      </NavItem>
      <NavItem href={withDefaultCtaUtm('/om-oss', 'bottomnav', 'about')} className={pathname === '/om-oss' ? 'active' : ''}>
        Om oss
        {pathname === '/om-oss' && <ActiveIndicator />}
      </NavItem>
    </Nav>
  );
}

export default function BottomNav() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <BottomNavContent />;
} 