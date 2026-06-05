"use client";

import Image from "next/image";

/**
 * Google Static Maps component for branch cards
 * Shows a small map preview using Google Maps Static API
 * Falls back to a placeholder if no coordinates are available
 */

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface BranchMapProps {
  latitude: number | null;
  longitude: number | null;
  address: string;
  className?: string;
}

export function BranchMap({ latitude, longitude, address, className }: BranchMapProps) {
  // No coordinates — show a subtle placeholder
  if (!latitude || !longitude) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/50 rounded-md ${className ?? ""}`}
      >
        <span className="text-xs text-muted-foreground px-2 py-1">
          {address}
        </span>
      </div>
    );
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/50 rounded-md ${className ?? ""}`}
      >
        <span className="text-xs text-muted-foreground px-2 py-1">
          Map unavailable{"\u2014"}set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        </span>
      </div>
    );
  }

  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=400x160&scale=2&maptype=roadmap&markers=color:red%7C${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;

  return (
    <div className={`relative overflow-hidden rounded-md ${className ?? ""}`}>
      <Image
        src={staticMapUrl}
        alt={`${address} map`}
        width={400}
        height={160}
        className="w-full h-full object-cover"
        unoptimized // Google Static Maps returns non-standard images
      />
    </div>
  );
}
