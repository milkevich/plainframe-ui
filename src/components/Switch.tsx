/** @jsxImportSource @emotion/react */
import React, { useEffect, useState, forwardRef } from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { useFocusRing } from "../utils/focusRing";

type WithCssProp = { css?: Interpolation<Theme> };

type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  label?: React.ReactNode;
  className?: string;
  trackCss?: Interpolation<Theme>;
  thumbCss?: Interpolation<Theme>;
  labelCss?: Interpolation<Theme>;
} & WithCssProp &
  Omit<React.HTMLAttributes<HTMLLabelElement>, "onChange" | "className">;

export const Switch: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<SwitchProps> & React.RefAttributes<HTMLLabelElement>
> = React.memo(forwardRef<HTMLLabelElement, SwitchProps>(function Switch(
  {
    checked: checkedProp,
    defaultChecked = false,
    onChange,
    disabled = false,
    size = "md",
    label,
    className,
    css: userRootCss,
    trackCss: userTrackCss,
    thumbCss: userThumbCss,
    labelCss: userLabelCss,
    ...props
  },
  ref
) {
  const theme = usePlainframeUITheme();
  const focusRing = useFocusRing();

  const sizeMap = {
    sm: { trackW: 25, trackH: 16, thumb: 11, labelGap: 8 },
    md: { trackW: 35, trackH: 20, thumb: 14, labelGap: 8 },
    lg: { trackW: 45, trackH: 24, thumb: 18, labelGap: 10 },
  } as const;
  const motion = { slideMs: 250, pressMs: 150, easing: "ease" } as const;

  const isControlled = checkedProp !== undefined;
  const [internal, setInternal] = useState<boolean>(defaultChecked);
  const isOn = isControlled ? !!checkedProp : internal;

  const [animating, setAnimating] = useState(false);
  useEffect(() => {
    if (disabled) return;
    setAnimating(true);
    const t = setTimeout(() => setAnimating(false), motion.pressMs);
    return () => clearTimeout(t);
  }, [isOn, disabled]);

  const sizeKey = (["sm", "md", "lg"].includes(size!) ? size : "md") as "sm" | "md" | "lg";
  const s = sizeMap[sizeKey];
  const slide = `${motion.slideMs}ms ${motion.easing}`;

  const primary = theme.palette?.primary?.[600] ?? theme.neutral[900];
  const offTrack = theme.neutral[300];
  const trackColor = isOn ? primary : offTrack;
  const thumbColor = isOn ? theme.text.onColors.primary : "#ffffff";

  const { trackW, trackH, thumb } = s;
  const pad = (trackH - thumb) / 2;

  const rootBaseCss = css({
    display: "inline-flex",
    alignItems: "center",
    gap: s.labelGap,
    cursor: disabled ? "not-allowed" : "pointer",
    width: "fit-content",
    padding: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    outline: "none",
  });

  const trackBaseCss = css({
    position: "relative",
    width: trackW,
    height: trackH,
    backgroundColor: trackColor,
    borderRadius: theme.radius.xl,
    transition: `background-color ${slide}, opacity 120ms ease`,
    willChange: "background-color",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  });

  const thumbBaseCss = css({
    position: "absolute",
    top: pad,
    left: isOn ? trackW - thumb - pad : pad,
    width: thumb,
    height: thumb,
    backgroundColor: thumbColor,
    borderRadius: theme.radius.xl,
    transition: `left ${slide}, transform ${slide}, background-color 0.25s ease`,
    transform: animating ? "scaleX(1.2)" : "scaleX(1)",
    transformOrigin: isOn ? "right center" : "left center",
  });

  const labelBaseCss = css({
    fontSize: theme.typography.sizes.sm,
    fontWeight: 500,
    color: disabled ? theme.text.muted : theme.text.primary,
  });

  const toggle = () => {
    if (disabled) return;
    const next = !isOn;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLLabelElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <label
      ref={ref}
      role="switch"
      aria-checked={isOn}
      aria-disabled={disabled || undefined}
      data-checked={isOn ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      tabIndex={disabled ? -1 : 0}
      onClick={toggle}
      onKeyDown={handleKeyDown}
      className={["plainframe-ui-switch", className || ""].join(" ").trim()}
      css={[rootBaseCss, focusRing({ color: isOn ? "primary" : "neutral" }), userRootCss]}
      {...props}
    >
      <div
        className="plainframe-ui-switch-track"
        css={[trackBaseCss, userTrackCss]}
      >
        <div className="plainframe-ui-switch-thumb" css={[thumbBaseCss, userThumbCss]} />
      </div>

      {label != null && (
        <span className="plainframe-ui-switch-label" css={[labelBaseCss, userLabelCss]}>
          {label}
        </span>
      )}
    </label>
  );
}));
