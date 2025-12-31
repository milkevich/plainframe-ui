/** @jsxImportSource @emotion/react */
import React from "react";
import { css, type Interpolation, type Theme as EmotionTheme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";

type BadgeAnchorOrigin = {
  vertical?: "top" | "bottom" | "center";
  horizontal?: "left" | "right" | "center";
};

type BadgeProps = {
  content?: number | string | React.ReactNode;
  color?:
    | "primary"
    | "secondary"
    | "neutral"
    | "danger"
    | "success"
    | "warning"
    | "info"
    | string;
  fontColor?: string;
  fontWeight?: number | string;
  fontSize?: number | string;
  variant?: "standard" | "dot";
  max?: number;
  showZero?: boolean;
  visible?: boolean;
  anchorOrigin?: BadgeAnchorOrigin;
  overlap?: "circular" | "rectangular";
  children: React.ReactNode;
  animate?: boolean;
  size?: number;
  outline?: boolean;
  outlineColor?: string;
  className?: string;
  badgeClassName?: string;
  css?: Interpolation<EmotionTheme>;
  badgeCss?: Interpolation<EmotionTheme>;
  offsetX?: number | string;
  offsetY?: number | string;
};

const toLen = (v?: number | string) =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : v;

type Theme = {
  palette?: Record<string, Record<string, string>>;
  neutral?: Record<string, string>;
  text?: {
    onColors?: Record<string, string>;
    primary?: string;
  };
  surface?: {
    appBg?: string;
  };
};

const getPaletteScale = (
  theme: Theme,
  color: string
): { scale: Record<string, string>; onKey: string } => {
  const t = theme as any;
  const palette = t.palette || {};
  const neutralScale = t.neutral || {};
  if (color === "neutral" || color === "secondary") {
    return { scale: neutralScale, onKey: "neutral" };
  }
  if (typeof color === "string" && palette[color]) {
    return { scale: palette[color], onKey: color };
  }
  return { scale: t.primary || neutralScale, onKey: "primary" };
};

const getBadgeBg = (scale: Record<string, string>) =>
  scale[600] ?? scale[500] ?? scale[400] ?? Object.values(scale)[0] ?? "#000";

const getFontColor = (
  theme: Theme,
  onColors: Record<string, string>,
  onKey: string,
  fontColor?: string
) =>
  fontColor ??
  onColors[onKey] ??
  onColors.primary ??
  theme.text?.primary ??
  "#fff";

const getDisplayContent = (
  content: BadgeProps["content"],
  max: number | undefined,
  variant: BadgeProps["variant"]
) => {
  if (variant === "dot") return "";
  if (typeof content === "number" && typeof max === "number" && content > max)
    return `${max}+`;
  return content ?? "";
};

const getShouldShow = (
  visible: boolean,
  variant: BadgeProps["variant"],
  content: BadgeProps["content"],
  showZero: boolean
) =>
  visible &&
  (variant === "dot" || !!content || (content === 0 && showZero));

export const Badge: React.FC<BadgeProps> = React.memo(({
  content,
  color = "primary",
  fontColor,
  fontWeight = 600,
  fontSize,
  variant = "dot",
  max = 99,
  showZero = false,
  visible = true,
  anchorOrigin = { vertical: "top", horizontal: "right" },
  overlap = "rectangular",
  children,
  animate = true,
  size,
  outline = false,
  outlineColor,
  className,
  badgeClassName,
  css: wrapperCss,
  badgeCss,
  offsetX,
  offsetY,
}) => {
  const theme = usePlainframeUITheme();
  const isDot = variant === "dot";
  const diameter = size ?? (isDot ? 8 : 17);
  const _fontSize = fontSize ?? (isDot ? 0 : 10);

  const { scale, onKey } = getPaletteScale(theme, color as string);
  const bg = getBadgeBg(scale);
  const onColors = theme.text?.onColors || {};
  const finalFontColor = getFontColor(theme, onColors, onKey, fontColor);

  const displayContent = getDisplayContent(content, max, variant);
  const shouldShow = getShouldShow(visible, variant, content, showZero);

  const wrapperBase = css({
    position: "relative",
    display: "inline-block",
  });

  const derivedOffset =
    overlap === "circular" ? (isDot ? "12.5%" : "5%") : (isDot ? "5%" : "2.5%");
  const offX = toLen(offsetX ?? derivedOffset);
  const offY = toLen(offsetY ?? derivedOffset);

  const vertical = anchorOrigin.vertical || "top";
  const horizontal = anchorOrigin.horizontal || "right";

  const pos: React.CSSProperties = {};
  let translateX = "0",
    translateY = "0";

  if (vertical === "center") {
    pos.top = "50%";
    translateY = "-50%";
  } else if (vertical === "top") {
    pos.top = offY;
    translateY = "-45%";
  } else {
    pos.bottom = offY;
    translateY = "45%";
  }

  if (horizontal === "center") {
    pos.left = "50%";
    translateX = "-50%";
  } else if (horizontal === "right") {
    pos.right = offX;
    translateX = "45%";
  } else {
    pos.left = offX;
    translateX = "-45%";
  }

  const baseScale = shouldShow ? 1 : 0.8;

  const bubbleBase = css({
    minWidth: isDot ? diameter : diameter / 2,
    height: diameter,
    background: bg,
    color: finalFontColor,
    fontSize: typeof _fontSize === "number" ? `${_fontSize}px` : _fontSize,
    fontWeight,
    borderRadius: 999,
    padding: isDot ? 0 : `0 ${diameter / 4}px`,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    lineHeight: 1,
    position: "absolute",
    pointerEvents: "none",
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ...(outline
      ? {
          boxShadow: `0 0 0 2px ${
            outlineColor ?? (theme.surface?.appBg as string)
          }`,
        }
      : {}),
    opacity: shouldShow ? 1 : 0,
    transform: `translate(${translateX}, ${translateY}) scale(${
      shouldShow ? baseScale : 0.5
    })`,
    ...(animate
      ? {
          transition:
            "opacity .18s cubic-bezier(.4,1.6,.6,1), transform .18s cubic-bezier(.4,1.6,.6,1)",
        }
      : {}),
    ...pos,
  });

  return (
    <div
      className={["plainframe-ui-badge-wrapper", className || ""].join(" ").trim()}
      css={[wrapperBase, wrapperCss]}
    >
      {children}
      <span
        aria-hidden={!shouldShow}
        className={["plainframe-ui-badge", badgeClassName || ""].join(" ").trim()}
        css={[bubbleBase, badgeCss]}
      >
        {displayContent}
      </span>
    </div>
  );
});
