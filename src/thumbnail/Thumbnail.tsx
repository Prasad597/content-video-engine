import { AbsoluteFill } from "remotion";
import { BrandMark } from "../brand/BrandMark";
import type { ChannelDefinition, ThumbnailDefinition } from "../engine/types";

export type ThumbnailProps = { thumbnail: ThumbnailDefinition; channel: ChannelDefinition };
// Cover crop policy is independent of video playback safe areas. Critical content
// stays in the central 1080px square (y420..1500), with additional inset.
export const Thumbnail = ({ thumbnail: t, channel }: ThumbnailProps) => {
  const c = channel.theme;
  const lines = t.headline.split("\n");
  const headlineSize = Math.min(68, 820 / (Math.max(...lines.map((l) => l.length)) * 0.61));
  const d = t.diagram;
  return <AbsoluteFill style={{ background: c.ink, color: c.text, fontFamily: "var(--mono)" }}>
    <AbsoluteFill style={{ opacity: 0.15, backgroundImage: `linear-gradient(${c.line} 1px, transparent 1px), linear-gradient(90deg, ${c.line} 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
    <div style={{ position: "absolute", inset: "440px 72px", border: `1px solid ${c.line}`, borderRadius: 24, background: c.ink, boxShadow: "0 24px 100px #0005" }} />
    <div style={{ position: "absolute", top: 490, left: 118, display: "flex", alignItems: "center", gap: 12 }}>
      <BrandMark channel={channel} size={40} />
      <span style={{ fontFamily: "var(--sans)", fontSize: 22, color: c.muted }}>{channel.name}</span>
    </div>
    <div style={{ position: "absolute", top: 565, left: 120, right: 120, fontSize: 22, letterSpacing: 2, color: c.accent }}>{t.eyebrow}</div>
    <div style={{ position: "absolute", top: 625, left: 110, right: 110, textAlign: "center", fontSize: headlineSize, fontWeight: 500, lineHeight: 1.2, whiteSpace: "pre-line" }}>{t.headline}</div>
    {d && <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, fontFamily: "JetBrains Mono, monospace" }}>
      <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1 L7 4 L1 7" fill="none" stroke={c.accent} strokeWidth="1.2" /></marker></defs>
      <text x="540" y="848" textAnchor="middle" fontSize="62" fill={c.red}>{d.verdict}</text>
      {[d.left, d.right].map((node, i) => <g key={i}>
        <rect x="118" y={880 + i * 84} width="844" height="68" rx="9" fill="#ffffff05" stroke={c.line} />
        <text x="142" y={923 + i * 84} fontSize="25" fill={c.muted}>{i + 1}</text>
        <text x="192" y={923 + i * 84} fontSize="29" fill={c.text}>{node.expression}</text>
        <text x="710" y={923 + i * 84} fontSize="29" fill={c.muted}>→</text>
        <text x="770" y={923 + i * 84} fontSize="31" fill={c.accent}>{node.value}</text>
      </g>)}
      <path d="M340 1052 V1084 H420 V1150" stroke={c.accent} strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
      <path d="M740 1052 V1084 H660 V1150" stroke={c.accent} strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
      <rect x="218" y="1160" width="644" height="166" rx="14" fill="#ffffff03" stroke={c.accent} strokeWidth="2" />
      <text x="540" y="1201" textAnchor="middle" fontSize="24" fill={c.muted}>{d.destination}</text>
      {[d.left, d.right].map((node, i) => <g key={i}>
        <rect x={254 + i * 290} y="1230" width="246" height="62" rx="7" fill={c.ink} stroke={c.line} strokeWidth="2" />
        <text x={377 + i * 290} y="1271" textAnchor="middle" fontSize="29" fill={c.text}>{node.label}</text>
      </g>)}
      <text x="522" y="1271" textAnchor="middle" fontSize="27" fill={c.red}>≠</text>
    </svg>}
    {t.subheadline && <div style={{ position: "absolute", top: d ? 1380 : 980, left: 110, right: 110, textAlign: "center", fontSize: 26, color: c.muted }}>{t.subheadline}</div>}
  </AbsoluteFill>;
};
