/** @jsxImportSource @emotion/react */
import React from "react";
import { css as emCss, type Interpolation } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import type { Theme } from "@emotion/react";

type Dir = "vertical" | "horizontal" | "column" | "row";
type GapKey = "xxs" | "xs" | "sm" | "md" | "lg" | "xl";

export type FlexProps = Omit<React.HTMLAttributes<HTMLDivElement>, "style"> & {
  direction?: Dir;
  gap?: GapKey | number | string;
  justify?: React.CSSProperties["justifyContent"];
  align?: React.CSSProperties["alignItems"];
  css?: Interpolation<Theme>;
  width?: string | number;
  height?: string | number;
};

const toLen = (v?: string | number): string | undefined =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : v;

export const Flex: React.FC<FlexProps> = React.memo(({
  direction = "row",
  gap = "sm",
  justify,
  align = "center",
  className,
  css: userCss,
  children,
  width,
  height,
  ...rest
}) => {
  const theme = usePlainframeUITheme();

  const flexDirection: React.CSSProperties["flexDirection"] =
    direction === "vertical" || direction === "column" ? "column" : "row";

  const gapVal: string | number | undefined =
    gap === undefined
      ? undefined
      : typeof gap === "number"
      ? gap
      : (theme.spacing as Record<string, string | number>)[gap as GapKey] ?? gap;

  const base: Interpolation<Theme> = emCss({
    display: "flex",
    flexDirection,
    gap: gapVal as any,
    justifyContent: justify,
    alignItems: align,
    maxWidth: toLen(width),
    width: width ? "100%" : undefined,
    maxHeight: toLen(height),
    height: height ? "100%" : undefined,
    boxSizing: "border-box",
  });

  return (
    <div
      className={["plainframe-ui-flex", className || ""].join(" ").trim()}
      css={[base, userCss]}
      {...rest}
    >
      {children}
    </div>
  );
});

Flex.displayName = "Flex";
