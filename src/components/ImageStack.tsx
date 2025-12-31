/** @jsxImportSource @emotion/react */
import React, { memo, Children, isValidElement } from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { Typography } from "./Typography";

type Variant = "fan" | "slide" | "domino" | "ladder";
type HoverEffect = "reveal" | "expand" | "none";
type Size = "sm" | "md" | "lg" | "xl";
type RadiusToken = "xs" | "sm" | "md" | "lg" | "xl" | "full";

export type ImageStackProps = Omit<React.HTMLAttributes<HTMLDivElement>, "style"> & {
  children: React.ReactNode;
  variant?: Variant;
  width?: number | string;
  aspectRatio?: number | string;
  size?: Size;
  hoverEffect?: HoverEffect;
  hovering?: boolean;
  maxItems?: number;
  shadow?: boolean;
  cursor?: React.CSSProperties["cursor"];
  outline?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
  outlineOffset?: number;
  radius?: number | string | RadiusToken;
  label?: React.ReactNode;
  labelAlign?: "left" | "center" | "right";
  css?: Interpolation<Theme>;
  className?: string;
};

const px = (v: number | string | undefined) =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : v;

const parseAR = (ar: unknown): number | undefined => {
  if (typeof ar === "number" && isFinite(ar) && ar > 0) return ar;
  if (typeof ar === "string") {
    const m = ar.trim().match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
    if (m) {
      const w = parseFloat(m[1]);
      const h = parseFloat(m[2]);
      if (w > 0 && h > 0) return w / h;
    }
    const n = parseFloat(ar);
    if (isFinite(n) && n > 0) return n;
  }
  return undefined;
};

const rad = (d: number) => (d * Math.PI) / 180;
const rotatedBBox = (w: number, h: number, deg: number) => {
  const t = Math.abs(rad(deg));
  const c = Math.cos(t);
  const s = Math.sin(t);
  return { w: Math.abs(w * c) + Math.abs(h * s), h: Math.abs(h * c) + Math.abs(w * s) };
};

function variantTx(variant: Variant, n: number) {
  if (n <= 1) {
    const z = { ang: [0], dx: [0], dy: [0] };
    return { base: z, exp: z };
  }
  if (variant === "fan") {
    const base = n === 2 ? { ang: [-14, 10], dx: [-40, 24], dy: [0, 0] } : { ang: [-14, 0, 14], dx: [-55, 0, 55], dy: [-7.5, 0, -7.5] };
    const exp  = n === 2 ? { ang: [-7, 5], dx: [-20, 12], dy: [0, 0] } : { ang: [-7, 0, 7], dx: [-32.5, 0, 32.5], dy: [0, 0, 0] };
    return { base, exp };
  }
  if (variant === "slide") {
    const base = n === 2 ? { ang: [-20, 3], dx: [-10, 5], dy: [-2, 0] } : { ang: [-20, -5, 10], dx: [-35, -10, 12], dy: [4, 0, 4] };
    const exp  = n === 2 ? { ang: [-10, 1.5], dx: [-10, 5], dy: [-2, 0] } : { ang: [-10, -2.5, 5], dx: [-30.5, -7.5, 6], dy: [4, 0, 4] };
    return { base, exp };
  }
  if (variant === "domino") {
    const base = n === 2 ? { ang: [0, 0], dx: [0, 0], dy: [-11, 5] } : { ang: [0, 0, 0], dx: [0, 0, 0], dy: [-18, -5, 6] };
    const exp  = n === 2 ? { ang: [0, 0], dx: [0, 0], dy: [-5, 5] } : { ang: [0, 0, 0], dx: [0, 0, 0], dy: [-14, -2.5, 7] };
    return { base, exp };
  }
  const base = n === 2 ? { ang: [-4, 8], dx: [-22, 18], dy: [-30, 40] } : { ang: [-10, 10, 0.5], dx: [-30, 30, -15], dy: [-65, 2, 65] };
  const exp  = n === 2 ? { ang: [-3, 6], dx: [-11, 9], dy: [-22.5, 30] } : { ang: [-7.5, 7.5, 0.35], dx: [-15, 20, -10.5], dy: [-55.5, 2, 55.5] };
  return { base, exp };
}

const baseScale = (variant: Variant, n: number, i: number) =>
  variant === "fan" ? (n === 2 ? [0.9, 1.08][i] ?? 1 : [0.8, 1.0, 0.8][i] ?? 1)
  : variant === "slide" ? (n === 2 ? [0.8, 1.0][i] ?? 1 : [0.7, 0.85, 1.0][i] ?? 1)
  : variant === "domino" ? (n === 2 ? [0.9, 1.0][i] ?? 1 : [0.85, 0.95, 1.0][i] ?? 1)
  : 1;

const bumpReveal = [1.02, 1.03, 1.02];
const bumpExpand = [1.06, 1.08, 1.06];

const SIZE_W: Record<Size, number> = { sm: 150, md: 200, lg: 260, xl: 340 };

const toLen = (v: number | string | undefined) =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : v;

function resolveRadius(radius: RadiusToken | string | number | undefined, theme: { radius?: Record<string, unknown>; radii?: Record<string, unknown> }) {
  if (radius == null) return undefined;
  if (typeof radius === "number") return `${radius}px`;
  if (typeof radius === "string") {
    if (["xs", "sm", "md", "lg", "xl", "full"].includes(radius)) {
      const val =
        (theme.radius && theme.radius[radius]) ||
        (theme.radii && theme.radii[radius]);
      return toLen((typeof val === "number" || typeof val === "string") ? val : radius);
    }
    return radius;
  }
  return undefined;
}

export const ImageStack: React.FC<ImageStackProps> = memo(function ImageStack({
  children,
  variant = "fan",
  width,
  aspectRatio = "4/5",
  size = "md",
  hoverEffect = "none",
  hovering,
  maxItems = 3,
  shadow = false,
  cursor,
  outline,
  outlineColor,
  outlineWidth = 3,
  outlineOffset = 0,
  radius = "md",
  label,
  labelAlign = "center",
  css: userCss,
  className,
  ...rest
}: ImageStackProps) {
  const theme = usePlainframeUITheme();
  const AR = parseAR(aspectRatio) ?? 4 / 5;

  const wStr = typeof width === "string" ? width : undefined;
  const Wn =
    typeof width === "number"
      ? width
      : wStr && /px$/.test(wStr)
      ? parseFloat(wStr)
      : SIZE_W[size];
  const Hn = Math.max(1, Wn / AR);

  const all = Children.toArray(children).filter(isValidElement) as React.ReactElement[];
  const items = all.slice(0, maxItems);
  const n = items.length;

  const t = variantTx(variant, n);
  const baseScales = items.map((_, i) => baseScale(variant, n, i));
  const frameH = (i: number) => Hn * 0.6 * baseScales[i];
  const frameW = (i: number) => frameH(i) * AR;

  let halfW = 0, halfH = 0;
  for (let i = 0; i < n; i++) {
    const bw = frameW(i);
    const bh = frameH(i);
    const worstAng = Math.max(Math.abs(t.base.ang[i] ?? 0), Math.abs(t.exp.ang[i] ?? 0));
    const worstDx = Math.max(Math.abs(t.base.dx[i] ?? 0), Math.abs(t.exp.dx[i] ?? 0));
    const worstDy = Math.max(Math.abs(t.base.dy[i] ?? 0), Math.abs(t.exp.dy[i] ?? 0));
    const bump = hoverEffect === "expand" ? bumpExpand[i] ?? 1.08 : hoverEffect === "reveal" ? bumpReveal[i] ?? 1.03 : 1;
    const rot = rotatedBBox(bw, bh, worstAng);
    const w0 = rot.w * bump;
    const h0 = rot.h * bump;
    const sx = (worstDx / 100) * bw * bump;
    const sy = (worstDy / 100) * bh * bump;
    halfW = Math.max(halfW, w0 / 2 + sx);
    halfH = Math.max(halfH, h0 / 2 + sy);
  }

  const stageW0 = Math.max(1, 2 * halfW);
  const stageH0 = Math.max(1, 2 * halfH);
  const stageScale = Math.min(1, Wn / stageW0, Hn / stageH0);

  const hoverMode = hovering === undefined ? "pointer" : "controlled";
  const hoverAttr = hovering ? "true" : undefined;

  const rootCss = css({
    display: "flex",
    flexDirection: "column",
    cursor: cursor || "auto",
    lineHeight: 0,
    position: "relative",
    isolation: "isolate",
    gap: label ? theme.spacing.xs : 0,
  });

  const stackCss = css({
    position: "relative",
    width: px(typeof width === "number" ? width : Wn) ?? (typeof width === "string" ? width : undefined),
    height: px(Hn),
  });

  const stageCss = css({
    position: "absolute",
    inset: 0,
    left: "50%",
    top: "50%",
    width: `${stageW0}px`,
    height: `${stageH0}px`,
    transform: `translate(-50%, -50%) scale(${stageScale})`,
    transformOrigin: "center center",
  });

  const frameRadius = resolveRadius(radius, theme) ?? "0px";

  const cardCss = (i: number) => {
    const baseTx =
      variant === "fan"
        ? `rotate(${t.base.ang[i]}deg) translate(${t.base.dx[i]}%, ${t.base.dy[i]}%)`
        : variant === "slide"
        ? `translate(${t.base.dx[i]}%, ${t.base.dy[i]}%) rotate(${t.base.ang[i]}deg)`
        : variant === "domino"
        ? `translate(0%, ${t.base.dy[i]}%)`
        : `translate(${t.base.dx[i]}%, ${t.base.dy[i]}%) rotate(${t.base.ang[i]}deg)`;
    const expTx =
      variant === "fan"
        ? `rotate(${t.exp.ang[i]}deg) translate(${t.exp.dx[i]}%, ${t.exp.dy[i]}%)`
        : variant === "slide"
        ? `translate(${t.exp.dx[i]}%, ${t.exp.dy[i]}%) rotate(${t.exp.ang[i]}deg)`
        : variant === "domino"
        ? `translate(0%, ${t.exp.dy[i]}%)`
        : `translate(${t.exp.dx[i]}%, ${t.exp.dy[i]}%) rotate(${t.exp.ang[i]}deg)`;

    const baseTransform = hoverEffect === "reveal" ? `translate(0,0) rotate(0) scale(1)` : `${baseTx} scale(1)`;
    const hoverTransform =
      hoverEffect === "expand"
        ? `${expTx} scale(${bumpExpand[i] ?? 1.06})`
        : hoverEffect === "reveal"
        ? `${baseTx} scale(${bumpReveal[i] ?? 1.03})`
        : `${baseTx} scale(1)`;

    return css({
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: `translate(-50%, -50%) ${baseTransform}`,
      transition: "transform .22s ease",
      willChange: "transform",
      backfaceVisibility: "hidden",
      zIndex: variant === "fan" ? (i === 1 ? 10 : i + 1) : i + 1,
      lineHeight: 0,
      boxShadow: shadow ? "rgba(0,0,0,.12) 0 8px 20px" : "none",
      outline: outline ? `${outlineWidth}px solid ${outlineColor ?? theme.surface.appBg}` : undefined,
      outlineOffset: outline ? outlineOffset : undefined,
      pointerEvents: "auto",
      ".plainframe-ui-image-stack-wrapper[data-hover-mode='pointer']:hover &": {
        transform: `translate(-50%, -50%) ${hoverTransform}`,
      },
      ".plainframe-ui-image-stack-wrapper[data-hover-mode='controlled'][data-hovered='true'] &": {
        transform: `translate(-50%, -50%) ${hoverTransform}`,
      },
    });
  };

  const frameCss = (i: number) =>
    css({
      width: `${frameW(i)}px`,
      aspectRatio: `${AR}`,
      position: "relative",
      overflow: "hidden",
      borderRadius: frameRadius,
      ["--pfui-image-radius" as any]: frameRadius,
      "& > *": {
        position: "absolute",
        inset: "0",
        width: "100% !important",
        height: "100% !important",
        maxWidth: "none !important",
        maxHeight: "none !important",
        display: "block",
      },
      "& img, & picture img, & video, & canvas": {
        width: "100% !important",
        height: "100% !important",
        objectFit: "cover",
        display: "block",
      },
    });

  const WrapperEl = label ? "figure" : "div";

  return (
    <WrapperEl
      className={["plainframe-ui-image-stack-wrapper", className || ""].join(" ").trim()}
      data-hover-mode={hoverMode}
      data-hovered={hoverAttr}
      css={[rootCss, userCss]}
      tabIndex={-1}
      {...rest}
    >
      <div className="plainframe-ui-image-stack" css={stackCss}>
        <div className="plainframe-ui-image-stack-stage" css={stageCss}>
          {items.map((child, i) => (
            <div key={i} className="plainframe-ui-image-stack-item" css={cardCss(i)}>
              <div className="plainframe-ui-image-stack-frame" css={frameCss(i)}>
                {child}
              </div>
            </div>
          ))}
        </div>
      </div>
      {label && (
        <Typography as="figcaption" variant="caption" align={labelAlign}>
          {label}
        </Typography>
      )}
    </WrapperEl>
  );
});
