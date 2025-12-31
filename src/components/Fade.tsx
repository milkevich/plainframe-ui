/** @jsxImportSource @emotion/react */
import React, {
  isValidElement,
  cloneElement,
  type ReactNode,
} from "react";
import { css } from "@emotion/react";

type FadeProps = {
  children: ReactNode;
  duration?: number;
  delay?: number;
  on: boolean;
  onAnimationEnd?: () => void;
  asChild?: boolean;
  className?: string;
  blur?: boolean;
};

export const Fade: React.FC<FadeProps> = ({
  children,
  duration = 300,
  delay = 0,
  on = false,
  onAnimationEnd,
  asChild = false,
  className,
  blur = false,
}) => {
  const baseStyles = {
    opacity: on ? 1 : 0,
    filter: blur ? (on ? "none" : "blur(10px)") : "none",
    transition: `opacity ${duration}ms ease ${delay}ms, filter ${duration}ms ease ${delay}ms`,
    pointerEvents: on ? "auto" : "none",
    willChange: "opacity, filter",
    backfaceVisibility: "hidden",
  } as const;

  const handleEnd =
    (prev?: (e: React.TransitionEvent<any>) => void) =>
    (e: React.TransitionEvent<any>) => {
      if (
        e.target === e.currentTarget &&
        (e.propertyName === "opacity" || e.propertyName === "filter")
      ) {
        onAnimationEnd?.();
      }
      prev?.(e);
    };

  if (asChild && isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    const prevCss = child.props.css;
    const mergedCss = Array.isArray(prevCss)
      ? [...prevCss, baseStyles]
      : prevCss
      ? [prevCss, baseStyles]
      : [baseStyles];

    const mergedClassName = [
      "plainframe-ui-transition-fade",
      child.props.className || "",
      className || "",
    ]
      .join(" ")
      .trim();

    const prevOnTransitionEnd = child.props.onTransitionEnd as
      | ((e: React.TransitionEvent<any>) => void)
      | undefined;

    return cloneElement(child, {
      ...child.props,
      css: mergedCss,
      className: mergedClassName,
      onTransitionEnd: handleEnd(prevOnTransitionEnd),
    });
  }

  const styles = css(baseStyles as import("@emotion/react").CSSObject);

  return (
    <div
      className={["plainframe-ui-transition-fade", className || ""]
        .join(" ")
        .trim()}
      css={styles}
      onTransitionEnd={handleEnd()}
    >
      {children}
    </div>
  );
};
