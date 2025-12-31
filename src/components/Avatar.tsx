/** @jsxImportSource @emotion/react */
import React, { useState, useEffect, forwardRef } from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";

type AvatarProps = Omit<React.HTMLAttributes<HTMLDivElement>, "style"> & {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg" | number;
  color?: string;
  rounded?: boolean;
  css?: Interpolation<Theme>;
  className?: string;
  children?: React.ReactNode;
};

const sizeKeys = ["sm", "md", "lg"] as const;

const getSize = (
  size: AvatarProps["size"],
  theme: ReturnType<typeof usePlainframeUITheme>
) => {
  if (typeof size === "number") return size;
  if (sizeKeys.includes(size as unknown as typeof sizeKeys[number]))
    return theme.componentHeights[size as keyof typeof theme.componentHeights];
  return theme.componentHeights.md;
};

const getPaletteColor = (
  theme: ReturnType<typeof usePlainframeUITheme>,
  color?: string
) => {
  const palette = theme.palette?.[color ?? "primary"] ?? theme.palette.primary;
  return palette?.[600] ?? palette?.[500] ?? theme.neutral?.[600] ?? theme.neutral?.[500];
};

const getForegroundColor = (
  theme: ReturnType<typeof usePlainframeUITheme>,
  color?: string
) => {
  const onColors = theme.text?.onColors ?? {};
  return onColors[color ?? "primary"] ?? onColors.primary ?? theme.text?.primary ?? "#fff";
};

const getFallbackText = (children: React.ReactNode, alt?: string) => {
  if (typeof children === "string") return children;
  return (alt?.trim()?.[0] || "").toUpperCase();
};

export const Avatar: React.ForwardRefExoticComponent<
  AvatarProps & React.RefAttributes<HTMLDivElement>
> = React.memo(forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt,
      size = "md",
      color = "primary",
      rounded = true,
      className,
      css: userCss,
      children,
      ...rest
    },
    ref
  ) => {
    const theme = usePlainframeUITheme();
    const [showImg, setShowImg] = useState(!!src);

    useEffect(() => {
      setShowImg(!!src);
    }, [src]);

    const px = getSize(size, theme);
    const numeric = typeof px === "number" ? px : Number.parseFloat(String(px)) || 0;
    const fontSize = numeric ? Math.round(numeric * (numeric <= 28 ? 0.55 : 0.52)) : undefined;
    const radius = rounded ? theme.radius.full : theme.radius.md;
    const bg = getPaletteColor(theme, color);
    const fg = getForegroundColor(theme, color);
    const fallbackText = getFallbackText(children, alt);

    const baseCss = css({
      width: px,
      height: px,
      borderRadius: radius,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      background: showImg ? "transparent" : bg,
      color: showImg ? "inherit" : fg,
      boxSizing: "border-box",
      userSelect: "none",
    });

    const imgCss = css({
      width: "100%",
      height: "100%",
      display: "block",
      objectFit: "cover",
    });

    const textCss = css({
      fontSize,
      lineHeight: 1,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
      marginTop: -1,
    });

    return (
      <div
        ref={ref}
        className={["plainframe-ui-avatar", className || ""].join(" ").trim()}
        css={[baseCss, userCss]}
        role={showImg ? undefined : "img"}
        aria-label={showImg ? undefined : alt}
        {...rest}
      >
        {showImg && src ? (
          <img
            className="plainframe-ui-avatar-img"
            src={src}
            alt={alt}
            css={imgCss}
            onError={() => setShowImg(false)}
            decoding="async"
            loading="lazy"
          />
        ) : typeof children === "string" ? (
          <span className="plainframe-ui-avatar-initials" css={textCss}>
            {children}
          </span>
        ) : children ? (
          children
        ) : (
          <span className="plainframe-ui-avatar-initials" css={textCss}>
            {fallbackText}
          </span>
        )}
      </div>
    );
  }
));

Avatar.displayName = "Avatar";
