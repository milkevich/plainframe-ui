/** @jsxImportSource @emotion/react */
import React, {
  isValidElement,
  cloneElement,
  type ReactNode,
} from "react";
import { css } from "@emotion/react";

type GrowProps = {
  children: ReactNode;
  duration?: number;
  delay?: number;
  on: boolean;
  initialScale?: number;
  finalScale?: number;
  onAnimationEnd?: () => void;
  asChild?: boolean;
  className?: string;
};

export const Grow: React.FC<GrowProps> = ({
  children,
  duration = 300,
  delay = 0,
  on = false,
  initialScale = 0,
  finalScale = 1,
  onAnimationEnd,
  asChild = false,
  className,
}) => {
  const baseStyles = {
    transform: on
      ? `scale(${finalScale})`
      : `scale(${initialScale})`,
    transition: `transform ${duration}ms ease ${delay}ms`,
    pointerEvents: on
      ? ("auto" as React.CSSProperties["pointerEvents"])
      : ("none" as React.CSSProperties["pointerEvents"]),
    willChange: "transform" as const,
    backfaceVisibility: "hidden" as const,
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

    const prevOnTransitionEnd = child.props.onTransitionEnd;

    const mergedClassName = [
      "plainframe-ui-transition-grow",
      child.props.className || "",
      className || "",
    ]
      .join(" ")
      .trim();

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
      className={["plainframe-ui-transition-grow", className || ""]
        .join(" ")
        .trim()}
      css={styles}
      onTransitionEnd={handleEnd()}
    >
      {children}
    </div>
  );
};
