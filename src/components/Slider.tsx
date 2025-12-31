/** @jsxImportSource @emotion/react */
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { css, type CSSObject } from "@emotion/react";
import type { Interpolation, Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { AnimatePresence, motion } from "framer-motion";

type Direction = "horizontal" | "vertical";

type SliderProps = Omit<React.HTMLAttributes<HTMLDivElement>, "style"> & {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  showStepper?: boolean;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  rounded?: boolean;
  showValue?: boolean;
  label?: string;
  fullWidth?: boolean;
  css?: Interpolation<Theme>;
  trackCss?: Interpolation<Theme>;
  thumbCss?: Interpolation<Theme>;
  direction?: Direction;
  className?: string;
};

const DEFAULT_TRACK_H = 8;
const DEFAULT_THUMB = 20;
const DEFAULT_DOT = 4;

export const Slider: React.FC<SliderProps> = ({
  value,
  defaultValue,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  rounded = false,
  showValue = false,
  showStepper = false,
  label,
  fullWidth = false,
  css: userRootCss,
  trackCss,
  thumbCss,
  direction = "horizontal",
  className,
  ...rest
}) => {
  const theme = usePlainframeUITheme();
  const isVertical = direction === "vertical";
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [dragging, setDragging] = useState(false);
  const [hoverThumb, setHoverThumb] = useState(false);
  const [hoverTip, setHoverTip] = useState(false);

  const isControlled = value !== undefined;
  const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max]);
  const quantize = useCallback(
    (raw: number) => clamp(Math.round((raw - min) / step) * step + min),
    [min, step, clamp]
  );

  const [internal, setInternal] = useState<number>(() =>
    quantize(defaultValue == null ? min : defaultValue)
  );
  const current = isControlled ? quantize(value as number) : internal;

  useEffect(() => {
    if (!isControlled) setInternal((v) => quantize(v));
  }, [min, max, step, isControlled, quantize]);

  const primary600 = theme.palette.primary[600];
  const panelBg = theme.surface.panelBg;
  const disabledInk = theme.neutral[500];

  const percent = useMemo(() => {
    const span = max - min || 1;
    return ((current - min) / span) * 100;
  }, [current, min, max]);

  const commit = useCallback(
    (next: number) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange]
  );

  const valueFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = trackRef.current;
      if (!el) return current;
      const rect = el.getBoundingClientRect();
      let ratio = isVertical ? (rect.bottom - clientY) / rect.height : (clientX - rect.left) / rect.width;
      ratio = Math.max(0, Math.min(1, ratio));
      return quantize(min + ratio * (max - min));
    },
    [current, isVertical, min, max, quantize]
  );

  const onPointerDownTrack = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      commit(valueFromPointer(e.clientX, e.clientY));
      setDragging(true);
    },
    [disabled, commit, valueFromPointer]
  );

  const onPointerDownThumb = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      setDragging(true);
    },
    [disabled]
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging || disabled) return;
      commit(valueFromPointer(e.clientX, e.clientY));
    },
    [dragging, disabled, commit, valueFromPointer]
  );

  const stopDrag = useCallback(() => setDragging(false), []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };
  }, [dragging, onPointerMove, stopDrag]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      let next = current;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") next = current + step;
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = current - step;
      else if (e.key === "Home") next = min;
      else if (e.key === "End") next = max;
      else return;
      e.preventDefault();
      commit(quantize(next));
    },
    [disabled, current, step, min, max, commit, quantize]
  );

  const showTooltip = dragging || hoverThumb || hoverTip;
  const showHoverRing = (hoverThumb || dragging) && !disabled;
  const ringColor = `color-mix(in srgb, ${primary600} 25%, transparent)`;

  const rootCss = css({
    display: "flex",
    flexDirection: isVertical ? "row" : "column",
    alignItems: "center",
    padding: isVertical ? "1rem" : "1rem 0",
    width: isVertical ? "fit-content" : fullWidth ? "100%" : 350,
    height: isVertical ? 250 : "auto",
    boxSizing: "border-box",
  });

  const labelCss = css({
    marginBottom: isVertical ? 0 : 4,
    marginRight: isVertical ? 8 : 0,
    color: theme.text.primary,
    userSelect: "none",
  });

  const trackBaseCss = css({
    position: "relative",
    width: isVertical ? DEFAULT_TRACK_H : "100%",
    height: isVertical ? "100%" : DEFAULT_TRACK_H,
    backgroundColor: theme.neutral[200],
    borderRadius: theme.radius.xs,
    cursor: disabled ? "not-allowed" : "pointer",
    touchAction: "none",
    outline: "none",
    overflow: "visible",
  });

  const stepperCss = css({
    position: "absolute",
    left: isVertical ? "50%" : 0,
    top: isVertical ? 2 : "50%",
    transform: isVertical ? "translateX(-50%)" : "translateY(-50%)",
    width: isVertical ? DEFAULT_TRACK_H : `calc(100% - ${DEFAULT_DOT * 0.5}px)`,
    height: isVertical ? `calc(100% - ${DEFAULT_DOT * 0.5}px)` : DEFAULT_TRACK_H,
    display: "flex",
    flexDirection: isVertical ? "column" : "row",
    justifyContent: "space-between",
    alignItems: "center",
    pointerEvents: "none",
    zIndex: 0,
    padding: 0,
  });

  const stepDotCss = css({
    width: DEFAULT_DOT,
    height: DEFAULT_DOT,
    borderRadius: "50%",
    backgroundColor: theme.text.primary,
    opacity: 0.15,
    flex: "0 0 auto",
  });

  const fillCss_default = css({
    position: "absolute",
    left: 0,
    top: isVertical ? `calc(${100 - percent}% )` : 0,
    bottom: 0,
    width: isVertical ? "100%" : `${percent}%`,
    height: isVertical ? `${percent}%` : "100%",
    backgroundColor: disabled ? disabledInk : primary600,
    borderRadius: theme.radius.sm,
    zIndex: 1,
    transition: "none",
    pointerEvents: "none",
  });

  const thumb_default = css({
    position: "absolute",
    appearance: "none",
    WebkitAppearance: "none",
    background: theme.text.onColors.primary,
    width: DEFAULT_THUMB,
    height: DEFAULT_THUMB,
    left: isVertical ? "50%" : `calc(${percent}% - ${DEFAULT_THUMB / 2}px)`,
    bottom: isVertical ? `${percent}%` : "auto",
    top: isVertical ? "auto" : "50%",
    transform: isVertical ? "translate(-50%, 50%)" : "translateY(-50%)",
    borderRadius: rounded ? theme.radius.full : `calc(${theme.radius.md} * 0.75)`,
    border: `2px solid ${disabled ? disabledInk : primary600}`,
    cursor: disabled ? "not-allowed" : "grab",
    zIndex: 5,
    padding: 0,
    lineHeight: 0,
    transition: "box-shadow .16s ease",
    boxShadow: showHoverRing ? `0 0 0 ${dragging ? 4 : 8}px ${ringColor}` : `0 0 0 0px ${ringColor}`,
    "&:focus-visible": {
      boxShadow: `0 0 0 4px ${ringColor}`,
      outline: "none",
    },
  });

  const tipAnchorCss = css({
    position: "relative",
    backgroundColor: "transparent",
    padding: "1rem",
    top: !isVertical ? -28 : -7.5,
    left: isVertical ? 9 : -7.5,
    pointerEvents: "none",
  });

  const tooltipCss = css({
    position: "absolute",
    top: isVertical ? `calc(50% - ${DEFAULT_DOT * 2.5}px)` : 0,
    left: isVertical ? "auto" : `calc(50% - ${DEFAULT_DOT * 3}px)`,
    transform: isVertical ? "translateY(-50%)" : "translateX(-50%)",
    backgroundColor: theme.neutral[800],
    color: theme.neutral[0],
    padding: `0.6rem 0.25rem`,
    fontSize: 12,
    borderRadius: 6,
    whiteSpace: "nowrap",
    pointerEvents: "auto",
    zIndex: 6,
    "&::after": {
      content: '""',
      position: "absolute",
      width: 6,
      height: 6,
      backgroundColor: theme.neutral[800],
      borderRadius: 2,
      bottom: isVertical ? "50%" : -2,
      left: isVertical ? -2.5 : "50%",
      transform: isVertical ? "translateY(50%) rotate(45deg)" : "translateX(-50%) rotate(45deg)",
    },
  });

  const rootUserCss = userRootCss as CSSObject | undefined;
  const trackUserCss = trackCss as CSSObject | undefined;
  const thumbUserCss = thumbCss as CSSObject | undefined;

  const stepsCount = Math.floor((max - min) / step) + 1;

  return (
    <div
      {...rest}
      role="group"
      aria-label={label}
      className={["plainframe-ui-slider", className || ""].join(" ").trim()}
      css={[rootCss, rootUserCss]}
      data-orientation={isVertical ? "vertical" : "horizontal"}
    >
      {label && !isVertical && (
        <div className="plainframe-ui-slider-label" css={labelCss}>
          {label}
        </div>
      )}

      <div
        ref={trackRef}
        className="plainframe-ui-slider-track"
        css={[trackBaseCss, trackUserCss]}
        onPointerDown={onPointerDownTrack}
      >
        {showStepper && step > 0 && (
          <div className="plainframe-ui-slider-stepper" css={stepperCss}>
            {Array.from({ length: stepsCount }).map((_, i) => (
              <span key={i} className="plainframe-ui-slider-step-dot" css={stepDotCss} />
            ))}
          </div>
        )}

        <div className="plainframe-ui-slider-fill" css={fillCss_default} />

        <button
          type="button"
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={current}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDownThumb}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          onMouseEnter={() => setHoverThumb(true)}
          onMouseLeave={() => setHoverThumb(false)}
          className="plainframe-ui-slider-thumb"
          css={[thumb_default, thumbUserCss]}
        >
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                className="plainframe-ui-slider-tooltip-anchor"
                css={tipAnchorCss}
                initial={{ opacity: 0, scale: 0.9, y: isVertical ? 0 : 4, x: isVertical ? 4 : 0 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: isVertical ? 0 : 4, x: isVertical ? 4 : 0 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                <motion.div
                  className="plainframe-ui-slider-tooltip"
                  css={tooltipCss}
                  initial={{ opacity: 0, y: isVertical ? 0 : 4, x: isVertical ? -4 : 0 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, y: isVertical ? 0 : 4, x: isVertical ? -4 : 0 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  onMouseEnter={() => setHoverTip(true)}
                  onMouseLeave={() => setHoverTip(false)}
                >
                  {current}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          {showValue && !showTooltip ? null : null}
        </button>
      </div>

      {label && isVertical && (
        <div className="plainframe-ui-slider-label" css={[labelCss, { marginLeft: 8 }]}>
          {label}
        </div>
      )}
    </div>
  );
};

Slider.displayName = "Slider";