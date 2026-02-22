"use client";

import { useEffect, useState } from "react";
import { Dithering } from "@paper-design/shaders-react";

export function ShaderBackground() {
  const [dimensions, setDimensions] = useState({ width: 1280, height: 720 });

  useEffect(() => {
    function updateDimensions() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      <Dithering
        width={dimensions.width}
        height={dimensions.height}
        colorBack="#000000"
        colorFront="#4F2800"
        shape="warp"
        type="4x4"
        size={1}
        speed={0.2}
        scale={1}
      />
    </div>
  );
}
