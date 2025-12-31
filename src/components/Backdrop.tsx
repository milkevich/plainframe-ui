/** @jsxImportSource @emotion/react */
import React, { useEffect, useRef, useState, useMemo } from "react";
import { css as emCss, type Interpolation } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import type { Theme } from "@emotion/react";

type BackdropProps = Omit<React.HTMLAttributes<HTMLDivElement>, "style"> & {
  on: boolean;
  onClickAway?: () => void;
  blur?: boolean;
  blurDepth?: number | string;
  color?: string;
  zIndex?: number;
  css?: Interpolation<Theme>;
  contentCss?: Interpolation<Theme>;
  overlayCss?: Interpolation<Theme>;
  children?: React.ReactNode;
  transitionDuration?: number;
  keepMounted?: boolean;
  className?: string;
  contentClassName?: string;
  lockScroll?: boolean;
};

export const Backdrop: React.FC<BackdropProps> = ({
  on,
  onClickAway,
  blur = false,
  blurDepth = 2.5,
  color,
  zIndex = 1000,
  css: userRootCss,
  contentCss: userContentCss,
  overlayCss: userOverlayCss,
  children,
  transitionDuration = 300,
  keepMounted = true,
  className,
  contentClassName,
  lockScroll = true,
  ...rest
}) => {
  const theme = usePlainframeUITheme();
  const overlayColor = useMemo(
    () => color ?? (theme.surface.overlayBg as string),
    [color, theme.surface.overlayBg]
  );

  const [visible, setVisible] = useState(on);
  const [show, setShow] = useState(on);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (on) {
      setVisible(true);
      rafRef.current = requestAnimationFrame(() => {
        setShow(true);
        rafRef.current = null;
      });
    } else {
      setShow(false);
      hideTimer.current = setTimeout(() => {
        setVisible(false);
        hideTimer.current = null;
      }, transitionDuration);
    }

    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [on, transitionDuration]);

  useEffect(() => {
    if (!lockScroll || !on) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const computedPad = parseFloat(getComputedStyle(body).paddingRight || "0");
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${computedPad + scrollbar}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
    };
  }, [on, lockScroll]);

  useEffect(() => {
    if (!show || !onClickAway) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClickAway();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [show, onClickAway]);

  const handleRootPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!show || !onClickAway) return;
    
    const dialog = contentRef.current?.querySelector('[role="dialog"]');
    if (dialog) {
      const rect = dialog.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        onClickAway();
      }
      return;
    }
    
    const target = e.target as HTMLElement;
    if (!target) return;
    if (!contentRef.current?.contains(target)) {
      onClickAway();
    }
  };

  const blurValue =
    blur && blurDepth
      ? typeof blurDepth === "number"
        ? `${blurDepth}px`
        : blurDepth
      : undefined;

  if (!keepMounted && !visible) return null;

  const rootBaseCss = emCss({
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100vh",
    zIndex,
    display: "grid",
    placeItems: "center",
    pointerEvents: show ? "auto" : "none",
    visibility: visible ? "visible" : "hidden",
  });

  const overlayBaseCss = emCss({
    position: "absolute",
    inset: 0,
    background: overlayColor,
    backdropFilter: blurValue ? `blur(${blurValue})` : undefined,
    WebkitBackdropFilter: blurValue ? `blur(${blurValue})` : undefined,
    opacity: show ? 1 : 0,
    transition: `opacity ${transitionDuration}ms cubic-bezier(.4,0,.2,1)`,
    pointerEvents: show ? "auto" : "none",
  });

  const contentBaseCss = emCss({
    position: "relative",
    zIndex: 1,
    pointerEvents: show ? "auto" : "none",
  });

  return (
    <div
      aria-hidden={!visible || undefined}
      className={["plainframe-ui-backdrop", className || ""].join(" ").trim()}
      css={[rootBaseCss, userRootCss]}
      onPointerDown={handleRootPointerDown}
      {...rest}
    >
      <div
        className="plainframe-ui-backdrop-overlay"
        css={[overlayBaseCss, userOverlayCss]}
        role="presentation"
      />
      <div
        ref={contentRef}
        className={[
          "plainframe-ui-backdrop-content",
          contentClassName || "",
        ]
          .join(" ")
          .trim()}
        css={[contentBaseCss, userContentCss]}
      >
        {children}
      </div>
    </div>
  );
};
