/** @jsxImportSource @emotion/react */
import React from "react";
import { css, type Interpolation, keyframes, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";

type SkeletonProps = {
  isLoading?: boolean;
  radius?: number | string;
  animation?: "wave" | "pulse" | "none";
  children?: React.ReactNode;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  className?: string;
  css?: Interpolation<Theme>;
};

const px = (v: number | string | undefined, fb: string) =>
  v == null ? fb : typeof v === "number" ? `${v}px` : v;

const wave = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulse = keyframes`
  0% { opacity: .6; }
  50% { opacity: 1; }
  100% { opacity: .6; }
`;

export const Skeleton: React.FC<SkeletonProps> = React.memo(({
  isLoading = true,
  radius,
  animation = "wave",
  children,
  width,
  height,
  style,
  className,
  css: userCss,
}) => {
  const theme = usePlainframeUITheme();

  const base = theme.surface.subtleBg;
  const highlight = theme.neutral[200];
  const r = px(radius ?? theme.radius?.lg ?? 8, "8px");

  const container = css({
    position: "relative",
    display: "inline-block",
    verticalAlign: "middle",
    width: width == null ? "fit-content" : px(width, String(width)),
    height: height == null ? "fit-content" : px(height, String(height)),
  });

  const overlayBase = css({
    position: "absolute",
    inset: 0,
    borderRadius: r,
    pointerEvents: "none",
    background: base,
    willChange: "background-position, opacity",
  });

  const overlayAnim =
    animation === "wave"
      ? css({
          backgroundImage: `linear-gradient(90deg, ${base} 25%, ${highlight} 50%, ${base} 75%)`,
          backgroundSize: "200% 100%",
          animation: `${wave} 1.4s ease-in-out infinite`,
        })
      : animation === "pulse"
      ? css({ animation: `${pulse} 1.2s ease-in-out infinite` })
      : css({});

  const childWrap = css({
    visibility: isLoading ? "hidden" : "visible",
    display: "inline-block",
    borderRadius: r,
  });

  return (
    <span
      className={["plainframe-ui-skeleton", className || ""].join(" ").trim()}
      css={[container, userCss]}
      style={style}
      aria-busy={isLoading || undefined}
    >
      {isLoading && <span aria-hidden css={[overlayBase, overlayAnim]} />}
      <span className="plainframe-ui-skeleton-content" css={childWrap}>
        {children}
      </span>
    </span>
  );
});
