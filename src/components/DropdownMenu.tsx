/** @jsxImportSource @emotion/react */
import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useContext,
  createContext,
  cloneElement,
  useCallback,
  isValidElement,
  useLayoutEffect,
} from "react";
import { css as emCss, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import {
  useFloating,
  flip,
  shift,
  offset as offsetMw,
  size as sizeMw,
  autoUpdate,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  type Placement,
} from "@floating-ui/react";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import { DenseCtx } from "./Menu";
import { mergeRefs as mergeRefsFromPopover } from "./Popover";
import { cancelSubMenuClose } from "./MenuItems";

type PFUIActiveScope = { id: string; depth: number; ts: number };

const markPFUIActiveScopeFrom = (node: HTMLElement | null): void => {
  if (!node || typeof window === "undefined") return;

  const owned = node.closest('[data-pfui-portal-owner]') as HTMLElement | null;
  const wrapper = node.closest('[data-pfui-scope]') as HTMLElement | null;

  const id =
    owned?.getAttribute("data-pfui-portal-owner") ??
    wrapper?.getAttribute("data-pfui-scope") ??
    undefined;

  if (!id) return;

  (window as any).__pfuiActiveScope = { id, depth: 0, ts: Date.now() } as PFUIActiveScope;
};


export const mergeRefs = mergeRefsFromPopover;

let __scrollLocks = 0;
let __prevOverflow: string | null = null;
let __prevPaddingRight: string | null = null;

const getScrollbarWidth = (): number =>
  typeof window === "undefined" || typeof document === "undefined"
    ? 0
    : window.innerWidth - document.documentElement.clientWidth;

function lockBodyScroll(): void {
  if (typeof document === "undefined") return;
  if (__scrollLocks === 0) {
    const body = document.body;
    __prevOverflow = body.style.overflow || "";
    __prevPaddingRight = body.style.paddingRight || "";
    const sw = getScrollbarWidth();
    body.style.overflow = "hidden";
    if (sw > 0) body.style.paddingRight = `${sw}px`;
  }
  __scrollLocks += 1;
}
function unlockBodyScroll(): void {
  if (typeof document === "undefined") return;
  if (__scrollLocks > 0) __scrollLocks -= 1;
  if (__scrollLocks === 0) {
    const body = document.body;
    if (__prevOverflow !== null) body.style.overflow = __prevOverflow;
    if (__prevPaddingRight !== null) body.style.paddingRight = __prevPaddingRight;
    __prevOverflow = null;
    __prevPaddingRight = null;
  }
}

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";
export type TriggerMode = "click" | "hover";

type VirtualRefLike = {
  getBoundingClientRect: () => DOMRect | ClientRect;
  contextElement?: Element;
};
type PointAnchor = { x: number; y: number };
type Anchor = HTMLElement | VirtualRefLike | PointAnchor;

export type DropdownMenuRootProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: TriggerMode;
  lockScroll?: boolean;
  size?: "sm" | "md";
  children: React.ReactNode;
};

export type DropdownMenuTriggerProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  "style"
> & {
  asChild?: boolean;
  children: React.ReactElement | React.ReactNode;
  width?: string | number;
  css?: Interpolation<Theme>;
};

export type DropdownMenuContentProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "style"
> & {
  anchor?: Anchor;
  side?: Side;
  align?: Align;
  sideOffset?: number | string;
  alignOffset?: number | string;
  collisionPadding?: number | string;
  sameWidth?: boolean;
  width?: number | string;
  height?: number | string;
  maxHeight?: number | string;
  unstyled?: boolean;
  closeOnBlur?: boolean;
  allItemsTabbable?: boolean;
  exitPlacement?: Side;
  animateOnBusClose?: boolean;
  gap?: "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | string | number;
  css?: Interpolation<Theme>;
  
  ignoreOutsidePressRefs?: React.RefObject<HTMLElement | null>[];
  
  disableOutsidePressDismiss?: boolean;
  
  returnFocus?: boolean;
};

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  trigger: TriggerMode;
  referenceRef: React.MutableRefObject<HTMLElement | null>;
  listRef: React.MutableRefObject<Array<HTMLElement | null>>;
  
  setActiveIndex: React.Dispatch<React.SetStateAction<number | null>>;
  scheduleSubmenuHover: (shouldOpen: boolean, delay?: number) => void;
  clearSubmenuHover: () => void;
  pendingOpenRef?: React.MutableRefObject<boolean>;
  floatingRef?: React.MutableRefObject<HTMLElement | null>;
  menuId?: string;
};
export const MenuCtx: React.Context<Ctx | null> = createContext<Ctx | null>(null);
const useMenu = (): Ctx => {
  const v = useContext(MenuCtx);
  if (!v) throw new Error("DropdownMenu components must be used inside <DropdownMenu>.");
  return v;
};


type ActiveIndexCtx = {
  activeIndex: number | null;
  setActiveIndex: React.Dispatch<React.SetStateAction<number | null>>;
};
export const ActiveIndexContext = createContext<ActiveIndexCtx | null>(null);
export const useActiveIndex = () => useContext(ActiveIndexContext);


type KeyboardNavCtx = {
  isKeyboardNav: boolean;
  setIsKeyboardNav: (v: boolean) => void;
};
export const KeyboardNavContext = createContext<KeyboardNavCtx | null>(null);
export const useKeyboardNav = () => useContext(KeyboardNavContext);


type SubMenuCloserCtx = {
  registerSubMenu: (close: () => void) => () => void;
  closeAllSubMenus: () => void;
};
export const SubMenuCloserContext = createContext<SubMenuCloserCtx | null>(null);
export const useSubMenuCloser = () => useContext(SubMenuCloserContext);


const IsInsideSubmenuContext = createContext<boolean>(false);
const useIsInsideSubmenu = () => useContext(IsInsideSubmenuContext);

export const FocusCtx: React.Context<{ allItemsTabbable: boolean }> =
  createContext<{ allItemsTabbable: boolean }>({
    allItemsTabbable: true,
  });

type RootHoverCtl = { clear: () => void; schedule: (d?: number) => void };

type RootBus = {
  registerCloser: (fn: () => void) => () => void;
  closeAll: () => void;
  registerHoverCtl: (ctl: RootHoverCtl) => () => void;
  clearAllHover: () => void;
  isBusClosingRef: { current: boolean };
};
export const RootBusCtx: React.Context<RootBus | null> = React.createContext<RootBus | null>(null);
const useRootBus = (): RootBus | null => useContext(RootBusCtx);

export function createRootBus(): RootBus {
  const closers: Array<() => void> = [];
  const hovers = new Set<RootHoverCtl>();
  const isBusClosingRef = { current: false };
  return {
    registerCloser(fn: () => void) {
      closers.push(fn);
      return () => {
        const i = closers.indexOf(fn);
        if (i >= 0) closers.splice(i, 1);
      };
    },
    closeAll() {
      if (isBusClosingRef.current) return;
      isBusClosingRef.current = true;
      for (let i = closers.length - 1; i >= 0; i--) {
        try {
          closers[i]();
        } catch {  }
      }
      queueMicrotask(() => {
        isBusClosingRef.current = false;
      });
    },
    registerHoverCtl(ctl: RootHoverCtl) {
      hovers.add(ctl);
      return () => hovers.delete(ctl);
    },
    clearAllHover() {
      hovers.forEach((h) => h.clear());
    },
    isBusClosingRef,
  };
}

export const useDropdownMenuActiveIndex: () => number | null = (): number | null =>
  useActiveIndex()?.activeIndex ?? null;


let menuIdCounter = 0;

export const DropdownMenu: React.FC<DropdownMenuRootProps> = ({
  open: controlled,
  defaultOpen,
  onOpenChange,
  trigger = "click",
  lockScroll = true,
  size = "md",
  children,
}) => {
  const [uncontrolled, setUncontrolled] = useState<boolean>(!!defaultOpen);
  const open = controlled ?? uncontrolled;
  const setOpen = useCallback(
  (v: boolean): void => {
    if (v) markPFUIActiveScopeFrom(referenceRef.current);
    if (controlled === undefined) setUncontrolled(v);
    onOpenChange?.(v);
  },
  [controlled, onOpenChange]
);

  const menuIdRef = useRef<string>(`pfui-menu-${++menuIdCounter}`);
  const referenceRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<Array<HTMLElement | null>>([]);
  const floatingRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isKeyboardNav, setIsKeyboardNav] = useState(false);

  
  useEffect(() => {
    if (!open) {
      setActiveIndex(null);
      listRef.current = [];
      setIsKeyboardNav(false);
    }
  }, [open]);

  const hoverTimeoutRef = useRef<number | null>(null);
  const scheduleSubmenuHover = useCallback(
    (shouldOpen: boolean, delay?: number): void => {
      if (trigger !== "hover") return;
      window.clearTimeout(hoverTimeoutRef.current ?? 0);
      const finalDelay = delay ?? 20;
      hoverTimeoutRef.current = window.setTimeout(() => setOpen(shouldOpen), finalDelay);
    },
    [trigger, setOpen]
  );
  const clearSubmenuHover = useCallback((): void => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);
  useEffect(() => () => clearSubmenuHover(), [clearSubmenuHover]);

  useEffect(() => {
    if (!lockScroll || !open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open, lockScroll]);

  const parentBus = useRootBus();
  const [bus] = useState<RootBus>(() => parentBus ?? createRootBus());

  
  const subMenuClosersRef = useRef<Set<() => void>>(new Set());
  const subMenuCloserValue = useMemo<SubMenuCloserCtx>(() => ({
    registerSubMenu: (close: () => void) => {
      subMenuClosersRef.current.add(close);
      return () => subMenuClosersRef.current.delete(close);
    },
    closeAllSubMenus: () => {
      subMenuClosersRef.current.forEach(close => close());
    },
  }), []);

  const value = useMemo<Ctx>(
    () => ({
      open,
      setOpen,
      trigger,
      referenceRef,
      listRef,
      floatingRef,
      
      setActiveIndex,
      scheduleSubmenuHover,
      clearSubmenuHover,
      menuId: menuIdRef.current,
    }),
    [open, setOpen, trigger, setActiveIndex, scheduleSubmenuHover, clearSubmenuHover]
  );

  
  const activeIndexValue = useMemo<ActiveIndexCtx>(
    () => ({ activeIndex, setActiveIndex }),
    [activeIndex, setActiveIndex]
  );

  
  const keyboardNavValue = useMemo<KeyboardNavCtx>(
    () => ({ isKeyboardNav, setIsKeyboardNav }),
    [isKeyboardNav]
  );

  const denseFlag = size === "sm";

  return (
    <RootBusCtx.Provider value={bus}>
      <DenseCtx.Provider value={denseFlag}>
        <KeyboardNavContext.Provider value={keyboardNavValue}>
          <SubMenuCloserContext.Provider value={subMenuCloserValue}>
            <ActiveIndexContext.Provider value={activeIndexValue}>
              <MenuCtx.Provider value={value}>{children}</MenuCtx.Provider>
            </ActiveIndexContext.Provider>
          </SubMenuCloserContext.Provider>
        </KeyboardNavContext.Provider>
      </DenseCtx.Provider>
    </RootBusCtx.Provider>
  );
};
DropdownMenu.displayName = "DropdownMenu";

export const DropdownMenuTrigger: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<DropdownMenuTriggerProps> & React.RefAttributes<HTMLElement>
> = React.forwardRef<HTMLElement, DropdownMenuTriggerProps>(
  ({ asChild = true, children, width, className, css: userCss, ...rest }, ref) => {
    const {
      open,
      setOpen,
      trigger,
      referenceRef,
      listRef,
      setActiveIndex,
      scheduleSubmenuHover,
      clearSubmenuHover,
      floatingRef,
      menuId,
    } = useMenu();
    const keyboardNav = useKeyboardNav();
    const subMenuCloser = useSubMenuCloser();

    const canAsChild = !!asChild && isValidElement(children);
    const childEl = canAsChild ? (children as React.ReactElement) : null;
    const childOnKeyDown =
      childEl && childEl.props && typeof childEl.props === "object" && "onKeyDown" in childEl.props
        ? (childEl.props.onKeyDown as ((e: React.KeyboardEvent) => void) | undefined)
        : undefined;
    const childOnClick =
      childEl && childEl.props && typeof childEl.props === "object" && "onClick" in childEl.props
        ? (childEl.props.onClick as ((e: React.MouseEvent) => void) | undefined)
        : undefined;

    type RestWithHandlers = typeof rest & {
      onKeyDown?: (e: React.KeyboardEvent) => void;
      onClick?: (e: React.MouseEvent) => void;
    };
    const { onKeyDown: propOnKeyDown, onClick: propOnClick, ...restProps } = rest as RestWithHandlers;

    const setRefs = useMemo(
      () =>
        mergeRefs<HTMLElement | null>(
          ref,
          canAsChild && isValidElement(children) && "ref" in children
            ? (children.ref as React.Ref<HTMLElement> | undefined)
            : undefined,
          (referenceRef as unknown) as React.Ref<HTMLElement | null>
        ),
      [ref, canAsChild, children, referenceRef]
    );

    const nodes = useCallback((): HTMLElement[] => listRef.current.filter(Boolean) as HTMLElement[], [listRef]);

    const focusIdx = useCallback(
      (idx: number): void => {
        const list = nodes();
        requestAnimationFrame(() => list[idx]?.focus());
      },
      [nodes]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent): void => {
        
        if (e.key === "Tab" && open) {
          e.preventDefault();
          keyboardNav?.setIsKeyboardNav(true);
          const menu = floatingRef?.current;
          if (menu) {
            menu.setAttribute('data-keyboard-nav', '');
            const firstItem = menu.querySelector<HTMLElement>(
              '[role="menuitem"]:not([aria-disabled="true"]):not([data-disabled]), [role="menuitemcheckbox"]:not([aria-disabled="true"]):not([data-disabled]), [role="menuitemradio"]:not([aria-disabled="true"]):not([data-disabled])'
            );
            if (firstItem) {
              document.querySelectorAll('[data-highlighted]').forEach(el => el.removeAttribute('data-highlighted'));
              firstItem.setAttribute('data-highlighted', '');
              firstItem.focus();
            }
          }
          return;
        }

        if (e.key === "ArrowRight" && open) {
          const hoveredSubTrigger = document.querySelector('[data-subtrigger][data-hovered]') as HTMLElement | null;
          if (hoveredSubTrigger) {
            e.preventDefault();
            e.stopPropagation();
            keyboardNav?.setIsKeyboardNav(true);
            
            hoveredSubTrigger.removeAttribute('data-hovered');
            hoveredSubTrigger.setAttribute('data-highlighted', '');
            hoveredSubTrigger.focus();
            
            requestAnimationFrame(() => {
              const keyEvent = new KeyboardEvent('keydown', {
                key: 'ArrowRight',
                bubbles: true,
                cancelable: true
              });
              hoveredSubTrigger.dispatchEvent(keyEvent);
            });
            return;
          }
        }

        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          keyboardNav?.setIsKeyboardNav(true);
          
          if (!open) {
            e.preventDefault();
            setOpen(true);
            requestAnimationFrame(() => {
              const menuElement = menuId ? document.querySelector(`[data-menu-id="${menuId}"]`) as HTMLElement | null : floatingRef?.current;

              if (menuElement) {
                
                menuElement.setAttribute('data-keyboard-nav', '');
                
                
                const items = Array.from(
                  menuElement.querySelectorAll<HTMLElement>(
                    '[role="menuitem"]:not([aria-disabled="true"]):not([data-disabled]), [role="menuitemcheckbox"]:not([aria-disabled="true"]):not([data-disabled]), [role="menuitemradio"]:not([aria-disabled="true"]):not([data-disabled])'
                  )
                ).filter(el => {
                  
                  const submenuParent = el.closest('[data-submenu-content]');
                  if (submenuParent && submenuParent !== menuElement) return false;

                  const style = window.getComputedStyle(el);
                  return style.display !== 'none' && style.visibility !== 'hidden';
                });

                if (items.length > 0) {
                  const targetIdx = e.key === "ArrowDown" ? 0 : items.length - 1;
                  setActiveIndex(targetIdx);
                  items[targetIdx]?.setAttribute('data-highlighted', '');
                  items[targetIdx]?.focus();
                }
              }
            });
            childOnKeyDown?.(e);
            propOnKeyDown?.(e);
            return;
          }
          
          if (open) {
            e.preventDefault();
            
            
            const allHovered = document.querySelectorAll('[data-hovered]');
            for (const hovered of Array.from(allHovered)) {
              const submenuContent = hovered.closest('[data-submenu-content]');
              if (submenuContent) {
                
                const submenuMenu = hovered.closest('[role="menu"]') as HTMLElement;
                if (submenuMenu) {
                  submenuMenu.setAttribute('data-keyboard-nav', '');
                  
                  const submenuItems = Array.from(
                    submenuMenu.querySelectorAll<HTMLElement>(
                      '[role="menuitem"]:not([aria-disabled="true"]):not([data-disabled])'
                    )
                  ).filter(el => {
                    if (el.closest('[role="menu"]') !== submenuMenu) return false;
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' && style.visibility !== 'hidden';
                  });
                  
                  const curIdx = submenuItems.indexOf(hovered as HTMLElement);
                  document.querySelectorAll('[data-highlighted]').forEach(item => item.removeAttribute('data-highlighted'));
                  (hovered as HTMLElement).removeAttribute('data-hovered');
                  
                  if (curIdx !== -1 && submenuItems.length > 0) {
                    const delta = e.key === "ArrowDown" ? 1 : -1;
                    const nextIdx = (curIdx + delta + submenuItems.length) % submenuItems.length;
                    submenuItems[nextIdx]?.setAttribute('data-highlighted', '');
                    submenuItems[nextIdx]?.focus();
                  }
                  return;
                }
              }
            }
            
            
            const targetMenu = menuId ? document.querySelector(`[data-menu-id="${menuId}"]`) as HTMLElement | null : floatingRef?.current;

            if (targetMenu) {
              
              targetMenu.setAttribute('data-keyboard-nav', '');
              
              
              subMenuCloser?.closeAllSubMenus();
              
              const items = Array.from(
                targetMenu.querySelectorAll<HTMLElement>(
                  '[role="menuitem"]:not([aria-disabled="true"]):not([data-disabled]), [role="menuitemcheckbox"]:not([aria-disabled="true"]):not([data-disabled]), [role="menuitemradio"]:not([aria-disabled="true"]):not([data-disabled])'
                )
              ).filter(el => {
                
                if (el.closest('[role="menu"]') !== targetMenu) return false;
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden';
              });

              if (items.length > 0) {
                
                const highlightedInMenu = targetMenu.querySelector('[data-highlighted]') as HTMLElement | null;
                const hoveredInMenu = targetMenu.querySelector('[data-hovered]') as HTMLElement | null;
                
                let currentIndex = -1;
                if (highlightedInMenu) {
                  currentIndex = items.indexOf(highlightedInMenu);
                } else if (hoveredInMenu) {
                  currentIndex = items.indexOf(hoveredInMenu);
                }
                
                
                document.querySelectorAll('[data-highlighted]').forEach(el => el.removeAttribute('data-highlighted'));
                if (hoveredInMenu) {
                  hoveredInMenu.removeAttribute('data-hovered');
                }

                if (currentIndex === -1) {
                  currentIndex = e.key === "ArrowDown" ? -1 : items.length;
                }

                const delta = e.key === "ArrowDown" ? 1 : -1;
                const nextIndex = (currentIndex + delta + items.length) % items.length;

                setActiveIndex(nextIndex);
                items[nextIndex]?.setAttribute('data-highlighted', '');
                items[nextIndex]?.focus();
              }
            }
            childOnKeyDown?.(e);
            propOnKeyDown?.(e);
            return;
          }
        }

        if ((e.key === "Enter" || e.key === " ") && !open) {
          e.preventDefault();
          keyboardNav?.setIsKeyboardNav(true);
          setOpen(true);
          
          requestAnimationFrame(() => {
            
            const menuElement = menuId ? document.querySelector(`[data-menu-id="${menuId}"]`) as HTMLElement | null : floatingRef?.current;

            if (menuElement) {
              
              menuElement.setAttribute('data-keyboard-nav', '');
              
              
              const items = Array.from(
                menuElement.querySelectorAll<HTMLElement>(
                  '[role="menuitem"]:not([aria-disabled="true"]):not([data-disabled]), [role="menuitemcheckbox"]:not([aria-disabled="true"]):not([data-disabled]), [role="menuitemradio"]:not([aria-disabled="true"]):not([data-disabled])'
                )
              ).filter(el => {
                
                const submenuParent = el.closest('[data-submenu-content]');
                if (submenuParent && submenuParent !== menuElement) return false;

                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden';
              });

              if (items.length > 0) {
                setActiveIndex(0);
                items[0]?.setAttribute('data-highlighted', '');
                items[0]?.focus();
              }
            }
          });
          childOnKeyDown?.(e);
          propOnKeyDown?.(e);
          return;
        }

        childOnKeyDown?.(e);
        propOnKeyDown?.(e);
      },
      [open, setOpen, setActiveIndex, childOnKeyDown, propOnKeyDown, nodes, focusIdx, listRef, keyboardNav, menuId, floatingRef, subMenuCloser]
    );

    const handleClick = useCallback(
      (e: React.MouseEvent): void => {
        if (trigger === "click") {
          const nativeEvent = e.nativeEvent as Event & { composedPath?: () => EventTarget[] };
          const path: EventTarget[] = nativeEvent.composedPath?.() ?? [];
          const clickedTextEntry = path.some((target: EventTarget) => {
            const el = target as Element | null;
            if (!el || !("tagName" in el)) return false;
            const t = String(el.tagName).toUpperCase();
            if (t === "INPUT" || t === "TEXTAREA") return true;
            if ("isContentEditable" in el && el.isContentEditable) return true;
            const role = "getAttribute" in el ? el.getAttribute("role") : null;
            return role === "textbox" || role === "combobox";
          });
          if (!clickedTextEntry) {
            e.stopPropagation();
            setOpen(!open);
          }
        }
        childOnClick?.(e);
        propOnClick?.(e);
      },
      [trigger, open, setOpen, childOnClick, propOnClick]
    );

    const hoverProps =
      trigger === "hover"
        ? {
          onMouseEnter: () => {
            clearSubmenuHover();
            setOpen(true);
          },
          onMouseLeave: () => {
            scheduleSubmenuHover(false);
          },
        }
        : {};

    const widthCss =
      width != null
        ? emCss({
          width: typeof width === "number" ? `${width}px` : width,
        })
        : undefined;

    if (canAsChild && childEl) {
      const childProps = childEl.props as Record<string, unknown>;
      const childCss = childProps.css;
      const childClassName = typeof childProps.className === "string" ? childProps.className : undefined;
      const childTabIndex = typeof childProps.tabIndex === "number" ? childProps.tabIndex : 0;

      const cloneProps: Record<string, unknown> = {
        ref: setRefs,
        tabIndex: childTabIndex,
        className: [childClassName, className].filter(Boolean).join(" ") || undefined,
        css: [childCss, widthCss, userCss].filter(Boolean),
        "aria-haspopup": "menu",
        "aria-expanded": open,
        onClick: handleClick,
        onKeyDown: handleKeyDown,
        ...hoverProps,
        ...restProps,
      };

      return cloneElement(childEl, cloneProps);
    }

    return (
      <button
        ref={setRefs}
        className={className}
        css={[emCss({ display: "inline-block" }), widthCss, userCss]}
        type="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...hoverProps}
        {...restProps}
      >
        {children}
      </button>
    );
  }
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

type MotionTransitions = Transition & {
  scale?: Transition;
  x?: Transition;
  y?: Transition;
  opacity?: Transition;
};

export const DropdownMenuContent: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<DropdownMenuContentProps> & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  (
    {
      anchor,
      side = "bottom",
      align = "start",
      sideOffset = 6,
      alignOffset = 0,
      collisionPadding = 8,
      sameWidth = false,
      width,
      height,
      maxHeight,
      unstyled = false,
      closeOnBlur = false,
      allItemsTabbable = false,
      className,
      css: userCss,
      children,
      exitPlacement,
      animateOnBusClose = true,
      gap,
      ignoreOutsidePressRefs,
      disableOutsidePressDismiss = false,
      returnFocus = false,
      ...rest
    },
    ref
  ) => {
    const {
      open,
      setOpen,
      referenceRef,
      clearSubmenuHover,
      setActiveIndex,
      floatingRef,
      menuId,
    } = useMenu();
    const theme = usePlainframeUITheme();
    const rootBus = useRootBus();
    const keyboardNav = useKeyboardNav();

    useEffect(() => {
      if (!rootBus) return;
      const off = rootBus.registerCloser(() => setOpen(false));
      return () => {
        if (off) off();
      };
    }, [rootBus, setOpen]);

    const so = typeof sideOffset === "string" ? parseFloat(sideOffset) : sideOffset;
    const ao = typeof alignOffset === "string" ? parseFloat(alignOffset) : alignOffset;
    const cp =
      typeof collisionPadding === "string" ? parseFloat(collisionPadding) : collisionPadding;
    const placement = `${side}${align === "center" ? "" : `-${align}`}` as Placement;

    const virtualFromPoint = useCallback(
      (p: { x: number; y: number }): VirtualRefLike => ({
        getBoundingClientRect: () => {
          const x = Math.round(p.x);
          const y = Math.round(p.y);
          return {
            x,
            y,
            left: x,
            top: y,
            right: x,
            bottom: y,
            width: 0,
            height: 0,
            toJSON: () => ({ x, y, left: x, top: y, right: x, bottom: y, width: 0, height: 0 }),
          } as DOMRect;
        },
        contextElement: undefined,
      }),
      []
    );

    const normalizedAnchor = useMemo<HTMLElement | VirtualRefLike | null>(() => {
      if (!anchor) return null;
      if (anchor instanceof HTMLElement) return anchor;
      if (
        typeof anchor === "object" &&
        anchor !== null &&
        "getBoundingClientRect" in anchor &&
        typeof (anchor as VirtualRefLike).getBoundingClientRect === "function"
      )
        return anchor as VirtualRefLike;
      const a = anchor as { x?: number; y?: number };
      return virtualFromPoint({ x: a.x!, y: a.y! });
    }, [anchor, virtualFromPoint]);

    const { refs, x, y, strategy, context, update } = useFloating({
      open,
      onOpenChange: setOpen,
      placement,
      whileElementsMounted: autoUpdate,
      middleware: [
        offsetMw({ mainAxis: so ?? 0, crossAxis: ao ?? 0 }),
        flip({ padding: cp ?? 8 }),
        shift({ padding: cp ?? 8 }),
        sizeMw({
          apply({ rects, elements }) {
            const el = elements.floating as HTMLElement;
            el.style.boxSizing = "border-box";

            
            if (height != null) {
              el.style.height = typeof height === "number" ? `${height}px` : String(height);
            } else {
              el.style.removeProperty("height");
            }

            
            if (width != null) {
              el.style.width = typeof width === "number" ? `${width}px` : String(width);
            } else if (sameWidth) {
              el.style.width = `${Math.round(rects.reference.width)}px`;
            } else {
              el.style.width = "200px";
            }


            
            if (maxHeight != null) {
              el.style.maxHeight = typeof maxHeight === "number" ? `${maxHeight}px` : String(maxHeight);
            } else {
              el.style.removeProperty("max-height");
            }
          },
        }),
      ],
    });

    useEffect(() => {
      if (normalizedAnchor) refs.setReference(normalizedAnchor);
      else if (referenceRef.current) refs.setReference(referenceRef.current);
    }, [refs, normalizedAnchor, referenceRef]);

    useEffect(() => {
      if (!open) return;
      const refEl = normalizedAnchor || referenceRef.current;
      const floatEl = refs.floating.current;
      if (!refEl || !floatEl) return;
      return autoUpdate(refEl, floatEl, update);
    }, [open, normalizedAnchor, referenceRef, refs, update]);

    useEffect(() => {
      
      update();
    }, [update, sameWidth, width, height, maxHeight]);

    useEffect(() => {
      if (open && !allItemsTabbable) setActiveIndex(0);
    }, [open, allItemsTabbable, setActiveIndex]);

    useEffect(() => {
      if (!closeOnBlur || !open) return;
      const onFocusIn = (): void => {
        const ae = document.activeElement as Node | null;
        const refEl = referenceRef.current;
        const fl = refs.floating.current;
        if (!ae) return;
        if (refEl?.contains(ae) || fl?.contains(ae)) return;
        setOpen(false);
      };
      document.addEventListener("focusin", onFocusIn, true);
      return () => document.removeEventListener("focusin", onFocusIn, true);
    }, [closeOnBlur, open, setOpen, referenceRef, refs.floating]);

    const dismiss = useDismiss(context, {
      outsidePressEvent: "pointerdown",
      escapeKey: true,
      outsidePress: disableOutsidePressDismiss ? false : (event) => {
        
        if (ignoreOutsidePressRefs?.length) {
          const target = event.target as Node;
          for (const ref of ignoreOutsidePressRefs) {
            if (ref.current?.contains(target)) return false;
          }
        }
        return true;
      },
    });
    const role = useRole(context, { role: "menu" });
    const { getFloatingProps } = useInteractions([dismiss, role]);

    
    const hasOpenedRef = useRef(false);
    useEffect(() => {
      if (open) {
        hasOpenedRef.current = true;
      } else if (hasOpenedRef.current && referenceRef.current && returnFocus) {
        
        
        const busClosing = rootBus?.isBusClosingRef.current;
        if (!busClosing) {
          requestAnimationFrame(() => {
            referenceRef.current?.focus();
          });
        }
      }
    }, [open, referenceRef, rootBus, returnFocus]);

    useLayoutEffect(() => {
  if (!open) return;

  const applyThemeScopeToPortal = () => {
    const el = floatingRef?.current;
    if (!el) return false;

    const portalEl =
      (el.closest('[data-floating-ui-portal="true"]') as HTMLElement | null) ?? el;

    const trigger = referenceRef?.current;
    if (!trigger) return false;

    const parentPortal = trigger.closest('[data-pfui-portal-owner]') as HTMLElement | null;

    if (parentPortal) {
      const scopeId = parentPortal.getAttribute("data-pfui-portal-owner");
      if (!scopeId) return false;

      if (
        portalEl.getAttribute("data-pfui-portal-owner") === scopeId &&
        el.getAttribute("data-pfui-portal-owner") === scopeId
      ) {
        return true;
      }

      portalEl.setAttribute("data-pfui-portal-owner", scopeId);
      el.setAttribute("data-pfui-portal-owner", scopeId);

      const mode = parentPortal.getAttribute("data-pfui-mode");
      const primary = parentPortal.getAttribute("data-pfui-primary");
      if (mode) {
        portalEl.setAttribute("data-pfui-mode", mode);
        el.setAttribute("data-pfui-mode", mode);
      }
      if (primary) {
        portalEl.setAttribute("data-pfui-primary", primary);
        el.setAttribute("data-pfui-primary", primary);
      }

      for (let i = 0; i < parentPortal.style.length; i++) {
        const prop = parentPortal.style[i];
        if (prop.startsWith("--pf-")) {
          const val = parentPortal.style.getPropertyValue(prop);
          portalEl.style.setProperty(prop, val);
          el.style.setProperty(prop, val);
        }
      }

      portalEl.classList.remove("pf-light", "pf-dark");
      el.classList.remove("pf-light", "pf-dark");
      if (parentPortal.classList.contains("pf-light")) {
        portalEl.classList.add("pf-light");
        el.classList.add("pf-light");
      }
      if (parentPortal.classList.contains("pf-dark")) {
        portalEl.classList.add("pf-dark");
        el.classList.add("pf-dark");
      }

      return true;
    }

    const unclaimed = trigger.closest('[data-floating-ui-portal="true"]') as HTMLElement | null;
    if (unclaimed && !unclaimed.getAttribute("data-pfui-portal-owner")) return false;

    const scopeWrapper = trigger.closest('[data-pfui-scope]') as HTMLElement | null;
    if (scopeWrapper) {
      const scopeId = scopeWrapper.getAttribute("data-pfui-scope");
      if (!scopeId) return false;

      portalEl.setAttribute("data-pfui-portal-owner", scopeId);
      el.setAttribute("data-pfui-portal-owner", scopeId);

      const mode = scopeWrapper.getAttribute("data-pfui-mode");
      const primary = scopeWrapper.getAttribute("data-pfui-primary");
      if (mode) {
        portalEl.setAttribute("data-pfui-mode", mode);
        el.setAttribute("data-pfui-mode", mode);
      }
      if (primary) {
        portalEl.setAttribute("data-pfui-primary", primary);
        el.setAttribute("data-pfui-primary", primary);
      }

      portalEl.classList.remove("pf-light", "pf-dark");
      el.classList.remove("pf-light", "pf-dark");
      if (scopeWrapper.classList.contains("pf-light")) {
        portalEl.classList.add("pf-light");
        el.classList.add("pf-light");
      }
      if (scopeWrapper.classList.contains("pf-dark")) {
        portalEl.classList.add("pf-dark");
        el.classList.add("pf-dark");
      }

      const existingPortal = document.querySelector(
        `[data-pfui-portal-owner="${scopeId}"]`
      ) as HTMLElement | null;

      if (existingPortal && existingPortal !== portalEl) {
        for (let i = 0; i < existingPortal.style.length; i++) {
          const prop = existingPortal.style[i];
          if (prop.startsWith("--pf-")) {
            const val = existingPortal.style.getPropertyValue(prop);
            portalEl.style.setProperty(prop, val);
            el.style.setProperty(prop, val);
          }
        }
      }

      return true;
    }

    return false;
  };

  const attempts = [0, 5, 15, 30, 60, 100, 150, 250];
  const timeouts: number[] = [];

  for (const t of attempts) timeouts.push(window.setTimeout(() => applyThemeScopeToPortal(), t));

  return () => {
    for (const id of timeouts) window.clearTimeout(id);
  };
}, [open, referenceRef]);


    const panelPad =
      typeof theme.spacing.xs === "number" ? `${theme.spacing.xs}px` : String(theme.spacing.xs);

    const resolvedGap =
      gap === undefined
        ? undefined
        : typeof gap === "number"
          ? gap
          : theme.spacing[gap] ?? gap;

    const baseCss = unstyled
      ? undefined
      : emCss({
        boxSizing: "border-box",
        background: theme.surface.panelBg,
        border: `${theme.componentHeights.border} solid ${theme.surface.border}`,
        borderRadius: theme.radius.lg,
        boxShadow: "0 8px 32px rgba(0,0,0,.05), 0 2px 8px rgba(0,0,0,.02)",
        "--pfui-panel-pad": panelPad,
        padding: "var(--pfui-panel-pad)",
        color: theme.text.primary,
        maxHeight,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: resolvedGap,
        
        "& > *": {
          flexShrink: 0,
        },
        
        "&[data-keyboard-nav]": {
          cursor: "none",
        },
        "&[data-keyboard-nav] *": {
          cursor: "none !important",
          pointerEvents: "none",
        },
      });

    let idx = -1;
    const annotate = (node: unknown): React.ReactNode => {
      if (!node || typeof node !== "object") return node as React.ReactNode;
      if (!isValidElement(node)) return node as React.ReactNode;

      const type = node.type as { displayName?: string } | undefined;
      const name = type?.displayName;

      if (name === "DropdownMenu" || name === "DropdownMenuSub") return node;

      if (
        name === "MenuItem" ||
        name === "MenuCheckboxItem" ||
        name === "MenuRadioItem" ||
        name === "MenuSwitchItem"
      ) {
        idx += 1;
        return cloneElement(node as React.ReactElement<Record<string, unknown>>, {
          __index: idx,
          key: node.key ?? idx,
        });
      }

      if (name === "DropdownMenuTrigger") {
        const kids = (node.props as { children?: React.ReactNode }).children;
        return cloneElement(node as React.ReactElement<Record<string, unknown>>, {
          children: React.Children.map(kids, annotate),
        });
      }

      
      
      if (name === "DropdownMenuSubTrigger") {
        idx += 1;
        const currentIdx = idx;
        
        return cloneElement(node as React.ReactElement<Record<string, unknown>>, {
          __index: currentIdx,
          key: node.key ?? currentIdx,
          
        });
      }

      const kids = (node.props as { children?: React.ReactNode }).children;
      if (kids == null) return node;
      return cloneElement(node as React.ReactElement<Record<string, unknown>>, {
        children: React.Children.map(kids, annotate),
      });
    };

    const enhancedChildren = React.Children.map(children, annotate);

    
    const delta = 8;
    const placementSide = (context.placement.split("-")[0] as Side) || "bottom";
    const transformOrigin =
      placementSide === "bottom"
        ? "center top"
        : placementSide === "top"
          ? "center bottom"
          : placementSide === "left"
            ? "right center"
            : "left center";

    const initial =
      placementSide === "bottom"
        ? { opacity: 0, y: -delta, scale: 0.96 }
        : placementSide === "top"
          ? { opacity: 0, y: +delta, scale: 0.96 }
          : placementSide === "left"
            ? { opacity: 0, x: +delta, scale: 0.96 }
            : { opacity: 0, x: -delta, scale: 0.96 };

    const exitSide = exitPlacement ?? placementSide;
    const exit =
      exitSide === "bottom"
        ? { opacity: 0, y: -delta, scale: 0.96 }
        : exitSide === "top"
          ? { opacity: 0, y: +delta, scale: 0.96 }
          : exitSide === "left"
            ? { opacity: 0, x: +delta, scale: 0.96 }
            : { opacity: 0, x: -delta, scale: 0.96 };

    const busClosing: boolean = !!rootBus?.isBusClosingRef.current;

    const transition: MotionTransitions =
      busClosing && !animateOnBusClose
        ? {
          scale: { duration: 0 },
          x: { duration: 0 },
          y: { duration: 0 },
          opacity: { duration: 0 },
        }
        : {
          scale: { type: "spring", stiffness: 520, damping: 38, mass: 0.5 },
          x: { type: "spring", stiffness: 420, damping: 30, mass: 0.6 },
          y: { type: "spring", stiffness: 420, damping: 30, mass: 0.6 },
          opacity: { duration: 0.12, ease: "linear" },
        };

    const positionCss = emCss({
      position: strategy as React.CSSProperties["position"],
      top: (y ?? 0) as number,
      left: (x ?? 0) as number,
      zIndex: 1000,
      transformOrigin,
      
    });

    
    const handleMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
      
      if (e.key === "Tab") {
        e.preventDefault();
        return;
      }

      
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        keyboardNav?.setIsKeyboardNav(true);
        
        
        const menuElement = e.currentTarget as HTMLElement;
        menuElement.setAttribute('data-keyboard-nav', '');
        
        const items = Array.from(
          menuElement.querySelectorAll<HTMLElement>(
            '[role="menuitem"]:not([aria-disabled="true"]):not([data-disabled]), [role="menuitemcheckbox"]:not([aria-disabled="true"]):not([data-disabled]), [role="menuitemradio"]:not([aria-disabled="true"]):not([data-disabled])'
          )
        ).filter(el => {
          
          if (el.closest('[role="menu"]') !== menuElement) return false;
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });

        if (items.length > 0) {
          
          const highlightedInMenu = menuElement.querySelector('[data-highlighted]') as HTMLElement | null;
          const hoveredInMenu = menuElement.querySelector('[data-hovered]') as HTMLElement | null;
          
          let currentIndex = -1;
          if (highlightedInMenu) {
            currentIndex = items.indexOf(highlightedInMenu);
          } else if (hoveredInMenu) {
            currentIndex = items.indexOf(hoveredInMenu);
          }
          
          
          document.querySelectorAll('[data-highlighted]').forEach(el => el.removeAttribute('data-highlighted'));
          if (hoveredInMenu) {
            hoveredInMenu.removeAttribute('data-hovered');
          }
          
          if (currentIndex === -1) {
            currentIndex = e.key === "ArrowDown" ? -1 : items.length;
          }
          const delta = e.key === "ArrowDown" ? 1 : -1;
          const nextIndex = (currentIndex + delta + items.length) % items.length;
          setActiveIndex(nextIndex);
          
          
          items[nextIndex]?.setAttribute('data-highlighted', '');
          items[nextIndex]?.focus();
        }
      }
    }, [keyboardNav, setActiveIndex]);

    
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      const menuElement = e.currentTarget as HTMLElement;
      
      menuElement.removeAttribute('data-keyboard-nav');
      menuElement.querySelectorAll('[data-highlighted]').forEach(el => el.removeAttribute('data-highlighted'));
      if (keyboardNav?.isKeyboardNav) {
        keyboardNav.setIsKeyboardNav(false);
      }
    }, [keyboardNav]);

    const exitKeyboardMode = useCallback((menuEl: HTMLElement) => {
  
  menuEl.removeAttribute("data-keyboard-nav");
  menuEl.querySelectorAll("[data-highlighted]").forEach(el =>
    el.removeAttribute("data-highlighted")
  );
  if (keyboardNav?.isKeyboardNav) keyboardNav.setIsKeyboardNav(false);
}, [keyboardNav]);

    return (
      <FloatingPortal>
        <AnimatePresence>
          {open ? (
            <FocusCtx.Provider value={{ allItemsTabbable }}>
              <motion.div
                {...getFloatingProps({
                  ...rest,
                  ref: mergeRefs(ref, refs.setFloating, (el: HTMLDivElement | null) => {
                    if (floatingRef) floatingRef.current = el;
                    
                    if (el && referenceRef.current) {
                      const trigger = referenceRef.current;
                      const parentPortal = trigger.closest('[data-pfui-portal-owner]') as HTMLElement | null;
                      
                      if (parentPortal) {
                        const scopeId = parentPortal.getAttribute('data-pfui-portal-owner');
                        if (scopeId) {
                          el.setAttribute("data-pfui-portal-owner", scopeId);
                          
                          const mode = parentPortal.getAttribute("data-pfui-mode");
                          const primary = parentPortal.getAttribute("data-pfui-primary");
                          if (mode) el.setAttribute("data-pfui-mode", mode);
                          if (primary) el.setAttribute("data-pfui-primary", primary);
                          
                          for (let i = 0; i < parentPortal.style.length; i++) {
                            const prop = parentPortal.style[i];
                            if (prop.startsWith("--pf-")) {
                              el.style.setProperty(prop, parentPortal.style.getPropertyValue(prop));
                            }
                          }
                          
                          if (parentPortal.classList.contains("pf-light")) el.classList.add("pf-light");
                          if (parentPortal.classList.contains("pf-dark")) el.classList.add("pf-dark");
                        }
                      }
                    }
                  }),
                })}
                data-menu-id={menuId}
                data-keyboard-nav={keyboardNav?.isKeyboardNav ? "" : undefined}
                className={className}
                css={[baseCss, positionCss, userCss]}
                initial={initial}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={exit}
                transition={transition}
                onPointerMove={(e) => exitKeyboardMode(e.currentTarget as HTMLElement)}
  onPointerDown={(e) => exitKeyboardMode(e.currentTarget as HTMLElement)}
                onKeyDown={handleMenuKeyDown}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => {
                  clearSubmenuHover();
                  rootBus?.clearAllHover();
                  
                }}
                onMouseLeave={() => {
                  
                  
                  document.querySelectorAll('[data-hovered]').forEach(el => el.removeAttribute('data-hovered'));
                }}
              >
                {enhancedChildren}
              </motion.div>
            </FocusCtx.Provider>
          ) : null}
        </AnimatePresence>
      </FloatingPortal>
    );
  }
);
DropdownMenuContent.displayName = "DropdownMenuContent";


export const DropdownMenuSub: React.FC<{
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (o: boolean) => void;
  trigger?: TriggerMode;
  dense?: boolean;
  children: React.ReactNode;
}> = ({ open: cOpen, defaultOpen, onOpenChange, trigger = "hover", dense, children }) => {
  
  const isInsideSubmenu = useIsInsideSubmenu();
  
  const [uOpen, setUOpen] = useState<boolean>(!!defaultOpen);
  const open = cOpen ?? uOpen;
  const setOpen = useCallback(
  (v: boolean): void => {
    if (v) markPFUIActiveScopeFrom(referenceRef.current);
    if (cOpen === undefined) setUOpen(v);
    onOpenChange?.(v);
  },
  [cOpen, onOpenChange]
);

  const hoverTimeoutRef = useRef<number | null>(null);
  const pendingOpenRef = useRef<boolean>(false); 
  const scheduleSubmenuHover = useCallback(
    (shouldOpen: boolean, delay?: number): void => {
      if (trigger !== "hover") return;
      window.clearTimeout(hoverTimeoutRef.current ?? 0);
      pendingOpenRef.current = shouldOpen; 
      const finalDelay = delay ?? 20;
      hoverTimeoutRef.current = window.setTimeout(() => {
        pendingOpenRef.current = false;
        setOpen(shouldOpen);
      }, finalDelay);
    },
    [trigger, setOpen]
  );
  const clearSubmenuHover = useCallback((): void => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
      pendingOpenRef.current = false;
    }
  }, []);
  useEffect(() => () => clearSubmenuHover(), [clearSubmenuHover]);

  
  const parentSubMenuCloser = useSubMenuCloser();
  useEffect(() => {
    if (!parentSubMenuCloser) return;
    const closeThis = () => {
      clearSubmenuHover(); 
      setOpen(false);
    };
    const unregister = parentSubMenuCloser.registerSubMenu(closeThis);
    return unregister;
  }, [parentSubMenuCloser, setOpen, clearSubmenuHover]);

  const menuIdRef = useRef<string>(`pfui-submenu-${++menuIdCounter}`);
  const referenceRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<Array<HTMLElement | null>>([]);
  const floatingRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isKeyboardNav, setIsKeyboardNav] = useState(false);

  
  useEffect(() => {
    if (!open) {
      setActiveIndex(null);
      listRef.current = [];
      setIsKeyboardNav(false);
    }
  }, [open]);

  const inheritedDense = useContext(DenseCtx);
  const finalDense = dense ?? inheritedDense;

  const value = useMemo<Ctx>(
    () => ({
      open,
      setOpen,
      trigger,
      referenceRef,
      listRef,
      floatingRef,
      setActiveIndex,
      scheduleSubmenuHover,
      clearSubmenuHover,
      pendingOpenRef,
      menuId: menuIdRef.current,
    }),
    [open, setOpen, trigger, setActiveIndex, scheduleSubmenuHover, clearSubmenuHover]
  );

  
  const activeIndexValue = useMemo<ActiveIndexCtx>(
    () => ({ activeIndex, setActiveIndex }),
    [activeIndex, setActiveIndex]
  );

  
  const keyboardNavValue = useMemo<KeyboardNavCtx>(
    () => ({ isKeyboardNav, setIsKeyboardNav }),
    [isKeyboardNav]
  );

  
  if (isInsideSubmenu) {
    console.warn(
      '[DropdownMenu] Nested submenus are not supported. ' +
      'DropdownMenuSub can only be used one level deep inside DropdownMenu. ' +
      'The nested submenu content will not be rendered.'
    );
    
    
    return (
      <>
        {React.Children.map(children, (child) => {
          if (!isValidElement(child)) return child;
          const type = child.type as { displayName?: string };
          
          if (type?.displayName === 'DropdownMenuSubTrigger' || 
              type?.displayName === 'DropdownMenuSubContent') {
            return null;
          }
          return child;
        })}
      </>
    );
  }

  return (
    <IsInsideSubmenuContext.Provider value={true}>
      <DenseCtx.Provider value={finalDense}>
        <ActiveIndexContext.Provider value={activeIndexValue}>
          <KeyboardNavContext.Provider value={keyboardNavValue}>
            <MenuCtx.Provider value={value}>{children}</MenuCtx.Provider>
          </KeyboardNavContext.Provider>
        </ActiveIndexContext.Provider>
      </DenseCtx.Provider>
    </IsInsideSubmenuContext.Provider>
  );
};
DropdownMenuSub.displayName = "DropdownMenuSub";


declare global {
  interface HTMLElement {
    __pfuiCloseSubmenu?: () => void;
  }
}

export const DropdownMenuSubTrigger: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<DropdownMenuTriggerProps & { __index?: number }> & React.RefAttributes<HTMLElement>
> = React.forwardRef<HTMLElement, DropdownMenuTriggerProps & { __index?: number }>(
  ({ asChild = true, children, width, className, css: userCss, ...rest }, ref) => {
    const { open, setOpen, trigger, referenceRef, scheduleSubmenuHover, clearSubmenuHover, pendingOpenRef, menuId } =
      useMenu();
    const keyboardNav = useKeyboardNav();
    
    
    const storeCloseCallback = useCallback((el: HTMLElement | null) => {
      if (el) {
        el.__pfuiCloseSubmenu = () => setOpen(false);
      }
    }, [setOpen]);

    const canAsChild = !!asChild && isValidElement(children);
    const childEl = canAsChild ? (children as React.ReactElement) : null;
    const childProps = childEl?.props as Record<string, unknown> | undefined;
    const childOnKeyDown = childProps?.onKeyDown as ((e: React.KeyboardEvent) => void) | undefined;
    const childOnClick = childProps?.onClick as ((e: React.MouseEvent) => void) | undefined;

    type RestWithHandlers = typeof rest & {
      onKeyDown?: (e: React.KeyboardEvent) => void;
      onClick?: (e: React.MouseEvent) => void;
    };
    const { onKeyDown: propOnKeyDown, onClick: propOnClick, ...restProps } = rest as RestWithHandlers;

    const setRefs = useMemo(
      () =>
        mergeRefs<HTMLElement | null>(
          ref,
          canAsChild && isValidElement(children) && "ref" in children
            ? (children.ref as React.Ref<HTMLElement> | undefined)
            : undefined,
          (referenceRef as unknown) as React.Ref<HTMLElement | null>,
          storeCloseCallback
        ),
      [ref, canAsChild, children, referenceRef, storeCloseCallback]
    );

    const widthCss =
      width != null ? emCss({ width: typeof width === "number" ? `${width}px` : width }) : undefined;

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent): void => {
        
        if (e.key === "Tab") {
          e.preventDefault();
          return;
        }

        const currentEl = e.currentTarget as HTMLElement;

        
        const navigateMenu = (direction: 'next' | 'prev') => {
          keyboardNav?.setIsKeyboardNav(true);
          const container = currentEl.closest('[data-menu-id]') as HTMLElement | null;
          if (!container) return;

          
          container.setAttribute('data-keyboard-nav', '');
          
          document.querySelectorAll('[data-highlighted]').forEach(el => el.removeAttribute('data-highlighted'));

          const candidates = Array.from(
            container.querySelectorAll<HTMLElement>(
              '[role="menuitem"]:not([aria-disabled="true"]):not([data-disabled]), [role="menuitemcheckbox"]:not([aria-disabled="true"]):not([data-disabled]), [role="menuitemradio"]:not([aria-disabled="true"]):not([data-disabled])'
            )
          ).filter(el => {
            
            if (el.closest('[data-menu-id]') !== container) return false;
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
          });

          if (!candidates.length) return;

          
          const currentIndex = candidates.indexOf(currentEl);
          const actualIndex = currentIndex >= 0 ? currentIndex : 0;

          const nextIndex = direction === 'next'
            ? (actualIndex + 1) % candidates.length
            : (actualIndex - 1 + candidates.length) % candidates.length;

          candidates[nextIndex]?.setAttribute('data-highlighted', '');
          candidates[nextIndex]?.focus();
        };

        
        if (e.key === "ArrowDown") {
          e.preventDefault();
          e.stopPropagation();
          
          if (open) {
            setOpen(false);
          }
          navigateMenu('next');
          return;
        }

        
        if (e.key === "ArrowUp") {
          e.preventDefault();
          e.stopPropagation();
          
          if (open) {
            setOpen(false);
          }
          navigateMenu('prev');
          return;
        }

        
        if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          keyboardNav?.setIsKeyboardNav(true);
          
          const currentEl = e.currentTarget as HTMLElement;
          
          setOpen(true);
          requestAnimationFrame(() => {
            
            const subMenuContent = menuId
              ? document.querySelector(`[data-menu-id="${menuId}"]`) as HTMLElement | null
              : document.querySelector('[data-submenu-content]') as HTMLElement | null;

            if (subMenuContent) {
              
              subMenuContent.setAttribute('data-keyboard-nav', '');
              
              
              currentEl.removeAttribute('data-highlighted');
              currentEl.removeAttribute('data-hovered');
              
              const firstItem = subMenuContent.querySelector<HTMLElement>(
                '[role="menuitem"]:not([aria-disabled="true"]):not([data-disabled]):not([data-subtrigger]), [role="menuitemcheckbox"]:not([aria-disabled="true"]):not([data-disabled]), [role="menuitemradio"]:not([aria-disabled="true"]):not([data-disabled])'
              );
              if (firstItem) {
                firstItem.setAttribute('data-highlighted', '');
                firstItem.focus();
              }
            }
          });
          return;
        }

        
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          e.stopPropagation();
          
          
          if (open) {
            setOpen(false);
          }
          
          
          const parentMenu = currentEl.closest('[data-menu-id]') as HTMLElement | null;
          if (parentMenu) {
            parentMenu.setAttribute('data-keyboard-nav', '');
          }
          
          
          document.querySelectorAll('[data-highlighted]').forEach(h => h.removeAttribute('data-highlighted'));
          document.querySelectorAll('[data-hovered]').forEach(h => h.removeAttribute('data-hovered'));
          currentEl.setAttribute('data-highlighted', '');
          currentEl.focus();
          
          if (keyboardNav) {
            keyboardNav.setIsKeyboardNav(true);
          }
          return;
        }

        
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          
          childOnKeyDown?.(e);
          return;
        }

        
        childOnKeyDown?.(e);
        propOnKeyDown?.(e);
      },
      [open, setOpen, childOnKeyDown, propOnKeyDown, referenceRef, keyboardNav, menuId]
    );


    const baseHoverProps =
      trigger === "hover"
        ? {
          onMouseEnter: (e: React.MouseEvent) => {
            const el = e.currentTarget as HTMLElement;
            
            
            cancelSubMenuClose();
            clearSubmenuHover(); 
            
            
            document.querySelectorAll('[data-hovered]').forEach(h => h.removeAttribute('data-hovered'));
            document.querySelectorAll('[data-highlighted]').forEach(h => h.removeAttribute('data-highlighted'));
            
            
            el.setAttribute('data-hovered', '');
            
            
            el.focus({ preventScroll: true });
            
            
            const container = el.closest('[data-menu-id]') as HTMLElement | null;
            if (container?.hasAttribute('data-keyboard-nav')) {
              container.removeAttribute('data-keyboard-nav');
            }
            if (keyboardNav) {
              keyboardNav.setIsKeyboardNav(false);
            }
            
            
            if (!open) {
              scheduleSubmenuHover(true, 90);
            }
          },
          onMouseMove: (e: React.MouseEvent) => {
            const el = e.currentTarget as HTMLElement;
            
            
            cancelSubMenuClose();
            
            
            if (!el.hasAttribute('data-hovered')) {
              
              document.querySelectorAll('[data-hovered]').forEach(h => h.removeAttribute('data-hovered'));
              document.querySelectorAll('[data-highlighted]').forEach(h => h.removeAttribute('data-highlighted'));
              
              
              el.setAttribute('data-hovered', '');
            }
            
            
            
            if (!open && !pendingOpenRef?.current) {
              scheduleSubmenuHover(true, 90);
            }
          },
          onMouseLeave: () => {
            
            scheduleSubmenuHover(false, 60);
          },
        }
        : {
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            setOpen(!open);
            childOnClick?.(e);
            propOnClick?.(e);
          },
        };

    if (canAsChild && childEl) {
      const childCss = childProps?.css;
      const childClassName = typeof childProps?.className === "string" ? childProps.className : undefined;
      const childTabIndex = typeof childProps?.tabIndex === "number" ? childProps.tabIndex : 0;

      const cloneProps: Record<string, unknown> = {
        ref: setRefs,
        tabIndex: childTabIndex,
        className: [childClassName, className].filter(Boolean).join(" ") || undefined,
        css: [childCss, widthCss, userCss].filter(Boolean),
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "data-subtrigger": "",
        
        __skipListReg: true,
        onKeyDown: handleKeyDown,
        onFocus: (e: React.FocusEvent) => {
          
          if ((e.target as HTMLElement).hasAttribute('data-highlighted')) {
            const parentMenu = (e.target as HTMLElement).closest('[data-menu-id]') as HTMLElement | null;
            if (parentMenu && !parentMenu.hasAttribute('data-keyboard-nav')) {
              parentMenu.setAttribute('data-keyboard-nav', '');
              if (keyboardNav) {
                keyboardNav.setIsKeyboardNav(true);
              }
            }
          }
          
          if (childProps && 'onFocus' in childProps && typeof childProps.onFocus === 'function') {
            (childProps.onFocus as (e: React.FocusEvent) => void)(e);
          }
        },
        ...baseHoverProps,
        ...restProps,
      };

      return cloneElement(childEl, cloneProps);
    }

    return (
      <div
        ref={setRefs}
        role="menuitem"
        tabIndex={0}
        className={className}
        css={[
          emCss({
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }),
          widthCss,
          userCss,
        ]}
        aria-haspopup="menu"
        aria-expanded={open}
        data-subtrigger=""
        onKeyDown={handleKeyDown}
        onFocus={(e) => {
          
          if (e.currentTarget.hasAttribute('data-highlighted')) {
            const parentMenu = e.currentTarget.closest('[data-menu-id]') as HTMLElement | null;
            if (parentMenu && !parentMenu.hasAttribute('data-keyboard-nav')) {
              parentMenu.setAttribute('data-keyboard-nav', '');
              if (keyboardNav) {
                keyboardNav.setIsKeyboardNav(true);
              }
            }
          }
        }}
        {...baseHoverProps}
        {...restProps}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

export const DropdownMenuSubContent: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<Omit<DropdownMenuContentProps, "anchor">> & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, Omit<DropdownMenuContentProps, "anchor">>(
  (props, ref) => {
    const rootBus = useRootBus();
    const { referenceRef, clearSubmenuHover, scheduleSubmenuHover } = useMenu();

    
    const mergedClassName = [props.className, "plainframe-ui-submenu-content"].filter(Boolean).join(" ");

    return (
      <DropdownMenuContent
        ref={ref}
        side="right"
        align="start"
        exitPlacement="bottom"
        animateOnBusClose={true}
        {...props}
        className={mergedClassName}
        data-submenu-content=""
        anchor={referenceRef.current as unknown as Anchor}
        onMouseEnter={(e) => {
          clearSubmenuHover();
          rootBus?.clearAllHover();
          
          cancelSubMenuClose();
          props.onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          
          
          scheduleSubmenuHover(false, 60);
          props.onMouseLeave?.(e);
        }}
      />
    );
  }
);
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";