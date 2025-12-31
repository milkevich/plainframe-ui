/** @jsxImportSource @emotion/react */
import React, {
  useState,
  useEffect,
  useMemo,
  useContext,
  forwardRef,
  useCallback,
} from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { Backdrop } from "./Backdrop";
import { Slide } from "./Slide";
import { Fade } from "./Fade";
import { Grow } from "./Grow";
import { Container } from "./Container";
import { usePlainframeUITheme } from "../theme/ThemeProvider";

const toLen = (v?: number | string): string | undefined =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : v;

type ModalCtxT = {
  open: boolean;
  setOpen: (next: boolean) => void;
  lockScroll: boolean;
  closeOnEscape: boolean;
};
const ModalCtx = React.createContext<ModalCtxT | null>(null);
const useModalCtx = (): ModalCtxT => {
  const ctx = useContext(ModalCtx);
  if (!ctx) throw new Error("Modal components must be used within <Modal>.");
  return ctx;
};

export type ModalProps = {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  lockScroll?: boolean;
  closeOnEscape?: boolean;
};

export const Modal: React.FC<ModalProps> = ({
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

  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, closeOnEscape, setOpen]);

  const value = useMemo<ModalCtxT>(
    () => ({ open, setOpen, lockScroll, closeOnEscape }),
    [open, setOpen, lockScroll, closeOnEscape]
  );

  return <ModalCtx.Provider value={value}>{children}</ModalCtx.Provider>;
};

export type ModalTriggerProps = Omit<React.HTMLAttributes<HTMLElement>, "style"> & {
  asChild?: boolean;
  css?: Interpolation<Theme>;
};

export const ModalTrigger: React.ForwardRefExoticComponent<
  ModalTriggerProps & React.RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, ModalTriggerProps>(
  ({ asChild = true, children, className, css: userCss, ...rest }, ref) => {
    const { setOpen } = useModalCtx();
    const canAsChild = !!asChild && React.isValidElement(children);

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLElement>) => {
        if (canAsChild) {
          let onClick: ((ev: React.MouseEvent<HTMLElement>) => void) | undefined;
          if (React.isValidElement(children)) {
            onClick = (children.props as { onClick?: (ev: React.MouseEvent<HTMLElement>) => void })
              .onClick;
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
            onKeyDown = (children.props as { onKeyDown?: (ev: React.KeyboardEvent<HTMLElement>) => void })
              .onKeyDown;
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
      return React.cloneElement(child, {
        ...(child.props || {}),
        className: [child.props.className, className].filter(Boolean).join(" ") || undefined,
        css: [childCss, userCss].filter(Boolean),
        "aria-haspopup": "dialog",
        onClick: handleClick,
        onKeyDown: handleKeyDown,
        ...rest,
      });
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={className}
        css={userCss}
        aria-haspopup="dialog"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
ModalTrigger.displayName = "ModalTrigger";

export type ModalContentProps = Omit<React.HTMLAttributes<HTMLDivElement>, "style"> & {
  variant?: "inset" | "full";
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  padding?: number | string;
  backdrop?: boolean;
  backdropBlur?: boolean;
  backdropBlurDepth?: number;
  closeOnClickAway?: boolean;
  transitionVariant?: "fade" | "slide" | "grow" | "none";
  direction?: "up" | "down" | "left" | "right";
  transitionDuration?: number;
  containerCss?: Interpolation<Theme>;
  backdropCss?: Interpolation<Theme>;
  className?: string;
};

export const ModalContent: React.ForwardRefExoticComponent<
  ModalContentProps & React.RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, ModalContentProps>(
  (
    {
      children,
      variant = "inset",
      width = 500,
      height = "auto",
      radius = "lg",
      padding = "lg",
      backdrop = true,
      backdropBlur = true,
      backdropBlurDepth = 5,
      closeOnClickAway = true,
      transitionVariant = "fade",
      direction = "up",
      transitionDuration = 300,
      containerCss,
      backdropCss,
      className,
      ...rest
    },
    ref
  ) => {
    const theme = usePlainframeUITheme();
    const { open, setOpen, lockScroll } = useModalCtx();
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const prevFocusRef = React.useRef<HTMLElement | null>(null);

    React.useEffect(() => {
      if (!open) return;

      prevFocusRef.current = document.activeElement as HTMLElement;

      const timer = setTimeout(() => {
        const content = contentRef.current;
        if (!content) return;

        const focusable = content.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          content.focus();
        }
      }, 100);

      const handleFocus = (e: FocusEvent) => {
        const content = contentRef.current;
        if (!content || !e.target) return;

        const target = e.target as Node;
        if (!content.contains(target)) {
          e.preventDefault();
          const focusable = content.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          } else {
            content.focus();
          }
        }
      };

      document.addEventListener("focusin", handleFocus, true);

      return () => {
        clearTimeout(timer);
        document.removeEventListener("focusin", handleFocus, true);

        if (prevFocusRef.current && typeof prevFocusRef.current.focus === "function") {
          prevFocusRef.current.focus();
        }
      };
    }, [open]);

    const marginValue =
      typeof theme.spacing.sm === "number" ? `${theme.spacing.sm}px` : String(theme.spacing.sm);

    const insetMax =
      typeof theme.spacing.sm === "number"
        ? `calc(100% - ${theme.spacing.sm * 2}px)`
        : `calc(100% - (${marginValue} + ${marginValue}))`;

    const frameCss = css({
      width: "100%",
      height: toLen(height),
      maxWidth: variant === "inset" ? `min(${toLen(width) || "100%"}, ${insetMax})` : toLen(width),
      maxHeight: variant === "inset" ? insetMax : "100%",
      margin: variant === "inset" ? `${marginValue} auto` : undefined,
    });

    const panel = (
      <Container
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={["plainframe-ui-modal", className || ""].join(" ").trim()}
        padding={padding}
        radius={radius}
        variant="panel"
        css={[frameCss, containerCss]}
        ref={(node) => {
          contentRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        {...rest}
      >
        {children}
      </Container>
    );

    const animated =
      transitionVariant === "none" ? (
        panel
      ) : transitionVariant === "slide" ? (
        <Slide on={open} direction={direction} duration={transitionDuration}>
          {panel}
        </Slide>
      ) : transitionVariant === "grow" ? (
        <Grow initialScale={0.75} on={open} duration={transitionDuration}>
          {panel}
        </Grow>
      ) : (
        <Fade on={open} duration={transitionDuration}>
          {panel}
        </Fade>
      );

    if (!backdrop) return <>{animated}</>;

    const backdropLayoutCss = css({
      position: "fixed",
      inset: 0,
      width: "100vw",
      height: "100vh",
      margin: 0,
      maxWidth: "100vw",
      maxHeight: "100vh",
      display: "flex",
      alignItems: variant === "full" ? "flex-start" : "center",
      justifyContent: variant === "full" ? "flex-start" : "center",
    });

    const contentLayoutCss = css({
      display: "flex",
      alignItems: variant === "full" ? "flex-start" : "center",
      justifyContent: variant === "full" ? "flex-start" : "center",
      ...(variant === "full" && {
        width: "100%",
        height: "100%",
      }),
    });

    return (
      <Backdrop
        on={open}
        blur={backdropBlur}
        blurDepth={backdropBlurDepth}
        onClickAway={closeOnClickAway ? () => setOpen(false) : undefined}
        css={[backdropLayoutCss, backdropCss].filter(Boolean)}
        contentCss={contentLayoutCss}
        lockScroll={lockScroll}
      >
        {animated}
      </Backdrop>
    );
  }
);
ModalContent.displayName = "ModalContent";
