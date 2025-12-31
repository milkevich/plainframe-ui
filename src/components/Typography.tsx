/** @jsxImportSource @emotion/react */
import React from "react";
import { css } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";

const MAP = {
  h1: { size: "2.25rem", weight: 800, lh: 1.1,  ls: "-0.02em" },
  h2: { size: "1.875rem", weight: 700, lh: 1.15, ls: "-0.01em" },
  h3: { size: "1.5rem",  weight: 600, lh: 1.2,  ls: "-0.005em" },
  h4: { size: "1.25rem", weight: 500, lh: 1.2, ls: "0" },
  h5: { size: "1.125rem", weight: 500, lh: 1.3, ls: "0" },
  h6: { size: "1rem", weight: 500, lh: 1.3, ls: "0" },
  body: { size: "sm", weight: 400, lh: 1.4, ls: "0" },
  caption: { size: "xs", weight: 400, lh: 1.4,  ls: "0.01em" },
} as const;

type Variant = keyof typeof MAP;
type Align = "left" | "center" | "right";
type Decoration = "none" | "underline" | "overline" | "line-through";
type DecorationStyle = "solid" | "dashed" | "dotted";

export type TypographyProps = {
  variant?: Variant;
  children: React.ReactNode;
  color?: string | "primary" | "secondary";
  size?: number | string;
  weight?: number | string;
  lineHeight?: number | string;
  letterSpacing?: number | string;
  align?: Align;
  textTransform?: "none" | "capitalize" | "uppercase" | "lowercase";
  whiteSpace?: "normal" | "nowrap" | "pre" | "pre-wrap";
  decoration?: Decoration;
  decorationStyle?: DecorationStyle;
  decorationThickness?: number | string;
  decorationColor?: string;
  italic?: boolean;
  className?: string;
  style?: React.CSSProperties;
  as?: React.ElementType;
};

const toLen = (v?: number | string) =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : String(v);

const defaultTagByVariant: Record<Variant, React.ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  body: "span",
  caption: "span",
};

export const Typography: React.FC<TypographyProps> = React.memo(({
  variant = "body",
  children,
  color,
  size,
  weight,
  lineHeight,
  letterSpacing,
  align = "left",
  textTransform = "none",
  whiteSpace = "normal",
  decoration = "none",
  decorationStyle = "solid",
  decorationThickness = 1,
  decorationColor,
  italic,
  className,
  style,
  as,
}) => {
  const theme = usePlainframeUITheme();
  const def = MAP[variant] ?? MAP.body;
  const Tag = as ?? defaultTagByVariant[variant] ?? "span";

  const resolveSize = (s: string | number | undefined) => {
    if (s == null) return def.size;
    if (typeof s === "number") return s;
    const themeSize = theme?.typography?.sizes?.[s as keyof typeof theme.typography.sizes];
    return themeSize ?? s;
  };
  const fontSize = resolveSize(size) ?? resolveSize(def.size);
  const fontWeight = weight ?? def.weight;
  const lh = lineHeight ?? def.lh;
  const ls = letterSpacing ?? def.ls;

  const fg =
    color === "secondary"
      ? theme.text.secondary
      : color === "primary"
      ? theme.text.primary
      : color ?? "inherit";

  const decoColor = decorationColor ?? theme.surface.border;

  const baseCss = css({
    boxSizing: "border-box",
    display: align === "left" ? "inline" : "block",
    textAlign: align === "left" ? undefined : align,
    fontFamily: theme?.typography?.fonts?.sans || "inherit",
    fontSize,
    fontWeight: fontWeight as number | string,
    lineHeight: lh as number | string,
    letterSpacing: ls as number | string,
    color: fg,
    textTransform,
    whiteSpace,
    fontStyle: italic ? "italic" : "normal",
    margin: 0,
    padding: 0,
  });

  const decoCss =
    decoration === "none"
      ? css({
          textDecoration: "none",
        })
      : css({
          textDecorationLine: decoration,
          textDecorationStyle: decorationStyle,
          textDecorationColor: decoColor,
          textDecorationThickness: toLen(decorationThickness),
          textDecorationSkipInk: "auto",
        });

  return (
    <Tag
      className={[`pfui-typo-${variant}`, className || ""].join(" ").trim()}
      css={[baseCss, decoCss]}
      style={style}
      data-variant={variant}
    >
      {children}
    </Tag>
  );
});
Typography.displayName = "Typography";
