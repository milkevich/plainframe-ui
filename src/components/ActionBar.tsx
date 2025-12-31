/** @jsxImportSource @emotion/react */
import React, { useRef, useEffect, useLayoutEffect, type CSSProperties } from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";

export type AnchorOrigin = {
  horizontal?: "left" | "center" | "right";
  vertical?: "top" | "center" | "bottom";
};

export type ActionBarProps = {
  children: React.ReactNode;
  open?: boolean;
  anchorOrigin?: AnchorOrigin;
  direction?: "horizontal" | "vertical";
  padding?: string | number;
  gap?: string | number;
  radius?: string | number;
  offset?: number | string;
  offsetX?: number | string;
  offsetY?: number | string;
  elevated?: boolean;
  unstyled?: boolean;
  fullWidth?: boolean;
  width?: string | number;
  height?: string | number;
  role?: string;
  "aria-label"?: string;
  onClose?: () => void;
};

const px = (v: string | number) => (typeof v === "number" ? `${v}px` : v);

export const ActionBar: React.FC<ActionBarProps> = ({
  children,
  open = true,
  anchorOrigin = { horizontal: "center", vertical: "bottom" },
  direction = "horizontal",
  padding = "sm",
  gap = "xs",
  radius = "lg",
  offset = 0,
  offsetX = 0,
  offsetY = 0,
  elevated = true,
  unstyled = false,
  fullWidth = false,
  width,
  height,
  role = "toolbar",
  "aria-label": ariaLabel,
  onClose,
}) => {
  const theme = usePlainframeUITheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const hasMountedRef = useRef(false);
  const prevOpenRef = useRef(open);

  const h = anchorOrigin.horizontal ?? "center";
  const v = anchorOrigin.vertical ?? "bottom";

  const resolveSpacing = (val: string | number) =>
    typeof val === "string" ? theme.spacing[val] ?? val : val;
  const resolveRadius = (val: string | number) =>
    typeof val === "string" ? theme.radius[val] ?? val : val;

  const resolvedOffset = px(resolveSpacing(offset));
  const resolvedOffsetX = px(resolveSpacing(offsetX));
  const resolvedOffsetY = px(resolveSpacing(offsetY));

  const containerStyle: Interpolation<Theme> = {
    position: "fixed",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    display: "flex",
    pointerEvents: "none",
    zIndex: 1000,
    justifyContent: h === "left" ? "flex-start" : h === "right" ? "flex-end" : "center",
    alignItems: v === "top" ? "flex-start" : v === "bottom" ? "flex-end" : "center",
  };

  const getTransformOrigin = () => {
    const hOrigin = h === "left" ? "left" : h === "right" ? "right" : "center";
    const vOrigin = v === "top" ? "top" : v === "bottom" ? "bottom" : "center";
    return `${hOrigin} ${vOrigin}`;
  };

  const getAnimationTransform = () => {
    if (v === "top" || v === "bottom") {
      const distance = v === "bottom" ? 100 : -100;
      return `translateY(${distance}px) scale(0.98)`;
    }
    if (v === "center") {
      if (h === "left") return "translateX(-100px) scale(0.98)";
      if (h === "right") return "translateX(100px) scale(0.98)";
      return "scale(0.95)";
    }
    return "scale(0.98)";
  };

  const getOpenTransform = () => {
    return v === "center" && h === "center"
      ? "scale(1)"
      : "translateX(0) translateY(0) scale(1)";
  };

  const baseMargin = 24;
  const contentStyle: CSSProperties = {
    margin: baseMargin,
    marginTop:
      v === "top"
        ? `calc(${baseMargin}px + ${resolvedOffset} + ${resolvedOffsetY})`
        : baseMargin,
    marginBottom:
      v === "bottom"
        ? `calc(${baseMargin}px + ${resolvedOffset} + ${resolvedOffsetY})`
        : baseMargin,
    marginLeft:
      h === "left"
        ? `calc(${baseMargin}px + ${resolvedOffset} + ${resolvedOffsetX})`
        : baseMargin,
    marginRight:
      h === "right"
        ? `calc(${baseMargin}px + ${resolvedOffset} + ${resolvedOffsetX})`
        : baseMargin,
    padding: unstyled ? 0 : px(resolveSpacing(padding)),
    background: unstyled ? "transparent" : theme.surface.panelBg,
    border: unstyled ? "none" : `1px solid ${theme.surface.border}`,
    borderRadius: unstyled ? 0 : px(resolveRadius(radius)),
    boxShadow: unstyled || !elevated ? "none" : "0 20px 40px rgba(0,0,0,.08)",
    display: "flex",
    flexDirection: direction === "vertical" ? "column" : "row",
    gap: px(resolveSpacing(gap)),
    transformOrigin: getTransformOrigin(),
    pointerEvents: open ? "auto" : "none",
    width: fullWidth ? "calc(100% - 48px)" : width ? px(width) : "auto",
    height: height ? px(height) : "auto",
    maxWidth: fullWidth ? "100%" : "none",
  };

  const textFieldStretchCss = css({
    "& .plainframe-ui-textfield": {
      flex: 1,
      minWidth: 0,
    },
  });

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const closedTransform = getAnimationTransform();
    const openTransform = getOpenTransform();

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      prevOpenRef.current = open;
      el.style.opacity = open ? "1" : "0";
      el.style.transform = open ? openTransform : closedTransform;
      return;
    }

    if (prevOpenRef.current === open) {
      el.style.opacity = open ? "1" : "0";
      el.style.transform = open ? openTransform : closedTransform;
      return;
    }

    prevOpenRef.current = open;

    if (animationRef.current) {
      animationRef.current.cancel();
    }

    const keyframes = open
      ? [
          { opacity: 0, transform: closedTransform },
          { opacity: 1, transform: openTransform },
        ]
      : [
          { opacity: 1, transform: openTransform },
          { opacity: 0, transform: closedTransform },
        ];

    animationRef.current = el.animate(keyframes, {
      duration: 250,
      easing: "ease",
      fill: "forwards",
    });

    return () => {
      if (animationRef.current) {
        animationRef.current.cancel();
      }
    };
  }, [open, h, v]);

  useEffect(() => {
    if (!open || !onClose) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  return (
    <div css={containerStyle}>
      <div
        ref={contentRef}
        css={textFieldStretchCss}
        style={contentStyle}
        role={role}
        aria-label={ariaLabel}
        aria-hidden={!open}
        {...(!open && { inert: true as any })}
      >
        {children}
      </div>
    </div>
  );
};

ActionBar.displayName = "ActionBar";
