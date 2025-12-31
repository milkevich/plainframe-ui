/** @jsxImportSource @emotion/react */
import React, { Children, cloneElement, isValidElement, useState, useRef, useEffect } from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";

type Variant = "subtle" | "outlined" | "ghost";

type AccordionGroupProps = {
  children: React.ReactNode;
  attached?: boolean;
  variant?: Variant;
  exclusive?: boolean;
  openIndex?: number | null;
  defaultOpenIndex?: number | null;
  onOpenIndexChange?: (index: number | null) => void;
  disabled?: boolean;
  width?: number | string;
  fullWidth?: boolean;
  className?: string;
  role?: React.AriaRole;
  css?: Interpolation<Theme>;
};

type AccordionLikeProps = {
  variant?: Variant;
  open?: boolean;
  defaultOpen?: boolean;
  onChange?: (open: boolean) => void;
  disabled?: boolean;
  width?: number | string;
  fullWidth?: boolean;
  css?: Interpolation<Theme>;
  className?: string;
  tabIndex?: number;
};

const isEl = (n: unknown): n is React.ReactElement => isValidElement(n);
const nameOf = (n: unknown) =>
  isEl(n)
    ? (n.type as { displayName?: string; name?: string })?.displayName ||
      (n.type as { name?: string })?.name
    : undefined;

const isAccordion = (n: unknown): n is React.ReactElement<AccordionLikeProps> =>
  nameOf(n) === "Accordion";

const toLen = (v: number | string | undefined) =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : v;

const toPx = (v: number | string | undefined, fallback = 1) => {
  if (v == null) return `${fallback}px`;
  if (typeof v === "number") return `${v}px`;
  return /^\d+(\.\d+)?$/.test(v) ? `${v}px` : v;
};

export const AccordionGroup: React.FC<AccordionGroupProps> = ({
  children,
  attached = false,
  variant,
  exclusive = false,
  openIndex,
  defaultOpenIndex,
  onOpenIndexChange,
  disabled = false,
  width,
  fullWidth = false,
  className,
  role = "group",
  css: userCss,
}) => {
  const theme = usePlainframeUITheme();
  const groupRef = useRef<HTMLDivElement>(null);
  
  const nodes = Children.toArray(children);
  const accs = nodes.filter(isAccordion) as React.ReactElement<AccordionLikeProps>[];
  const count = accs.length;

  const isControlled = exclusive && openIndex !== undefined;
  const [internalIndex, setInternalIndex] = useState<number | null>(() => {
    if (!exclusive) return null;
    if (defaultOpenIndex !== undefined) return defaultOpenIndex;
    for (let i = 0; i < accs.length; i++) {
      const p = accs[i].props;
      if (p.open || p.defaultOpen) return i;
    }
    return null;
  });
  const activeIndex = exclusive ? (isControlled ? openIndex ?? null : internalIndex) : null;

  const bw = toPx(theme.componentHeights?.border, 1);
  const borderColor = theme.surface.border;
  const radius = theme.radius.md;

  const forcedVariant = variant;
  const isOutlined = forcedVariant === "outlined"

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
      
      const accordions = Array.from(
        group.querySelectorAll<HTMLElement>(".plainframe-ui-accordion")
      );
      
      const enabledAccordions = accordions.filter(
        acc => acc.getAttribute("data-disabled") !== "true"
      );
      
      if (enabledAccordions.length === 0) return;

      const currentFocus = document.activeElement;
      const currentIndex = enabledAccordions.findIndex(acc => acc.contains(currentFocus));
      
      if (currentIndex === -1) return;

      e.preventDefault();
      
      let nextIndex = currentIndex;
      
      if (e.key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % enabledAccordions.length;
      } else if (e.key === "ArrowUp") {
        nextIndex = (currentIndex - 1 + enabledAccordions.length) % enabledAccordions.length;
      } else if (e.key === "Home") {
        nextIndex = 0;
      } else if (e.key === "End") {
        nextIndex = enabledAccordions.length - 1;
      }

      enabledAccordions[nextIndex]?.focus();
    };

    group.addEventListener("keydown", handleKeyDown);
    return () => group.removeEventListener("keydown", handleKeyDown);
  }, [count]);

  const rootCss = css({
    display: "flex",
    flexDirection: "column",
    maxWidth: width != null ? toLen(width) : undefined,
    width: fullWidth ? "100%" : width != null ? undefined : "auto",
    gap: attached ? 0 : theme.spacing.sm,
    border: attached && isOutlined ? `${bw} solid ${borderColor}` : "none",
    borderRadius: attached && isOutlined ? radius : undefined,
    background: attached && isOutlined ? theme.surface.panelBg : "transparent",
  });

  let logical = 0;
  const out: React.ReactNode[] = [];

  nodes.forEach((node, i) => {
    if (!isAccordion(node)) {
      out.push(node);
      return;
    }

    const props = node.props as AccordionLikeProps;
    const idx = logical++;
    const isFirst = idx === 0;
    const isLast = idx === count - 1;
    const isDisabled = disabled || !!props.disabled;

    const nextVariant: Variant | undefined = forcedVariant ?? props.variant;

    const roundCss = attached
      ? css({
          width: "100%",
          marginBottom: 0,
          borderTopLeftRadius: isFirst ? radius : 0,
          borderTopRightRadius: isFirst ? radius : 0,
          borderBottomLeftRadius: isLast ? radius : 0,
          borderBottomRightRadius: isLast ? radius : 0,
        })
      : css({ width: "100%", marginBottom: 0 });

    const separatorCss =
      !isFirst && count > 1 && attached
        ? css({
            borderTop: `${bw} solid ${borderColor}`,
          })
        : null;

    const killChildOutline =
      isOutlined
        ? css({
            border: "1px solid transparent",
          })
        : null;

    const injected: Partial<AccordionLikeProps> = {
      variant: nextVariant,
      disabled: isDisabled,
      width: "100%",
      css: [props.css, roundCss, killChildOutline, separatorCss],
      className: [props.className, "plainframe-ui-accordion-group-item"].filter(Boolean).join(" "),
    };

    if (exclusive) {
      const userOnChange = props.onChange;
      const active = activeIndex === idx;
      injected.open = active;
      injected.defaultOpen = undefined;
      injected.onChange = (next) => {
        const nextIdx = next ? idx : null;
        if (!isControlled) setInternalIndex(nextIdx);
        onOpenIndexChange?.(nextIdx);
        userOnChange?.(next);
      };
    }

    out.push(
      cloneElement(node, {
        ...props,
        ...injected,
        key: node?.key ?? i,
      })
    );
  });

  return (
    <div
      ref={groupRef}
      role={role}
      aria-orientation="vertical"
      data-attached={attached || undefined}
      data-exclusive={exclusive || undefined}
      className={["plainframe-ui-accordion-group", className || ""].join(" ").trim()}
      css={[rootCss, userCss]}
    >
      {out}
    </div>
  );
};

AccordionGroup.displayName = "AccordionGroup";