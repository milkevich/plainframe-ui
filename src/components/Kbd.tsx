/** @jsxImportSource @emotion/react */
import React, { forwardRef } from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { useFocusRing } from "../utils/focusRing";

const toLen = (v?: number | string) => (typeof v === "number" ? `${v}px` : v);

export type KbdProps = Omit<React.HTMLAttributes<HTMLElement>, "style"> & {
  variant?: "subtle" | "outlined" | "ghost";
  size?: "sm" | "md" | "lg";
  radius?: number | string;
  mono?: boolean;
  uppercase?: boolean;
  symbolBoost?: number;
  css?: Interpolation<Theme>;
  className?: string;
};

const sizeTokens: Record<
  NonNullable<KbdProps["size"]>,
  { h: number; px: number; font: number }
> = {
  sm: { h: 20, px: 6, font: 10 },
  md: { h: 24, px: 7, font: 12 },
  lg: { h: 28, px: 8, font: 14 },
};

function resolveRadius(
  radius: number | string | undefined,
  theme: { radius?: Record<string, string | number>; radii?: Record<string, string | number> }
) {
  if (radius == null) {
    const fallback = theme.radius?.xs ?? theme.radius?.sm ?? 3;
    return toLen(fallback);
  }
  if (typeof radius === "number") return `${radius}px`;
  if (typeof radius === "string") {
    const token = theme.radius?.[radius] ?? theme.radii?.[radius];
    if (token != null) return toLen(token);
  }
  return radius;
}

function isSymbolLikeContent(value: React.ReactNode): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length > 4) return false;
  if (/[A-Za-z0-9]/.test(trimmed)) return false;
  return true;
}

export const Kbd: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<KbdProps> & React.RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, KbdProps>(function Kbd(
  {
    children,
    variant = "outlined",
    size = "sm",
    radius,
    mono = true,
    uppercase = false,
    symbolBoost = 2,
    css: userCss,
    className = "plainframe-ui-kbd",
    ...rest
  },
  ref
) {
  const theme = usePlainframeUITheme();
  const focusRing = useFocusRing();
  const t = sizeTokens[size] ?? sizeTokens.sm;
  const r = resolveRadius(radius, theme);

  const gray = {
    br: theme.neutral[300],
    txt: theme.neutral[800],
    inset: theme.neutral[0],
  };

  const base = css({
    all: "unset",
    boxSizing: "border-box",
    display: "inline-flex !important",
    alignItems: "center",
    justifyContent: "center",
    minHeight: variant === "ghost" ? undefined : `${t.h}px !important`,
    paddingInline: variant === "ghost" ? 0 : `${t.px}px !important`,
    paddingBlock: `0 !important`,
    fontFamily: mono ? theme.typography.fonts.mono : "inherit",
    fontSize: `${t.font}px !important`,
    fontWeight: 600,
    letterSpacing: 0.2,
    textTransform: uppercase ? "uppercase" : "none",
    borderRadius: r as string,
    userSelect: "none",
    verticalAlign: "baseline",
    position: "relative",
    outline: "none",
  });

  const subtle = css({
    "&&": {
      background: theme.surface.subtleBg,
      border: "none",
      boxShadow: "none",
      color: gray.txt,
    },
  });

  const ghost = css({
    "&&": {
      background: "transparent",
      color: gray.txt,
      border: "none",
      boxShadow: "none",
    },
  });

  const outlined = css({
    "&&": {
      background: theme.surface.panelBg,
      color: gray.txt,
      border: `1px solid ${gray.br}`,
      boxShadow: `inset 0 1px 0 ${gray.inset}AA, 0 1px 0 rgba(0,0,0,0.03)`,
    },
  });

  const variantCss =
    variant === "subtle" ? subtle : variant === "ghost" ? ghost : outlined;

  const boostSymbols = mono && symbolBoost > 0 && isSymbolLikeContent(children);

  const content = boostSymbols ? (
    <span
      css={css({
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${t.font + symbolBoost}px`,
        lineHeight: 1,
      })}
    >
      {children}
    </span>
  ) : (
    children
  );

  return (
    <kbd
      ref={ref}
      className={className}
      css={[focusRing(), base, variantCss, userCss]}
      {...rest}
    >
      {content}
    </kbd>
  );
});
