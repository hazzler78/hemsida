'use client';
import { useState } from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter, FaCopy, FaShare } from 'react-icons/fa';
import GlassButton from './GlassButton';

interface ShareResultsProps {
  analysisResult: string;
  savingsAmount?: number;
  logId?: number | null;
  onShare?: (platform: string) => void;
}

export default function ShareResults({ analysisResult, savingsAmount, logId, onShare }: ShareResultsProps) {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copied, setCopied] = useState(false);

  // Extrahera besparingsbelopp från analysen (prioritera årlig besparing)
  const extractSavings = (text: string): number => {
    // Först leta efter årlig besparing (kr/år)
    const yearlyMatch = text.match(/(\d+[,.]?\d*)\s*kr\/år/i);
    if (yearlyMatch) {
      return parseFloat(yearlyMatch[1].replace(',', '.'));
    }
    
    // Sedan leta efter månatlig besparing och multiplicera med 12
    const monthlyMatch = text.match(/(\d+[,.]?\d*)\s*kr.*?(?:spar|bespar|minska)/i);
    if (monthlyMatch) {
      return parseFloat(monthlyMatch[1].replace(',', '.')) * 12;
    }
    
    return savingsAmount || 0;
  };

  const detectedSavings = extractSavings(analysisResult);

  // Generera delningstext
  const generateShareText = (platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter') => {
    const baseText = `💡 AI-analys av min elräkning visar att jag betalar ${detectedSavings > 0 ? `${detectedSavings.toLocaleString('sv-SE')} kr/år` : 'flera hundra kronor/år'} i onödiga avgifter!`;
    
    const platformTexts = {
      facebook: `${baseText}\n\n🔍 Testa själv på elchef.se/fakturaanalys\n\n#Elbesparing #AI #Elchef`,
      instagram: `${baseText}\n\n🔍 Testa själv på elchef.se/fakturaanalys\n\n#Elbesparing #AI #Elchef #Energi`,
      linkedin: `${baseText}\n\nSom energikonsult ser jag många kunder som betalar onödiga avgifter på sina elräkningar. Denna AI-verktyg från Elchef hjälper dig identifiera dolda kostnader.\n\n🔍 Testa själv: elchef.se/fakturaanalys\n\n#Energibesparing #AI #Elchef #Hållbarhet`,
      twitter: `${baseText}\n\n🔍 Testa själv: elchef.se/fakturaanalys\n\n#Elbesparing #AI #Elchef`
    };

    return platformTexts[platform];
  };

  // Generera delnings-URL
  const generateShareUrl = (platform: string, text: string) => {
    const encodedText = encodeURIComponent(text);
    // Generera unik delningslänk baserat på logId
    const shareUrl = logId 
      ? `https://elchef.se/delad-kalkyl?id=${logId}`
      : 'https://elchef.se/fakturaanalys';
    const url = encodeURIComponent(shareUrl);
    
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&hashtag=%23Elbesparing&display=popup&ref=plugin&src=share_button`,
      // Låt endast texten (som redan innehåller vår länk) delas, utan extra URL-parameter
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      instagram: 'https://www.instagram.com/elchef' // Instagram har ingen direkt delnings-URL
    };

    return urls[platform as keyof typeof urls] || urls.facebook;
  };

  const handleShare = (platform: string) => {
    const text = generateShareText(platform as 'facebook' | 'instagram' | 'linkedin' | 'twitter');
    const url = generateShareUrl(platform, text);
    
    // Spåra delning
    if (onShare) {
      onShare(platform);
    }

    // Spåra i analytics
    try {
      fetch('/api/events/share-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          logId,
          savingsAmount: detectedSavings,
          sessionId: typeof window !== 'undefined' ? localStorage.getItem('invoiceSessionId') : null
        })
      }).catch(() => {});
    } catch {}

    if (platform === 'instagram') {
      // För Instagram, visa instruktioner
      alert('Kopiera texten och dela på Instagram:\n\n' + text);
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (platform === 'facebook') {
      // Facebook - kopiera text och öppna
      const shareUrl = logId 
        ? `https://elchef.se/delad-kalkyl?id=${logId}`
        : 'https://elchef.se/fakturaanalys';
      
      try {
        navigator.clipboard.writeText(text);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&display=popup`, '_blank', 'width=600,height=400');
        setTimeout(() => {
          alert(`✅ Analysen har kopierats till urklipp!\n\n📋 Klistra in texten i Facebook-inlägget:\n• Tryck Ctrl+V (eller Cmd+V på Mac)\n• Eller högerklicka och välj "Klistra in"\n\n🔗 Länken till din analys är redan med i texten!`);
        }, 500);
      } catch (error) {
        alert(`✅ Analysen har kopierats!\n\n📋 Klistra in texten i Facebook-inlägget (Ctrl+V)\n\n🔗 Länken är redan inkluderad i texten!`);
      }
    } else {
      // Öppna direkt utan popup-kontroll
      window.open(url, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    }
  };



  const copyToClipboard = () => {
    const text = generateShareText('facebook');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!analysisResult) return null;

  return (
    <div style={{
      marginTop: '2rem',
      background: 'var(--glass-bg)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      boxShadow: 'var(--glass-shadow-medium)'
    }}>
      <h4 style={{
        color: 'white',
        fontSize: '1.25rem',
        fontWeight: 600,
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <FaShare />
        Dela din AI-analys
      </h4>
      
      <p style={{
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: '1.5rem',
        fontSize: '0.95rem',
        lineHeight: 1.5
      }}>
        {detectedSavings > 0 
          ? `Dela att du kan spara ${detectedSavings.toLocaleString('sv-SE')} kr/år och hjälp andra att upptäcka sina dolda elavgifter!`
          : 'Dela din AI-analys och hjälp andra att upptäcka dolda elavgifter!'
        }
      </p>

      {!showShareOptions ? (
        <GlassButton
          variant="primary"
          size="md"
          background="linear-gradient(135deg, var(--primary), var(--secondary))"
          disableScrollEffect
          disableHoverEffect
          onClick={() => setShowShareOptions(true)}
        >
          <FaShare style={{ marginRight: '0.5rem' }} />
          Dela resultat
        </GlassButton>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.75rem'
          }}>
            <GlassButton
              variant="secondary"
              size="sm"
              background="rgba(24, 119, 242, 0.8)"
              disableScrollEffect
              disableHoverEffect
              onClick={async () => {
                const text = generateShareText('facebook');
                const shareUrl = logId 
                  ? `https://elchef.se/delad-kalkyl?id=${logId}`
                  : 'https://elchef.se/fakturaanalys';
                
                try {
                  // Kopiera texten automatiskt
                  await navigator.clipboard.writeText(text);
                  
                  // Öppna Facebook och visa tydlig instruktion
                  const facebookWindow = window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&display=popup`, '_blank', 'width=600,height=400');
                  
                  // Visa förbättrat meddelande med exakt instruktion
                  setTimeout(() => {
                    alert(`✅ Analysen har kopierats till urklipp!\n\n📋 Klistra in texten i Facebook-inlägget:\n• Tryck Ctrl+V (eller Cmd+V på Mac)\n• Eller högerklicka och välj "Klistra in"\n\n🔗 Länken till din analys är redan med i texten!`);
                  }, 500);
                  
                } catch (error) {
                  // Fallback om clipboard inte fungerar
                  const fallbackText = `${text}\n\n🔗 Länk: ${shareUrl}`;
                  const textArea = document.createElement('textarea');
                  textArea.value = fallbackText;
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                  
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&display=popup`, '_blank', 'width=600,height=400');
                  alert(`✅ Analysen har kopierats!\n\n📋 Klistra in texten i Facebook-inlägget (Ctrl+V)\n\n🔗 Länken är redan inkluderad i texten!`);
                }
              }}
            >
              <FaFacebook style={{ marginRight: '0.5rem' }} />
              Facebook
            </GlassButton>
            
            <GlassButton
              variant="secondary"
              size="sm"
              background="linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)"
              disableScrollEffect
              disableHoverEffect
              onClick={() => handleShare('instagram')}
            >
              <FaInstagram style={{ marginRight: '0.5rem' }} />
              Instagram
            </GlassButton>
            
            <GlassButton
              variant="secondary"
              size="sm"
              background="rgba(0, 119, 181, 0.8)"
              disableScrollEffect
              disableHoverEffect
              onClick={() => handleShare('linkedin')}
            >
              <FaLinkedin style={{ marginRight: '0.5rem' }} />
              LinkedIn
            </GlassButton>
            
            <GlassButton
              variant="secondary"
              size="sm"
              background="rgba(29, 161, 242, 0.8)"
              disableScrollEffect
              disableHoverEffect
              onClick={() => handleShare('twitter')}
            >
              <FaTwitter style={{ marginRight: '0.5rem' }} />
              Twitter
            </GlassButton>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center'
          }}>
            <GlassButton
              variant="secondary"
              size="sm"
              background="rgba(255, 255, 255, 0.2)"
              disableScrollEffect
              disableHoverEffect
              onClick={copyToClipboard}
            >
              <FaCopy style={{ marginRight: '0.5rem' }} />
              {copied ? 'Kopierat!' : 'Kopiera text'}
            </GlassButton>
            
            <GlassButton
              variant="secondary"
              size="sm"
              background="rgba(255, 255, 255, 0.1)"
              disableScrollEffect
              disableHoverEffect
              onClick={() => setShowShareOptions(false)}
            >
              Stäng
            </GlassButton>
          </div>
        </div>
      )}

    </div>
  );
}
