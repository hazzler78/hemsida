import { useEffect, useRef, useState, ElementType } from 'react';

export interface GlassButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  background?: string;
  color?: string;
  disableScrollEffect?: boolean;
  disableHoverEffect?: boolean;
  as?: ElementType;
}

/** Use translateZ(0) so Safari keeps a stable compositor layer and avoids flicker. */
const layerTransform = (t: string) => (t ? `${t} translateZ(0)` : 'translateZ(0)');

export default function GlassButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  background,
  color,
  disableScrollEffect = false,
  disableHoverEffect = false,
  as = 'button',
}: GlassButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isTouchOrNoHover, setIsTouchOrNoHover] = useState(true);
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const hasHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;
    setIsTouchOrNoHover(!hasHover);
  }, []);

  useEffect(() => {
    if (disableScrollEffect || isTouchOrNoHover) return;
    let rafId: number;
    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        const offset = window.scrollY;
        if (buttonRef.current && !disabled && !isPressed) {
          buttonRef.current.style.transform = layerTransform(`translateY(${offset * 0.1}px)`);
        }
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [disabled, disableScrollEffect, isTouchOrNoHover, isPressed]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
        };
      case 'secondary':
        return {
          background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
        };
      case 'outline':
        return {
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: 'white',
        };
      default:
        return {
          background: 'linear-gradient(135deg, rgba(22, 147, 255, 0.5), rgba(0, 201, 107, 0.5))',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
        };
    }
  };

  const getHoverBackground = () => {
    switch (variant) {
      case 'primary':
        return 'linear-gradient(135deg, var(--primary-dark), var(--secondary-dark))';
      case 'secondary':
        return 'linear-gradient(135deg, var(--secondary-dark), var(--primary-dark))';
      case 'outline':
        return 'rgba(255, 255, 255, 0.2)';
      default:
        return 'linear-gradient(135deg, var(--primary-dark), var(--secondary-dark))';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '0.5rem 1rem', fontSize: '0.875rem' };
      case 'lg':
        return { padding: '1rem 2rem', fontSize: '1.125rem' };
      default:
        return { padding: '0.75rem 1.5rem', fontSize: '1rem' };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const hoverBackground = getHoverBackground();
  const baseBackground = background || variantStyles.background;

  const Element: ElementType = as;
  const useHover = !disableHoverEffect && !disabled && !isTouchOrNoHover;

  const pressIn = () => {
    if (!disabled) setIsPressed(true);
  };
  const pressOut = () => setIsPressed(false);

  // Clear visual feedback: press on all devices; hover only where hover exists
  let transform = 'translateZ(0)';
  let boxShadow = 'var(--glass-shadow-light)';
  let filter: string | undefined;
  let bg = baseBackground;
  let border = variantStyles.border;

  if (!disabled && isPressed) {
    transform = layerTransform('scale(0.96)');
    boxShadow = 'inset 0 2px 8px rgba(0, 0, 0, 0.28), 0 0 0 2px rgba(255, 255, 255, 0.35)';
    filter = 'brightness(0.88)';
    border = '1px solid rgba(255, 255, 255, 0.55)';
  } else if (!disabled && useHover && isHovered) {
    transform = layerTransform('translateY(-2px) scale(1.02)');
    boxShadow = 'var(--glass-shadow-medium), 0 0 0 1px rgba(255,255,255,0.25)';
    bg = background ? baseBackground : hoverBackground;
  }

  return (
    <Element
      ref={as === 'button' ? buttonRef : undefined}
      onClick={onClick}
      disabled={as === 'button' ? disabled : undefined}
      className={`glass-button ${className}`}
      onMouseEnter={() => {
        if (useHover) setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        pressOut();
      }}
      onPointerDown={pressIn}
      onPointerUp={pressOut}
      onPointerCancel={pressOut}
      onBlur={pressOut}
      style={{
        ...variantStyles,
        ...sizeStyles,
        background: bg,
        border,
        color: color ?? variantStyles.color,
        borderRadius: 'var(--radius-full)',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition:
          'transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease, background 0.2s ease, border-color 0.12s ease',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        boxShadow,
        position: 'relative',
        overflow: 'hidden',
        opacity: disabled ? 0.6 : 1,
        transform: disabled ? 'none' : transform,
        filter: disabled ? undefined : filter,
        whiteSpace: 'nowrap',
        WebkitAppearance: 'none',
        appearance: 'none',
        touchAction: 'manipulation',
        backfaceVisibility: 'hidden' as const,
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </Element>
  );
}
