/** @jsxImportSource @emotion/react */
import React, { Children, isValidElement, cloneElement } from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { useFocusRing } from "../utils/focusRing";

type AvatarGroupProps = {
  children: React.ReactNode;
  max?: number;
  size?: "sm" | "md" | "lg" | string | number;
  overlap?: number;
  css?: Interpolation<Theme>;
  rounded?: boolean;
  bgColor?: string | "subtle" | "panel";
  extraLabelCss?: Interpolation<Theme>;
  outlineThickness?: number | string;
  className?: string;
};

const toLen = (v: number | string | undefined) =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : v;

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  max,
  size = "md",
  overlap = -7,
  css: userCss,
  rounded = true,
  bgColor,
  extraLabelCss,
  outlineThickness = 4,
  className,
}) => {
  const theme = usePlainframeUITheme();
  const focusRing = useFocusRing();

  const resolveDiameter = (): string => {
    if (typeof size === "number") return `${size}px`;
    if (typeof size === "string") {
      const h =
        (theme.componentHeights && theme.componentHeights[size]) ??
        (theme.spacing && theme.spacing[size]);
      return toLen(h ?? size)!;
    }
    return "32px";
  };

  const diameter = resolveDiameter();

  const nodes = Children.toArray(children).filter(Boolean);
  const hasMax = typeof max === "number" && max >= 0;
  const shown = hasMax && nodes.length > max ? nodes.slice(0, max) : nodes;
  const extra = hasMax && nodes.length > max ? nodes.length - max : 0;

  const ring =
    bgColor === "panel"
      ? theme.surface.panelBg
      : bgColor === "subtle"
      ? theme.surface.subtleBg
      : bgColor ?? theme.surface.appBg;

  const ringThickness = toLen(outlineThickness) ?? "4px";

  const containerCss = css({
    display: "flex",
    alignItems: "center",
  });

  const itemCss = (i: number) =>
    css({
      marginLeft: i === 0 ? 0 : overlap,
      zIndex: shown.length - i,
      boxShadow: `0 0 0 ${ringThickness} ${ring}`,
      backgroundColor: ring,
      borderRadius: rounded ? theme.radius.full : theme.radius.md,
      display: "inline-flex",
      width: diameter,
      height: diameter,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 0,
      flex: "0 0 auto",
    });

  const childFillCss = css({
    width: "100%",
    height: "100%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    objectFit: "cover",
    boxSizing: "border-box",
  });

  return (
    <div
      role="group"
      tabIndex={-1}
      aria-label="Avatar group"
      className={`plainframe-ui-avatar-group${className ? ` ${className}` : ""}`}
      css={[containerCss, userCss, focusRing()]}
    >
      {shown.map((child, i) => {
        if (!isValidElement(child)) {
          return (
            <div key={i} className="plainframe-ui-avatar-group-item" css={itemCss(i)}>
              <span css={childFillCss}>{child}</span>
            </div>
          );
        }

        const childElement = child as React.ReactElement<any>;
        const prevCss = childElement.props?.css;
        const mergedCss = prevCss == null ? childFillCss : [childFillCss, prevCss];

        const cloned = cloneElement(childElement, {
          size,
          rounded,
          css: mergedCss,
          style: {
            ...childElement.props?.style,
            width: "100%",
            height: "100%",
            objectFit: childElement.props?.objectFit ?? "cover",
          },
        });

        return (
          <div key={i} className="plainframe-ui-avatar-group-item" css={itemCss(i)}>
            {cloned}
          </div>
        );
      })}

      {extra > 0 && (
        <span
          className="plainframe-ui-avatar-group-extra"
          css={[
            css({
              marginLeft: 5,
              fontSize: theme.typography.sizes.sm,
              fontWeight: 600,
              lineHeight: 1,
              padding: "2px 1px",
              zIndex: 2,
              color: theme.text.secondary,
            }),
            extraLabelCss,
          ]}
          aria-label={`+${extra} more`}
        >
          +{extra}
        </span>
      )}
    </div>
  );
};
