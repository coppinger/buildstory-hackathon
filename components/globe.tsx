"use client";

import { useEffect, useRef } from "react";

const PARTICIPANT_LOCATIONS: [number, number][] = [
  [-73.935, 40.73],    // New York
  [-122.42, 37.77],    // San Francisco
  [-43.17, -22.91],    // Rio de Janeiro
  [-3.7, 40.42],       // Madrid
  [2.35, 48.86],       // Paris
  [13.4, 52.52],       // Berlin
  [12.5, 41.9],        // Rome
  [31.24, 30.04],      // Cairo
  [28.98, 41.01],      // Istanbul
  [37.62, 55.75],      // Moscow
  [77.21, 28.61],      // New Delhi
  [100.5, 13.76],      // Bangkok
  [103.85, 1.29],      // Singapore
  [121.47, 31.23],     // Shanghai
  [139.69, 35.69],     // Tokyo
  [151.21, -33.87],    // Sydney
  [-46.63, -23.55],    // Sao Paulo
  [18.42, -33.92],     // Cape Town
  [24.94, 60.17],      // Helsinki
  [-79.38, 43.65],     // Toronto
];

export function Globe() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.warn("NEXT_PUBLIC_MAPBOX_TOKEN not set — globe disabled");
      return;
    }

    let map: import("mapbox-gl").Map;
    let animationId: number;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (!containerRef.current) return;

      mapboxgl.accessToken = token;

      map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        projection: "globe",
        center: [20, 20],
        zoom: 3,
        interactive: false,
        attributionControl: false,
        fadeDuration: 0,
      });

      // Force the WebGL canvas to be transparent
      const canvas = map.getCanvas();
      canvas.style.background = "transparent";

      map.on("style.load", () => {
        // Remove fog so space around the globe is transparent
        map.setFog(null as never);

        // Hide the style's background layer
        const bgLayer = map.getStyle().layers?.find((l) => l.type === "background");
        if (bgLayer) {
          map.setPaintProperty(bgLayer.id, "background-opacity", 0);
        }

        // Hide all labels
        for (const layer of map.getStyle().layers ?? []) {
          if (layer.type === "symbol") {
            map.setLayoutProperty(layer.id, "visibility", "none");
          }
        }

        map.addSource("participants", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: PARTICIPANT_LOCATIONS.map(([lng, lat]) => ({
              type: "Feature" as const,
              geometry: { type: "Point" as const, coordinates: [lng, lat] },
              properties: {},
            })),
          },
        });

        // Outer glow
        map.addLayer({
          id: "participant-glow",
          type: "circle",
          source: "participants",
          paint: {
            "circle-radius": 24,
            "circle-color": "orange",
            "circle-opacity": 0.15,
            "circle-blur": 1,
          },
        });

        // Inner dot
        map.addLayer({
          id: "participant-dots",
          type: "circle",
          source: "participants",
          paint: {
            "circle-radius": 4,
            "circle-color": "orange",
            "circle-opacity": 0.9,
          },
        });
      });

      // Slow rotation
      function rotate() {
        const center = map.getCenter();
        center.lng += 0.03;
        map.setCenter(center);
        animationId = requestAnimationFrame(rotate);
      }
      animationId = requestAnimationFrame(rotate);
    })();

    return () => {
      cancelAnimationFrame(animationId);
      map?.remove();
    };
  }, []);

  return (
    <div className="absolute -z-10 w-full overflow-hidden" style={{ height: "80vh" }}>
      <div
        ref={containerRef}
        className="absolute left-0 right-0"
        style={{ top: "10%", height: "250%" }}
      />
      {/* Top fade into the page background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-background to-transparent" />
      {/* Bottom clip */}
      {/* <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" /> */}
    </div>
  );
}
