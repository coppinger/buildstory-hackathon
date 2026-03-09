"use client";

import { CountryCombobox } from "@/components/onboarding/country-combobox";
import { RegionCombobox } from "@/components/onboarding/region-combobox";

interface LocationInlineProps {
  country: string | null;
  region: string | null;
  onCountryChange: (value: string) => void;
  onRegionChange: (value: string) => void;
}

export function LocationInline({
  country,
  region,
  onCountryChange,
  onRegionChange,
}: LocationInlineProps) {
  return (
    <div className="border border-buildstory-500/20 bg-buildstory-500/5 p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-lg">🌍</span>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Add your location to get your hackathon stamp
          </p>
          <p className="text-xs text-muted-foreground">
            Show where in the world you built from. Totally optional.
          </p>
        </div>
      </div>
      <div className="space-y-3">
        <CountryCombobox value={country ?? ""} onChange={onCountryChange} />
        {country && (
          <RegionCombobox
            countryCode={country}
            value={region ?? ""}
            onChange={onRegionChange}
          />
        )}
      </div>
    </div>
  );
}
