/** @jsxImportSource @emotion/react */
import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  forwardRef,
  createContext,
  useContext,
} from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import {
  useFloating,
  autoUpdate,
  offset as offsetMw,
  flip,
  shift,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  type Placement,
} from "@floating-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { usePlainframeUITheme } from "../theme/ThemeProvider";

type WithCss = { css?: Interpolation<Theme> };
type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

export type AnchorOrigin = {
  vertical: "top" | "bottom" | "center";
  horizontal: "left" | "right" | "center";
};

export type PopoverRootProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerOn?: "click" | "hover";
  lockScroll?: boolean;
  trapFocus?: boolean;
  children: React.ReactNode;
};

export type PopoverTriggerProps = WithCss & {
  asChild?: boolean;
  children: React.ReactElement;
};

export type PopoverAnchorProps = WithCss & {
  asChild?: boolean;
  width?: number | string;
  children: React.ReactElement;
};

export type PopoverContentProps = WithCss &
  Omit<React.HTMLAttributes<HTMLDivElement>, "style"> & {
    anchorOrigin?: AnchorOrigin;
    sideOffset?: number;
    alignOffset?: number;
    collisionPadding?: number | Partial<Record<Side, number>>;
    unstyled?: boolean;
    width?: string | number;
    height?: string | number;
    padding?: string | number;
    paddingX?: string | number;
    paddingY?: string | number;
    radius?: string | number;
  };

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerOn: "click" | "hover";
  referenceRef: React.MutableRefObject<HTMLElement | null>;
  scheduleClose: (ms?: number) => void;
  cancelClose: () => void;
};

const PopoverCtx = createContext<Ctx | null>(null);
const usePopover = (): Ctx => {
  const v = useContext(PopoverCtx);
  if (!v) throw new Error("Popover components must be used inside <Popover>.");
  return v;
};

function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {
  if (!ref) return;
  if (typeof ref === "function") (ref as (v: T | null) => void)(value);
  else (ref as unknown as { current: T | null }).current = value;
}

export const mergeRefs: <T>(
  ...refs: Array<React.Ref<T> | undefined>
) => (node: T | null) => void =
  <T,>(...refs: Array<React.Ref<T> | undefined>) =>
  (node: T | null) => {
    for (const r of refs) setRef(r, node);
  };

const toCssSize = (v?: string | number): string | undefined =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : v;

const useBodyScrollLock = (locked: boolean): void => {
  useEffect(() => {
    if (!locked) return;
    if (typeof document === "undefined" || typeof window === "undefined") return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const computedPad = parseFloat(getComputedStyle(body).paddingRight || "0");
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${computedPad + scrollbar}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
    };
  }, [locked]);
};

const resolveToken = (
  token: string | number | undefined,
  scale: Record<string, string | number> | undefined
): string | undefined => {
  if (token == null) return undefined;
  if (typeof token === "number") return `${token}px`;
  if (typeof token === "string" && scale && token in scale) {
    const v = scale[token];
    return typeof v === "number" ? `${v}px` : String(v);
  }
  return token;
};

export const Popover: React.FC<PopoverRootProps> = ({
  open: controlled,
  defaultOpen,
  onOpenChange,
  triggerOn = "click",
  lockScroll = true,
  trapFocus = true,
  children,
}) => {
  const [uncontrolled, setUncontrolled] = useState<boolean>(!!defaultOpen);
  const open = controlled ?? uncontrolled;
  const setOpen = (v: boolean): void => {
    if (controlled === undefined) setUncontrolled(v);
    onOpenChange?.(v);
  };

  const referenceRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const scheduleClose = (ms = 120): void => {
    if (closeTimerRef.current != null) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setOpen(false), ms);
  };
  const cancelClose = (): void => {
    if (closeTimerRef.current == null) return;
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  };

  useBodyScrollLock(lockScroll && open);

  useEffect(() => {
    if (!trapFocus || !open) return;
    if (typeof document === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const contentEl = document.querySelector('.plainframe-ui-popover') as HTMLElement | null;
      if (!contentEl) return;

      const focusables = Array.from(contentEl.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), [role="menuitem"]:not([aria-disabled="true"]):not([data-disabled]), [role="menuitemcheckbox"]:not([aria-disabled="true"]):not([data-disabled]), [role="menuitemradio"]:not([aria-disabled="true"]):not([data-disabled])'
      )).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });

      if (focusables.length === 0) return;

      const firstFocusable = focusables[0];
      const lastFocusable = focusables[focusables.length - 1];
      const activeEl = document.activeElement as HTMLElement;

      
      if (e.shiftKey && activeEl === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
      
      else if (!e.shiftKey && activeEl === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [trapFocus, open]);

  const value = useMemo<Ctx>(
    () => ({ open, setOpen, triggerOn, referenceRef, scheduleClose, cancelClose }),
    [open, triggerOn]
  );

  return <PopoverCtx.Provider value={value}>{children}</PopoverCtx.Provider>;
};

export const PopoverTrigger: React.FC<
  PopoverTriggerProps & React.RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, PopoverTriggerProps>(({ asChild = true, children, css: userCss }, ref) => {
  const { open, setOpen, triggerOn, referenceRef, scheduleClose, cancelClose } = usePopover();
  const onlyChild = React.Children.only(children) as React.ReactElement;
  const childProps = (onlyChild.props || {}) as Record<string, unknown>;

  const mergedRef = mergeRefs<HTMLElement | null>(
    referenceRef as unknown as React.Ref<HTMLElement | null>,
    ref as React.Ref<HTMLElement | null>,
    (onlyChild as any).ref as React.Ref<HTMLElement | null> | undefined
  );

  const triggerProps =
    triggerOn === "click"
      ? {
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            setOpen(!open);
            (childProps.onClick as ((e: React.MouseEvent) => void) | undefined)?.(e);
          },
        }
      : {
          onMouseEnter: (e: React.MouseEvent) => {
            cancelClose();
            if (!open) setOpen(true);
            (childProps.onMouseEnter as ((e: React.MouseEvent) => void) | undefined)?.(e);
          },
          onMouseLeave: (e: React.MouseEvent) => {
            scheduleClose();
            (childProps.onMouseLeave as ((e: React.MouseEvent) => void) | undefined)?.(e);
          },
        };

  const a11y = { "aria-haspopup": "dialog", "aria-expanded": open };

  if (asChild) {
    const childCss = (onlyChild.props as any)?.css as Interpolation<Theme> | undefined;
    return React.cloneElement(
      onlyChild,
      {
        ...(triggerProps as object),
        ...(a11y as object),
        ref: mergedRef,
        css: [childCss, userCss].filter(Boolean),
      } as React.HTMLAttributes<HTMLElement>
    );
  }

  return React.createElement("button", {
    ref: mergedRef,
    type: "button",
    css: [userCss],
    ...triggerProps,
    ...a11y,
    children: onlyChild,
  });
});
PopoverTrigger.displayName = "PopoverTrigger";

export const PopoverAnchor: React.FC<
  PopoverAnchorProps & React.RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, PopoverAnchorProps>(({ asChild = true, width, css: userCss, children }, ref) => {
  const { referenceRef } = usePopover();
  const onlyChild = React.Children.only(children) as React.ReactElement;

  const mergedRef = mergeRefs<HTMLElement | null>(
    referenceRef as unknown as React.Ref<HTMLElement | null>,
    ref as React.Ref<HTMLElement | null>,
    (onlyChild as any).ref as React.Ref<HTMLElement | null> | undefined
  );

  if (asChild) {
    const childCss = (onlyChild.props as any)?.css as Interpolation<Theme> | undefined;
    return React.cloneElement(onlyChild, {
      ref: mergedRef,
      css: [childCss, userCss].filter(Boolean),
    } as any);
  }

  const wrapperCss = css({
    display: "inline-block",
    width: toCssSize(width),
    verticalAlign: "middle",
    ...(userCss as object),
  });

  return (
    <span ref={mergedRef as unknown as React.Ref<HTMLSpanElement>} css={wrapperCss}>
      {onlyChild}
    </span>
  );
});
PopoverAnchor.displayName = "PopoverAnchor";

function anchorToPlacement(ao?: AnchorOrigin): Placement {
  const v = ao?.vertical ?? "bottom";
  const h = ao?.horizontal ?? "center";

  if (v === "top" || v === "bottom") {
    const side = v;
    const align: Align = h === "left" ? "start" : h === "right" ? "end" : "center";
    return (align === "center" ? side : `${side}-${align}`) as Placement;
  }

  const side: Side = h === "left" ? "left" : "right";
  const align: Align = "center";
  return (align === "center" ? side : `${side}-${align}`) as Placement;
}

export const PopoverContent: React.FC<
  PopoverContentProps & React.RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, PopoverContentProps>(
  (
    {
      anchorOrigin = { vertical: "bottom", horizontal: "center" },
      sideOffset = 8,
      alignOffset = 0,
      collisionPadding = 8,
      unstyled = false,
      children,
      width,
      height,
      padding,
      paddingX,
      paddingY,
      radius = "lg",
      css: userCss,
      ...rest
    },
    ref
  ) => {
    const { open, setOpen, triggerOn, referenceRef, scheduleClose, cancelClose } = usePopover();
    const theme = usePlainframeUITheme();

    const placement = anchorToPlacement(anchorOrigin);

    const { refs, x, y, strategy, context } = useFloating({
      open,
      onOpenChange: setOpen,
      whileElementsMounted: autoUpdate,
      placement,
      strategy: "fixed",
      middleware: [
        offsetMw({ mainAxis: sideOffset, crossAxis: alignOffset }),
        flip({ padding: collisionPadding as number | Partial<Record<Side, number>> }),
        shift({ padding: collisionPadding as number | Partial<Record<Side, number>> }),
      ],
    });

    useEffect(() => {
      if (referenceRef.current) refs.setReference(referenceRef.current);
    }, [refs, referenceRef]);

    const dismiss = useDismiss(context, { outsidePressEvent: "pointerdown", escapeKey: true });
    const role = useRole(context, { role: "dialog" });
    const { getFloatingProps } = useInteractions([dismiss, role]);

    const [sideMain] = context.placement.split("-") as [Side, Align?];
    const resolvedSide = sideMain;

    const transformOrigin = `${resolvedSide === "left" ? "right" : resolvedSide === "right" ? "left" : "center"} ${
      resolvedSide === "top" ? "bottom" : resolvedSide === "bottom" ? "top" : "center"
    }`;

    const delta = 8;
    const initialOffset =
      resolvedSide === "top"
        ? { y: delta }
        : resolvedSide === "bottom"
        ? { y: -delta }
        : resolvedSide === "left"
        ? { x: delta }
        : { x: -delta };

    const motionProps = {
      initial: { opacity: 0, scale: 0.96, ...initialOffset },
      animate: { opacity: 1, scale: 1, x: 0, y: 0 },
      exit: { opacity: 0, scale: 0.96, ...initialOffset },
      transition: {
        scale: { type: "spring", stiffness: 520, damping: 32, mass: 0.5 },
        x: { type: "spring", stiffness: 420, damping: 30, mass: 0.6 },
        y: { type: "spring", stiffness: 420, damping: 30, mass: 0.6 },
        opacity: { duration: 0.16, ease: "linear" },
      },
    } as const;

    const panelBg = theme.surface.panelBg;
    const panelFg = theme.text.primary;
    const panelBorder = `${theme.componentHeights.border} solid ${theme.surface.border}`;

    const resolvedPad = resolveToken(padding, theme.spacing as Record<string, string | number>);
    const resolvedPadX = resolveToken(paddingX, theme.spacing as Record<string, string | number>);
    const resolvedPadY = resolveToken(paddingY, theme.spacing as Record<string, string | number>);

    const applyPad: React.CSSProperties = {};
    if (resolvedPad) applyPad.padding = resolvedPad;
    if (resolvedPadX) (applyPad as any).paddingInline = resolvedPadX;
    if (resolvedPadY) (applyPad as any).paddingBlock = resolvedPadY;

    const resolvedRadius =
      resolveToken(radius as string | number | undefined, theme.radius as Record<string, string | number>) ??
      (theme.radius.md as unknown as string);

    const panelShadow = "0 8px 32px rgba(0,0,0,.05), 0 2px 8px rgba(0,0,0,.02)";

    const basePos = css({
      position: strategy as React.CSSProperties["position"],
      top: (y ?? 0) as number,
      left: (x ?? 0) as number,
      zIndex: 1000,
      transformOrigin,
      pointerEvents: "auto",
      display: "inline-flex",
      flexDirection: "column",
      width: toCssSize(width) ?? "fit-content",
      height: toCssSize(height) ?? "fit-content",
      boxSizing: "border-box",
      willChange: "opacity, transform",
    });

    const visualsCss = unstyled
      ? css({})
      : css({
          background: panelBg,
          color: panelFg,
          border: panelBorder,
          borderRadius: resolvedRadius,
          boxShadow: panelShadow,
          ...applyPad,
          ...(applyPad.padding || (applyPad as any).paddingInline || (applyPad as any).paddingBlock
            ? {}
            : {
                padding:
                  typeof theme.spacing?.sm === "number"
                    ? `${theme.spacing.sm}px ${theme.spacing.md}px`
                    : `${(theme.spacing as any)?.sm ?? "0.5rem"} ${(theme.spacing as any)?.md ?? "1rem"}`,
              }),
        });

    const hoverHandlers =
      triggerOn === "hover"
        ? {
            onMouseEnter: cancelClose as React.MouseEventHandler<HTMLDivElement>,
            onMouseLeave: () => scheduleClose(),
          }
        : {};

    const mergedRef = mergeRefs<HTMLDivElement | null>(
      refs.setFloating as unknown as React.Ref<HTMLDivElement | null>,
      ref as React.Ref<HTMLDivElement | null>
    );

    const node = (
      <motion.div
        className="plainframe-ui-popover"
        {...getFloatingProps({ ...rest, ref: mergedRef, ...hoverHandlers })}
        {...motionProps}
        css={[basePos, visualsCss, userCss]}
      >
        {children}
      </motion.div>
    );

    return (
      <FloatingPortal>
        <AnimatePresence>{open ? node : null}</AnimatePresence>
      </FloatingPortal>
    );
  }
);
PopoverContent.displayName = "PopoverContent";

export const usePopoverContext: () => {
  open: boolean;
  close: () => void;
  setOpen: (v: boolean) => void;
} = () => {
  const ctx = usePopover();
  return { open: ctx.open, close: () => ctx.setOpen(false), setOpen: ctx.setOpen };
};
