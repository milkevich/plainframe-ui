/** @jsxImportSource @emotion/react */
import React, { useMemo, forwardRef } from "react";
import { css } from "@emotion/react";
import type { Interpolation, Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";

type DividerVariant = "full" | "inset" | "middle";
type LabelPos = "left" | "right" | "center" | "top" | "bottom";
type ChipVariant = "subtle" | "outlined";

export type DividerProps = Omit<React.HTMLAttributes<HTMLDivElement>, "style"> & {
  label?: React.ReactNode;
  variant?: DividerVariant;
  direction?: "vertical" | "horizontal";
  labelPosition?: LabelPos;
  thickness?: number | string;
  width?: number | string;
  middleMargin?: number | string;
  insetMargin?: number | string;
  chip?: boolean;
  chipVariant?: ChipVariant;
  rounded?: boolean;
  margin?: number | string;
  css?: Interpolation<Theme>;
  labelCss?: Interpolation<Theme>;
  strokeCss?: Interpolation<Theme>;
  className?: string;
};

const toLen = (v: number | string | undefined, def = "0px"): string =>
  v == null ? def : typeof v === "number" ? `${v}px` : v;

export const Divider: React.ForwardRefExoticComponent<
  DividerProps & React.RefAttributes<HTMLDivElement>
> = React.memo(forwardRef<HTMLDivElement, DividerProps>(function Divider(
  {
    label,
    variant = "full",
    direction = "horizontal",
    labelPosition = "center",
    thickness = 1,
    width,
    middleMargin = "5px",
    insetMargin = "10px",
    chip = false,
    chipVariant = "subtle",
    rounded = false,
    margin = 10,
    css: userCss,
    labelCss,
    strokeCss,
    className,
    ...rest
  },
  ref
) {
  const theme = usePlainframeUITheme();

  const {
    t,
    strokeColor,
    labelTextColor,
    chipSubtleBg,
    chipOutlinedBg,
    outerM,
    padX,
    verticalStrokeMargin,
  } = useMemo(() => {
    const tVal = typeof thickness === "number" ? `${thickness}px` : thickness;
    const strokeColorVal = theme.surface.border;
    const labelTextColorVal = theme.text.secondary;
    const chipSubtleBgVal = theme.surface.subtleBg;
    const chipOutlinedBgVal = theme.surface.panelBg;
    const outerMVal = toLen(margin, "10px");
    const padXVal =
      direction === "horizontal"
        ? variant === "middle"
          ? toLen(middleMargin)
          : variant === "inset"
          ? toLen(insetMargin, "0px")
          : "0"
        : "0";
    const verticalStrokeMarginVal =
      direction === "vertical"
        ? variant === "middle"
          ? toLen(middleMargin)
          : variant === "inset"
          ? toLen(insetMargin, "0px")
          : "0"
        : "0";
    return {
      t: tVal,
      strokeColor: strokeColorVal,
      labelTextColor: labelTextColorVal,
      chipSubtleBg: chipSubtleBgVal,
      chipOutlinedBg: chipOutlinedBgVal,
      outerM: outerMVal,
      padX: padXVal,
      verticalStrokeMargin: verticalStrokeMarginVal,
    };
  }, [thickness, theme, direction, variant, middleMargin, insetMargin, margin]);

  const wrapCss = useMemo(
    () =>
      css([
        { display: "flex", alignItems: "center" },
        direction === "vertical"
          ? {
              flexDirection: "column",
              alignSelf: "stretch",
              width: label ? "max-content" : t,
              minWidth: label ? "max-content" : t,
              marginLeft: outerM,
              marginRight: outerM,
            }
          : {
              flexDirection: "row",
              width: width ? toLen(width) : "100%",
              minWidth: 0,
              paddingLeft: padX,
              paddingRight: variant === "middle" ? padX : "0",
              marginTop: outerM,
              marginBottom: outerM,
            },
        ...(Array.isArray(userCss) ? userCss : userCss ? [userCss] : [])
      ]),
    [direction, label, t, outerM, width, padX, variant, userCss]
  );

  const strokeBaseCss = useMemo(
    () =>
      css([
        {
          background: strokeColor,
          borderRadius: rounded ? theme.radius.full : theme.radius.xs,
        },
        direction === "vertical"
          ? {
              width: t,
              minHeight: 18,
              flex: 1,
              marginTop: verticalStrokeMargin,
              marginBottom: verticalStrokeMargin,
            }
          : { height: t, flex: 1 }
      ]),
    [strokeColor, rounded, theme.radius.full, theme.radius.xs, direction, t, verticalStrokeMargin]
  );

  const labelBaseCss = useMemo(
    () =>
      css([
        {
          margin: chip ? (direction === "vertical" ? "4px 0" : 0) : direction === "vertical" ? "2px 0" : 0,
          padding: chip ? "3px 7px" : 0,
          borderRadius: chip
            ? rounded
              ? theme.radius.full
              : `calc(${theme.radius.sm} * 0.75)`
            : `calc(${theme.radius.sm} * 0.75)`,
          color: labelTextColor,
          fontWeight: 500,
          fontSize: 13,
          textAlign: "center",
          alignSelf: "center",
          whiteSpace: direction === "vertical" ? "normal" : "pre",
          wordBreak: direction === "vertical" ? "break-all" : undefined,
          ...(chip
            ? chipVariant === "subtle"
              ? { background: chipSubtleBg, border: "none" }
              : { background: chipOutlinedBg, border: `${t} solid ${strokeColor}` }
            : {}),
        },
        ...(Array.isArray(labelCss) ? labelCss : labelCss ? [labelCss] : [])
      ]),
    [
      chip,
      direction,
      rounded,
      theme.radius.full,
      theme.radius.sm,
      labelTextColor,
      chipVariant,
      chipSubtleBg,
      chipOutlinedBg,
      t,
      strokeColor,
      labelCss,
    ]
  );

  const strokeEl = useMemo<React.ReactElement>(
    () => <div className="plainframe-ui-divider-stroke" css={[strokeBaseCss, strokeCss]} />,
    [strokeBaseCss, strokeCss]
  );

  if (direction === "vertical") {
    return (
      <div
        ref={ref}
        data-direction="vertical"
        data-variant={variant}
        data-chip={chip ? "true" : undefined}
        className={["plainframe-ui-divider-wrapper", "is-vertical", className || ""].join(" ").trim()}
        css={wrapCss}
        {...rest}
      >
        {label && labelPosition !== "top" && strokeEl}
        {label && (
          <span className="plainframe-ui-divider-label" css={labelBaseCss}>
            {label}
          </span>
        )}
        {label && labelPosition !== "bottom" && strokeEl}
        {!label && strokeEl}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      data-direction="horizontal"
      data-variant={variant}
      data-chip={chip ? "true" : undefined}
      className={["plainframe-ui-divider-wrapper", className || ""].join(" ").trim()}
      css={wrapCss}
      {...rest}
    >
      {label && labelPosition !== "left" && strokeEl}
      {label && (
        <span className="plainframe-ui-divider-label" css={labelBaseCss}>
          {label}
        </span>
      )}
      {label && labelPosition !== "right" && strokeEl}
      {!label && strokeEl}
    </div>
  );
}));
