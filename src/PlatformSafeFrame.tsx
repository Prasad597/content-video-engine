import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from "remotion";

// Conservative project policy, NOT official platform UI/cropping guarantees.
export const MASTER = { width: 1080, height: 1920 } as const;
export const SAFE_MARGINS = { left: 90, right: 180, top: 250, bottom: 350 } as const;
export const SAFE_WIDTH = MASTER.width - SAFE_MARGINS.left - SAFE_MARGINS.right;
export const SAFE_HEIGHT = MASTER.height - SAFE_MARGINS.top - SAFE_MARGINS.bottom;
const BRAND_HEIGHT = 90;
const CAPTION_HEIGHT = 190;

export const SafeContentLayer = ({ children }: { children: ReactNode }) => (
  <div data-safe-content style={{ position: "absolute", ...SAFE_MARGINS }}>{children}</div>
);

// Only overflowing meaningful content is fitted, never the canvas/background.
// Reserve space for the existing 14 px Reveal translation, without clipping it.
export const SafeContentSlot = ({ children, caption = false }: { children: ReactNode; caption?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const frame = useCurrentFrame();
  const height = caption ? CAPTION_HEIGHT : SAFE_HEIGHT - BRAND_HEIGHT - CAPTION_HEIGHT;
  const measure = () => {
    const node = ref.current;
    if (node) setScale(Math.min(1, SAFE_WIDTH / Math.max(SAFE_WIDTH, node.scrollWidth), height / Math.max(1, node.offsetHeight + 16)));
  };
  useLayoutEffect(measure, [frame, children, height]);
  useLayoutEffect(() => {
    const handle = delayRender("Measure safe content after fonts load");
    let active = true;
    document.fonts.ready.then(() => { if (active) measure(); continueRender(handle); });
    const observer = new ResizeObserver(measure);
    if (ref.current) observer.observe(ref.current);
    return () => { active = false; observer.disconnect(); continueRender(handle); };
  }, [height]);
  return (
    <div data-safe-slot={caption ? "caption" : "scene"} style={{ position: "absolute", left: 0, right: 0,
      top: caption ? undefined : BRAND_HEIGHT, bottom: caption ? 0 : undefined, height }}>
      <div ref={ref} data-safe-fit style={{ position: "absolute", width: SAFE_WIDTH, display: "flow-root",
        top: caption ? undefined : 0, bottom: caption ? 0 : undefined,
        transform: `scale(${scale})`, transformOrigin: caption ? "bottom left" : "top left" }}>
        {children}
      </div>
    </div>
  );
};

export const SafeZoneOverlay = () => (
  <AbsoluteFill data-safe-overlay style={{ pointerEvents: "none", zIndex: 1000, boxShadow: "inset 0 0 0 3px #ff6b6b" }}>
    <div style={{ position: "absolute", ...SAFE_MARGINS, border: "3px dashed #68f5ff",
      boxShadow: "0 0 0 3000px rgba(255, 50, 50, 0.15)", boxSizing: "border-box" }} />
    <div style={{ position: "absolute", left: SAFE_MARGINS.left, top: 180, color: "#68f5ff", fontSize: 25 }}>
      PREVIEW · 1080×1920 · SAFE: x90–900 / y250–1570
    </div>
  </AbsoluteFill>
);
