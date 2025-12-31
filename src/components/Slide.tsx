/** @jsxImportSource @emotion/react */
import React, {
  isValidElement,
  cloneElement,
  type ReactNode,
  type CSSProperties,
} from "react";
import { css } from "@emotion/react";

type Direction = "left" | "right" | "up" | "down";

type SlideProps = {
  children: ReactNode;
  direction?: Direction;
  duration?: number;
  delay?: number;
  on: boolean;
  onAnimationEnd?: () => void;
  asChild?: boolean;
  className?: string;
  distance?: number | string;
};

const toLen = (v: number | string | undefined, fb: string) =>
  v == null ? fb : typeof v === "number" ? `${v}px` : v;

export const Slide: React.FC<SlideProps> = ({
  children,
  direction = "up",
  duration = 450,
  delay = 0,
  on = false,
  onAnimationEnd,
  asChild = false,
  className,
  distance,
}) => {
  const defaultDist =
    direction === "left" || direction === "right" ? "100vw" : "100vh";
  const dist = toLen(distance, defaultDist);

  const offX =
    direction === "left" ? `-${dist}` : direction === "right" ? dist : "0";
  const offY =
    direction === "up" ? dist : direction === "down" ? `-${dist}` : "0";

  const baseStyles: CSSProperties = {
    transform: on
      ? "translate3d(0,0,0)"
      : `translate3d(${offX}, ${offY}, 0)`,
    transition: `transform ${duration}ms ease ${delay}ms`,
    pointerEvents: on ? "auto" : "none",
    willChange: "transform",
    backfaceVisibility: "hidden",
  };

  const handleEnd =
    (prev?: (e: React.TransitionEvent<any>) => void) =>
    (e: React.TransitionEvent<any>) => {
      if (e.target === e.currentTarget && e.propertyName === "transform") {
        onAnimationEnd?.();
      }
      prev?.(e);
    };

  if (asChild && isValidElement(children)) {
    const child = children as React.ReactElement<{
      css?: unknown;
      className?: string;
      onTransitionEnd?: React.TransitionEventHandler;
    }>;
    const prevCss = child.props.css;
    const mergedCss = Array.isArray(prevCss)
      ? [...prevCss, baseStyles]
      : prevCss
      ? [prevCss, baseStyles]
      : [baseStyles];

    const mergedClassName = [
      "plainframe-ui-transition-slide",
      child.props.className || "",
      className || "",
    ]
      .join(" ")
      .trim();

    const prevOnTransitionEnd = child.props.onTransitionEnd;

    return cloneElement(child, {
      ...child.props,
      css: mergedCss,
      className: mergedClassName,
      onTransitionEnd: handleEnd(prevOnTransitionEnd),
    });
  }

  const styles = css(baseStyles as any);

  return (
    <div
      className={["plainframe-ui-transition-slide", className || ""]
        .join(" ")
        .trim()}
      css={styles}
      onTransitionEnd={handleEnd()}
    >
      {children}
    </div>
  );
};
