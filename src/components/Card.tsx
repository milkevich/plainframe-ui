/** @jsxImportSource @emotion/react */
import React from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { useFocusRing } from "../utils/focusRing";
import { Container, type ContainerProps } from "./Container";

type WithCssProp = { css?: Interpolation<Theme> };
type CardDirection = "horizontal" | "vertical";
type Align = "start" | "center" | "end";

type SectionPadding = {
  padding?: ContainerProps["padding"];
  paddingX?: ContainerProps["padding"];
  paddingY?: ContainerProps["padding"];
};

export type CardProps = WithCssProp &
  Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "className"> & {
    variant?: ContainerProps["variant"];
    padding?: ContainerProps["padding"];
    radius?: ContainerProps["radius"];

    hoverable?: ContainerProps["hoverable"];
    selectable?: ContainerProps["selectable"];
    selected?: ContainerProps["selected"];
    defaultSelected?: ContainerProps["defaultSelected"];
    onSelectedChange?: (selected: boolean) => void;

    width?: ContainerProps["width"];
    height?: ContainerProps["height"];
    gap?: string | number | ContainerProps["padding"];

    direction?: CardDirection;

    className?: string;
  };

type CardSectionBaseProps = WithCssProp &
  SectionPadding &
  Omit<React.HTMLAttributes<HTMLDivElement>, "className"> & {
    className?: string;
    align?: Align;
  };

type CardSideProps = CardSectionBaseProps;

const toLen = (v: number | string | undefined) =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : v;

function resolveTokenPadding(
  padding: ContainerProps["padding"],
  theme: Record<string, unknown>
): string | undefined {
  if (padding == null) return undefined;

  if (typeof padding === "number") return `${padding}px`;

  if (typeof padding === "string") {
    const spacingScale =
      (theme.spacing as Record<string, string | number> | undefined) ??
      (theme.space as Record<string, string | number> | undefined);
    if (spacingScale && padding in spacingScale) {
      const v = spacingScale[padding];
      return toLen(v);
    }
    return padding;
  }

  return undefined;
}

function flexAlign(
  align: Align | undefined
): "flex-start" | "center" | "flex-end" {
  switch (align) {
    case "center":
      return "center";
    case "end":
      return "flex-end";
    case "start":
    default:
      return "flex-start";
  }
}

function textAlign(align: Align | undefined): "left" | "center" | "right" {
  switch (align) {
    case "center":
      return "center";
    case "end":
      return "right";
    case "start":
    default:
      return "left";
  }
}

function resolveGap(
  gap: CardProps["gap"],
  theme: Record<string, unknown>
): string | number | undefined {
  if (gap === null || gap === undefined) {
    const spacing = theme.spacing as Record<string, string | number> | undefined;
    return spacing?.md ?? undefined;
  }

  if (typeof gap === "number") return gap;

  if (typeof gap === "string") {
    const spacingScale =
      (theme.spacing as Record<string, string | number> | undefined) ??
      (theme.space as Record<string, string | number> | undefined) ??
      {};
    if (gap in spacingScale) {
      return spacingScale[gap];
    }
    return gap;
  }

  return undefined;
}

function sectionPaddingStyles(
  theme: Record<string, unknown>,
  padding?: ContainerProps["padding"],
  paddingX?: ContainerProps["padding"],
  paddingY?: ContainerProps["padding"]
) {
  const p = resolveTokenPadding(padding, theme);
  const px = resolveTokenPadding(paddingX, theme);
  const py = resolveTokenPadding(paddingY, theme);

  const styles: React.CSSProperties = {};

  if (p && !px && !py) {
    styles.padding = p;
  }
  if (px) {
    styles.paddingLeft = px;
    styles.paddingRight = px;
  }
  if (py) {
    styles.paddingTop = py;
    styles.paddingBottom = py;
  }

  return styles;
}

function resolveColor(theme: Record<string, unknown>, color?: string | "primary" | "secondary") {
  if (!color) return undefined;
  if (color === "primary") return (theme as { text?: { primary?: string } }).text?.primary;
  if (color === "secondary") return (theme as { text?: { secondary?: string } }).text?.secondary;
  return color;
}

const CardDirectionCtx = React.createContext<CardDirection>("horizontal");
const useCardDirection = () => React.useContext(CardDirectionCtx);

export const Card: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<CardProps> & React.RefAttributes<HTMLDivElement>
> = React.memo(React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      css: cssProp,
      variant = "ghost",
      padding = "md",
      radius = "lg",
      hoverable,
      selectable,
      selected,
      defaultSelected,
      onSelectedChange,
      width = "100%",
      height,
      gap,
      direction = "horizontal",
      className,
      onClick,
      ...rest
    },
    ref
  ) => {
    const theme = usePlainframeUITheme();
    const focusRing = useFocusRing();
    const isVertical = direction === "vertical";

    const cardBase = css({
      position: "relative",
      display: "flex",
      flexDirection: isVertical ? "column" : "row",
      gap: resolveGap(gap, theme),
      alignItems: isVertical ? "stretch" : "center",
      transition: "all .16s ease",
    });

    return (
      <CardDirectionCtx.Provider value={direction}>
        <Container
          ref={ref}
          variant={variant}
          padding={padding}
          radius={radius}
          hoverable={hoverable}
          selectable={selectable}
          selected={selected}
          defaultSelected={defaultSelected}
          onSelectedChange={onSelectedChange}
          width={width}
          height={height}
          className={["plainframe-ui-card", className || ""]
            .join(" ")
            .trim()}
          css={[focusRing(), cardBase, cssProp]}
          onClick={onClick}
          tabIndex={onClick ? 0 : undefined}
          {...rest}
        >
          {children}
        </Container>
      </CardDirectionCtx.Provider>
    );
  }
));

Card.displayName = "Card";

export const CardContent: React.FC<CardSectionBaseProps> = React.memo(({
  children,
  css: cssProp,
  className,
  align = "start",
  padding,
  paddingX,
  paddingY,
  ...rest
}) => {
  const theme = usePlainframeUITheme();
  const direction = useCardDirection();
  const isVertical = direction === "vertical";

  const base = css({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: flexAlign(align),
    textAlign: textAlign(align),
    ...(isVertical ? { width: "100%" } : { flex: 1, minWidth: 0 }),
    ...sectionPaddingStyles(theme, padding, paddingX, paddingY),
  });

  return (
    <div
      data-slot="card-content"
      className={["plainframe-ui-card-content", className || ""]
        .join(" ")
        .trim()}
      css={[base, cssProp]}
      {...rest}
    >
      {children}
    </div>
  );
});

export const CardStart: React.FC<CardSideProps> = React.memo(({
  children,
  css: cssProp,
  className,
  align = "start",
  padding,
  paddingX,
  paddingY,
  ...rest
}) => {
  const theme = usePlainframeUITheme();
  const direction = useCardDirection();
  const isVertical = direction === "vertical";

  const base = css({
    display: "flex",
    flexShrink: 0,
    justifyContent: flexAlign(align),
    alignItems: flexAlign(align),
    ...(isVertical ? { width: "100%" } : {}),
    ...sectionPaddingStyles(theme, padding, paddingX, paddingY),
  });

  return (
    <div
      data-slot="card-start"
      className={["plainframe-ui-card-start", className || ""]
        .join(" ")
        .trim()}
      css={[base, cssProp]}
      {...rest}
    >
      {children}
    </div>
  );
});

export const CardEnd: React.FC<CardSideProps> = React.memo(({
  children,
  css: cssProp,
  className,
  align = "start",
  padding,
  paddingX,
  paddingY,
  ...rest
}) => {
  const theme = usePlainframeUITheme();
  const direction = useCardDirection();
  const isVertical = direction === "vertical";

  const base = css({
    display: "flex",
    flexShrink: 0,
    justifyContent: flexAlign(align),
    alignItems: flexAlign(align),
    ...(isVertical ? { width: "100%" } : {}),
    gap: theme.spacing.xs,
    color: theme.text.secondary,
    ...sectionPaddingStyles(theme, padding, paddingX, paddingY),
  });

  return (
    <div
      data-slot="card-end"
      className={["plainframe-ui-card-end", className || ""]
        .join(" ")
        .trim()}
      css={[base, cssProp]}
      {...rest}
    >
      {children}
    </div>
  );
});

type TextTune = {
  weight?: number | string;
  size?: number | string;
  color?: string | "primary" | "secondary";
};

export const CardTitle: React.FC<CardSectionBaseProps & TextTune> = React.memo(({
  children,
  css: cssProp,
  className,
  align = "start",
  padding,
  paddingX,
  paddingY,
  weight,
  size,
  color,
  ...rest
}) => {
  const theme = usePlainframeUITheme();

  const base = css({
    fontWeight: weight ?? 500,
    fontSize:
      size ??
      (theme.typography?.sizes?.sm !== undefined ? theme.typography.sizes.sm : "1rem"),
    color: resolveColor(theme, color) ?? theme.text?.primary,
    textAlign: textAlign(align),
    ...sectionPaddingStyles(theme, padding, paddingX, paddingY),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing?.xs ?? 6,
  });

  return (
    <div
      data-slot="card-title"
      className={["plainframe-ui-card-title", className || ""]
        .join(" ")
        .trim()}
      css={[base, cssProp]}
      {...rest}
    >
      {children}
    </div>
  );
});

export const CardDescription: React.FC<CardSectionBaseProps & TextTune> = React.memo(({
  children,
  css: cssProp,
  className,
  align = "start",
  padding,
  paddingX,
  paddingY,
  weight,
  size,
  color,
  ...rest
}) => {
  const theme = usePlainframeUITheme();

  const base = css({
    fontWeight: weight ?? 400,
    fontSize:
      size ??
      (theme.typography?.sizes?.sm !== undefined ? theme.typography.sizes.sm : "0.875rem"),
    color: resolveColor(theme, color) ?? theme.text?.secondary,
    marginTop: theme.spacing?.xxs ?? 2,
    textAlign: textAlign(align),
    ...sectionPaddingStyles(theme, padding, paddingX, paddingY),
  });

  return (
    <div
      data-slot="card-description"
      className={["plainframe-ui-card-description", className || ""]
        .join(" ")
        .trim()}
      css={[base, cssProp]}
      {...rest}
    >
      {children}
    </div>
  );
});
