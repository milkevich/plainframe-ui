/** @jsxImportSource @emotion/react */
import React, {
  useState,
  useLayoutEffect,
  useEffect,
  useRef,
  cloneElement,
  isValidElement,
  useId,
  forwardRef,
} from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { useFocusRing } from "../utils/focusRing";
import { ChevronDown } from "lucide-react";

type AccordionVariant = "subtle" | "outlined" | "ghost";

export type AccordionProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onChange?: (open: boolean) => void;
  variant?: AccordionVariant;
  disabled?: boolean;
  width?: number | string;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
  css?: Interpolation<Theme>;
};

export type AccordionSummaryProps = {
  children?: React.ReactNode;
  expandIcon?: React.ReactNode;
  expandIconPosition?: "left" | "right";
  hideExpandIcon?: boolean;
  className?: string;
  css?: Interpolation<Theme>;
  expandIconCss?: Interpolation<Theme>;
};

export type AccordionDetailsProps = {
  children?: React.ReactNode;
  className?: string;
  css?: Interpolation<Theme>;
};

const toLen = (v: number | string | undefined) =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : v;

const getSlot = (el: React.ReactElement): string => {
  const t = el.type as { __PFUI_SLOT?: string; displayName?: string; name?: string } | undefined;
  return t?.__PFUI_SLOT || t?.displayName || t?.name || "";
};

export const AccordionSummary: React.ForwardRefExoticComponent<
  AccordionSummaryProps & React.RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, AccordionSummaryProps>(
  (
    {
      children,
      expandIcon,
      expandIconPosition = "right",
      hideExpandIcon = false,
      className,
      css: userCss,
      expandIconCss,
    },
    ref
  ) => {
    const theme = usePlainframeUITheme();

    const fontSize = theme.typography.sizes.sm;
    const iconSize = 20;
    const gap = 10;
    const paddingX = theme.spacing.lg;
    const paddingY = theme.spacing.md;
    const rowH = Number(theme.componentHeights?.md);
    const T = theme.text;

    const baseCss = css({
      display: "flex",
      alignItems: "center",
      outline: "none",
      userSelect: "none",
      fontWeight: 500,
      minHeight: rowH,
      padding: `${paddingY} ${paddingX}`,
      gap,
      fontSize,
      color: T.primary,
    });

    const contentCss = css({
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "flex",
      alignItems: "center",
      gap: 8,
    });

    const leftIconCss = css({ marginRight: 0, marginLeft: -2, lineHeight: 0, color: theme.text.secondary });
    const rightIconCss = css({ marginLeft: 5, marginRight: -2, lineHeight: 0, color: theme.text.secondary });

    return (
      <div
        ref={ref}
        role="presentation"
        tabIndex={-1}
        className={["plainframe-ui-accordion-summary", className || ""]
          .join(" ")
          .trim()}
        css={[baseCss, userCss]}
      >
        {!hideExpandIcon && expandIconPosition === "left" && (
          <span
            className="plainframe-ui-accordion-icon plainframe-ui-accordion-icon-left"
            css={[leftIconCss, expandIconCss]}
          >
            {expandIcon ?? (
              <ChevronDown
                strokeWidth={2}
                css={{ width: iconSize, height: iconSize }}
              />
            )}
          </span>
        )}

        <span className="plainframe-ui-accordion-content" css={contentCss}>
          {children}
        </span>

        {!hideExpandIcon && expandIconPosition === "right" && (
          <span
            className="plainframe-ui-accordion-icon plainframe-ui-accordion-icon-right"
            css={[rightIconCss, expandIconCss]}
          >
            {expandIcon ?? (
              <ChevronDown
                strokeWidth={2}
                css={{ width: iconSize, height: iconSize }}
              />
            )}
          </span>
        )}
      </div>
    );
  }
);

(AccordionSummary as unknown as { __PFUI_SLOT: string }).__PFUI_SLOT = "AccordionSummary";
AccordionSummary.displayName = "AccordionSummary";

export const AccordionDetails: React.FC<AccordionDetailsProps> = ({
  children,
  className,
  css: userCss,
}) => {
  const theme = usePlainframeUITheme();

  const fontSize = theme.typography.sizes.sm;
  const paddingX = theme.spacing.lg;
  const paddingY = "0.15rem";
  const paddingBottom = theme.spacing.md;

  const baseCss = css({
    padding: `${paddingY} ${paddingX} ${paddingBottom} ${paddingX}`,
    fontSize,
    boxSizing: "border-box",
    minHeight: 0,
  });

  return (
    <div
      className={["plainframe-ui-accordion-details", className || ""]
        .join(" ")
        .trim()}
      css={[baseCss, userCss]}
      tabIndex={-1}
    >
      {children}
    </div>
  );
};

(AccordionDetails as unknown as { __PFUI_SLOT: string }).__PFUI_SLOT = "AccordionDetails";
AccordionDetails.displayName = "AccordionDetails";

export const Accordion: React.FC<AccordionProps> = ({
  open: controlledOpen,
  defaultOpen = false,
  onChange,
  className,
  variant = "subtle",
  disabled = false,
  width,
  fullWidth = false,
  css: userCss,
  children,
}) => {
  const theme = usePlainframeUITheme();
  const detailsId = useId();
  const summaryId = useId();

  const radius = theme.radius?.md;
  const T = theme.text;
  const borderW = theme.componentHeights?.border ?? 1;
  const borderWStr = toLen(borderW) ?? "1px";

  const isControlled = controlledOpen !== undefined;
  const [uncontrolled, setUncontrolled] = useState(!!defaultOpen);
  const open = isControlled ? !!controlledOpen : uncontrolled;

  const focusRing = useFocusRing();

  const [maxH, setMaxH] = useState(0);
  const [ready, setReady] = useState(false);

  const measureRef = useRef<HTMLDivElement>(null);
  const detailsClipRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const ensureDetailsBlurred = () => {
    if (!open) return;
    const active = document.activeElement;
    if (detailsClipRef.current?.contains(active)) {
      rootRef.current?.focus();
    }
  };

  const toggle = () => {
    if (disabled) return;
    ensureDetailsBlurred();
    if (isControlled) {
      onChange?.(!controlledOpen);
    } else {
      setUncontrolled(prev => {
        const next = !prev;
        onChange?.(next);
        return next;
      });
    }
  };

  const arr = React.Children.toArray(children).filter(
    (c): c is React.ReactElement => isValidElement(c)
  );

  let summaryIdx = arr.findIndex(el => getSlot(el) === "AccordionSummary");
  let detailsIdx = arr.findIndex(el => getSlot(el) === "AccordionDetails");

  if (summaryIdx === -1 && arr.length) summaryIdx = 0;
  if (detailsIdx === -1) {
    detailsIdx = arr.findIndex((_, i) => i !== summaryIdx);
    if (detailsIdx === -1 && arr.length >= 2) detailsIdx = 1;
  }

  const summaryEl = arr[summaryIdx] ?? null;
  const detailsEl = arr[detailsIdx] ?? null;

  const bg =
    variant === "subtle"
      ? theme.surface.subtleBg
      : variant === "outlined"
      ? (theme.surface.panelBg as string)
      : "transparent";

  const rootCss = css({
    backgroundColor: bg,
    color: T.primary,
    borderRadius: radius,
    border:
      variant === "outlined"
        ? `${borderWStr} solid ${theme.surface.border}`
        : `none`,
    outline: "none",
    marginBottom: theme.spacing.sm,
    maxWidth: width != null ? toLen(width) : undefined,
    width: fullWidth ? "100%" : width != null ? "100%" : "auto",
    boxSizing: "border-box",
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? "not-allowed" : undefined,
  });

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    setMaxH(el.scrollHeight);
  }, [open, children]);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setMaxH(el.scrollHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (maxH > 0 && !ready) setReady(true);
  }, [maxH, ready]);

  useLayoutEffect(() => {
    if (!open && detailsClipRef.current) {
      const active = document.activeElement;
      if (detailsClipRef.current.contains(active)) {
        rootRef.current?.focus();
      }
    }
  }, [open]);

  useLayoutEffect(() => {
    const el = detailsClipRef.current;
    if (!el) return;

    const focusable = Array.from(
      el.querySelectorAll<HTMLElement>(
        "a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]"
      )
    );

    if (!open) {
      focusable.forEach(node => {
        if (node.dataset.accordionTabindex == null) {
          node.dataset.accordionTabindex = node.hasAttribute("tabindex")
            ? node.getAttribute("tabindex") ?? ""
            : "";
        }
        node.tabIndex = -1;
      });
      el.setAttribute("inert", "");
    } else {
      focusable.forEach(node => {
        const value = node.dataset.accordionTabindex;
        if (value != null) {
          if (value === "") {
            node.removeAttribute("tabindex");
          } else {
            node.tabIndex = Number(value);
          }
          delete node.dataset.accordionTabindex;
        }
      });
      el.removeAttribute("inert");
    }
  }, [open]);

  const clipCss = css({
    maxHeight: open ? (maxH ? maxH : "none") : 0,
    overflow: open && !ready ? "visible" : "hidden",
    transition: ready ? "max-height 0.36s cubic-bezier(.25,.8,.4,1)" : "none",
    willChange: ready ? "max-height" : undefined,
  });

  const innerCss = css({
    opacity: open ? 1 : 0,
    transform: open ? "translateY(0)" : "translateY(1rem)",
    transition: ready ? "transform 0.28s ease, opacity 0.28s ease" : "none",
  });

  const iconRotationCss = css({
    "& .plainframe-ui-accordion-icon": {
      transition: "transform 0.3s cubic-bezier(.6,1.3,.5,1)",
      transform: open ? "rotate(180deg)" : "rotate(0deg)",
    },
  });

  const summary =
    summaryEl &&
    cloneElement(
      summaryEl,
      {
        ...(typeof summaryEl.props === "object" && summaryEl.props ? summaryEl.props : {}),
        className: [
          (summaryEl.props as any)?.className,
          "plainframe-ui-accordion-summary-managed",
        ].filter(Boolean).join(" "),
      } as any
    );

  const details = detailsEl;

  return (
    <div
      className={[
        "plainframe-ui-accordion",
        `plainframe-ui-accordion-${variant}`,
        className || "",
      ]
        .join(" ")
        .trim()}
      data-variant={variant}
      data-open={open ? "true" : "false"}
      data-disabled={disabled ? "true" : "false"}
      css={[focusRing(), rootCss, userCss]}
      tabIndex={disabled ? -1 : 0}
      ref={rootRef}
      role="button"
      aria-expanded={open}
      aria-controls={detailsId}
      aria-labelledby={summaryId}
      aria-disabled={disabled || undefined}
      onClick={e => {
        if (e.detail === 0 && document.activeElement !== rootRef.current) return;
        toggle();
      }}
      onKeyDown={e => {
        if (disabled) return;
        if (document.activeElement !== rootRef.current) return;
        if (e.target !== rootRef.current) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
    >
      <div
        id={summaryId}
        className="plainframe-ui-accordion-summary-wrapper"
        css={[
          css({ cursor: disabled ? "not-allowed" : "pointer" }),
          iconRotationCss,
        ]}
      >
        {summary}
      </div>

      <div
        id={detailsId}
        aria-hidden={!open}
        className="plainframe-ui-accordion-details-clip"
        css={clipCss}
        tabIndex={-1}
        ref={detailsClipRef}
        onClick={e => e.stopPropagation()}
      >
        <div
          ref={measureRef}
          className="plainframe-ui-accordion-details-inner"
          css={innerCss}
        >
          {details}
        </div>
      </div>
    </div>
  );
};

Accordion.displayName = "Accordion";
