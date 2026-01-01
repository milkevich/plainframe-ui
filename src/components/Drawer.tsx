/** @jsxImportSource @emotion/react */
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useContext,
} from "react";
import { css, type Interpolation } from "@emotion/react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import type { Theme } from "@emotion/react";

type DrawerSide = "left" | "right" | "top" | "bottom";
type DrawerVariant = "inset" | "full";

type DrawerCtxT = {
  open: boolean;
  setOpen: (next: boolean) => void;
  lockScroll: boolean;
  closeOnEscape: boolean;
};

const DrawerCtx = React.createContext<DrawerCtxT | null>(null);

const useDrawerCtx = (): DrawerCtxT => {
  const ctx = useContext(DrawerCtx);
  if (!ctx) throw new Error("Drawer components must be used within <Drawer>.");
  return ctx;
};

type DomDragKeys =
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onDragOver"
  | "onDragEnter"
  | "onDragLeave"
  | "onDrop";

type DomAnimKeys = "onAnimationStart" | "onAnimationEnd";

export type DrawerRootProps = {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  lockScroll?: boolean;
  closeOnEscape?: boolean;
};

export const Drawer: React.FC<DrawerRootProps> = ({
  children,
  open: controlled,
  defaultOpen,
  onOpenChange,
  lockScroll = true,
  closeOnEscape = true,
}) => {
  const [uncontrolled, setUncontrolled] = useState<boolean>(!!defaultOpen);
  const open = controlled ?? uncontrolled;

  const setOpen = useCallback(
    (next: boolean): void => {
      if (controlled === undefined) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange]
  );

  const value = useMemo<DrawerCtxT>(
    () => ({ open, setOpen, lockScroll, closeOnEscape }),
    [open, setOpen, lockScroll, closeOnEscape]
  );

  return <DrawerCtx.Provider value={value}>{children}</DrawerCtx.Provider>;
};

export type DrawerTriggerProps = Omit<React.HTMLAttributes<HTMLElement>, "style"> & {
  asChild?: boolean;
  css?: Interpolation<Theme>;
};

export const DrawerTrigger: React.ForwardRefExoticComponent<
  DrawerTriggerProps & React.RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, DrawerTriggerProps>(
  ({ asChild = true, children, className, css: userCss, ...rest }, ref) => {
    const { setOpen } = useDrawerCtx();
    const canAsChild = !!asChild && React.isValidElement(children);

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLElement>) => {
        if (canAsChild) {
          let onClick: ((ev: React.MouseEvent<HTMLElement>) => void) | undefined;
          if (React.isValidElement(children)) {
            onClick = (children.props as { onClick?: (ev: React.MouseEvent<HTMLElement>) => void }).onClick;
          }
          onClick?.(e);
        }
        (rest.onClick as ((ev: React.MouseEvent<HTMLElement>) => void) | undefined)?.(e);
        if (!e.defaultPrevented) setOpen(true);
      },
      [canAsChild, children, rest.onClick, setOpen]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen(true);
        }
        if (canAsChild) {
          let onKeyDown: ((ev: React.KeyboardEvent<HTMLElement>) => void) | undefined;
          if (React.isValidElement(children)) {
            onKeyDown = (children.props as { onKeyDown?: (ev: React.KeyboardEvent<HTMLElement>) => void }).onKeyDown;
          }
          onKeyDown?.(e);
        }
        (rest.onKeyDown as ((ev: React.KeyboardEvent<HTMLElement>) => void) | undefined)?.(e);
      },
      [canAsChild, children, rest.onKeyDown, setOpen]
    );

    if (canAsChild) {
      const child = children as React.ReactElement<{ className?: string; css?: Interpolation<Theme> }>;
      const childCss = child.props.css;
      return React.cloneElement(
        child,
        {
          ...(child.props || {}),
          className: [child.props.className, className].filter(Boolean).join(" ") || undefined,
          css: [childCss, userCss].filter(Boolean),
          onClick: handleClick,
          onKeyDown: handleKeyDown,
          ...rest,
        }
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={className}
        css={userCss}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
DrawerTrigger.displayName = "DrawerTrigger";

export type DrawerContentProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  DomDragKeys | DomAnimKeys | "style"
> & {
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  position?: DrawerSide;
  variant?: DrawerVariant;
  margin?: number | string;
  radius?: number | string;
  backdropBlur?: boolean;
  backdropBlurDepth?: number | string;
  closeOnClickAway?: boolean;
  transitionMs?: number;
  snapClosePct?: number;
  velocityClosePxS?: number;
  dragElasticOut?: number;
  css?: Interpolation<Theme>;
  className?: string;
};

let __locks = 0;
let __prevOverflow = "";
let __prevPadRight = "";

const getScrollbarW = (): number =>
  typeof window === "undefined"
    ? 0
    : window.innerWidth - document.documentElement.clientWidth;

function lockBody(): void {
  if (typeof document === "undefined") return;
  if (__locks === 0) {
    const b = document.body;
    __prevOverflow = b.style.overflow || "";
    __prevPadRight = b.style.paddingRight || "";
    const sw = getScrollbarW();
    b.style.overflow = "hidden";
    if (sw > 0) b.style.paddingRight = `${sw}px`;
  }
  __locks += 1;
}

function unlockBody(): void {
  if (typeof document === "undefined") return;
  if (__locks > 0) __locks -= 1;
  if (__locks === 0) {
    const b = document.body;
    b.style.overflow = __prevOverflow;
    b.style.paddingRight = __prevPadRight;
  }
}

const toNum = (v: number | string | undefined, fb = 0): number =>
  v == null ? fb : typeof v === "number" ? v : parseFloat(String(v)) || fb;

export const DrawerContent: React.ForwardRefExoticComponent<
  DrawerContentProps & React.RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, DrawerContentProps>(function DrawerContent(
  {
    children,
    width,
    height,
    position = "left",
    variant = "inset",
    margin = 10,
    radius,
    backdropBlur = true,
    backdropBlurDepth,
    closeOnClickAway = true,
    transitionMs,
    snapClosePct = 0.33,
    velocityClosePxS = 950,
    dragElasticOut = 0.2,
    className,
    css: userCss,
    ...rest
  },
  ref
): React.ReactElement | null {
  const theme = usePlainframeUITheme();
  const { open, setOpen, lockScroll, closeOnEscape } = useDrawerCtx();

  const bodyLockedRef = useRef(false);
  const pendingUnlockRef = useRef(false);

  useEffect(() => {
    if (!lockScroll) {
      if (bodyLockedRef.current) {
        bodyLockedRef.current = false;
        pendingUnlockRef.current = false;
        unlockBody();
      }
      return;
    }

    if (open) {
      pendingUnlockRef.current = false;
      if (!bodyLockedRef.current) {
        lockBody();
        bodyLockedRef.current = true;
      }
    } else {
      if (bodyLockedRef.current) pendingUnlockRef.current = true;
    }
  }, [open, lockScroll]);

  useEffect(() => {
    return () => {
      if (bodyLockedRef.current) {
        bodyLockedRef.current = false;
        pendingUnlockRef.current = false;
        unlockBody();
      }
    };
  }, []);

  const marginPx = useMemo(() => toNum(margin, 0), [margin]);

  const axis: "x" | "y" = useMemo(
    () => (position === "left" || position === "right" ? "x" : "y"),
    [position]
  );
  const dir = useMemo(
    () => (position === "left" || position === "top" ? -1 : 1) as 1 | -1,
    [position]
  );

  const computedWidth: number | string = useMemo(
    () =>
      width ??
      (position === "left" || position === "right"
        ? 320
        : variant === "inset"
        ? `calc(100% - ${marginPx * 2}px)`
        : "100%"),
    [width, position, variant, marginPx]
  );

  const computedHeight: number | string = useMemo(
    () =>
      height ??
      (position === "top" || position === "bottom"
        ? 420
        : variant === "inset"
        ? `calc(100% - ${marginPx * 2}px)`
        : "100%"),
    [height, position, variant, marginPx]
  );

  const edgeRadius = useMemo(() => {
    const r = String(theme.radius.lg);
    switch (position) {
      case "left":
        return `0 ${r} ${r} 0`;
      case "right":
        return `${r} 0 0 ${r}`;
      case "top":
        return `0 0 ${r} ${r}`;
      default:
        return `${r} ${r} 0 0`;
    }
  }, [position, theme.radius.lg]);

  const computedRadius = useMemo(
    () => radius ?? (variant === "inset" ? theme.radius.lg : edgeRadius),
    [radius, variant, theme.radius.lg, edgeRadius]
  );

  const posCss = useMemo<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  }>(() => {
    if (variant === "inset") {
      return {
        top: position === "bottom" ? undefined : marginPx,
        bottom: position === "top" ? undefined : marginPx,
        left: position === "right" ? undefined : marginPx,
        right: position === "left" ? undefined : marginPx,
      };
    }
    return {
      top: position === "bottom" ? undefined : 0,
      bottom: position === "top" ? undefined : 0,
      left: position === "right" ? undefined : 0,
      right: position === "left" ? undefined : 0,
    };
  }, [variant, position, marginPx]);

  const panelRef = useRef<HTMLDivElement | null>(null);

  const sizePx = useCallback((): number => {
    const el = panelRef.current;
    if (!el) return 1;
    const r = el.getBoundingClientRect();
    return axis === "x" ? r.width : r.height;
  }, [axis]);

  const springTransition = useMemo(
    () => ({ type: "spring", stiffness: 520, damping: 40, mass: 0.7 } as const),
    []
  );

  const timedTransition = useMemo(
    () =>
      ({
        duration: (transitionMs ?? 280) / 1000,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      }) as const,
    [transitionMs]
  );

  const closedOffset = useMemo(() => dir * 1.1, [dir]);
  const initialTranslate = useMemo(
    () =>
      axis === "x"
        ? ({ x: `${closedOffset * 100}%`, y: 0 } as const)
        : ({ y: `${closedOffset * 100}%`, x: 0 } as const),
    [axis, closedOffset]
  );

  const panelCss: Interpolation<Theme> = useMemo(
    () =>
      css({
        position: "fixed",
        zIndex: 1100,
        ...posCss,
        width: computedWidth,
        height: computedHeight,
        backgroundColor: theme.surface.panelBg,
        borderRadius: computedRadius,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
        willChange: "transform, box-shadow, opacity",
        backfaceVisibility: "hidden",
        pointerEvents: open ? "auto" : "none",
        touchAction: axis === "x" ? "pan-y" : "pan-x",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      }),
    [posCss, computedWidth, computedHeight, theme.surface, computedRadius, open, axis]
  );

  const overlayCss: Interpolation<Theme> = useMemo(
    () =>
      css({
        position: "fixed",
        inset: 0,
        zIndex: 1099,
        background: theme.surface.overlayBg,
        willChange: "opacity",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
        ...(backdropBlur
          ? {
              backdropFilter: `blur(${backdropBlurDepth ?? "2px"})`,
              WebkitBackdropFilter: `blur(${backdropBlurDepth ?? "2px"})`,
            }
          : null),
      }),
    [backdropBlur, backdropBlurDepth, theme.surface]
  );

  const onOverlayClick = useCallback<React.MouseEventHandler<HTMLDivElement>>(
    () => {
      if (closeOnClickAway) setOpen(false);
    },
    [closeOnClickAway, setOpen]
  );

  const dragElastic = useMemo((): Record<string, number> => {
    return axis === "x"
      ? {
          left: dir === -1 ? dragElasticOut : 0,
          right: dir === 1 ? dragElasticOut : 0,
        }
      : {
          top: dir === -1 ? dragElasticOut : 0,
          bottom: dir === 1 ? dragElasticOut : 0,
        };
  }, [axis, dir, dragElasticOut]);

  const dragConstraints = useMemo(
    (): Record<string, number> =>
      axis === "x" ? { left: 0, right: 0 } : { top: 0, bottom: 0 },
    [axis]
  );

  const snapPct = useMemo(() => Math.max(0, Math.min(1, snapClosePct)), [snapClosePct]);

  const onDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const delta = axis === "x" ? info.offset.x : info.offset.y;
      const velocity = axis === "x" ? info.velocity.x : info.velocity.y;
      const movedOutward = dir * delta > 0;
      const distOk = Math.abs(delta) >= sizePx() * snapPct;
      const velOk = dir * velocity > velocityClosePxS;
      if (movedOutward && (distOk || velOk)) setOpen(false);
    },
    [axis, dir, sizePx, snapPct, velocityClosePxS, setOpen]
  );

  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    prevFocusRef.current = document.activeElement as HTMLElement;

    const timer = setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;

      const focusable = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        panel.focus();
      }
    }, 100);

    const handleFocus = (e: FocusEvent) => {
      const panel = panelRef.current;
      if (!panel || !e.target) return;

      const target = e.target as Node;
      if (!panel.contains(target)) {
        e.preventDefault();
        const focusable = panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          panel.focus();
        }
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        e.stopPropagation();
        setOpen(false);
      }
    };

    document.addEventListener("focusin", handleFocus, true);
    window.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("focusin", handleFocus, true);
      window.removeEventListener("keydown", onKey);

      if (prevFocusRef.current && typeof prevFocusRef.current.focus === "function") {
        prevFocusRef.current.focus();
      }
    };
  }, [open, setOpen, closeOnEscape]);

  const { ...safeRest } = rest;

  return (
    <AnimatePresence
      onExitComplete={() => {
        if (lockScroll && pendingUnlockRef.current && bodyLockedRef.current) {
          pendingUnlockRef.current = false;
          bodyLockedRef.current = false;
          unlockBody();
        }
      }}
    >
      {open ? (
        <>
          <motion.div
            key="overlay"
            role="presentation"
            aria-hidden
            css={overlayCss}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitionMs ? timedTransition : { duration: 0.18, ease: "linear" }}
            onClick={onOverlayClick}
          />
          <motion.div
            key="panel"
            ref={(node: HTMLDivElement | null) => {
              panelRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            data-position={position}
            data-variant={variant}
            className={["plainframe-ui-drawer", className || ""].join(" ").trim()}
            css={[panelCss, userCss]}
            drag={axis}
            dragConstraints={dragConstraints}
            dragElastic={dragElastic}
            dragMomentum={false}
            dragDirectionLock
            onDragEnd={onDragEnd}
            initial={{ ...initialTranslate, opacity: 0.98 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{ ...initialTranslate, opacity: 0.98 }}
            transition={transitionMs ? timedTransition : springTransition}
            {...safeRest}
          >
            {children}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
});

DrawerContent.displayName = "DrawerContent";
