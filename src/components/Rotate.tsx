/** @jsxImportSource @emotion/react */
import React, {
  isValidElement,
  cloneElement,
  type ReactNode,
} from "react";
import { css } from "@emotion/react";

type RotateProps = {
  children: ReactNode;
  duration?: number;
  delay?: number;
  on: boolean;
  initialAngle?: number;
  finalAngle?: number;
  onAnimationEnd?: () => void;
  asChild?: boolean;
  className?: string;
};

export const Rotate: React.FC<RotateProps> = ({
  children,
  duration = 400,
  delay = 0,
  on = false,
  initialAngle = 360,
  finalAngle = 0,
  onAnimationEnd,
  asChild = false,
  className,
}) => {
  const baseStyles = {
    transform: `rotate(${on ? finalAngle : initialAngle}deg)`,
    transition: `transform ${duration}ms ease ${delay}ms`,
    pointerEvents: on ? "auto" : "none",
    transformOrigin: "center center",
    willChange: "transform",
    backfaceVisibility: "hidden",
  } as const;

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
      "plainframe-ui-transition-rotate",
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
      className={["plainframe-ui-transition-rotate", className || ""]
        .join(" ")
        .trim()}
      css={styles}
      onTransitionEnd={handleEnd()}
    >
      {children}
    </div>
  );
};
