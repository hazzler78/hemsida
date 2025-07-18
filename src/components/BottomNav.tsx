"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from 'styled-components';

const Nav = styled.nav`
  position: fixed;
  bottom: 0;
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
  z-index: 1000;
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
  
  return (
    <Nav>
      <NavItem href="/" className={pathname === '/' ? 'active' : ''}>
        Hem
        {pathname === '/' && <ActiveIndicator />}
      </NavItem>
      <NavItem href="/media" className={pathname === '/media' ? 'active' : ''}>
        Media
        {pathname === '/media' && <ActiveIndicator />}
      </NavItem>
      <NavItem href="/foretag" className={pathname === '/foretag' ? 'active' : ''}>
        Företag
        {pathname === '/foretag' && <ActiveIndicator />}
      </NavItem>
      <NavItem href="/om-oss" className={pathname === '/om-oss' ? 'active' : ''}>
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