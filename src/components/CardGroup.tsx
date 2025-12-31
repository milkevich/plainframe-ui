/** @jsxImportSource @emotion/react */
import React, { Children, cloneElement, isValidElement } from "react";
import type { Interpolation, Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import type { CardProps } from "./Card";

type Variant = "subtle" | "outlined" | "ghost";

export type CardGroupProps = {
  children: React.ReactNode;
  attached?: boolean;
  gap?: string | number;
  width?: string | number;
  direction?: "vertical" | "horizontal";
  variant?: Variant;
  className?: string;
  role?: React.AriaRole;
  css?: Interpolation<Theme>;
};

const isEl = (n: unknown): n is React.ReactElement => isValidElement(n);
const nameOf = (n: unknown) =>
  isEl(n)
    ? ((n.type as { displayName?: string; name?: string })?.displayName ||
       (n.type as { displayName?: string; name?: string })?.name)
    : undefined;
const isCard = (n: unknown) => nameOf(n) === "Card";

const toLen = (v: string | number) => (typeof v === "number" ? `${v}px` : v);

export const CardGroup: React.FC<CardGroupProps> = ({
  children,
  attached = false,
  gap,
  width,
  direction = "vertical",
  variant,
  className,
  role = "group",
  css: userCss,
}) => {
  const theme = usePlainframeUITheme();
  const isVertical = direction === "vertical";
  const bw = String(theme.componentHeights?.border ?? "1px");
  const betweenColor = theme.surface.border;

  const rootCss: Interpolation<Theme> = {
    display: "flex",
    flexDirection: isVertical ? "column" : "row",
    width: typeof width === "string" || typeof width === "number" ? toLen(width) : "auto",
    maxWidth: "none",
    gap: attached ? 0 : gap ?? theme.spacing?.sm,
  };

  const nodes = Children.toArray(children);
  const cardNodes = nodes.filter(isCard) as React.ReactElement<CardProps>[];
  const totalCards = cardNodes.length;

  let logical = 0;
  const out = nodes.map((node, i) => {
    if (!isCard(node) || !isEl(node)) return node;

    const props = node.props as CardProps & { variant?: Variant; radius?: string | number };
    const idx = logical++;
    const isFirst = idx === 0;
    const isLast = idx === totalCards - 1;

    const forcedVariant = (variant ?? props.variant) as Variant | undefined;

    const radiusCss: Interpolation<Theme> | undefined = attached
      ? isVertical
        ? {
            borderTopLeftRadius: isFirst ? (props.radius) : 0,
            borderTopRightRadius: isFirst ? (props.radius) : 0,
            borderBottomLeftRadius: isLast ? (props.radius) : 0,
            borderBottomRightRadius: isLast ? (props.radius) : 0,
          }
        : {
            borderTopLeftRadius: isFirst ? (props.radius) : 0,
            borderBottomLeftRadius: isFirst ? (props.radius) : 0,
            borderTopRightRadius: isLast ? (props.radius) : 0,
            borderBottomRightRadius: isLast ? (props.radius) : 0,
          }
      : undefined;

    const collapseCss: Interpolation<Theme> | undefined =
      attached && !isFirst
        ? isVertical
          ? { borderTopWidth: 0 }
          : { borderLeftWidth: 0 }
        : undefined;

    const betweenCss: Interpolation<Theme> | null =
      forcedVariant === "subtle" && totalCards > 1 && !isFirst
        ? isVertical
          ? { borderTop: `${bw} solid ${betweenColor}` }
          : { borderLeft: `${bw} solid ${betweenColor}` }
        : null;

    const sizingCss: Interpolation<Theme> =
      attached
        ? { width: "100%" }
        : {
            width: "100%",
            marginBottom: isVertical ? 0 : undefined,
            marginRight: !isVertical ? 0 : undefined,
          };

    const visualCss: Interpolation<Theme>[] = [radiusCss, collapseCss, betweenCss, sizingCss].filter(
      Boolean
    ) as Interpolation<Theme>[];

    const mergedClass = [props.className, "plainframe-ui-card-group-item"]
      .filter(Boolean)
      .join(" ");

    return cloneElement(node as React.ReactElement<CardProps>, {
      ...props,
      variant: forcedVariant ?? props.variant,
      css: [props.css, ...visualCss],
      className: mergedClass,
      key: typeof node === "object" && "key" in node ? node.key : i,
    });
  });

  return (
    <div
      role={role}
      aria-orientation={isVertical ? "vertical" : "horizontal"}
      data-attached={attached || undefined}
      data-direction={direction}
      className={["plainframe-ui-card-group", className || ""].join(" ").trim()}
      css={[rootCss, userCss]}
    >
      {out}
    </div>
  );
};

CardGroup.displayName = "CardGroup";
