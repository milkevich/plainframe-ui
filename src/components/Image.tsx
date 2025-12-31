/** @jsxImportSource @emotion/react */
import React, { useState, forwardRef } from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { Typography } from "./Typography";

type HoverEffect = "scale" | "rotate" | "scale-rotate" | "none";
type RadiusToken = "xs" | "sm" | "md" | "lg" | "xl" | "full";

export type ImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "style"> & {
  radius?: number | string | RadiusToken;
  shadow?: boolean;
  hoverEffect?: HoverEffect;
  label?: React.ReactNode;
  labelAlign?: "left" | "center" | "right";
  aspectRatio?: number | string;
  placeholder?: "blur" | "color";
  blurDataURL?: string;
  placeholderColor?: string;
  fallbackSrc?: string;
  css?: Interpolation<Theme>;
  className?: string;
};

const toLen = (v: number | string | undefined) =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : v;

const resolveRadius = (
  radius: RadiusToken | string | number | undefined,
  theme: { radius?: Record<string, unknown>; radii?: Record<string, unknown> }
) => {
  if (radius == null) return undefined;
  if (typeof radius === "number") return `${radius}px`;
  if (typeof radius === "string") {
    if (["xs", "sm", "md", "lg", "xl", "full"].includes(radius)) {
      const val =
        (theme.radius && theme.radius[radius]) ||
        (theme.radii && theme.radii[radius]);
      return toLen(typeof val === "number" || typeof val === "string" ? val : radius);
    }
    return radius;
  }
  return undefined;
};

export const Image: React.ForwardRefExoticComponent<
  ImageProps & React.RefAttributes<HTMLImageElement>
> = forwardRef<HTMLImageElement, ImageProps>(function Image(
  {
    src,
    alt = "",
    width,
    height,
    radius = "md",
    shadow = false,
    hoverEffect = "none",
    label,
    labelAlign = "center",
    aspectRatio,
    loading = "lazy",
    decoding = "async",
    fetchPriority,
    srcSet,
    sizes,
    placeholder,
    blurDataURL,
    placeholderColor = "#f1f1f1",
    fallbackSrc,
    className,
    css: userCss,
    onClick,
    onLoad,
    onError,
    ...imgRest
  },
  ref
) {
  const [hovering, setHovering] = useState(false);
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const theme = usePlainframeUITheme();

  const br = resolveRadius(radius, theme) ?? "0px";
  const WrapperEl = label ? "figure" : "div";

  const wrapperCss = css({
    display: "flex",
    flexDirection: "column",
    gap: label ? theme.spacing.xs : 0,
    width: "fit-content",
    borderRadius: `var(--pfui-image-radius, ${br})`,
  });

  const frameCss = css({
    position: "relative",
    borderRadius: `var(--pfui-image-radius, ${br})`,
    maxWidth: width ? toLen(width)! : "100%",
    maxHeight: height ? toLen(height)! : undefined,
    width: width ? "100%" : undefined,
    height: height ? "100%" : undefined,
    aspectRatio: aspectRatio as any,
    boxShadow: shadow ? "0 12px 32px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.04)" : "none",
    overflow: "hidden",
    padding: 0,
    lineHeight: 0,
    transition: "transform 0.3s ease",
    willChange: "transform",
    transform:
      hovering && (hoverEffect === "rotate" || hoverEffect === "scale-rotate")
        ? "rotate(3deg)"
        : "none",
    cursor: onClick ? "pointer" : undefined,
  });

  const placeholderCss = css({
    position: "absolute",
    inset: 0,
    background:
      placeholder === "color" ? (placeholderColor as string) : undefined,
    backgroundImage:
      placeholder === "blur" && blurDataURL ? `url(${blurDataURL})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: placeholder === "blur" ? "blur(8px)" : undefined,
    transition: "opacity 0.3s ease",
    opacity: loaded ? 0 : 1,
    pointerEvents: "none",
  });

  const imgCss = css({
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover",
    transform:
      hovering && (hoverEffect === "scale" || hoverEffect === "scale-rotate")
        ? "scale(1.08)"
        : "none",
    transition: "transform 0.3s ease",
    willChange: "transform",
  });

  return (
    <WrapperEl
      className={["plainframe-ui-image", className || ""].join(" ").trim()}
      css={[wrapperCss, userCss]}
      tabIndex={-1}
    >
      <div
        className="plainframe-ui-image-frame"
        css={frameCss}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={onClick as any}
      >
        {!loaded && placeholder && (
          <div aria-hidden className="plainframe-ui-image-placeholder" css={placeholderCss} />
        )}
        <img
          ref={ref}
          className="plainframe-ui-image-img"
          css={imgCss}
          src={errored && fallbackSrc ? fallbackSrc : (src as string)}
          alt={alt}
          srcSet={srcSet}
          sizes={sizes}
          loading={loading}
          decoding={decoding}
          fetchPriority={fetchPriority}
          onLoad={(e) => {
            setLoaded(true);
            onLoad?.(e);
          }}
          onError={(e) => {
            setErrored(true);
            onError?.(e);
          }}
          {...imgRest}
        />
      </div>

      {label && (
        <Typography as="figcaption" variant="caption" align={labelAlign}>
          {label}
        </Typography>
      )}
    </WrapperEl>
  );
});

Image.displayName = "Image";
