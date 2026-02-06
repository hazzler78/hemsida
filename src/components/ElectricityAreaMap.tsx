"use client";

import React, { useCallback, useState } from "react";
import Image from "next/image";
import type { ElectricityArea } from "@/lib/types";

interface ElectricityAreaMapProps {
  onAreaSelected?: (area: ElectricityArea) => void;
  value?: ElectricityArea | null;
}

const AREA_IDS: ElectricityArea[] = ["se1", "se2", "se3", "se4"];

/**
 * Interaktiv karta för Sveriges elområden.
 * Använder inline SVG (se1–se4) ovanpå bakgrundsbild för mobilkompatibilitet.
 */
export function ElectricityAreaMap({
  onAreaSelected,
  value = null,
}: ElectricityAreaMapProps) {
  const [internalSelected, setInternalSelected] =
    useState<ElectricityArea | null>(null);

  const selectedArea = value ?? internalSelected;

  const handleSelectArea = useCallback(
    (area: ElectricityArea) => {
      setInternalSelected(area);
      onAreaSelected?.(area);
    },
    [onAreaSelected]
  );

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const target = (e.target as SVGElement).closest("[data-area]");
      const area = target?.getAttribute("data-area");
      if (area && AREA_IDS.includes(area as ElectricityArea)) {
        handleSelectArea(area as ElectricityArea);
      }
    },
    [handleSelectArea]
  );

  const pathStyle = (id: ElectricityArea) => ({
    cursor: "pointer",
    fill: selectedArea === id ? "rgba(255,255,255,0.3)" : "transparent",
    stroke: "none",
    WebkitTapHighlightColor: "transparent",
    touchAction: "manipulation",
  } as React.CSSProperties);

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
          minHeight: 0,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.35)",
          backgroundColor: "#e5e7eb",
        }}
      >
        <Image
          src="/elomraden.png"
          alt=""
          fill
          sizes="360px"
          style={{ objectFit: "contain", pointerEvents: "none" }}
          aria-hidden
        />
        <svg
          viewBox="0 0 1024 1024"
          preserveAspectRatio="xMidYMid meet"
          onClick={handleSvgClick}
          role="img"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "auto",
            cursor: "pointer",
            touchAction: "manipulation",
          }}
          aria-label="Sveriges elområden SE1–SE4. Tryck på ett område för att välja."
        >
          <g data-area="se1" transform="translate(470, 50) scale(0.99)">
            <path
              d="M161.243 293.767C166.909 301.767 185.443 321.867 214.243 338.267L231.243 322.267L214.243 311.267V273.767L256.243 213.267L299.743 222.267L315.743 200.767L299.743 193.767L271.243 97.2674L281.743 65.2674L189.743 0.767395L165.743 58.7674L116.743 49.2674L99.7426 91.7674L82.2426 108.767L62.2426 97.2674L51.7426 115.267L62.2426 123.267L57.2426 142.767L67.7426 159.767L0.742566 222.267L9.74257 230.267L35.7426 222.267L67.7426 248.267L92.7426 273.767L125.743 287.267L161.243 293.767Z"
              style={pathStyle("se1")}
            />
          </g>
          <g data-area="se2" transform="translate(425, 280) scale(0.91)">
            <path
              d="M141.731 240.5L254.231 116.5L205.731 71L148.731 56L75.7313 0.5H41.7313L48.7313 47L0.731323 126.5L26.7313 137L7.73132 157.5L37.2313 205L19.2313 227L32.7313 240.5L48.7313 227L75.7313 240.5H141.731Z"
              style={pathStyle("se2")}
            />
          </g>
          <g data-area="se3" transform="translate(310, 420) scale(1.0)">
            <path
              d="M111.023 385.08L219.023 466.08L213.523 500.08H230.523L245.023 435.58H230.523L237.023 344.58L286.523 337.58L314.523 270.08L254.523 215.58L237.023 162.08L254.523 136.08L249.523 90.5798L154.523 77.0798L140.523 90.5798L125.523 77.0798L146.023 57.5798L116.523 7.57977L85.0231 0.579773L65.5231 48.5798V114.58L76.0231 130.08L65.5231 153.08L85.0231 168.08V185.08L65.5231 196.08L76.0231 228.08L58.5231 264.58L41.5231 278.08V309.08L31.5231 328.58L8.52313 309.08L0.523132 337.58L14.0231 377.58L31.5231 370.58V416.08L47.0231 410.58L65.5231 366.08L111.023 354.58V385.08Z"
              style={pathStyle("se3")}
            />
          </g>
          <rect
            data-area="se4"
            x={350}
            y={820}
            width={200}
            height={160}
            style={pathStyle("se4")}
          />
        </svg>
      </div>
    </div>
  );
}

export default ElectricityAreaMap;
