"use client";

import React, { useCallback, useRef, useEffect, useState } from "react";
import type { ElectricityArea } from "@/lib/types";

interface ElectricityAreaMapProps {
  /** Callback för att meddela valt elområde till t.ex. Hero-komponenten */
  onAreaSelected?: (area: ElectricityArea) => void;
  /** Nuvarande val (för att kunna markera från utsidan om man vill) */
  value?: ElectricityArea | null;
}

const AREA_IDS: ElectricityArea[] = ["se1", "se2", "se3", "se4"];

/**
 * Interaktiv SVG-karta för Sveriges elområden.
 *
 * Använder `/elomraden.svg` med path-element med id se1–se4.
 * Själva prislogiken hanteras i föräldern (Hero).
 */
export function ElectricityAreaMap({
  onAreaSelected,
  value = null,
}: ElectricityAreaMapProps) {
  const [internalSelected, setInternalSelected] =
    useState<ElectricityArea | null>(null);
  const objectRef = useRef<HTMLObjectElement>(null);

  const selectedArea = value ?? internalSelected;

  const handleSelectArea = useCallback(
    (area: ElectricityArea) => {
      setInternalSelected(area);
      onAreaSelected?.(area);
    },
    [onAreaSelected]
  );

  const handleSelectRef = useRef(handleSelectArea);
  handleSelectRef.current = handleSelectArea;
  const selectedAreaRef = useRef(selectedArea);
  selectedAreaRef.current = selectedArea;

  const applyStyles = useCallback((doc: Document) => {
    const area = selectedAreaRef.current;
    AREA_IDS.forEach((id) => {
      const el = doc.getElementById(id);
      if (!el) return;
      el.style.cursor = "pointer";
      el.setAttribute(
        "fill",
        area === id ? "rgba(255,255,255,0.25)" : "transparent"
      );
      el.setAttribute(
        "stroke",
        area === id ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.4)"
      );
    });
  }, []);

  useEffect(() => {
    const obj = objectRef.current;
    if (!obj) return;

    const onLoad = () => {
      const doc = obj.contentDocument;
      if (!doc) return;
      applyStyles(doc);
      doc.addEventListener("click", (e) => {
        const id = (e.target as Element)?.id;
        if (id && AREA_IDS.includes(id as ElectricityArea)) {
          handleSelectRef.current(id as ElectricityArea);
        }
      });
    };

    if (obj.contentDocument?.readyState === "complete") {
      onLoad();
    } else {
      obj.addEventListener("load", onLoad);
    }
  }, [applyStyles]);

  useEffect(() => {
    const doc = objectRef.current?.contentDocument;
    if (doc) applyStyles(doc);
  }, [applyStyles, selectedArea]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 360,
          margin: "0 auto",
          aspectRatio: "1",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.35)",
          backgroundColor: "#e5e7eb",
        }}
      >
        <object
          ref={objectRef}
          data="/elomraden.svg"
          type="image/svg+xml"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            pointerEvents: "auto",
          }}
          aria-label="Sveriges elområden SE1–SE4. Klicka på ett område för att välja."
        />
      </div>
    </div>
  );
}

export default ElectricityAreaMap;

