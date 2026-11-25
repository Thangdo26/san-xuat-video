import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { AbsoluteFill, useDelayRender, useVideoConfig } from "remotion";

export type MapPlateProps = {
  readonly style: string;
  readonly center: [number, number];
  readonly zoom: number;
  /** Plate size in CSS pixels; applied through calculateMetadata in Root. */
  readonly width: number;
  readonly height: number;
};

/**
 * Build-time only: renders one still of the region with MapLibre so the video
 * itself can animate over a flat image. That keeps the main render fast,
 * deterministic and offline - no WebGL, no tile requests per frame.
 *
 * Rendered by `npm run video:map`, which also stores the center and zoom used
 * here so pins can be projected onto the image with the same Web Mercator
 * maths MapLibre uses (see src/map-projection.ts).
 */
export const MapPlate: React.FC<MapPlateProps> = ({ style, center, zoom }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const { width, height } = useVideoConfig();
  const [handle] = useState(() => delayRender("Loading map plate"));

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    maplibregl.setWorkerUrl(
      URL.createObjectURL(
        new Blob(
          [
            `import "https://unpkg.com/maplibre-gl@${maplibregl.getVersion()}/dist/maplibre-gl-worker.mjs";`,
          ],
          { type: "text/javascript" },
        ),
      ),
    );

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center,
      zoom,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });

    map.on("error", (event) => {
      cancelRender(event.error ?? new Error("MapLibre failed to load"));
    });

    map.on("load", () => {
      map.jumpTo({ center, zoom });
      map.once("idle", () => continueRender(handle));
    });
  }, [cancelRender, center, continueRender, handle, style, zoom]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#04101a" }}>
      <div ref={containerRef} style={{ width, height, position: "absolute" }} />
    </AbsoluteFill>
  );
};
