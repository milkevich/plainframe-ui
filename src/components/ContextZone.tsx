/** @jsxImportSource @emotion/react */
import React from "react";
import { css } from "@emotion/react";

type TriggerMode = "contextmenu" | "dblclick" | "click" | "hover";

type ContextZoneProps = {
  children: React.ReactNode;
  content?: React.ReactNode | ((api: { close: () => void }) => React.ReactNode);
  trigger?: TriggerMode;
  onOpenChange?: (open: boolean) => void;
  hoverOpenDelay?: number;
  hoverCloseDelay?: number;
  hoverPosition?: "cursor" | "center";
  hoverOffset?: number;
};

const getName = (n: unknown): string => {
  if (
    typeof n === "object" &&
    n !== null &&
    "type" in n &&
    (n as { type?: unknown }).type
  ) {
    const type = (n as { type: unknown }).type;
    if (typeof type === "object" && type !== null) {
      return (type as { displayName?: string })?.displayName || (type as { name?: string })?.name || "";
    }
    if (typeof type === "function") {
      return (type as { displayName?: string })?.displayName || (type as { name?: string })?.name || "";
    }
    return "";
  }
  return "";
};

const hasDropdownNodes = (node: unknown): boolean => {
  if (
    !node ||
    typeof node !== "object"
  )
    return false;
  const name = getName(node);
  if (name === "DropdownMenu" || name === "DropdownMenuContent") return true;
  const props = (node as React.ReactElement | null)?.props;
  const kids =
    props && typeof props === "object" && props !== null && "children" in props
      ? (props as { children?: unknown }).children
      : undefined;
  if (kids == null) return false;
  return Array.isArray(kids) ? kids.some(hasDropdownNodes) : hasDropdownNodes(kids);
};

export const ContextZone: React.FC<ContextZoneProps> = ({
  children,
  content,
  trigger = "contextmenu",
  onOpenChange,
  hoverPosition = "cursor",
  hoverOffset = 10,
}) => {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const setAndNotify = React.useCallback(
    (o: boolean) => {
      setOpen(o);
      onOpenChange?.(o);
    },
    [onOpenChange]
  );
  const close = React.useCallback(() => setAndNotify(false), [setAndNotify]);

  const ptRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const shellRef = React.useRef<HTMLDivElement | null>(null);
  const rafId = React.useRef<number | null>(null);

  const flush = React.useCallback(() => {
    rafId.current = null;
    const el = shellRef.current;
    if (!el) return;
    const x = Math.round(ptRef.current.x);
    const y = Math.round(ptRef.current.y);
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  const requestFlush = React.useCallback(() => {
    if (rafId.current != null) return;
    rafId.current = requestAnimationFrame(flush);
  }, [flush]);

  React.useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const virtualAnchor = React.useMemo(
    () => ({
      getBoundingClientRect: () => {
        const x = Math.round(ptRef.current.x);
        const y = Math.round(ptRef.current.y);
        return { x, y, left: x, top: y, right: x, bottom: y, width: 0, height: 0, toJSON: () => ({ x, y }) } as DOMRect;
      },
    }),
    []
  );

  const czIdRef = React.useRef(`cz-${Math.random().toString(36).slice(2)}`);
  const getMenuEl = React.useCallback(
    () =>
      typeof document !== "undefined"
        ? (document.querySelector(`[data-cz-id="${czIdRef.current}"]`) as HTMLElement | null)
        : null,
    []
  );

  const openT = React.useRef<number | null>(null);
  const closeT = React.useRef<number | null>(null);
  const clearOpenT = React.useCallback(() => {
    if (openT.current != null) clearTimeout(openT.current);
    openT.current = null;
  }, []);
  const clearCloseT = React.useCallback(() => {
    if (closeT.current != null) clearTimeout(closeT.current);
    closeT.current = null;
  }, []);
  const scheduleClose = React.useCallback(() => {
    clearCloseT();
    closeT.current = window.setTimeout(() => setAndNotify(false), 0);
  }, [clearCloseT, setAndNotify]);

  const centerOfHost = React.useCallback(() => {
    const r = hostRef.current?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: 0, y: 0 };
  }, []);

  const openAt = React.useCallback(
    (x: number, y: number) => {
      ptRef.current = { x, y };
      requestFlush();
      setAndNotify(true);
    },
    [requestFlush, setAndNotify]
  );

  const rendered = typeof content === "function" ? content({ close }) : content;
  const isMenuTree = hasDropdownNodes(rendered);

  const injectForMenu = (node: React.ReactNode): React.ReactNode => {
    if (!React.isValidElement(node)) return node;
    const name = getName(node);
    const element = node as React.ReactElement<any>;
    const kids = element.props.children;
    const nextChildren =
      kids == null
        ? kids
        : Array.isArray(kids)
        ? kids.map(child => (React.isValidElement(child) ? injectForMenu(child) : child))
        : React.isValidElement(kids)
        ? injectForMenu(kids)
        : kids;

    if (name === "DropdownMenu") {
      const prev = element.props.onOpenChange as ((o: boolean) => void) | undefined;
      return React.cloneElement<typeof element.props>(element, {
        ...element.props,
        open,
        onOpenChange: (o: boolean) => {
          prev?.(o);
          setAndNotify(o);
        },
        children: nextChildren,
      });
    }
    if (name === "DropdownMenuContent") {
      const prevEnter = element.props.onMouseEnter as ((e: React.MouseEvent) => void) | undefined;
      const prevLeave = element.props.onMouseLeave as ((e: React.MouseEvent) => void) | undefined;
      return React.cloneElement<typeof element.props>(element, {
        ...element.props,
        anchor: virtualAnchor,
        "data-cz-id": czIdRef.current,
        onMouseEnter: (e: React.MouseEvent) => {
          clearCloseT();
          prevEnter?.(e);
        },
        onMouseLeave: (e: React.MouseEvent) => {
          scheduleClose();
          prevLeave?.(e);
        },
        children: nextChildren,
      });
    }
    return nextChildren === kids ? element : React.cloneElement<typeof element.props>(element, { ...element.props, children: nextChildren });
  };

  const wired = isMenuTree ? injectForMenu(rendered) : rendered;

  const handleNonHoverOpen = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      openAt(e.clientX, e.clientY);
    },
    [openAt]
  );

  const onContextMenu = React.useCallback(
    (e: React.MouseEvent) => {
      if (trigger === "contextmenu") handleNonHoverOpen(e);
    },
    [trigger, handleNonHoverOpen]
  );

  const onDoubleClick = React.useCallback(
    (e: React.MouseEvent) => {
      if (trigger === "dblclick") handleNonHoverOpen(e);
    },
    [trigger, handleNonHoverOpen]
  );

  const onClick = React.useCallback(
    (e: React.MouseEvent) => {
      if (trigger === "click") handleNonHoverOpen(e);
    },
    [trigger, handleNonHoverOpen]
  );

  const onMouseEnter = React.useCallback(
    (e: React.MouseEvent) => {
      if (trigger !== "hover") return;
      clearOpenT();
      clearCloseT();
      const base = hoverPosition === "center" ? centerOfHost() : { x: e.clientX, y: e.clientY };
      openT.current = window.setTimeout(() => {
        const x = base.x + (hoverPosition === "cursor" ? hoverOffset : 0);
        const y = base.y + (hoverPosition === "cursor" ? hoverOffset : 0);
        openAt(x, y);
      }, 0);
    },
    [trigger, hoverPosition, hoverOffset, centerOfHost, openAt, clearOpenT, clearCloseT]
  );

  const onMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (trigger !== "hover") return;
      if (open && hoverPosition === "cursor" && !isMenuTree) {
        ptRef.current = { x: e.clientX + hoverOffset, y: e.clientY + hoverOffset };
        requestFlush();
      }
    },
    [trigger, open, hoverPosition, isMenuTree, hoverOffset, requestFlush]
  );

  const onMouseLeave = React.useCallback(() => {
    if (trigger !== "hover") return;
    clearOpenT();
    scheduleClose();
  }, [trigger, clearOpenT, scheduleClose]);

  React.useEffect(() => {
    if (trigger !== "hover") return;
    const onMove = () => {
      if (!open) return;
      const hostHovered = hostRef.current?.matches(":hover");
      const menuHovered = getMenuEl()?.matches?.(":hover");
      if (hostHovered || menuHovered) clearCloseT();
      else scheduleClose();
    };
    window.addEventListener("pointermove", onMove, { passive: true, capture: true });
    return () => window.removeEventListener("pointermove", onMove, { capture: true });
  }, [open, trigger, getMenuEl, clearCloseT, scheduleClose]);

  React.useEffect(() => {
    const onScrollResize = () => {
      if (!open) return;
      if (trigger === "hover") {
        const hostHovered = hostRef.current?.matches(":hover");
        const menuHovered = getMenuEl()?.matches?.(":hover");
        if (hostHovered || menuHovered) clearCloseT();
        else scheduleClose();
        if (hoverPosition === "center" && hostRef.current) {
          const c = centerOfHost();
          ptRef.current = { x: c.x, y: c.y };
          requestFlush();
        }
      } else {
        setAndNotify(false);
      }
    };
    window.addEventListener("scroll", onScrollResize, true);
    window.addEventListener("resize", onScrollResize, true);
    return () => {
      window.removeEventListener("scroll", onScrollResize, true);
      window.removeEventListener("resize", onScrollResize, true);
    };
  }, [open, trigger, hoverPosition, centerOfHost, requestFlush, setAndNotify, clearCloseT, scheduleClose, getMenuEl]);

  React.useEffect(() => {
    return () => {
      clearOpenT();
      clearCloseT();
    };
  }, [clearOpenT, clearCloseT]);

  const FloatingShell: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    open ? (
      <div
        ref={shellRef}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          transform: `translate3d(${Math.round(ptRef.current.x)}px, ${Math.round(ptRef.current.y)}px, 0)`,
          willChange: "transform",
          zIndex: 1000,
          pointerEvents: "auto",
        }}
        onMouseEnter={() => trigger === "hover" && clearCloseT()}
        onMouseLeave={() => trigger === "hover" && scheduleClose()}
      >
        {children}
      </div>
    ) : null;

  return (
    <div
      ref={hostRef}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      css={css({ position: "relative" })}
      className="plainframe-ui-context-zone-wrapper"
    >
      {children}
      {isMenuTree ? wired : <FloatingShell>{wired}</FloatingShell>}
    </div>
  );
};
