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

type ClickIntroVideoProps = {
  onComplete: () => void;
};

/**
 * Kort introfilm (ca 15 s) som visas innan kunden skickas vidare
 * efter klick på t.ex. "Byt elavtal" eller banner till fakturaanalys.
 */
export default function ClickIntroVideo({ onComplete }: ClickIntroVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const completedRef = useRef(false);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
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
  }, []);

  return (
    <Overlay role="dialog" aria-modal="true" aria-label="Kort introduktionsfilm">
      <Content>
        <SkipButton type="button" onClick={finish}>
          Fortsätt →
        </SkipButton>
        <video
          ref={videoRef}
          src={CLICK_INTRO_VIDEO_SRC}
          playsInline
          autoPlay
          controls={false}
          onEnded={finish}
        />
        <Hint>Kort tips innan du går vidare</Hint>
      </Content>
    </Overlay>
  );
}
