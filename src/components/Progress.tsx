/** @jsxImportSource @emotion/react */
import React from "react";
import { css, type Interpolation, keyframes } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import type { Theme } from "@emotion/react";

export type ProgressProps = {
  variant?: "linear" | "circular";
  value?: number;
  min?: number;
  max?: number;
  color?: string;
  size?: number | string;
  thickness?: number;
  spinDuration?: number;
  wrapperCss?: Interpolation<Theme>;
  trackCss?: Interpolation<Theme>;
  barCss?: Interpolation<Theme>;
  circleCss?: Interpolation<Theme>;
  "aria-label"?: string;
};

type LinearProps = {
  thickness?: number;
  active: string;
  track: string;
  radius: number | string | undefined;
  isDeterminate: boolean;
  percent?: number;
  wrapperCss?: Interpolation<Theme>;
  trackCss?: Interpolation<Theme>;
  barCss?: Interpolation<Theme>;
  ariaLabel?: string;
  min: number;
  max: number;
  value?: number;
};

type CircularProps = {
  size?: number | string;
  thickness?: number;
  active: string;
  isDeterminate: boolean;
  percent?: number;
  spinDuration: number;
  wrapperCss?: Interpolation<Theme>;
  trackCss?: Interpolation<Theme>;
  circleCss?: Interpolation<Theme>;
  ariaLabel?: string;
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const asPx = (v: number | string | undefined, fb: string) =>
  v == null ? fb : typeof v === "number" ? `${v}px` : v;

const MIN_VISUAL_PCT = 1;

const spin = keyframes`100% { transform: rotate(360deg); }`;
const indet1 = keyframes`
  0%   { left: -35%; right: 100%; }
  60%  { left: 100%; right: -90%; }
  100% { left: 100%; right: -90%; }
`;
const indet2 = keyframes`
  0%   { left: -200%; right: 100%; }
  60%  { left: 107%;  right: -8%;  }
  100% { left: 107%;  right: -8%;  }
`;

const cssColorLike = (s: string) =>
  s.startsWith("#") ||
  s.startsWith("rgb(") || s.startsWith("rgba(") ||
  s.startsWith("hsl(") || s.startsWith("hsla(") ||
  s.startsWith("oklch(") || s.startsWith("lab(") ||
  s.startsWith("color(") || s.startsWith("var(");

const allowedShades = new Set(["0","50","100","200","300","400","500","600","700","800","900"]);

function resolvePaletteColor(theme: ReturnType<typeof usePlainframeUITheme>, color?: string): string {
  if (!color || color.trim() === "") return theme.text.primary;

  const raw = color.trim();

  if (cssColorLike(raw)) return raw;

  const m = raw.match(/^([a-zA-Z0-9_-]+)[\.\-:\s]?([0-9]{1,3})?$/);
  if (m) {
    const name = m[1];
    const shade = (m[2] && allowedShades.has(m[2])) ? (m[2] as any) : "600";

    if (name === "primary" && (theme.palette as any).primary?.[shade]) {
      return (theme.palette as any).primary[shade];
    }

    const scale = (theme.palette as any)[name];
    if (scale && scale[shade] != null) return scale[shade];

    if (name === "neutral" || name === "secondary" && (theme.neutral as any)[shade] != null) {
      return (theme.neutral as any)[shade];
    }
  }

  return theme.palette.primary[600];
}

export const Progress: React.FC<ProgressProps> = React.memo(({
  variant = "circular",
  value,
  min = 0,
  max = 100,
  color,
  size,
  thickness,
  spinDuration = 0.75,
  wrapperCss,
  trackCss,
  barCss,
  circleCss,
  "aria-label": ariaLabel,
}) => {
  const theme = usePlainframeUITheme();
  const isDeterminate = typeof value === "number";
  const safeRange = Math.max(max - min, 1);
  const val = isDeterminate ? clamp(value as number, min, max) : undefined;
  const percent = isDeterminate ? ((val! - min) / safeRange) * 100 : undefined;

  const active = resolvePaletteColor(theme, color);
  const track = theme.surface.subtleBg;
  const radius = theme.radius?.md;

  if (variant === "circular") {
    return (
      <Circular
        size={size}
        active={active}
        isDeterminate={isDeterminate}
        percent={percent}
        spinDuration={spinDuration}
        wrapperCss={wrapperCss}
        trackCss={trackCss}
        circleCss={circleCss}
        ariaLabel={ariaLabel}
        thickness={thickness}
      />
    );
  }

  return (
    <Linear
      thickness={thickness}
      active={active}
      track={track}
      radius={radius}
      isDeterminate={isDeterminate}
      percent={percent}
      wrapperCss={wrapperCss}
      trackCss={trackCss}
      barCss={barCss}
      ariaLabel={ariaLabel}
      min={min}
      max={max}
      value={val}
    />
  );
});

const Linear: React.FC<LinearProps> = ({
  thickness = 4,
  active,
  track,
  radius,
  isDeterminate,
  percent,
  wrapperCss,
  trackCss,
  barCss,
  ariaLabel,
  min,
  max,
  value,
}) => {
  const r =
    radius == null ? "8px" : typeof radius === "number" ? `${radius}px` : String(radius);

  const rootCss = css([
    { display: "inline-block", width: "100%" },
    ...(Array.isArray(wrapperCss) ? wrapperCss : wrapperCss ? [wrapperCss] : []),
  ]);

  const barBase = css([
    {
      position: "relative",
      width: "100%",
      height: asPx(thickness, "6px"),
      backgroundColor: track,
      borderRadius: r,
      overflow: "hidden",
    },
    ...(Array.isArray(trackCss) ? trackCss : trackCss ? [trackCss] : []),
  ]);

  const pctRender = isDeterminate ? Math.max(percent ?? 0, MIN_VISUAL_PCT) : MIN_VISUAL_PCT;

  const fillDeterminate = css([
    {
      position: "absolute",
      inset: 0,
      backgroundColor: active,
      borderRadius: "inherit",
      transformOrigin: "left",
      transform: `scaleX(${pctRender / 100})`,
      transition: "transform 160ms cubic-bezier(.2,0,.2,1)",
      willChange: "transform",
    },
    ...(Array.isArray(barCss) ? barCss : barCss ? [barCss] : []),
  ]);

  const runnerBase = {
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    backgroundColor: active,
    borderRadius: "inherit",
    willChange: "left,right",
    ["@media (prefers-reduced-motion: reduce)"]: { animation: "none" } as any,
  };

  const runner1 = css([
    {
      ...runnerBase,
      left: "-35%",
      right: "100%",
      animation: `${indet1} 2.1s cubic-bezier(.65,.815,.735,.395) infinite`,
    },
    ...(Array.isArray(barCss) ? barCss : barCss ? [barCss] : []),
  ]);

  const runner2 = css([
    {
      ...runnerBase,
      left: "-200%",
      right: "100%",
      animation: `${indet2} 2.1s cubic-bezier(.165,.84,.44,1) 1.15s infinite`,
    },
    ...(Array.isArray(barCss) ? barCss : barCss ? [barCss] : []),
  ]);

  const ariaProps = isDeterminate
    ? { role: "progressbar", "aria-valuemin": min, "aria-valuemax": max, "aria-valuenow": value }
    : { role: "progressbar", "aria-busy": true };

  if (ariaLabel) (ariaProps as any)["aria-label"] = ariaLabel;

  return (
    <span css={rootCss} {...ariaProps}>
      <div className="plainframe-ui-progress-linear-track" css={barBase}>
        {isDeterminate ? (
          <div className="plainframe-ui-progress-linear-fill" css={fillDeterminate} />
        ) : (
          <>
            <div className="plainframe-ui-progress-linear-runner1" css={runner1} />
            <div className="plainframe-ui-progress-linear-runner2" css={runner2} />
          </>
        )}
      </div>
    </span>
  );
};

const Circular: React.FC<CircularProps> = ({
  size,
  thickness = 4,
  active,
  isDeterminate,
  percent,
  spinDuration,
  wrapperCss,
  trackCss,
  circleCss,
  ariaLabel,
}) => {
  const theme = usePlainframeUITheme();
  const d = 40;
  const r = (d - thickness) / 2;
  const c = 2 * Math.PI * r;

  const arcFraction = isDeterminate ? clamp((percent ?? 0) / 100, 0.01, 1) : 0.7;
  const dashArray = `${arcFraction * c} ${c}`;

  const spinnerWrap = css([
    {
      display: "inline-block",
      width: asPx(size, `${theme.componentHeights.md}`),
      height: asPx(size, `${theme.componentHeights.md}`),
    },
    ...(Array.isArray(wrapperCss) ? wrapperCss : wrapperCss ? [wrapperCss] : []),
  ]);

  const svgCss = css([
    {
      width: "100%",
      height: "100%",
      transform: "rotate(-90deg)",
      transformBox: "fill-box",
      transformOrigin: "50% 50%",
    },
    ...(Array.isArray(trackCss) ? trackCss : trackCss ? [trackCss] : []),
  ]);

  const circleBase = css([
    {
      stroke: active,
      strokeLinecap: "butt",
      strokeDasharray: dashArray,
      strokeDashoffset: 0,
      transition: isDeterminate ? "stroke-dasharray 160ms cubic-bezier(.2,0,.2,1)" : "none",
      transformBox: "fill-box",
      transformOrigin: "50% 50%",
      fill: "none",
      willChange: isDeterminate ? "stroke-dasharray" : "transform",
      animation: isDeterminate ? "none" : `${spin} ${spinDuration}s linear infinite`,
      ["@media (prefers-reduced-motion: reduce)"]: { animation: "none" } as any,
    },
    ...(Array.isArray(circleCss) ? circleCss : circleCss ? [circleCss] : []),
  ]);

  const ariaProps = isDeterminate
    ? {
        role: "progressbar",
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": Math.round(percent ?? 0),
      }
    : { role: "progressbar", "aria-busy": true };

  if (ariaLabel) (ariaProps as any)["aria-label"] = ariaLabel;

  return (
    <span css={spinnerWrap} className="plainframe-ui-progress-circular" {...ariaProps}>
      <svg css={svgCss} viewBox={`0 0 ${d} ${d}`} focusable="false" aria-hidden>
        <circle cx={d / 2} cy={d / 2} r={r} strokeWidth={thickness} css={circleBase} />
      </svg>
    </span>
  );
};
