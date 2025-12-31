/** @jsxImportSource @emotion/react */
import React, {
  createContext,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import {
  useFloating,
  offset,
  flip,
  shift,
  arrow as arrowMw,
  autoUpdate,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  safePolygon,
  FloatingPortal,
  type Placement,
} from "@floating-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { usePlainframeUITheme } from "../theme/ThemeProvider";

const mergeRefs =
  <T,>(...refs: Array<React.Ref<T> | undefined>) =>
  (node: T) => {
    for (const r of refs) {
      if (!r) continue;
      if (typeof r === "function") r(node);
      else try {
        (r as any).current = node;
      } catch {}
    }
  };

type Ctx = {
  open: boolean;
  setOpen: (o: boolean) => void;
  id: string;
  placement: Placement;
  autoWidth: boolean;
  allowArrow: boolean;
  refs: ReturnType<typeof useFloating>["refs"];
  floatingStyles: ReturnType<typeof useFloating>["floatingStyles"];
  middlewareData: ReturnType<typeof useFloating>["middlewareData"];
  getReferenceProps: ReturnType<typeof useInteractions>["getReferenceProps"];
  getFloatingProps: ReturnType<typeof useInteractions>["getFloatingProps"];
  arrowRef: React.MutableRefObject<HTMLDivElement | null>;
};

const TooltipCtx = createContext<Ctx | null>(null);
const useTooltipCtx = () => {
  const v = useContext(TooltipCtx);
  if (!v) throw new Error("TooltipTrigger/TooltipContent must be inside <Tooltip>.");
  return v;
};

export type TooltipProps = {
  children: React.ReactNode;
  placement?: Placement;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (o: boolean) => void;
  delay?: number;
  arrow?: boolean;
  autoWidth?: boolean;
  disableHoverListener?: boolean;
};

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  placement = "top",
  open: controlled,
  defaultOpen = false,
  onOpenChange,
  delay = 80,
  arrow = true,
  autoWidth = false,
  disableHoverListener = false,
}) => {
  const [uc, setUc] = useState(!!defaultOpen);
  const open = controlled ?? uc;
  const setOpen = (o: boolean) => {
    if (controlled === undefined) setUc(o);
    onOpenChange?.(o);
  };

  const arrowRef = useRef<HTMLDivElement | null>(null);

  const floating = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    strategy: "fixed",
    transform: false,
    middleware: [
      offset(8),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      arrow ? arrowMw({ element: arrowRef, padding: 4 }) : undefined,
    ].filter(Boolean) as any,
  });

  const hover = useHover(floating.context, {
    enabled: !disableHoverListener,
    delay: { open: delay, close: 60 },
    handleClose: safePolygon(),
    restMs: 20,
  });
  const focus = useFocus(floating.context);
  const dismiss = useDismiss(floating.context, { escapeKey: true, outsidePress: true });
  const role = useRole(floating.context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  const id = useId();

  const ctx = useMemo<Ctx>(
    () => ({
      open,
      setOpen,
      id,
      placement: floating.placement,
      autoWidth,
      allowArrow: !!arrow,
      refs: floating.refs,
      floatingStyles: floating.floatingStyles,
      middlewareData: floating.middlewareData,
      getReferenceProps,
      getFloatingProps,
      arrowRef,
    }),
    [
      open,
      autoWidth,
      arrow,
      floating.placement,
      floating.refs,
      floating.floatingStyles,
      floating.middlewareData,
      getReferenceProps,
      getFloatingProps,
    ]
  );

  return <TooltipCtx.Provider value={ctx}>{children}</TooltipCtx.Provider>;
};

export type TooltipTriggerProps = {
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
  css?: Interpolation<Theme>;
};

export const TooltipTrigger: React.FC<TooltipTriggerProps> = ({
  asChild = true,
  children,
  className,
  css: userCss,
}) => {
  const { refs, getReferenceProps, id } = useTooltipCtx();
  const isElement = React.isValidElement(children);
  const isDomChild = isElement && typeof (children as React.ReactElement).type === "string";

  if (asChild && isElement && isDomChild) {
    const child = children as React.ReactElement<Record<string, unknown> & { css?: Interpolation<Theme>; className?: string }>;
    const childRef = "ref" in child ? child.ref : undefined;
    const merged = getReferenceProps({
      ...child.props,
      "aria-describedby": id,
      ref: mergeRefs(childRef as React.Ref<Element> | undefined, refs.setReference as React.Ref<Element>),
      className: [child.props?.className || "", className || ""].join(" ").trim() || undefined,
    });
    const mergedCss = [
      child.props?.css || undefined,
      userCss,
    ].filter(Boolean);
    return React.cloneElement(child, { ...merged, css: mergedCss });
  }

  return (
    <span
      ref={refs.setReference}
      className={className}
      css={userCss}
      style={{ display: "inline-flex" }}
      {...getReferenceProps({ "aria-describedby": id })}
    >
      {children}
    </span>
  );
};

export type TooltipContentProps = {
  children: React.ReactNode;
  className?: string;
  css?: Interpolation<Theme>;
  arrowCss?: Interpolation<Theme>;
};

export const TooltipContent: React.FC<TooltipContentProps> = ({
  children,
  className,
  css: userCss,
  arrowCss,
}) => {
  const {
    open,
    refs,
    floatingStyles,
    middlewareData,
    getFloatingProps,
    placement,
    id,
    autoWidth,
    allowArrow,
    arrowRef,
  } = useTooltipCtx();

  const theme = usePlainframeUITheme();

  const side = (placement.split("-")[0] || "top") as "top" | "bottom" | "left" | "right";
  const delta = 8;
  const initial =
    side === "bottom"
      ? { opacity: 0, y: -delta, scale: 0.98 }
      : side === "top"
      ? { opacity: 0, y: +delta, scale: 0.98 }
      : side === "left"
      ? { opacity: 0, x: +delta, scale: 0.98 }
      : { opacity: 0, x: -delta, scale: 0.98 };

  const exit = initial;
  const transformOrigin =
    side === "bottom"
      ? "center top"
      : side === "top"
      ? "center bottom"
      : side === "left"
      ? "right center"
      : "left center";

  const tooltipBase = css({
    zIndex: 1300,
    backgroundColor: theme.neutral[900],
    color: theme.neutral[0],
    borderRadius: 8,
    padding: "6px 9px",
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.25,
    maxWidth: 260,
    whiteSpace: autoWidth ? "nowrap" : "normal",
    boxShadow: "0 10px 30px rgba(0,0,0,.18)",
    pointerEvents: "auto",
    transformOrigin,
  });

  const arrowBase = css({
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: theme.neutral[900],
    transform: "rotate(45deg)",
    pointerEvents: "none",
  });

  const arrowData = middlewareData.arrow as { x?: number; y?: number } | undefined;
  const staticSide =
    ({ top: "bottom", bottom: "top", left: "right", right: "left" } as const)[side];

  return (
    <FloatingPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            id={id}
            ref={refs.setFloating}
            role="tooltip"
            data-state="open"
            className={["plainframe-ui-tooltip", className || ""].join(" ").trim()}
            css={[tooltipBase, userCss]}
            style={floatingStyles}
            initial={initial}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={exit}
            transition={{
              scale: { type: "spring", stiffness: 520, damping: 36, mass: 0.6 },
              x: { type: "spring", stiffness: 420, damping: 32, mass: 0.6 },
              y: { type: "spring", stiffness: 420, damping: 32, mass: 0.6 },
              opacity: { duration: 0.14, ease: "linear" },
            }}
            {...getFloatingProps()}
          >
            {children}
            {allowArrow && (
              <div
                ref={arrowRef}
                className="plainframe-ui-tooltip-arrow"
                css={[arrowBase, arrowCss]}
                style={{
                  left: arrowData?.x != null ? `${arrowData.x}px` : undefined,
                  top: arrowData?.y != null ? `${arrowData.y}px` : undefined,
                  [staticSide]: "-3px",
                } as React.CSSProperties}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </FloatingPortal>
  );
};
