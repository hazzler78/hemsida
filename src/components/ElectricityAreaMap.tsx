"use client";

import React, { useCallback, useState } from "react";
import type { ElectricityArea } from "@/lib/types";

interface ElectricityAreaMapProps {
  /** Callback för att meddela valt elområde till t.ex. Hero-komponenten */
  onAreaSelected?: (area: ElectricityArea) => void;
  /** Nuvarande val (för att kunna markera från utsidan om man vill) */
  value?: ElectricityArea | null;
}

/**
 * Enkel interaktiv karta för Sveriges elområden.
 *
 * Bygger på bilden `/elomraden.png` i `public/`.
 * Vi lägger klickytor (hover/click) ovanpå i ungefärliga zoner.
 * Själva prislogiken hanteras i föräldern (Hero).
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
          aspectRatio: "3 / 4",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.35)",
          backgroundColor: "#e5e7eb",
        }}
      >
        <img
          src="/elomraden.png"
          alt="Sveriges elområden SE1–SE4"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />

        {/* Klickytor – grovt placerade rektanglar per elområde */}
        {/* SE1 – nordligaste delen (huvud) */}
        <button
          type="button"
          onClick={() => handleSelectArea("se1")}
          aria-label="Välj elområde SE1"
          style={{
            position: "absolute",
            top: "4%",
            left: "28%",
            width: "50%",
            height: "20%",
            background:
              selectedArea === "se1"
                ? "rgba(255,255,255,0.15)"
                : "rgba(255,255,255,0.01)",
            border:
              selectedArea === "se1"
                ? "2px solid rgba(255,255,255,0.8)"
                : "1px solid transparent",
            cursor: "pointer",
          }}
        />

        {/* SE2 – strax under SE1 */}
        <button
          type="button"
          onClick={() => handleSelectArea("se2")}
          aria-label="Välj elområde SE2"
          style={{
            position: "absolute",
            top: "24%",
            left: "28%",
            width: "50%",
            height: "18%",
            background:
              selectedArea === "se2"
                ? "rgba(255,255,255,0.15)"
                : "rgba(255,255,255,0.01)",
            border:
              selectedArea === "se2"
                ? "2px solid rgba(255,255,255,0.8)"
                : "1px solid transparent",
            cursor: "pointer",
          }}
        />

        {/* SE3 – mittdelen av landet (lite större band) */}
        <button
          type="button"
          onClick={() => handleSelectArea("se3")}
          aria-label="Välj elområde SE3"
          style={{
            position: "absolute",
            top: "40%",
            left: "28%",
            width: "50%",
            height: "40%",
            background:
              selectedArea === "se3"
                ? "rgba(255,255,255,0.15)"
                : "rgba(255,255,255,0.01)",
            border:
              selectedArea === "se3"
                ? "2px solid rgba(255,255,255,0.8)"
                : "1px solid transparent",
            cursor: "pointer",
          }}
        />

        {/* SE4 – södra delen inklusive Skåne (kompaktare) */}
        <button
          type="button"
          onClick={() => handleSelectArea("se4")}
          aria-label="Välj elområde SE4"
          style={{
            position: "absolute",
            top: "80%",
            left: "28%",
            width: "50%",
            height: "14%",
            background:
              selectedArea === "se4"
                ? "rgba(255,255,255,0.15)"
                : "rgba(255,255,255,0.01)",
            border:
              selectedArea === "se4"
                ? "2px solid rgba(255,255,255,0.8)"
                : "1px solid transparent",
            cursor: "pointer",
          }}
        />
      </div>

    </div>
  );
}

export default ElectricityAreaMap;

