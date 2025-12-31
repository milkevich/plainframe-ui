/** @jsxImportSource @emotion/react */
import React, { useMemo, useState, useCallback, forwardRef } from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { useFocusRing } from "../utils/focusRing";

type SpaceToken = "xs" | "sm" | "md" | "lg" | "xl";
type RadiusToken = "xs" | "sm" | "md" | "lg" | "xl" | "full";
type ContainerVariant = "panel" | "subtle" | "outlined" | "ghost";

export type ContainerProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "style" | "color"
> & {
  children?: React.ReactNode;
  css?: Interpolation<Theme>;
  variant?: ContainerVariant;
  padding?: number | string | SpaceToken;
  radius?: number | string | RadiusToken;
  hoverable?: boolean;
  selectable?: boolean;
  selected?: boolean;
  defaultSelected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  width?: number | string;
  height?: number | string;
  className?: string;
};

const toLen = (v: number | string | undefined): string | undefined =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : v;

const resolvePadding = (
  padding: ContainerProps["padding"],
  theme: { spacing?: Record<string, string | number>; space?: Record<string, string | number> }
): string | undefined => {
  if (padding == null) return undefined;
  if (typeof padding === "number") return `${padding}px`;
  if (typeof padding === "string") {
    const scale = theme.spacing ?? theme.space;
    return toLen(scale?.[padding] ?? padding);
  }
  return undefined;
};

const resolveRadius = (
  radius: ContainerProps["radius"],
  theme: { radius?: Record<string, string | number>; radii?: Record<string, string | number> }
): string | undefined => {
  if (radius == null) return undefined;
  if (typeof radius === "number") return `${radius}px`;
  if (typeof radius === "string") {
    const scale = theme.radius ?? theme.radii;
    return toLen(scale?.[radius] ?? radius);
  }
  return undefined;
};

const baseBgFor = (
  variant: ContainerVariant,
  theme: { surface?: { panelBg?: string; subtleBg?: string } }
): string => {
  const s = theme.surface ?? {};
  if (variant === "panel" || variant === "outlined") return s.panelBg ?? "transparent";
  if (variant === "subtle") return s.subtleBg ?? "transparent";
  return "transparent";
};

const hoverBgFor = (
  variant: ContainerVariant,
  theme: { surface?: { panelHover?: string; panelBg?: string; subtleHover?: string; subtleBg?: string } },
  baseBg: string
): string => {
  const s = theme.surface ?? {};
  if (variant === "panel" || variant === "outlined") return s.panelHover ?? s.panelBg ?? baseBg;
  if (variant === "subtle") return s.subtleHover ?? s.subtleBg ?? baseBg;
  return s.subtleBg ?? baseBg;
};

export const Container: React.ForwardRefExoticComponent<
  ContainerProps & React.RefAttributes<HTMLDivElement>
> = React.memo(forwardRef<HTMLDivElement, ContainerProps>(function Container(
  {
    children,
    css: userCss,
    variant = "ghost",
    padding,
    radius,
    className,
    hoverable,
    selectable,
    selected: controlledSelected,
    defaultSelected,
    onSelectedChange,
    width,
    height,
    onClick,
    onKeyDown,
    role,
    tabIndex,
    ...rest
  },
  ref
): React.ReactElement | null {
  const theme = usePlainframeUITheme();
  const surface = (theme.surface ?? {}) as { border?: string; panelHover?: string; panelBg?: string; subtleHover?: string; subtleBg?: string };

  const [internalSelected, setInternalSelected] = useState<boolean>(!!defaultSelected);
  const isControlled = controlledSelected != null;
  const selected = isControlled ? !!controlledSelected : internalSelected;

  const baseBg = useMemo<string>(() => baseBgFor(variant, theme), [variant, theme]);
  const hoverBg = useMemo<string>(() => hoverBgFor(variant, theme, baseBg), [variant, theme, baseBg]);
  const selectedBg: string = hoverBg;

  const pad = useMemo<string | undefined>(() => resolvePadding(padding, theme), [padding, theme]);
  const rad = useMemo<string | undefined>(() => resolveRadius(radius, theme), [radius, theme]);

  const interactive = !!hoverable || !!selectable;

  const rootCss = useMemo<Interpolation<Theme>>(
    () =>
      css({
        backgroundColor: baseBg,
        padding: pad,
        borderRadius: rad,
        border:
          variant === "outlined"
            ? `${theme.componentHeights?.border ?? "1px"} solid ${surface.border ?? "transparent"}`
            : undefined,
        backgroundClip: "padding-box",
        boxSizing: "border-box",
        width: width ? "100%" : undefined,
        maxWidth: toLen(width),
        height: toLen(height),
        outline: "none",
        transition: "background-color .16s ease, border-color .16s ease",
        cursor: interactive ? "pointer" : undefined,
        ...(interactive ? { "&:hover": { backgroundColor: hoverBg } } : {}),
        '&[data-selected="true"]': { backgroundColor: selectedBg },
        ...(interactive
          ? { '&[data-selected="true"]:hover': { backgroundColor: selectedBg } }
          : {}),
      }),
    [baseBg, pad, rad, variant, theme.componentHeights, surface.border, width, height, interactive, hoverBg, selectedBg]
  );

  const toggleSelected = useCallback((): void => {
    if (!selectable) return;
    const next = !selected;
    if (!isControlled) setInternalSelected(next);
    onSelectedChange?.(next);
  }, [isControlled, onSelectedChange, selectable, selected]);

  const handleClick = useCallback<React.MouseEventHandler<HTMLDivElement>>(
    (e) => {
      if (selectable) toggleSelected();
      onClick?.(e);
    },
    [selectable, toggleSelected, onClick]
  );

  const handleKeyDownInt = useCallback<React.KeyboardEventHandler<HTMLDivElement>>(
    (e) => {
      if (selectable && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        toggleSelected();
      }
      onKeyDown?.(e);
    },
    [selectable, toggleSelected, onKeyDown]
  );

  const focusRing = useFocusRing();

  return (
    <div
      ref={ref}
      data-variant={variant}
      data-selected={selectable && selected ? "true" : undefined}
      aria-pressed={selectable ? selected : undefined}
      className={["plainframe-ui-container", className || ""].join(" ").trim()}
      css={[focusRing(), rootCss, userCss]}
      onClick={handleClick}
      onKeyDown={handleKeyDownInt}
      role={selectable ? role ?? "button" : role}
      tabIndex={selectable ? tabIndex ?? 0 : tabIndex}
      {...rest}
    >
      {children}
    </div>
  );
}));

Container.displayName = "Container";
