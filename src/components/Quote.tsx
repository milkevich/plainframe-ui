/** @jsxImportSource @emotion/react */
import React from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";

type QuoteVariant = "solid" | "dashed";
type Direction = "left" | "right";

export type QuoteProps = {
  children?: React.ReactNode;
  direction?: Direction;
  width?: string | number;
  variant?: QuoteVariant;
  className?: string;
  css?: Interpolation<Theme>;
};

const toCssSize = (v?: string | number, fb?: string) =>
  v == null ? fb : typeof v === "number" ? `${v}px` : v;

export const Quote: React.FC<QuoteProps> = React.memo(({
  children,
  direction = "left",
  width,
  variant = "solid",
  className,
  css: userCss,
}) => {
  const theme = usePlainframeUITheme();
  const borderColor = theme.surface.border;

  const root = css(
    {
      display: "inline-block",
      boxSizing: "border-box",
      maxWidth: toCssSize(width, "fit-content"),
      width: "100%",
      padding: `0 ${theme.spacing.md}`,
      borderLeft:
        direction === "left"
          ? `3px ${variant === "dashed" ? "dashed" : "solid"} ${borderColor}`
          : "none",
      borderRight:
        direction === "right"
          ? `3px ${variant === "dashed" ? "dashed" : "solid"} ${borderColor}`
          : "none",
    },
    ...(Array.isArray(userCss) ? userCss : userCss ? [userCss] : [])
  );

  return (
    <div className={className ?? "plainframe-ui-quote"} css={root}>
      {children}
    </div>
  );
});
