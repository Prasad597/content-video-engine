import type { ChannelDefinition } from "../engine/types";
export const BrandMark = ({
  channel,
  size = 64,
}: {
  channel: ChannelDefinition;
  size?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 80 80"
    role="img"
    aria-label={channel.name}
    style={{ display: "block", flexShrink: 0 }}
  >
    <rect
      x="1"
      y="1"
      width="78"
      height="78"
      rx="20"
      fill={channel.theme.accent}
    />
    <text
      x="39"
      y="40"
      textAnchor="middle"
      fontFamily="Inter, sans-serif"
      fontWeight="700"
      fontSize="28"
      letterSpacing="-1.4"
      fill={channel.theme.ink}
    >
      {channel.mark}
    </text>
    <path
      d="M18 58 H39"
      stroke={channel.theme.ink}
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.3"
    />
    <rect
      x="47"
      y="47"
      width="24"
      height="24"
      rx="8"
      fill={channel.theme.ink}
    />
    <path
      d="m53 59 4 4 8-9"
      fill="none"
      stroke={channel.theme.accent}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export const BrandWatermark = ({ channel }: { channel: ChannelDefinition }) => (
  <div
    style={{
      position: "absolute",
      left: 78,
      top: 150,
      display: "flex",
      gap: 16,
      alignItems: "center",
      opacity: 0.78,
    }}
  >
    <BrandMark channel={channel} size={62} />
    <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.7 }}>
      {channel.name}
    </span>
  </div>
);
export const ChannelSignature = ({
  channel,
}: {
  channel: ChannelDefinition;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 20,
      marginTop: 48,
    }}
  >
    <BrandMark channel={channel} size={72} />
    <div>
      <div style={{ fontSize: 32, fontWeight: 600, marginBottom: 10 }}>
        {channel.name}
      </div>
      <div style={{ fontSize: 29, color: channel.theme.muted }}>
        {channel.tagline}
      </div>
    </div>
  </div>
);
