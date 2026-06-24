import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import StyledComponentsRegistry from '../lib/registry';
import SiteChrome from '@/components/SiteChrome';
import { websiteJsonLd } from '@/lib/seo';

const inter = Inter({ subsets: ["latin"] });

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
};

const SITE_TITLE = "Elchef – sänk elräkningen med rätt rörligt elavtal 2026";
const SITE_DESCRIPTION =
  "Trött på elräkningar som rusar? Elchef.se hjälper dig välja rätt rörligt elavtal, analysera din elräkning med AI och ta nästa steg mot total energibesparing med solceller och batteri.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.elchef.se"),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords:
    "rörligt elavtal, sänka elräkning, bästa elavtal 2026, elavtal, elpriser, byta elavtal, jämför elpriser, solceller, batteri",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: "/",
    siteName: "Elchef",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-share.png",
        width: 1200,
        height: 630,
        alt: "Betalar du för mycket för elen? Byt gratis på elchef.se",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-share.png"],
  },
  verification: {
    other: {
      "facebook-domain-verification": "in9xjxefhkl6pbe4g33zjwrsnkliin",
      "tiktok-developers-site-verification": "i7h859t0QF0G6Dua8q4h9qJUXwuPQoof",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <head>
        {/* Load after hydration to avoid React #418 (Cookiebot injects DOM and causes server/client mismatch) */}
        <Script 
          id="Cookiebot" 
          src="https://consent.cookiebot.com/uc.js" 
          data-cbid="adbd0838-8684-44d4-951e-f4eddcb600cc" 
          data-blockingmode="auto" 
          strategy="afterInteractive"
        />
        
        <script type="application/ld+json" suppressHydrationWarning>{`
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Elchef",
            "url": "https://www.elchef.se",
            "logo": "https://www.elchef.se/elchef-logo.png",
            "contactPoint": [{
              "@type": "ContactPoint",
              "email": "info@elchef.se",
              "contactType": "customer service",
              "areaServed": "SE",
              "availableLanguage": ["Swedish", "English"]
            }],
            "sameAs": [
              "https://www.facebook.com/elchef.se",
              "https://www.instagram.com/elchef.se/"
            ]
          }
        `}</script>
        <script type="application/ld+json" suppressHydrationWarning>
          {JSON.stringify(websiteJsonLd)}
        </script>
        
        {/* Facebook Meta Pixel Code – respekterar Cookiebot (marketing) */}
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            
            fbq('consent', 'revoke');
            fbq('init', '780636244595001');
            
            function fireFbPageView() {
              var cb = window.cookiebot || window.Cookiebot || window.CookieControl;
              if (cb && cb.consent) {
                if (cb.consent.marketing) {
                  fbq('consent', 'grant');
                  fbq('track', 'PageView');
                  return true;
                }
                return false;
              }
              setTimeout(function() {
                var cb2 = window.cookiebot || window.Cookiebot || window.CookieControl;
                if (cb2 && cb2.consent && cb2.consent.marketing) {
                  fbq('consent', 'grant');
                  fbq('track', 'PageView');
                }
              }, 3000);
              return false;
            }
            fireFbPageView();
            
            document.addEventListener('CookiebotOnConsentReady', function() {
              var cb = window.cookiebot || window.Cookiebot || window.CookieControl;
              if (cb && cb.consent && cb.consent.marketing) {
                fbq('consent', 'grant');
                fbq('track', 'PageView');
              }
            });
            
            document.addEventListener('CookiebotOnDecline', function() {
              fbq('consent', 'revoke');
            });
            
            var fbConsentGranted = false;
            setInterval(function() {
              var cb = window.cookiebot || window.Cookiebot || window.CookieControl;
              if (cb && cb.consent && cb.consent.marketing && !fbConsentGranted) {
                fbq('consent', 'grant');
                fbq('track', 'PageView');
                fbConsentGranted = true;
              }
            }, 2000);
          `}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img height="1" width="1" style={{display: 'none'}}
            src="https://www.facebook.com/tr?id=780636244595001&ev=PageView&noscript=1"
          />
        </noscript>
        {/* End Meta Pixel Code */}


        {/* TikTok Pixel Code */}
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
            var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
            ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};

              ttq.load('D3HQR4RC77U2RE92SKV0');
              
              // Check Cookiebot consent and fire page event
              function fireTikTokPage() {
                // Check multiple possible Cookiebot objects
                const cookiebot = window.cookiebot || window.Cookiebot || window.CookieControl;
                
                if (cookiebot && cookiebot.consent) {
                  // If Cookiebot is present, check consent
                  if (cookiebot.consent.marketing) {
                    ttq.page();
                  } else {
                    ttq.holdConsent();
                  }
                } else {
                  // Wait longer for Cookiebot to load, then check again
                  setTimeout(() => {
                    const cookiebotLater = window.cookiebot || window.Cookiebot || window.CookieControl;
                    if (cookiebotLater && cookiebotLater.consent) {
                      if (cookiebotLater.consent.marketing) {
                        ttq.page();
                      } else {
                        ttq.holdConsent();
                      }
                    } else {
                      ttq.page();
                    }
                  }, 3000);
                }
              }
              
              // Fire immediately or when consent is given
              fireTikTokPage();
              
              // Listen for consent changes
              document.addEventListener('CookiebotOnConsentReady', function() {
                const cookiebot = window.cookiebot || window.Cookiebot || window.CookieControl;
                if (cookiebot?.consent?.marketing) {
                  ttq.grantConsent();
                  ttq.page();
                  
                  // Fire test event
                  ttq.track('TEST23145');
                }
              });
              
              // Listen for Cookiebot decline
              document.addEventListener('CookiebotOnDecline', function() {
                ttq.revokeConsent();
              });
              
              // Manual check for consent changes
              let consentGranted = false;
              setInterval(() => {
                const cookiebot = window.cookiebot || window.Cookiebot || window.CookieControl;
                if (cookiebot?.consent?.marketing && !consentGranted) {
                  ttq.grantConsent();
                  ttq.page();
                  
                  // Fire test event
                  ttq.track('TEST23145');
                  
                  consentGranted = true;
                }
              }, 2000);
              
              // Simple client-to-server mirroring for CAPI
              window.__ttq_capi = async function(eventName, props) {
                try {
                  await fetch('/api/tiktok/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event: eventName, data: props || {} })
                  });
                } catch (e) { }
              }
              
            }(window, document, 'ttq');
          `}
        </Script>
        {/* End TikTok Pixel Code */}
      </head>
      <body className={inter.className}>
        <StyledComponentsRegistry>
          {/* Tracks and stores affiliate code from query params in a cookie */}
          <Script id="affiliate-tracker" strategy="afterInteractive">
            {`
              (function(){
                try {
                  var params = new URLSearchParams(window.location.search);
                  var ref = params.get('ref') || params.get('utm_source');
                  var campaign = params.get('code') || params.get('kampanj') || params.get('utm_campaign');
                  if (ref) {
                    var expires = new Date();
                    expires.setDate(expires.getDate() + 30);
                    document.cookie = 'elchef_affiliate=' + encodeURIComponent(ref) + '; path=/; expires=' + expires.toUTCString() + '; SameSite=Lax';
                  }
                  if (campaign) {
                    var expires2 = new Date();
                    expires2.setDate(expires2.getDate() + 30);
                    document.cookie = 'elchef_campaign=' + encodeURIComponent(campaign) + '; path=/; expires=' + expires2.toUTCString() + '; SameSite=Lax';
                  }
                } catch (e) { /* noop */ }
              })();
            `}
          </Script>
          <SiteChrome>{children}</SiteChrome>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
