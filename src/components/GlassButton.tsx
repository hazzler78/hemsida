import { useEffect, useRef, ElementType } from 'react';

export interface GlassButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  background?: string;
  disableScrollEffect?: boolean;
  disableHoverEffect?: boolean;
  as?: ElementType;
}

export default function GlassButton({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  background,
  disableScrollEffect = false,
  disableHoverEffect = false,
  as = 'button',
}: GlassButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (disableScrollEffect) return;
    const handleScroll = () => {
      const offset = window.scrollY;
      if (buttonRef.current && !disabled) {
        buttonRef.current.style.transform = `translateY(${offset * 0.1}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [disabled, disableScrollEffect]);

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

  const Element: ElementType = as;

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (!disableHoverEffect && !disabled) {
      const target = e.currentTarget;
      target.style.background = hoverBackground;
      target.style.transform = 'translateY(-2px) scale(1.02)';
      target.style.boxShadow = 'var(--glass-shadow-medium)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (!disableHoverEffect && !disabled) {
      const target = e.currentTarget;
      target.style.background = variantStyles.background;
      target.style.transform = 'translateY(0) scale(1)';
      target.style.boxShadow = 'var(--glass-shadow-light)';
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    if (!disableHoverEffect && !disabled) {
      const target = e.currentTarget;
      target.style.transform = 'translateY(0) scale(0.98)';
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLElement>) => {
    if (!disableHoverEffect && !disabled) {
      const target = e.currentTarget;
      target.style.transform = 'translateY(-2px) scale(1.02)';
    }
  };

  return (
    <Element
      ref={as === 'button' ? buttonRef : undefined}
      onClick={onClick}
      disabled={as === 'button' ? disabled : undefined}
      className={`glass-button ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={{
        ...variantStyles,
        ...sizeStyles,
        borderRadius: 'var(--radius-full)',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        boxShadow: 'var(--glass-shadow-light)',
        position: 'relative',
        overflow: 'hidden',
        opacity: disabled ? 0.6 : 1,
        transform: disabled ? 'none' : undefined,
        whiteSpace: 'nowrap',
        ...(background ? { background } : {}),
      }}
    >
      <span style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </span>
    </Element>
  );
} 