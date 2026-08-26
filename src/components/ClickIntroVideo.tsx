"use client";

import React, { useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  z-index: 12000;
`;

const Content = styled.div`
  width: 100%;
  max-width: min(420px, 92vw);
  aspect-ratio: 9 / 16;
  max-height: min(88vh, 760px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
  position: relative;
  background: #000;

  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    background: #000;
  }
`;

const SkipButton = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 999px;
  padding: 0.45rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  z-index: 2;
`;

const Hint = styled.p`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0.85rem;
  margin: 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.85rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  pointer-events: none;
`;

export const CLICK_INTRO_VIDEO_SRC = '/videos/elchef-click-intro.mp4';
/** Visas innan kunden öppnar affiliate-länk hos leverantören. */
export const AFFILIATE_INTRO_VIDEO_SRC = '/videos/elchef-affiliate-intro.mp4';

type ClickIntroVideoProps = {
  onComplete: () => void;
  /** Standard: CTA/banner-intro. Använd AFFILIATE_INTRO_VIDEO_SRC för affiliate-klick. */
  src?: string;
  hint?: string;
};

/**
 * Kort introfilm som visas innan kunden skickas vidare
 * (CTA, banner till fakturaanalys, eller affiliate-länk till leverantör).
 */
export default function ClickIntroVideo({
  onComplete,
  src = CLICK_INTRO_VIDEO_SRC,
  hint = 'Kort tips innan du går vidare',
}: ClickIntroVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const completedRef = useRef(false);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    completedRef.current = false;
    const video = videoRef.current;
    if (!video) return;
    const play = async () => {
      try {
        video.muted = false;
        await video.play();
      } catch {
        try {
          video.muted = true;
          await video.play();
        } catch {
          // Om autoplay blockeras kan användaren trycka vidare manuellt
        }
      }
    };
    play();
  }, [src]);

  return (
    <Overlay role="dialog" aria-modal="true" aria-label="Kort introduktionsfilm">
      <Content>
        <SkipButton type="button" onClick={finish}>
          Fortsätt →
        </SkipButton>
        <video
          ref={videoRef}
          key={src}
          src={src}
          playsInline
          autoPlay
          controls={false}
          onEnded={finish}
        />
        <Hint>{hint}</Hint>
      </Content>
    </Overlay>
  );
}
