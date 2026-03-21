import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "./theme";

function getScoreColor(score: number): string {
  if (score < 50) return theme.red;
  if (score < 70) return theme.yellow;
  return theme.green;
}

function getGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

const checks = [
  { label: "CLAUDE.md exists", before: "✗", after: "✓" },
  { label: "Skills configured", before: "✗", after: "✓" },
  { label: "MCP servers synced", before: "✗", after: "✓" },
  { label: "Rules grounded", before: "—", after: "✓" },
];

export const ScoreTransition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  // Slower transition: starts at frame 30, completes by ~60
  const transitionProgress = spring({ frame: frame - 28, fps, config: { damping: 22, mass: 0.8 } });
  const score = Math.round(interpolate(transitionProgress, [0, 1], [47, 94]));
  const barWidth = interpolate(transitionProgress, [0, 1], [47, 94]);
  const scoreColor = getScoreColor(score);
  const grade = getGrade(score);

  const glowIntensity = score >= 90 ? interpolate(frame, [60, 75], [0, 1], { extrapolateRight: "clamp" }) : 0;
  const subtitleOpacity = interpolate(frame, [75, 95], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: containerOpacity,
        background: `radial-gradient(ellipse 40% 40% at 50% 50%, ${scoreColor}06, transparent)`,
      }}
    >
      {/* Section label */}
      <div
        style={{
          position: "absolute",
          top: "8%",
          fontSize: 24,
          fontFamily: theme.fontMono,
          color: theme.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.15em",
        }}
      >
        $ caliber score
      </div>

      {/* Score card */}
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: theme.radiusLg,
          padding: "52px 72px",
          border: `1px solid ${theme.surfaceBorder}`,
          minWidth: 720,
          boxShadow: `0 0 ${40 * glowIntensity}px ${theme.green}20`,
        }}
      >
        {/* Score row */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginBottom: 24 }}>
          <span
            style={{
              color: theme.text,
              fontSize: 100,
              fontWeight: 700,
              fontFamily: theme.fontSans,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
            }}
          >
            {score}
          </span>
          <span style={{ color: theme.textMuted, fontSize: 36, fontFamily: theme.fontSans }}>/100</span>
          <div
            style={{
              marginLeft: "auto",
              padding: "8px 28px",
              borderRadius: 28,
              backgroundColor: `${scoreColor}15`,
              border: `1px solid ${scoreColor}30`,
              color: scoreColor,
              fontSize: 36,
              fontWeight: 700,
              fontFamily: theme.fontSans,
            }}
          >
            Grade {grade}
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: "100%",
            height: 10,
            backgroundColor: `${theme.textMuted}20`,
            borderRadius: 5,
            overflow: "hidden",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: `${barWidth}%`,
              height: "100%",
              backgroundColor: scoreColor,
              borderRadius: 5,
              boxShadow: `0 0 14px ${scoreColor}40`,
            }}
          />
        </div>

        {/* Check items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {checks.map((check, i) => {
            const checkProgress = spring({
              frame: frame - 34 - i * 4,
              fps,
              config: { damping: 14 },
            });
            const isAfter = checkProgress > 0.5;
            const symbol = isAfter ? check.after : check.before;
            const symbolColor = symbol === "✓" ? theme.green : symbol === "✗" ? theme.red : theme.textMuted;

            return (
              <div key={check.label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span
                  style={{
                    width: 28,
                    textAlign: "center",
                    color: symbolColor,
                    fontSize: 24,
                    fontFamily: theme.fontMono,
                    fontWeight: 600,
                  }}
                >
                  {symbol}
                </span>
                <span style={{ color: theme.textSecondary, fontSize: 24, fontFamily: theme.fontSans }}>
                  {check.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key message */}
      <div
        style={{
          position: "absolute",
          bottom: "8%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          opacity: subtitleOpacity,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontFamily: theme.fontSans,
            color: theme.text,
            fontWeight: 600,
          }}
        >
          Fully runs on your setup
        </div>
        <div
          style={{
            fontSize: 20,
            fontFamily: theme.fontSans,
            color: theme.textMuted,
          }}
        >
          No code sent anywhere. 100% local scoring.
        </div>
      </div>
    </AbsoluteFill>
  );
};
