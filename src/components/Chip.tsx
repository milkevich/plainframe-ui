/** @jsxImportSource @emotion/react */
import React, { useMemo, useCallback, forwardRef } from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { useFocusRing } from "../utils/focusRing";
import { X } from "lucide-react";

type ChipVariant = "soft" | "outlined" | "filled" | "ghost";
type ChipSize = "sm" | "md" | "lg";
type WithCssProp = { css?: Interpolation<Theme> };

export type ChipProps = WithCssProp & {
  children?: React.ReactNode;
  labelCss?: Interpolation<Theme>;
  variant?: ChipVariant;
  color?: string;
  rounded?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  size?: ChipSize;
  onClick?: () => void;
  onDelete?: () => void;
  deleteIcon?: React.ReactNode;
  disabled?: boolean;
  cursor?: React.CSSProperties["cursor"];
  className?: string;
};

const u = (v: string | number): string => (typeof v === "number" ? `${v}px` : v);

const hasText = (node: React.ReactNode): boolean => {
  let found = false;
  React.Children.forEach(node as unknown, (ch: unknown) => {
    if (found) return;
    if (typeof ch === "string" || typeof ch === "number") {
      if (String(ch).trim() !== "") found = true;
    } else if (Array.isArray(ch)) {
      if (hasText(ch)) found = true;
    }
  });
  return found;
};

type SizeT = {
  fontSize: string | number;
  paddingX: string | number;
  paddingY: string | number;
  gap: string | number;
  iconSize: string | number;
  radius: string | number;
  soloPadding: string | number;
  iconOffset: string;
  iconOffsetRounded: string;
};

const getSize = (theme: ReturnType<typeof usePlainframeUITheme>, size: ChipSize): SizeT => {
  if (size === "sm") {
    return {
      fontSize: theme.typography.sizes.xs,
      paddingX: `calc(${theme.spacing.sm} * 0.7)`,
      paddingY: theme.spacing.xs,
      gap: theme.spacing.xxs,
      iconSize: theme.typography.sizes.xs,
      radius: `calc(${theme.radius.sm} * 0.8)`,
      soloPadding: theme.spacing.xs,
      iconOffset: "0px",
      iconOffsetRounded: "-2px",
    };
  }
  if (size === "lg") {
    return {
      fontSize: theme.typography.sizes.md,
      paddingX: theme.spacing.sm,
      paddingY: `calc(${theme.spacing.sm} * 0.6)`,
      gap: theme.spacing.xs,
      iconSize: theme.typography.sizes.md,
      radius: theme.radius.md,
      soloPadding: theme.spacing.sm,
      iconOffset: "0px",
      iconOffsetRounded: "-3px",
    };
  }
  return {
    fontSize: theme.typography.sizes.sm,
    paddingX: `calc(${theme.spacing.sm} * 0.9)`,
    paddingY: theme.spacing.xs,
    gap: theme.spacing.xxs,
    iconSize: theme.typography.sizes.sm,
    radius: theme.radius.sm,
    soloPadding: theme.spacing.xs,
    iconOffset: "-1px",
    iconOffsetRounded: "-3px",
  };
};

export const Chip: React.ForwardRefExoticComponent<
  ChipProps & React.RefAttributes<HTMLDivElement>
> = React.memo(forwardRef<HTMLDivElement, ChipProps>(function Chip(
  {
    children,
    labelCss: userLabelCss,
    variant = "soft",
    color = "primary",
    rounded = false,
    startIcon,
    endIcon,
    size = "md",
    onClick,
    onDelete,
    deleteIcon,
    disabled,
    cursor,
    className,
    css: userCss,
  },
  ref
): React.ReactElement {
  const theme = usePlainframeUITheme();
  const focusRing = useFocusRing();

  const sizeKey: ChipSize = (["sm", "md", "lg"].includes(size) ? size : "md") as ChipSize;
  const S: SizeT = useMemo<SizeT>(() => getSize(theme, sizeKey), [theme, sizeKey]);

  const isClickable = !!onClick && !disabled;
  const baseCursor: React.CSSProperties["cursor"] = disabled
    ? "not-allowed"
    : cursor || (isClickable ? "pointer" : "inherit");
  const strokeW = String(theme.componentHeights?.border ?? "1px");

  const paletteKey: string = useMemo<string>(() => {
    const palette = theme.palette as Record<string, Record<string, string>>;
    const isSecondary = color === "secondary" || color === "neutral";
    if (isSecondary) return "neutral";
    return color && palette[color] ? color : "primary";
  }, [color, theme.palette]);

  const sw = useCallback(
    (shade: 50 | 100 | 300 | 600 | 700 | 800): string => {
      const palette = theme.palette as Record<string, Record<string, string>>;
      return (
        (paletteKey === "neutral" ? theme.neutral[shade] : palette[paletteKey]?.[shade]) ??
        (palette.primary?.[shade] as string)
      );
    },
    [paletteKey, theme.neutral, theme.palette]
  );

  const softBg: string = useMemo(
    () => (paletteKey === "neutral" ? theme.neutral[100] : sw(50)),
    [paletteKey, sw, theme.neutral]
  );
  const softFg: string = useMemo(
    () => (paletteKey === "neutral" ? theme.text.secondary : sw(800)),
    [paletteKey, sw, theme.text.secondary]
  );

  const outlinedBg: string = useMemo(
    () => (paletteKey === "neutral" ? theme.neutral[100] : sw(50)),
    [paletteKey, sw, theme.neutral]
  );
  const outlinedFg: string = useMemo(
    () => (paletteKey === "neutral" ? theme.text.secondary : sw(800)),
    [paletteKey, sw, theme.text.secondary]
  );
  const outlinedBr: string = useMemo(
    () => (paletteKey === "neutral" ? theme.neutral[400] : sw(300)),
    [paletteKey, sw, theme.neutral]
  );

  const filledBg: string = useMemo(
    () => (paletteKey === "neutral" ? theme.surface.subtleBg : sw(600)),
    [paletteKey, sw, theme.surface.subtleBg]
  );
  const filledFg: string = useMemo(() => {
    const onMap = theme.text.onColors ?? ({} as Record<string, string>);
    return onMap[paletteKey] ?? (paletteKey === "neutral" ? theme.neutral[900] : theme.neutral[0] ?? "#fff");
  }, [paletteKey, theme.text.onColors, theme.neutral]);

  const ghostBg: string = "transparent";
  const ghostFg: string = useMemo(
    () => (paletteKey === "neutral" ? theme.text.secondary : sw(700) ?? theme.text.primary),
    [paletteKey, sw, theme.text.primary, theme.text.secondary]
  );

  const isIconOnly: boolean = useMemo(
    () =>
      !startIcon && !endIcon && children != null && !hasText(children) && React.Children.count(children) === 1,
    [startIcon, endIcon, children]
  );

  const variantCss: Interpolation<Theme> = useMemo(() => {
    if (variant === "filled")
      return css({ backgroundColor: filledBg, color: filledFg, border: "none", boxShadow: "none" });
    if (variant === "outlined")
      return css({
        backgroundColor: outlinedBg,
        color: outlinedFg,
        border: "none",
        boxShadow: `inset 0 0 0 ${strokeW} ${outlinedBr}`,
      });
    if (variant === "ghost")
      return css({ backgroundColor: ghostBg, color: ghostFg, border: "none", boxShadow: "none" });
    return css({ backgroundColor: softBg, color: softFg, border: "none", boxShadow: "none" });
  }, [filledBg, filledFg, ghostFg, outlinedBg, outlinedFg, outlinedBr, softBg, softFg, strokeW, variant]);

  const rootCss: Interpolation<Theme> = useMemo(
    () =>
      css({
        display: "inline-flex",
        alignItems: "center",
        gap: u(S.gap),
        padding:
          variant === "ghost"
            ? 0
            : isIconOnly || children == null
            ? u(S.soloPadding)
            : `${u(S.paddingY)} ${u(S.paddingX)}`,
        borderRadius: rounded ? (theme.radius.full as string | number) : S.radius,
        fontWeight: 600,
        cursor: baseCursor,
        opacity: disabled ? 0.55 : 1,
        transition: "outline .16s ease, outline-offset .16s ease",
        overflow: variant === "ghost" ? "visible" : "hidden",
        ...(isIconOnly
          ? {
              lineHeight: 1,
              minWidth: `calc(${u(S.iconSize)} + ${u(S.soloPadding)} * 2)`,
              minHeight: `calc(${u(S.iconSize)} + ${u(S.soloPadding)} * 2)`,
              justifyContent: "center",
            }
          : null),
      }),
    [S, baseCursor, children, disabled, isIconOnly, rounded, theme.radius.full, variant]
  );

  const baseLabelCss: Interpolation<Theme> = useMemo(
    () =>
      css({
        fontSize: isIconOnly ? u(S.iconSize) : u(S.fontSize),
        lineHeight: 1.2,
        minWidth: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        "& > svg": {
          width: isIconOnly ? u(S.iconSize) : undefined,
          height: isIconOnly ? u(S.iconSize) : undefined,
          display: isIconOnly ? "block" : undefined,
        },
      }),
    [S.fontSize, S.iconSize, isIconOnly]
  );

  const iconCss: Interpolation<Theme> = useMemo(
    () =>
      css({
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: u(S.iconSize),
        lineHeight: 0,
        "& > svg": { width: u(S.iconSize), height: u(S.iconSize), display: "block" },
      }),
    [S.iconSize]
  );

  const leftIconMargins: Interpolation<Theme> = useMemo(
    () =>
      css({
        marginRight: isIconOnly || children == null ? 0 : u(S.gap),
        marginLeft: isIconOnly || children == null ? 0 : u(S.iconOffset),
      }),
    [S.gap, S.iconOffset, children, isIconOnly]
  );

  const rightIconMargins: Interpolation<Theme> = useMemo(
    () =>
      css({
        marginLeft: isIconOnly || children == null ? 0 : u(S.gap),
        marginRight:
          isIconOnly || children == null
            ? 0
            : rounded
            ? u(S.iconOffsetRounded)
            : u(S.iconOffset),
      }),
    [S.gap, S.iconOffset, S.iconOffsetRounded, children, isIconOnly, rounded]
  );

  const deleteBtnCss: Interpolation<Theme> = useMemo(
    () =>
      css({
        marginRight: rounded ? 0 : u(S.iconOffset),
        padding: 0,
        border: "none",
        outline: "none",
        background: "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        color: "currentColor",
        opacity: disabled ? 0.4 : 0.85,
        transition:
          "background-color .16s ease, color .16s ease, opacity .16s ease, outline .16s ease, outline-offset .16s ease",
        fontSize: u(S.iconSize),
        borderRadius: theme.radius.xs,
      }),
    [S.iconOffset, S.iconSize, disabled, rounded, theme.radius.xs]
  );

  const onKeyDown = useCallback((e: React.KeyboardEvent): void => {
    if (!isClickable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  }, [isClickable, onClick]);

  const defaultDeleteIcon: React.ReactNode = useMemo(
    () => <X css={{ width: S.iconSize, height: S.iconSize }} strokeWidth={2.5} />,
    [S.iconSize]
  );

  return (
    <div
      ref={ref}
      className={["plainframe-ui-chip", isClickable ? "plainframe-ui-chip-clickable" : "", className || ""]
        .join(" ")
        .trim()}
      css={[
        rootCss,
        variantCss,
        isClickable ? focusRing({ color: color ?? "primary" }) : null,
        userCss,
      ]}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={onKeyDown}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-disabled={disabled || undefined}
      data-variant={variant}
      data-color={paletteKey}
      data-size={size}
      data-icon-only={isIconOnly || undefined}
    >
      {startIcon && (
        <span css={[iconCss, leftIconMargins]} className="plainframe-ui-chip-icon-left">
          {startIcon}
        </span>
      )}

      {children != null && (
        <span css={[baseLabelCss, userLabelCss]} className="plainframe-ui-chip-label">
          {children}
        </span>
      )}

      {endIcon && (
        <span css={[iconCss, rightIconMargins]} className="plainframe-ui-chip-icon-right">
          {endIcon}
        </span>
      )}

      {onDelete && (
        <button
          type="button"
          aria-label="Delete"
          disabled={disabled}
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) onDelete?.();
          }}
          css={[deleteBtnCss, focusRing({ color: color ?? "primary" })]}
          className="plainframe-ui-chip-delete"
        >
        {deleteIcon || defaultDeleteIcon}
        </button>
      )}
    </div>
  );
}));

Chip.displayName = "Chip";
