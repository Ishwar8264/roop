/**
 * Purpose: Google Maps location picker with autocomplete search
 * Responsibility: Let user search & pick a location on map, return coords + address
 * Important Notes:
 *   - Uses @react-google-maps/api for map rendering
 *   - Autocomplete search bar for finding locations
 *   - Click on map to set pin location
 *   - Returns latitude, longitude, formatted address, and city
 *   - Used in BranchForm (and any future form needing location)
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
  Autocomplete,
} from "@react-google-maps/api";
import { MapPin, Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/i18n/use-translation";

// ==================== Types ====================

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
  city: string;
  googleMapsUrl: string;
}

export interface LocationPickerProps {
  value?: LocationData | null;
  onChange: (location: LocationData | null) => void;
  error?: string;
}

// ==================== Constants ====================

const DEFAULT_CENTER = { lat: 26.9124, lng: 75.7873 }; // Jaipur, India
const MAP_CONTAINER_STYLE = { width: "100%", height: "300px", borderRadius: "8px" };
const MAP_LIBRARIES: ("places" | "marker")[] = ["places"];

// ==================== Component ====================

export function LocationPicker({ value, onChange, error }: LocationPickerProps) {
  const { t } = useTranslation();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: MAP_LIBRARIES,
  });

  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    value ? { lat: value.lat, lng: value.lng } : null
  );
  const [autocompleteRef, setAutocompleteRef] =
    useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchText, setSearchText] = useState("");

  // Sync marker with external value
  useEffect(() => {
    if (value) {
      setMarker({ lat: value.lat, lng: value.lng });
    }
  }, [value]);

  // Handle map click — set pin
  const handleMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarker({ lat, lng });

      // Reverse geocode to get address
      try {
        const geocoder = new google.maps.Geocoder();
        const result = await geocoder.geocode({ location: { lat, lng } });
        if (result.results[0]) {
          const addr = result.results[0].formatted_address;
          const city = extractCity(result.results[0].address_components);
          onChange({
            lat,
            lng,
            address: addr,
            city,
            googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
          });
          setSearchText(addr);
        }
      } catch {
        onChange({
          lat,
          lng,
          address: "",
          city: "",
          googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
        });
      }
    },
    [onChange]
  );

  // Handle autocomplete place selection
  const handlePlaceSelect = useCallback(() => {
    if (!autocompleteRef) return;
    const place = autocompleteRef.getPlace();
    if (!place.geometry?.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const addr = place.formatted_address || "";
    const city = extractCity(place.address_components || []);
    setMarker({ lat, lng });

    onChange({
      lat,
      lng,
      address: addr,
      city,
      googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
    });
    setSearchText(addr);
  }, [autocompleteRef, onChange]);

  // Handle autocomplete load
  const handleAutocompleteLoad = useCallback(
    (autocomplete: google.maps.places.Autocomplete) => {
      setAutocompleteRef(autocomplete);
    },
    []
  );

  // Clear location
  const handleClear = () => {
    setMarker(null);
    setSearchText("");
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // Extract city from address components
  function extractCity(
    components: google.maps.GeocoderAddressComponent[]
  ): string {
    const cityComponent = components.find(
      (c) =>
        c.types.includes("locality") ||
        c.types.includes("administrative_area_level_2")
    );
    return cityComponent?.long_name || "";
  }

  // ==================== Render ====================

  if (!apiKey) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground text-sm">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Google Maps API key not configured</p>
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-destructive text-sm">
          <p>Failed to load Google Maps</p>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading map...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {/* Search Input with Autocomplete */}
      <div className="relative">
        <Autocomplete
          onLoad={handleAutocompleteLoad}
          onPlaceChanged={handlePlaceSelect}
          fields={[
            "geometry",
            "formatted_address",
            "address_components",
          ]}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={t("branches.searchLocation") || "Search location..."}
              className="pl-9 pr-9"
            />
            {searchText && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={handleClear}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </Autocomplete>
      </div>

      {/* Map */}
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={marker || DEFAULT_CENTER}
        zoom={marker ? 16 : 12}
        onClick={handleMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
        }}
      >
        {marker && <Marker position={marker} draggable onDragEnd={(e) => {
          if (e.latLng) {
            handleMapClick(e as unknown as google.maps.MapMouseEvent);
          }
        }} />}
      </GoogleMap>

      {/* Selected location info */}
      {value && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
          <div>
            <p className="font-medium text-foreground">{value.address}</p>
            {value.city && <p>City: {value.city}</p>}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
