/** @jsxImportSource @emotion/react */
import React, {
  forwardRef,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { css as emCss, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { KeyboardNavContext, FocusCtx } from "./DropdownMenu";

export type MenuVariant = "ghost" | "subtle" | "outlined";
export const MenuVariantCtx: React.Context<MenuVariant> = React.createContext<MenuVariant>("ghost");
export const DenseCtx: React.Context<boolean> = React.createContext<boolean>(false);

export type MenuProps = Omit<React.HTMLAttributes<HTMLDivElement>, "style"> & {
  variant?: MenuVariant;
  size?: "sm" | "md";
  width?: number | string;
  maxHeight?: number | string;
  unstyled?: boolean;
  css?: Interpolation<Theme>;
  label?: string;
  allItemsTabbable?: boolean;
};

export const Menu: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<MenuProps> & React.RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, MenuProps>(function Menu(
  {
    variant = "ghost",
    size = "md",
    width,
    maxHeight,
    unstyled = false,
    className,
    css: userCss,
    children,
    label,
    allItemsTabbable = false,
    ...rest
  },
  ref
) {
  const theme = usePlainframeUITheme();
  
  
  const [isKeyboardNav, setIsKeyboardNav] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const panelPad =
    typeof theme.spacing.xs === "number" ? `${theme.spacing.xs}px` : String(theme.spacing.xs);

  const bg =
    variant === "outlined"
      ? theme.surface.panelBg
      : variant === "subtle"
      ? theme.surface.subtleBg ?? theme.neutral[50]
      : "transparent";

  const baseCss = unstyled
    ? undefined
    : emCss({
        background: bg,
        border:
          variant === "outlined"
            ? `${theme.componentHeights.border} solid ${theme.surface.border}`
            : "none",
        borderRadius: theme.radius.lg,
        "--pfui-panel-pad": panelPad,
        padding: variant === "ghost" ? 0 : "var(--pfui-panel-pad)",
        color: theme.text.primary,
        width: "100%",
        maxHeight,
        overflowY: maxHeight != null ? "auto" : undefined,
        display: "flex",
        flexDirection: "column",
        outline: "none",
        position: "relative",
        
        "&[data-keyboard-nav]": {
          cursor: "none",
        },
        "&[data-keyboard-nav] *": {
          cursor: "none !important",
          pointerEvents: "none",
        },
      });

  const dense = size === "sm";

  
  const keyboardNavValue = useMemo(
    () => ({ isKeyboardNav, setIsKeyboardNav }),
    [isKeyboardNav]
  );
  const focusCtxValue = useMemo(
    () => ({ allItemsTabbable }),
    [allItemsTabbable]
  );

  
  const getMenuItems = useCallback((container: HTMLElement): HTMLElement[] => {
    return Array.from(
      container.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([aria-disabled="true"]):not([data-disabled]), ' +
        '[role="menuitemcheckbox"]:not([aria-disabled="true"]):not([data-disabled]), ' +
        '[role="menuitemradio"]:not([aria-disabled="true"]):not([data-disabled])'
      )
    ).filter((el) => {
      
      if (el.closest('[role="menu"]') !== container) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }, []);

  
  const exitKeyboardMode = useCallback((menuEl: HTMLElement) => {
    menuEl.removeAttribute('data-keyboard-nav');
    menuEl.querySelectorAll('[data-highlighted]').forEach(el => 
      el.removeAttribute('data-highlighted')
    );
    setIsKeyboardNav(false);
  }, []);

  
  const isExitingRef = useRef(false);

  
  const handleFocus = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    
    if (e.target !== e.currentTarget) return;
    
    
    if (isExitingRef.current) {
      isExitingRef.current = false;
      return;
    }
    
    const menuEl = e.currentTarget;
    const items = getMenuItems(menuEl);
    
    if (items.length > 0) {
      setIsKeyboardNav(true);
      menuEl.setAttribute('data-keyboard-nav', '');
      
      
      document.querySelectorAll('[data-highlighted]').forEach(el => 
        el.removeAttribute('data-highlighted')
      );
      document.querySelectorAll('[data-hovered]').forEach(el => 
        el.removeAttribute('data-hovered')
      );
      
      
      items[0].setAttribute('data-highlighted', '');
      items[0].focus({ preventScroll: true });
    }
  }, [getMenuItems]);

  
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const menuEl = e.currentTarget;
    const items = getMenuItems(menuEl);
    
    if (items.length === 0) return;

    
    if (e.key === "Tab") {
      
      isExitingRef.current = true;
      
      
      menuEl.removeAttribute('data-keyboard-nav');
      document.querySelectorAll('[data-highlighted]').forEach(el => 
        el.removeAttribute('data-highlighted')
      );
      setIsKeyboardNav(false);
      
      
      menuEl.tabIndex = -1;
      requestAnimationFrame(() => {
        menuEl.tabIndex = 0;
        isExitingRef.current = false;
      });
      
      return;
    }

    
    const highlightedItem = menuEl.querySelector('[data-highlighted]') as HTMLElement | null;
    const hoveredItem = menuEl.querySelector('[data-hovered]') as HTMLElement | null;
    const activeItem = highlightedItem || hoveredItem;
    let currentIndex = activeItem ? items.indexOf(activeItem) : -1;

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      
      setIsKeyboardNav(true);
      menuEl.setAttribute('data-keyboard-nav', '');
      
      
      document.querySelectorAll('[data-highlighted]').forEach(el => 
        el.removeAttribute('data-highlighted')
      );
      document.querySelectorAll('[data-hovered]').forEach(el => 
        el.removeAttribute('data-hovered')
      );
      
      
      if (currentIndex === -1) {
        currentIndex = e.key === "ArrowDown" ? -1 : items.length;
      }
      const delta = e.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (currentIndex + delta + items.length) % items.length;
      
      
      items[nextIndex].setAttribute('data-highlighted', '');
      items[nextIndex].focus({ preventScroll: true });
      return;
    }

    if (e.key === "Home") {
      e.preventDefault();
      e.stopPropagation();
      
      setIsKeyboardNav(true);
      menuEl.setAttribute('data-keyboard-nav', '');
      
      document.querySelectorAll('[data-highlighted]').forEach(el => 
        el.removeAttribute('data-highlighted')
      );
      document.querySelectorAll('[data-hovered]').forEach(el => 
        el.removeAttribute('data-hovered')
      );
      
      items[0].setAttribute('data-highlighted', '');
      items[0].focus({ preventScroll: true });
      return;
    }

    if (e.key === "End") {
      e.preventDefault();
      e.stopPropagation();
      
      setIsKeyboardNav(true);
      menuEl.setAttribute('data-keyboard-nav', '');
      
      document.querySelectorAll('[data-highlighted]').forEach(el => 
        el.removeAttribute('data-highlighted')
      );
      document.querySelectorAll('[data-hovered]').forEach(el => 
        el.removeAttribute('data-hovered')
      );
      
      items[items.length - 1].setAttribute('data-highlighted', '');
      items[items.length - 1].focus({ preventScroll: true });
      return;
    }

    
    if (e.key === "Escape") {
      e.preventDefault();
      menuEl.removeAttribute('data-keyboard-nav');
      document.querySelectorAll('[data-highlighted]').forEach(el => 
        el.removeAttribute('data-highlighted')
      );
      setIsKeyboardNav(false);
      menuEl.blur();
      return;
    }
  }, [getMenuItems]);

  
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const menuEl = e.currentTarget;
    if (menuEl.hasAttribute('data-keyboard-nav')) {
      exitKeyboardMode(menuEl);
    }
  }, [exitKeyboardMode]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const menuEl = e.currentTarget;
    if (menuEl.hasAttribute('data-keyboard-nav')) {
      exitKeyboardMode(menuEl);
    }
  }, [exitKeyboardMode]);

  
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    menuRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  }, [ref]);

  return (
    <KeyboardNavContext.Provider value={keyboardNavValue}>
      <FocusCtx.Provider value={focusCtxValue}>
        <DenseCtx.Provider value={dense}>
          <MenuVariantCtx.Provider value={variant}>
            <div css={{ display: "flex", flexDirection: "column", gap: theme.spacing.sm, width: "100%", maxWidth: width }}>
              {label ? (
                <div css={{ width: "100%", textAlign: "left"}}>
                  <span
                    css={{
                      display: "block",
                      color: theme.text.secondary,
                      fontSize: theme.typography.sizes.xs,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: ".04em",
                      padding: typeof theme.spacing.sm === "number" ? `${theme.spacing.sm}px` : theme.spacing.sm,
                      paddingTop: 0,
                    }}
                  >
                    {label}
                  </span>
                </div>
              ) : null}
              <div
                ref={setRefs}
                role="menu"
                data-keyboard-nav={isKeyboardNav ? "" : undefined}
                tabIndex={0}
                aria-label={label || undefined}
                className={["plainframe-ui-menu", className || ""].join(" ").trim()}
                css={[baseCss, userCss]}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                onPointerMove={handlePointerMove}
                onPointerDown={handlePointerDown}
                {...rest}
              >
                {children}
              </div>
            </div>
          </MenuVariantCtx.Provider>
        </DenseCtx.Provider>
      </FocusCtx.Provider>
    </KeyboardNavContext.Provider>
  );
});
Menu.displayName = "Menu";
