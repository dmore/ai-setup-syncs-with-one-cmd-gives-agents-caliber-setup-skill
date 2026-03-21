import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Logo } from "./Logo";
import { theme } from "./theme";
import { ClaudeIcon, CursorIcon, CodexIcon, CopilotIcon } from "./ToolIcons";

const editors = [
  { name: "Claude Code", Icon: ClaudeIcon, color: "#d4a574", angle: -40 },
  { name: "Cursor", Icon: CursorIcon, color: "#7dd3fc", angle: 40 },
  { name: "Codex", Icon: CodexIcon, color: "#86efac", angle: 150 },
  { name: "Copilot", Icon: CopilotIcon, color: "#c4b5fd", angle: 210 },
];

export const EcosystemHub: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [10, 28], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [10, 28], [16, 0], { extrapolateRight: "clamp" });
  const taglineOpacity = interpolate(frame, [22, 40], [0, 1], { extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [50, 68], [0, 1], { extrapolateRight: "clamp" });

  const orbitRotation = interpolate(frame, [0, 120], [0, 12], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${theme.brand3}08, transparent)`,
      }}
    >
      {/* Outer glow ring */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          border: `1px solid ${theme.brand3}10`,
          opacity: interpolate(frame, [20, 45], [0, 1], { extrapolateRight: "clamp" }),
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 420,
          height: 420,
          borderRadius: "50%",
          border: `1px dashed ${theme.surfaceBorder}`,
          opacity: interpolate(frame, [18, 40], [0, 0.5], { extrapolateRight: "clamp" }),
        }}
      />

      {/* Logo */}
      <div style={{ marginBottom: 16 }}>
        <Logo size={1} animate delay={0} />
      </div>

      {/* Brand name */}
      <div
        style={{
          fontSize: 80,
          fontWeight: 700,
          fontFamily: theme.fontSans,
          letterSpacing: "-0.03em",
          background: `linear-gradient(135deg, ${theme.brand1}, ${theme.brand3})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        caliber
      </div>

      {/* Primary tagline */}
      <div
        style={{
          fontSize: 32,
          fontFamily: theme.fontSans,
          color: theme.textSecondary,
          opacity: taglineOpacity,
          marginTop: 10,
          fontWeight: 400,
        }}
      >
        AI setup tailored for your codebase
      </div>

      {/* Key message */}
      <div
        style={{
          fontSize: 24,
          fontFamily: theme.fontSans,
          color: theme.brand2,
          opacity: subtitleOpacity,
          marginTop: 14,
          fontWeight: 500,
        }}
      >
        Bring your own AI — API key or coding agent seat
      </div>

      {/* Editor nodes with real icons */}
      {editors.map((editor, i) => {
        const delay = 16 + i * 6;
        const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 70 } });
        const radius = 220;
        const angle = ((editor.angle + orbitRotation) * Math.PI) / 180;
        const x = Math.cos(angle) * radius * s;
        const y = Math.sin(angle) * radius * 0.52 * s;

        const lineProgress = interpolate(frame, [delay + 8, delay + 20], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const pulsePhase = ((frame - delay) % 40) / 40;
        const pulseOpacity = s > 0.9 ? 0.15 + Math.sin(pulsePhase * Math.PI * 2) * 0.1 : 0;

        return (
          <div key={editor.name}>
            <svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            >
              <defs>
                <linearGradient id={`line-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={theme.brand3} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={editor.color} stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <line
                x1="50%"
                y1="44%"
                x2={`${50 + (x / 12.8)}%`}
                y2={`${44 + (y / 7.2)}%`}
                stroke={`url(#line-${i})`}
                strokeWidth={1.5}
                opacity={lineProgress}
                strokeDasharray="4 6"
              />
            </svg>

            <div
              style={{
                position: "absolute",
                left: `calc(50% + ${x}px - 80px)`,
                top: `calc(44% + ${y}px - 22px)`,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 22px",
                borderRadius: 28,
                backgroundColor: theme.surface,
                border: `1px solid ${theme.surfaceBorder}`,
                color: theme.text,
                fontSize: 20,
                fontWeight: 500,
                fontFamily: theme.fontSans,
                opacity: s,
                transform: `scale(${interpolate(s, [0, 1], [0.8, 1])})`,
                boxShadow: `0 0 24px ${editor.color}${Math.round(pulseOpacity * 255).toString(16).padStart(2, "0")}`,
              }}
            >
              <editor.Icon size={24} color={editor.color} />
              {editor.name}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
