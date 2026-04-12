"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";

interface GlobeProps {
  locations: [number, number][];
}

export function Globe({ locations }: GlobeProps) {
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
            features: locations.map(([lng, lat]) => ({
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
            "circle-color": "#FF5001",
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
            "circle-color": "#FF5001",
            "circle-opacity": 0.9,
          },
        });
      });

      // Slow rotation
      function rotate() {
        const center = map.getCenter();
        center.lng += 0.01;
        map.setCenter(center);
        animationId = requestAnimationFrame(rotate);
      }
      animationId = requestAnimationFrame(rotate);
    })();

    return () => {
      cancelAnimationFrame(animationId);
      map?.remove();
    };
  }, [locations]);

  return (
    <motion.div
      className="absolute -z-10 w-full"
      style={{ height: "80vh" }}
      initial={{ opacity: 0, filter: "blur(20px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 1.2, delay: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div
        ref={containerRef}
        className="absolute left-0 right-0"
        style={{ top: "0%", height: "250%" }}
      />
      {/* Top fade into the page background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-background to-transparent" />
      {/* Bottom clip */}
      {/* <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" /> */}
    </motion.div>
  );
}
