'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RobinhoodPage() {
  const router = useRouter();

  useEffect(() => {
    // Mark that user came via robinhood link (for conversion tracking)
    if (typeof window !== 'undefined') {
      localStorage.setItem('came_via_robinhood', 'true');
      // Set expiration (24 hours)
      localStorage.setItem('came_via_robinhood_time', Date.now().toString());
    }

    // Track the click in D1 database
    const trackClick = async () => {
      try {
        await fetch('/api/track/robinhood', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            referer: document.referrer || '',
            userAgent: navigator.userAgent || '',
          }),
        });
      } catch (error) {
        console.error('Failed to track click:', error);
        // Continue with redirect even if tracking fails
      }
    };

    // Track and redirect immediately
    trackClick();
    
    // Redirect to homepage
    router.push('/');
  }, [router]);

  // Show a brief loading message while redirecting
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <p>Omdirigerar...</p>
    </div>
  );
}
