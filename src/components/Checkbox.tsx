/** @jsxImportSource @emotion/react */
import React, { useCallback, useMemo, useState, forwardRef } from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { useFocusRing } from "../utils/focusRing";

type WithCssProp = { css?: Interpolation<Theme> };
type CheckboxSize = "sm" | "md" | "lg";

type CheckboxProps = WithCssProp & {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: CheckboxSize;
  label?: React.ReactNode;
  description?: React.ReactNode;
  rounded?: boolean;
  checkedIcon?: React.ReactNode;
  color?:
    | "primary"
    | "secondary"
    | "neutral"
    | "danger"
    | "success"
    | "warning"
    | "info"
    | string;
  boxCss?: Interpolation<Theme>;
  checkCss?: Interpolation<Theme>;
  labelCss?: Interpolation<Theme>;
  descriptionCss?: Interpolation<Theme>;
  className?: string;
};

const getSize = (theme: ReturnType<typeof usePlainframeUITheme>, size: CheckboxSize) => {
  if (size === "sm") {
    return {
      box: 16,
      labelFont: theme.typography.sizes.xs,
      gap: 8,
      borderRadius: theme.radius.xxs,
      borderWidth: theme.componentHeights.border,
      iconRatioW: 0.7,
      iconRatioH: 0.75,
    };
  }
  if (size === "lg") {
    return {
      box: 24,
      labelFont: theme.typography.sizes.md,
      gap: 8,
      borderRadius: theme.radius.xs,
      borderWidth: theme.componentHeights.border,
      iconRatioW: 0.7,
      iconRatioH: 0.75,
    };
  }
  return {
    box: 20,
    labelFont: theme.typography.sizes.sm,
    gap: 8,
    borderRadius: theme.radius.xs,
    borderWidth: theme.componentHeights.border,
    iconRatioW: 0.7,
    iconRatioH: 0.75,
  };
};

export const Checkbox = React.memo(forwardRef<HTMLLabelElement, CheckboxProps>(
  (
    {
      checked,
      defaultChecked = false,
      onChange,
      disabled = false,
      size = "md",
      label,
      description,
      rounded = false,
      checkedIcon,
      color = "primary",
      css: userCss,
      boxCss: userBoxCss,
      checkCss: userCheckCss,
      labelCss: userLabelCss,
      descriptionCss: userDescriptionCss,
      className,
      ...props
    },
    ref
  ) => {
    const theme = usePlainframeUITheme();
    const focusRing = useFocusRing();

    const isControlled = typeof checked === "boolean";
    const [internalChecked, setInternalChecked] = useState<boolean>(defaultChecked);
    const isOn = isControlled ? (checked as boolean) : internalChecked;

    const sizeKey: CheckboxSize = size === "sm" || size === "lg" ? size : "md";
    const S = useMemo(() => getSize(theme, sizeKey), [theme, sizeKey]);

    const { checkedBg, checkColor, borderCol, hoverBg, gapPx } = useMemo(() => {
      const palette = (theme.palette || {}) as Record<string, Record<string, string>>;
      const neutralScale = (theme.neutral || {}) as Record<string, string>;
      const onColors = (theme.text?.onColors || {}) as Record<string, string>;

      let scale: Record<string, string>;
      let onKey: string;

      if (color === "neutral" || color === "secondary") {
        scale = neutralScale;
        onKey = "neutral";
      } else if (typeof color === "string" && Object.prototype.hasOwnProperty.call(palette, color)) {
        scale = palette[color] || palette.primary || neutralScale;
        onKey = color;
      } else {
        scale = palette.primary || neutralScale;
        onKey = "primary";
      }

      const bg =
        scale[600] ??
        scale[500] ??
        scale[400] ??
        Object.values(scale)[0] ??
        theme.palette.primary[600];

      const chk =
        onColors[onKey] ??
        onColors.primary ??
        theme.text?.onColors?.primary ??
        theme.text.primary;

      const gapVal = typeof S.gap === "number" ? S.gap + 2 : S.gap;

      return {
        checkedBg: bg,
        checkColor: chk,
        borderCol: theme.surface.border,
        hoverBg: theme.surface.panelHover,
        gapPx: gapVal,
      };
    }, [S.gap, color, theme]);

    const rootCss = useMemo(
      () =>
        css({
          display: "inline-flex",
          alignItems: label && description ? "flex-start" : "center",
          gap: gapPx,
          cursor: disabled ? "not-allowed" : "pointer",
          userSelect: "auto",
          position: "relative",
          width: "fit-content",
          borderRadius: theme.radius.sm,
          padding: theme.spacing.xs,
          transition: "background-color .16s ease, color .16s ease, opacity .16s ease",

          '&:not([data-disabled="true"]):hover input:not(:checked) + .plainframe-ui-checkbox-box': {
            outlineColor: borderCol as string,
            backgroundColor: hoverBg as string,
          },

          "input:checked + .plainframe-ui-checkbox-box": {
            backgroundColor: checkedBg,
            outlineColor: checkedBg,
            "--pfui-bleed": checkedBg as string,
          },

          '&:not([data-disabled="true"]):hover input:checked + .plainframe-ui-checkbox-box': {
            outlineColor: checkedBg,
            backgroundColor: checkedBg,
            "--pfui-bleed": checkedBg as string,
          },

          ".plainframe-ui-checkbox-check": {
            opacity: 0,
            transform: "scale(0.2)",
          },
          "input:checked + .plainframe-ui-checkbox-box .plainframe-ui-checkbox-check": {
            opacity: 1,
            transform: "scale(1)",
          },
        }),
      [borderCol, checkedBg, description, disabled, gapPx, hoverBg, label, theme.radius.sm, theme.spacing.xs]
    );

    const inputCss = useMemo(
      () =>
        css({
          position: "absolute",
          opacity: 0,
          width: 0,
          height: 0,
          margin: 0,
          padding: 0,
          pointerEvents: "none",
        }),
      []
    );

    const boxBase = useMemo(
      () =>
        css({
          width: S.box,
          height: S.box,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",

          backgroundColor: "transparent",
          outline: `${S.borderWidth} solid ${borderCol}`,
          outlineOffset: `-${S.borderWidth}`,
          boxShadow: "inset 0 0 0 0.5px var(--pfui-bleed, transparent)",

          borderRadius: rounded ? theme.radius.full : S.borderRadius,
          transition:
            "background-color .16s ease, outline-color .05s ease, box-shadow .16s ease, transform .16s ease",
          flex: "0 0 auto",
          verticalAlign: "middle",
          overflow: "hidden",

          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
        }),
      [S.box, S.borderRadius, S.borderWidth, borderCol, rounded, theme.radius.full]
    );

    const checkDims = useMemo(
      () => ({
        w: Math.round(S.box * S.iconRatioW),
        h: Math.round(S.box * S.iconRatioH),
      }),
      [S.box, S.iconRatioH, S.iconRatioW]
    );

    const checkBaseCss = useMemo(
      () =>
        css({
          width: checkDims.w,
          height: checkDims.h,
          transition: "opacity .14s ease, transform .14s ease",
          color: checkColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 0,
          pointerEvents: "none",
          "& > svg, & > img": { width: "100%", height: "100%", display: "block" },
        }),
      [checkColor, checkDims.h, checkDims.w]
    );

    const textColCss = useMemo(
      () =>
        css({
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          userSelect: "text",
          WebkitUserSelect: "text",
        }),
      []
    );

    const baseLabelCss = useMemo(
      () =>
        css({
          fontSize: S.labelFont,
          lineHeight: 1.1,
          fontWeight: 500,
          userSelect: "text",
          WebkitUserSelect: "text",
          color: theme.text.primary,
        }),
      [S.labelFont, theme.text.primary]
    );

    const baseDescriptionCss = useMemo(
      () =>
        css({
          fontSize: S.labelFont,
          lineHeight: 1.25,
          color: theme.text.secondary,
          fontWeight: 400,
          marginTop: label && description ? theme.spacing.xs : 0,
          userSelect: "text",
          WebkitUserSelect: "text",
        }),
      [S.labelFont, description, label, theme.spacing.xs, theme.text.secondary]
    );

    const toggle = useCallback(() => {
      if (disabled) return;
      if (isControlled) {
        onChange?.(!isOn);
      } else {
        setInternalChecked((prev) => {
          const next = !prev;
          onChange?.(next);
          return next;
        });
      }
    }, [disabled, isControlled, isOn, onChange]);

    const onKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      },
      [disabled, toggle]
    );

    return (
      <label
        ref={ref}
        role="checkbox"
        aria-checked={isOn}
        aria-disabled={disabled || undefined}
        data-state={isOn ? "checked" : "unchecked"}
        className={["plainframe-ui-checkbox", className || ""].join(" ").trim()}
        css={[rootCss, focusRing({ color: isOn ? "primary" : "neutral" }), userCss, disabled ? css({ opacity: 0.6 }) : null]}
        data-disabled={disabled ? "true" : "false"}
        tabIndex={!disabled ? 0 : -1}
        onKeyDown={onKeyDown}
      >
        <input
          type="checkbox"
          checked={isOn}
          onChange={toggle}
          disabled={disabled}
          css={inputCss}
          {...props}
          tabIndex={-1}
        />

        <span className="plainframe-ui-checkbox-box" css={[boxBase, userBoxCss]} aria-hidden="true">
          <span className="plainframe-ui-checkbox-check" css={[checkBaseCss, userCheckCss]}>
            {isOn &&
              (checkedIcon || (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={checkColor}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  css={css({ width: "100%", height: "100%", display: "block" })}
                  aria-hidden="true"
                  focusable="false"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ))}
          </span>
        </span>

        {(label || description) && (
          <span className="plainframe-ui-checkbox-text" css={textColCss}>
            {label && (
              <span className="plainframe-ui-checkbox-label" css={[baseLabelCss, userLabelCss]}>
                {label}
              </span>
            )}
            {description && (
              <span className="plainframe-ui-checkbox-description" css={[baseDescriptionCss, userDescriptionCss]}>
                {description}
              </span>
            )}
          </span>
        )}
      </label>
    );
  }
));

Checkbox.displayName = "Checkbox";
