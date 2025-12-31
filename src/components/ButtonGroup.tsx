/** @jsxImportSource @emotion/react */
import React, {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ComponentPropsWithoutRef,
} from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";

type Direction = "horizontal" | "vertical";
type Size = "sm" | "md" | "lg";
type VariantStr = string;

type WithCssProp = { css?: Interpolation<Theme> };

export type ButtonGroupProps = WithCssProp &
  Omit<React.HTMLAttributes<HTMLDivElement>, "style"> & {
    children: React.ReactNode;
    attached?: boolean;
    direction?: Direction;
    fullWidth?: boolean;
    disabled?: boolean;
    size?: Size;
    rounded?: boolean;
    gap?: string | number;
    width?: string | number;
    className?: string;
    role?: React.AriaRole;
  };

type PrivateEdgeFlags = { __clipLeft?: boolean; __clipRight?: boolean };

type ButtonishProps = {
  disabled?: boolean;
  size?: Size;
  variant?: VariantStr;
  className?: string;
  css?: Interpolation<Theme>;
};
type DropdownMenuProps = { children?: React.ReactNode };
type DropdownMenuTriggerProps = ButtonishProps & { children?: React.ReactNode };

const isEl = (n: unknown): n is ReactElement => isValidElement(n);

const displayNameOf = (n: ReactElement) => {
  const t = n.type as { displayName?: string; name?: string };
  return t.displayName ?? t.name;
};

const isOfType = <P,>(el: ReactElement, name: string): el is ReactElement<P> =>
  displayNameOf(el) === name;

const isGroup = (n: ReactElement): n is ReactElement<ButtonGroupProps & PrivateEdgeFlags> =>
  isOfType(n, "ButtonGroup");

const isMenu = (n: ReactElement): n is ReactElement<DropdownMenuProps> =>
  isOfType(n, "DropdownMenu");

const isTrigger = (n: ReactElement): n is ReactElement<DropdownMenuTriggerProps> =>
  isOfType(n, "DropdownMenuTrigger");

const toLen = (v: string | number | undefined) =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : v;

const toPx = (v: number | string | undefined, fallback = 1) => {
  if (v == null) return `${fallback}px`;
  if (typeof v === "number") return `${v}px`;
  return /^\d+(\.\d+)?$/.test(v) ? `${v}px` : v;
};

const isOutlinedVariant = (v: unknown): boolean =>
  typeof v === "string" && /^(outlined|outlined-soft|outline-soft)$/i.test(v);

const visualLeaf = (node: ReactElement, first: boolean): ReactElement | null => {
  if (!isEl(node)) return null;
  if (isGroup(node)) {
    const kids = Children.toArray(node.props.children).filter(isValidElement) as ReactElement[];
    if (!kids.length) return null;
    return visualLeaf(first ? kids[0] : kids[kids.length - 1], first);
  }
  if (isMenu(node)) {
    const kids = Children.toArray(node.props.children).filter(isValidElement) as ReactElement[];
    const trig = kids.find(isTrigger);
    return trig ? visualLeaf(trig, first) : null;
  }
  if (isTrigger(node)) {
    const kids = Children.toArray(node.props.children ?? []).filter(isValidElement) as ReactElement[];
    return kids.length ? kids[0] : null;
  }
  return node;
};

const outlinedOnEdge = (el: ReactElement | null, side: "left" | "right") => {
  if (!el) return false;
  const leaf = visualLeaf(el, side === "left");
  const v: VariantStr | undefined =
    leaf && leaf.props && typeof leaf.props === "object" ? (leaf.props as ButtonishProps).variant : undefined;
  return isOutlinedVariant(v);
};

export const ButtonGroup = React.memo(
  React.forwardRef<HTMLDivElement, ButtonGroupProps & PrivateEdgeFlags>(function ButtonGroup(
    {
      children,
      attached = false,
      direction = "horizontal",
      fullWidth = false,
      disabled = false,
      size = "md",
      rounded = false,
      gap,
      width,
      className,
      role = "group",
      css: userCss,
      __clipLeft,
      __clipRight,
      ...rest
    },
    ref
  ) {
    const theme = usePlainframeUITheme();
    const tokenRadius = size === "sm" ? theme.radius.sm : theme.radius.md;
    const baseRadius = rounded ? theme.radius.full : tokenRadius;
    const isVertical = direction === "vertical";
    const bw = toPx(theme.componentHeights.border, 1);
    const borderCol = theme.surface.border;
    const clipLeft = attached && !!__clipLeft;
    const clipRight = attached && !!__clipRight;

    const rootCss = css({
      display: "flex",
      flexDirection: isVertical ? "column" : "row",
      width: fullWidth ? "100%" : width != null ? toLen(width) : "auto",
      maxWidth: "none",
      backgroundColor: "transparent",
      gap: attached ? 0 : toLen(gap ?? theme.spacing.sm),
    });

    const nodes = Children.toArray(children);
    const realNodes = nodes.filter(isEl) as ReactElement[];
    const realCount = realNodes.length;

    let realIndex = 0;
    let prevRightOutlined = false;
    const out: React.ReactNode[] = [];

    for (const node of nodes) {
      if (!isEl(node)) {
        out.push(node);
        continue;
      }

      const isFirst = realIndex === 0;
      const isLast = realIndex === realCount - 1;

      const nodeProps = (node.props ?? {}) as Record<string, unknown>;
      const mergedDisabled = (nodeProps.disabled as boolean | undefined) ?? disabled;
      const mergedSize = (nodeProps.size as Size | undefined) ?? size;

      let tl: string | number = 0, tr: string | number = 0, br: string | number = 0, bl: string | number = 0;
      if (attached) {
        if (isVertical) {
          tl = isFirst ? (clipLeft ? 0 : baseRadius) : 0;
          tr = isFirst ? (clipRight ? 0 : baseRadius) : 0;
          bl = isLast ? (clipLeft ? 0 : baseRadius) : 0;
          br = isLast ? (clipRight ? 0 : baseRadius) : 0;
        } else {
          tl = isFirst ? (clipLeft ? 0 : baseRadius) : 0;
          bl = isFirst ? (clipLeft ? 0 : baseRadius) : 0;
          tr = isLast ? (clipRight ? 0 : baseRadius) : 0;
          br = isLast ? (clipRight ? 0 : baseRadius) : 0;
        }
      }

      const currLeftOutlined = outlinedOnEdge(node, "left");
      const currRightOutlined = outlinedOnEdge(node, "right");

      const borderDir = isVertical ? "borderTop" : "borderLeft";
      const shouldSeparate = attached && !isFirst && !(prevRightOutlined && currLeftOutlined);

      const separatorCss = shouldSeparate && !(prevRightOutlined || currLeftOutlined)
        ? css({ [borderDir]: `${bw} solid ${borderCol}` })
        : null;

      const killJoinCss =
        attached && !isFirst && prevRightOutlined && currLeftOutlined
          ? css(isVertical ? { borderTopWidth: 0 } : { borderLeftWidth: 0 })
          : null;

      const cornerCss = attached
        ? css({
            borderTopLeftRadius: toLen(tl),
            borderTopRightRadius: toLen(tr),
            borderBottomRightRadius: toLen(br),
            borderBottomLeftRadius: toLen(bl),
          })
        : null;

      const flexCss = fullWidth
        ? css({
            flex: "1 1 0%",
            minWidth: 0,
            width: "100%",
          })
        : null;
      const visualCss = css([cornerCss, separatorCss, killJoinCss, flexCss]);

      if (!isMenu(node)) {
        const childCss = (nodeProps.css as Interpolation<Theme> | undefined);
        const childClass = [nodeProps.className as string | undefined, "plainframe-ui-button-group-item"]
          .filter(Boolean)
          .join(" ");

        const injectedToGroup = isGroup(node) && attached
          ? ({ __clipLeft: !isFirst, __clipRight: !isLast } as Partial<PrivateEdgeFlags>)
          : {};

        const cloned = cloneElement<ButtonishProps & Partial<PrivateEdgeFlags>>(
          node as ReactElement<ButtonishProps>,
          {
            ...(nodeProps as ComponentPropsWithoutRef<any>),
            disabled: mergedDisabled,
            size: mergedSize,
            className: childClass,
            css: [childCss, visualCss],
            ...injectedToGroup,
          }
        );

        out.push(cloned);
        prevRightOutlined = currRightOutlined;
        realIndex += 1;
        continue;
      }

      const childrenProp = nodeProps.children as React.ReactNode;
      const newChildren = Children.map(childrenProp, (ch) => {
        if (!isEl(ch) || !isTrigger(ch)) return ch;

        const cprops = ch.props as DropdownMenuTriggerProps;
        const triggerClass = [cprops.className, "plainframe-ui-button-group-item"].filter(Boolean).join(" ");

        return cloneElement<DropdownMenuTriggerProps>(ch, {
          ...cprops,
          css: [cprops.css, visualCss],
          className: triggerClass,
          disabled: mergedDisabled,
          size: mergedSize,
        });
      });

      const patchedMenu = cloneElement<DropdownMenuProps>(node, { ...(nodeProps as DropdownMenuProps), children: newChildren });
      out.push(patchedMenu);
      prevRightOutlined = currRightOutlined;
      realIndex += 1;
    }

    return (
      <div
        ref={ref}
        role={role}
        aria-orientation={isVertical ? "vertical" : "horizontal"}
        data-attached={attached || undefined}
        data-direction={direction}
        className={["plainframe-ui-button-group", className || ""].join(" ").trim()}
        css={[rootCss, userCss]}
        {...rest}
      >
        {out}
      </div>
    );
  })
);

ButtonGroup.displayName = "ButtonGroup";