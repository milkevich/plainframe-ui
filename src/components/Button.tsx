/** @jsxImportSource @emotion/react */
import React, {
  useMemo,
  isValidElement,
  cloneElement,
  type ReactNode,
} from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import type { PlainframeUITheme, Scale } from "../theme/theme";
import { useFocusRing } from "../utils/focusRing";
import { Progress } from "./Progress";

export type ButtonVariant =
  | "primary"
  | "destructive"
  | "subtle"
  | "outlined"
  | "ghost"
  | "quiet"
  | "ghost-destructive";

export type ButtonSize = "sm" | "md" | "lg" | number | string;
export type LoadingPosition = "start" | "end" | "center";

type WithCssProp = { css?: Interpolation<Theme> };

type ButtonBase = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "color" | "style"
> &
  WithCssProp & {
    size?: ButtonSize;
    startIcon?: ReactNode;
    endIcon?: ReactNode;
    rounded?: boolean;
    fullWidth?: boolean;
    loading?: boolean;
    loadingIndicator?: ReactNode;
    loadingPosition?: LoadingPosition;
    className?: string;
    hoverEffect?: boolean;
    icon?: boolean; 
    children?: ReactNode;
  };

export type ButtonProps = ButtonBase & { variant?: ButtonVariant };

const cloneIcon = (icon: ReactNode, size: number | string) => {
  if (!isValidElement(icon)) return icon;
  const props = icon.props as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  if (props.size === undefined) next.size = size;
  if (props.color === undefined) next.color = "currentColor";
  return cloneElement(icon, { ...props, ...next });
};

const px = (v: number | string) => (typeof v === "number" ? `${v}px` : v);

const hasText = (node: React.ReactNode): boolean => {
  let found = false;
  React.Children.forEach(node, (ch) => {
    if (found) return;
    if (typeof ch === "string" || typeof ch === "number") {
      if (String(ch).trim() !== "") found = true;
    } else if (Array.isArray(ch)) {
      if (hasText(ch)) found = true;
    }
  });
  return found;
};

function getSize(theme: PlainframeUITheme, size: ButtonSize) {
  const t = theme;
  const kind: "sm" | "md" | "lg" =
    typeof size === "string" && (size === "sm" || size === "md" || size === "lg")
      ? size
      : "md";

  if (kind === "sm") {
    return {
      fontSize: t.typography.sizes.sm,
      paddingY: t.spacing.xs,
      paddingX: t.spacing.md,
      paddingXIcon: t.spacing.md,
      iconSize: 14,
      minHeight: t.componentHeights.sm,
      radius: t.radius.sm,
    };
  }
  if (kind === "lg") {
    return {
      fontSize: t.typography.sizes.md,
      paddingY: t.spacing.sm,
      paddingX: t.spacing.lg,
      paddingXIcon: t.spacing.md,
      iconSize: 18,
      minHeight: t.componentHeights.lg,
      radius: t.radius.md,
    };
  }
  return {
    fontSize: t.typography.sizes.sm,
    paddingY: t.spacing.sm,
    paddingX: t.spacing.lg,
    paddingXIcon: t.spacing.md,
    iconSize: 16,
    minHeight: t.componentHeights.md,
    radius: t.radius.md,
  };
}

function resolveVisuals(theme: PlainframeUITheme, variant: ButtonVariant) {
  const N = theme.neutral as Scale;
  const T = theme.text;
  const P = theme.palette as Record<string, Scale>;
  const primaryScale: Scale = (P.primary as Scale) || (N as Scale);
  const dangerScale: Scale = (P.danger as Scale) || (P.error as Scale) || primaryScale;
  const onColors = (theme.text.onColors || {}) as Record<string, string>;
  const primaryOn = onColors.primary ?? T.onColors.primary;
  const dangerOn = onColors.danger ?? primaryOn;

  const pick = (scale: Scale, k: keyof Scale, fb?: string) =>
    (scale && scale[k]) || fb;

  if (variant === "primary") {
    const scale = primaryScale;
    const bg =
      pick(scale, 600, N[900] as string) ||
      pick(scale, 500, N[900] as string);
    const hoverBg =
      pick(scale, 500, N[800] as string) ||
      pick(scale, 600, N[800] as string);
    return { bg, fg: primaryOn, hoverBg, border: "none" };
  }

  if (variant === "destructive") {
    const scale = dangerScale;
    const bg =
      pick(scale, 600, N[900] as string) ||
      pick(scale, 500, N[900] as string);
    const hoverBg =
      pick(scale, 500, N[800] as string) ||
      pick(scale, 600, N[800] as string);
    return { bg, fg: dangerOn, hoverBg, border: "none" };
  }

  if (variant === "ghost-destructive") {
    const D = dangerScale as Scale;
    const fg = D[700];
    return {
      bg: "transparent",
      fg,
      hoverBg: theme.palette.danger[50],
      border: "none",
    };
  }

  if (variant === "subtle") {
    return {
      bg: theme.surface.subtleBg,
      fg: T.primary,
      hoverBg: theme.surface.subtleHover,
      border: "none",
    };
  }

  if (variant === "outlined") {
    return {
      bg: theme.surface.panelBg,
      fg: T.primary,
      hoverBg: theme.surface.panelHover,
      border: `${theme.componentHeights.border} solid ${theme.surface.border}`,
    };
  }

  if (variant === "ghost") {
    return {
      bg: "transparent",
      fg: theme.text.primary,
      hoverBg: theme.surface.subtleBg,
      border: "none",
    };
  }

  if (variant === "quiet") {
    return {
      bg: "transparent",
      fg: T.secondary,
      hoverBg: theme.surface.subtleBg,
      border: "none",
    };
  }

  return {
    bg: "transparent",
    fg: T.secondary,
    hoverBg: theme.surface.subtleBg,
    border: "none",
  };
}

export const Button = React.memo(
  React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
      {
        variant = "primary",
        size = "md",
        startIcon,
        endIcon,
        rounded = false,
        fullWidth = false,
        disabled = false,
        loading = false,
        loadingIndicator,
        loadingPosition = "center",
        children,
        className,
        hoverEffect = true,
        icon,
        onClick,
        css: userCss,
        ...props
      },
      ref
    ) => {
      const theme = usePlainframeUITheme();
      const focusRing = useFocusRing();

      const S = useMemo(() => getSize(theme, size), [theme, size]);
      const vis = useMemo(() => resolveVisuals(theme, variant), [theme, variant]);

      const isIconOnly = useMemo(
        () => {
          if (icon === true) return true;
          if (icon === false) return false;
          return (
            !startIcon &&
            !endIcon &&
            !hasText(children) &&
            React.Children.count(children) === 1
          );
        },
        [icon, startIcon, endIcon, children]
      );

      const iconSize = S.iconSize;
      const sizedStart = useMemo(
        () => cloneIcon(startIcon, iconSize),
        [startIcon, iconSize]
      );
      const sizedEnd = useMemo(
        () => cloneIcon(endIcon, iconSize),
        [endIcon, iconSize]
      );

      const spinnerNode = useMemo(
        () =>
          loadingIndicator ?? (
            <Progress
              color={vis.fg}
              variant="circular"
              size={14}
              thickness={5}
            />
          ),
        [loadingIndicator, vis]
      );

      const resolvedLoadingPos: LoadingPosition = useMemo(
        () => (isIconOnly ? "center" : loadingPosition ?? "center"),
        [isIconOnly, loadingPosition]
      );

      const showCenterLoader = !!loading && resolvedLoadingPos === "center";
      const showStartLoader = !!loading && resolvedLoadingPos === "start";
      const showEndLoader = !!loading && resolvedLoadingPos === "end";
      const nonInteractive = disabled || loading;

      const rootBase = useMemo(
        () =>
          css({
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            width: fullWidth ? "100%" : "auto",
            minHeight: S.minHeight,
            lineHeight: 1,
            fontWeight: 600,
            cursor: nonInteractive ? "not-allowed" : "pointer",
            opacity: nonInteractive ? 0.5 : 1,
            userSelect: "none",
            position: "relative",
            borderRadius: rounded ? theme.radius.full : S.radius,
            outline: "none",
            willChange: "box-shadow, transform, outline-offset",
            transition:
              "box-shadow 140ms ease, transform 90ms ease, outline-offset 140ms ease",
          }),
        [fullWidth, S, rounded, theme, nonInteractive]
      );

      const variantCss = useMemo(
        () =>
          css({
            backgroundColor: vis.bg,
            color: vis.fg,
            border: vis.border,
          }),
        [vis]
      );

      const hoverOverlayCss = useMemo(
        () =>
          css({
            overflow: "hidden",
            "::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              backgroundColor: vis.hoverBg,
              opacity: 0,
              pointerEvents: "none",
              transition: "opacity 140ms ease",
              zIndex: 0,
            },
            "@media (hover: hover) and (pointer: fine)":
              hoverEffect && !nonInteractive
                ? {
                    ":hover::before": {
                      opacity: 1,
                    },
                  }
                : {},
          }),
        [vis, hoverEffect, nonInteractive]
      );

      const padCss = useMemo(
        () =>
          css(
            isIconOnly && !fullWidth
              ? {
                  width: "100%",
                  height: "100%",
                  maxWidth: S.minHeight,
                  minWidth: S.minHeight,
                  maxHeight: S.minHeight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: px(S.iconSize),
                }
              : {
                  fontSize: px(S.fontSize),
                  padding:
                    startIcon || endIcon
                      ? `${S.paddingY} ${S.paddingXIcon}`
                      : `${S.paddingY} ${S.paddingX}`,
                }
          ),
        [isIconOnly, fullWidth, S, startIcon, endIcon]
      );

      const contentGroupCss = useMemo(
        () =>
          css({
            position: "relative",
            zIndex: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: px(theme.spacing.sm),
            opacity: showCenterLoader ? 0 : 1,
            transition: "opacity 140ms ease",
          }),
        [theme, showCenterLoader]
      );

      const labelCss = useMemo(
        () =>
          css({
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }),
        []
      );

      const slotSizePx = useMemo(
        () =>
          typeof S.iconSize === "number"
            ? S.iconSize
            : Math.max(
                12,
                Math.round(parseFloat(String(S.iconSize)) || 16)
              ),
        [S.iconSize]
      );

      const slotCss = useMemo(
        () =>
          css({
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: slotSizePx,
            minWidth: slotSizePx,
            maxWidth: slotSizePx,
            height: "1em",
          }),
        [slotSizePx]
      );

      const slotLayerCss = useMemo(
        () => (visible: boolean) =>
          css({
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: visible ? 1 : 0,
            transition: "opacity 140ms ease",
          }),
        []
      );

      const centerOverlayCss = useMemo(
        () =>
          css({
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: showCenterLoader ? 1 : 0,
            pointerEvents: "none",
            zIndex: 2,
            transition: "opacity 140ms ease",
          }),
        [showCenterLoader]
      );

      const renderLeftSlot = useMemo(
        () => () => {
          if (isIconOnly) return null;
          const has = Boolean(startIcon);
          if (!has && !showStartLoader) return null;
          return (
            <span css={slotCss} aria-hidden={loading ? true : undefined}>
              <span css={slotLayerCss(!showStartLoader)}>
                {has ? (sizedStart || startIcon) : null}
              </span>
              <span css={slotLayerCss(!!showStartLoader)}>
                {spinnerNode}
              </span>
            </span>
          );
        },
        [
          isIconOnly,
          startIcon,
          showStartLoader,
          slotCss,
          slotLayerCss,
          sizedStart,
          loading,
          spinnerNode,
        ]
      );

      const renderRightSlot = useMemo(
        () => () => {
          if (isIconOnly) return null;
          const has = Boolean(endIcon);
          if (!has && !showEndLoader) return null;
          return (
            <span css={slotCss} aria-hidden={loading ? true : undefined}>
              <span css={slotLayerCss(!showEndLoader)}>
                {has ? (sizedEnd || endIcon) : null}
              </span>
              <span css={slotLayerCss(!!showEndLoader)}>
                {spinnerNode}
              </span>
            </span>
          );
        },
        [
          isIconOnly,
          endIcon,
          showEndLoader,
          slotCss,
          slotLayerCss,
          sizedEnd,
          loading,
          spinnerNode,
        ]
      );

      const isInteractive = !(disabled || loading);

      return (
        <button
          ref={ref}
          type={"type" in props && props.type ? props.type : "button"}
          data-variant={variant}
          className={["plainframe-ui-button", className || ""]
            .join(" ")
            .trim()}
          css={[
            rootBase,
            focusRing({
              color:
                variant === "primary"
                  ? "primary"
                  : variant === "destructive" ||
                    variant === "ghost-destructive"
                  ? "danger"
                  : "neutral",
            }),
            variantCss,
            hoverOverlayCss,
            padCss,
            userCss,
          ]}
          onClick={isInteractive ? onClick : undefined}
          disabled={disabled || undefined}
          tabIndex={loading ? -1 : undefined}
          aria-disabled={disabled || undefined}
          aria-busy={loading || undefined}
          {...props}
        >
          <span
            className="plainframe-ui-button-content"
            css={contentGroupCss}
          >
            {renderLeftSlot()}
            <span
              className="plainframe-ui-button-label"
              css={labelCss}
            >
              {isIconOnly
                ? loading
                  ? spinnerNode
                  : cloneIcon(children, S.iconSize)
                : children}
            </span>
            {renderRightSlot()}
          </span>
          <span
            className="plainframe-ui-button-center-overlay"
            css={centerOverlayCss}
            aria-hidden="true"
          >
            {showCenterLoader ? spinnerNode : null}
          </span>
        </button>
      );
    }
  )
);

Button.displayName = "Button";