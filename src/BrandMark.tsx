import { colors } from "./components";

export const brand = {
  name: "NoSkipLearning",
  tagline: "Understand it. Then move on.",
};

// Vector-only mark: a compact monogram with a distinct inset verification tab.
// All proportions share one viewBox so the mark also works outside this video.
export const BrandMark = ({ size = 64 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 80 80"
    role="img"
    aria-label="NSL check mark"
    style={{ display: "block", flexShrink: 0 }}
  >
    <rect x="1" y="1" width="78" height="78" rx="20" fill={colors.accent} />
    <text
      x="39"
      y="40"
      textAnchor="middle"
      fontFamily="Inter, sans-serif"
      fontWeight="700"
      fontSize="28"
      letterSpacing="-1.4"
      fill={colors.ink}
    >
      NSL
    </text>
    <path
      d="M18 58 H39"
      stroke={colors.ink}
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.3"
    />
    <rect x="47" y="47" width="24" height="24" rx="8" fill={colors.ink} />
    <path
      d="m53 59 4 4 8-9"
      fill="none"
      stroke={colors.accent}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const BrandWatermark = () => (
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
    <BrandMark size={62} />
    <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.7 }}>
      {brand.name}
    </span>
  </div>
);

export const BrandSignature = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 20,
      marginTop: 62,
    }}
  >
    <BrandMark size={72} />
    <div>
      <div style={{ fontSize: 32, fontWeight: 600, marginBottom: 10 }}>
        {brand.name}
      </div>
      <div style={{ fontSize: 29, color: colors.muted }}>{brand.tagline}</div>
    </div>
  </div>
);
