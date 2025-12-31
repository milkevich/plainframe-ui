/** @jsxImportSource @emotion/react */
import React, { useContext, useMemo, useState, forwardRef, useRef, useCallback } from "react";
import { css as emCss, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { Switch } from "./Switch";
import { Checkbox } from "./Checkbox";
import { Check, ChevronRight } from "lucide-react";
import { MenuVariantCtx, DenseCtx as MenuDenseCtx } from "./Menu";
import {
  MenuCtx as DropdownMenuCtx,
  FocusCtx as DropdownFocusCtx,
  RootBusCtx as DropdownRootBusCtx,
  useSubMenuCloser,
  useKeyboardNav,
} from "./DropdownMenu";

const useMenu = () => useContext(DropdownMenuCtx);
const useFocusOpts = () => useContext(DropdownFocusCtx);
const useRootBus = () => useContext(DropdownRootBusCtx);

let closeSubMenuTimeout: number | null = null;
const scheduleSubMenuClose = (closeAllSubMenus: () => void, delay: number = 35) => {
  if (closeSubMenuTimeout !== null) {
    window.clearTimeout(closeSubMenuTimeout);
  }
  closeSubMenuTimeout = window.setTimeout(() => {
    closeAllSubMenus();
    closeSubMenuTimeout = null;
  }, delay);
};
export const cancelSubMenuClose = () => {
  if (closeSubMenuTimeout !== null) {
    window.clearTimeout(closeSubMenuTimeout);
    closeSubMenuTimeout = null;
  }
};

export type MenuItemProps = Omit<React.HTMLAttributes<HTMLDivElement>, "style"> & {
  disabled?: boolean;
  destructive?: boolean;
  inset?: boolean | number;
  closeOnSelect?: boolean;
  onSelect?: () => void;
  css?: Interpolation<Theme>;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  
  selected?: boolean;
  
  active?: boolean;
  meta?: React.ReactNode;
};

export type MenuCheckboxItemProps = Omit<MenuItemProps, "onSelect" | "selected"> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (next: boolean) => void;
  value?: string | number;
};

export type MenuRadioGroupProps = {
  value?: string | number;
  defaultValue?: string | number;
  onValueChange?: (val: string | number) => void;
  children?: React.ReactNode;
};

export type MenuRadioItemProps = Omit<MenuItemProps, "onSelect" | "startIcon" | "endIcon" | "selected"> & {
  value: string | number;
};

export type MenuLabelProps = Omit<React.HTMLAttributes<HTMLDivElement>, "style"> & {
  inset?: boolean;
  css?: Interpolation<Theme>;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  wrap?: boolean;
  color?: "primary" | "secondary" | "danger" | "warning" | "success" | "info";
};

export type MenuSeparatorProps = Omit<React.HTMLAttributes<HTMLDivElement>, "style"> & {
  css?: Interpolation<Theme>;
  variant?: "full" | "middle" | "inset";
};

type ItemPrivate = { __index?: number; __skipListReg?: boolean };

export const MenuItem: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<MenuItemProps & ItemPrivate> & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, MenuItemProps & ItemPrivate>(
  function MenuItem(
    {
      disabled = false,
      destructive = false,
      inset,
      closeOnSelect = true,
      onSelect,
      children,
      className,
      css: userCss,
      startIcon,
      endIcon,
      selected = false,
      active,
      meta,
      __index,
      __skipListReg,
      ...rest
    },
    ref
  ) {
    const dd = useMenu();
    const rootBus = useRootBus();
    const subMenuCloser = useSubMenuCloser();
    const keyboardNav = useKeyboardNav();
    const focusOpts = useFocusOpts();
    const theme = usePlainframeUITheme();

    const denseFromMenu = useContext(MenuDenseCtx);
    const dense = !!denseFromMenu;

    const isSubTrigger = (rest as any)["data-subtrigger"] !== undefined;

    const effectiveEndIcon = isSubTrigger && endIcon === undefined
      ? <ChevronRight size={18} strokeWidth={2.5} />
      : endIcon;

    const nesting = 0;
    const insetLevel = typeof inset === "number" ? inset : inset === false ? 0 : nesting;

    const variant = useContext(MenuVariantCtx);
    const variantHover =
      variant === "subtle"
        ? theme.surface?.subtleHover ?? theme.neutral[100]
        : variant === "outlined"
          ? theme.surface?.subtleBg ?? theme.neutral[100]
          : theme.surface?.subtleBg ?? theme.neutral[100];

const itemCss = useMemo(
  () =>
    emCss({
      width: "100%",
      borderRadius: theme.radius.md,
      padding: `${theme.spacing.sm} ${theme.spacing.sm}`,
      paddingLeft:
        insetLevel > 0
          ? `calc(${theme.spacing.md} + (${theme.spacing.xl} * ${insetLevel}))`
          : theme.spacing.md,
      minHeight: dense ? theme.componentHeights.sm : theme.componentHeights.md,
      display: "flex",
      alignItems: "center",
      gap: theme.spacing.sm,
      fontWeight: 500,
      fontSize: theme.typography.sizes.sm,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.55 : 1,
      userSelect: "none",
      background: "transparent",
      color: destructive ? theme.palette.danger[800] : theme.text.primary,
      transition: "background-color .16s ease, color .16s ease",
      outline: "none",

      "[role='menu']:not([data-keyboard-nav]) &:hover": disabled
        ? {}
        : { background: destructive ? theme.palette.danger[50] : variantHover },

      "&[data-highlighted]": disabled
        ? {}
        : {
            background: destructive ? theme.palette.danger[50] : variantHover,
          },

      "&[data-active]": disabled
        ? {}
        : {
            background: destructive ? theme.palette.danger[50] : variantHover,
          },

      "&[data-subtrigger][aria-expanded='true']": disabled
        ? {}
        : {
            background: destructive ? theme.palette.danger[50] : variantHover,
          },

      "[role='menu']:not([data-keyboard-nav]) &:not([data-disabled]):hover [data-menu-checkbox-wrapper],\
&:not([data-disabled])[data-highlighted] [data-menu-checkbox-wrapper],\
&:not([data-disabled])[data-active] [data-menu-checkbox-wrapper],\
&[data-subtrigger][aria-expanded='true'] [data-menu-checkbox-wrapper]": {
        background: theme.surface.border,
      },

      "& > [data-label]": {
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
    }),
  [theme, dense, insetLevel, disabled, destructive, variantHover]
);

    const iconStartBox = useMemo(() => emCss({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "0 0 auto",
      lineHeight: 0,

      "& > *": { flexShrink: 0 },

      "& > svg:only-child": { width: 16, height: 16, display: "block" },
    }), []);

    const iconEndBox = useMemo(() => emCss({
      marginLeft: "auto",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "flex-end",
      flex: "0 0 auto",
      flexShrink: 0,
      whiteSpace: "nowrap",
      lineHeight: 0,
      gap: theme.spacing.sm,
      "& > svg": { width: 16, height: 16, display: "block" },
      color: theme.text.secondary,
      
    }), [theme.text.secondary, theme.spacing.sm]);

    const selectedIndicatorCss = useMemo(() => emCss({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: theme.palette.primary[600],
      "& > svg": { width: 16, height: 16, display: "block" },
    }), [theme.palette.primary]);

    const overlayCss: Interpolation<Theme>[] = [];
    if (dense) overlayCss.push({ minHeight: theme.componentHeights.sm, paddingLeft: theme.spacing.sm, paddingRight: theme.spacing.xs, paddingTop: theme.spacing.xs, paddingBottom: theme.spacing.xs });

    const activate = () => {
      onSelect?.();
      if (closeOnSelect && !isSubTrigger) rootBus?.closeAll();
    };

    const moveFocus = (currentEl: HTMLElement, idxGetter: (len: number, cur: number) => number) => {

      const container = currentEl.closest('[role="menu"]') as HTMLElement | null;
      if (!container) return;
      
      const candidates = Array.from(
        container.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not([aria-disabled="true"]):not([data-disabled]), [role="menuitemcheckbox"]:not([aria-disabled="true"]):not([data-disabled]), [role="menuitemradio"]:not([aria-disabled="true"]):not([data-disabled])'
        )
      ).filter((el) => {

        if (el.closest('[role="menu"]') !== container) return false;

        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
      
      if (!candidates.length) return;
      
      const cur = candidates.indexOf(currentEl);
      const actualCur = cur >= 0 ? cur : 0;
      
      const next = idxGetter(candidates.length, actualCur);
      const nextCandidate = candidates[next];
      
      if (nextCandidate) {

        document.querySelectorAll('[data-highlighted]').forEach(el => {
          el.removeAttribute('data-highlighted');
        });

        nextCandidate.setAttribute('data-highlighted', '');
        nextCandidate.focus();

        if (dd && __index != null) {
          dd.setActiveIndex(next);
        }
      }
    };

    
    
    const itemTabIndex = disabled ? -1 : (focusOpts?.allItemsTabbable ? 0 : -1);

    return (
      <div
        role="menuitem"
        aria-disabled={disabled || undefined}
        data-disabled={disabled ? "" : undefined}
        data-active={active ? "" : undefined}
        tabIndex={itemTabIndex}
        ref={(node) => {

          if (dd && !__skipListReg) {
            const arr = dd.listRef.current;
            if (node) {
              if (__index != null) arr[__index] = node as any;
              else if (!arr.includes(node as any)) arr.push(node as any);
            }
          }
          if (typeof ref === "function") ref(node);
          else if (ref && "current" in (ref as any)) (ref as any).current = node;
        }}
        onMouseMove={(e) => {

          if (e.currentTarget.hasAttribute('data-hovered')) {

            return;
          }

          
          
          const isInsideSubmenu = !!e.currentTarget.closest('[data-submenu-content]');
          if (!isSubTrigger && subMenuCloser && !isInsideSubmenu) {
            scheduleSubMenuClose(subMenuCloser.closeAllSubMenus);
          }
          
          document.querySelectorAll('[data-hovered]').forEach(el => {
            el.removeAttribute('data-hovered');
          });
          document.querySelectorAll('[data-highlighted]').forEach(el => {
            el.removeAttribute('data-highlighted');
          });

          document.querySelectorAll('[data-active]').forEach(el => {
            el.removeAttribute('data-active');
          });
          
          e.currentTarget.setAttribute('data-hovered', '');
          
          const container = e.currentTarget.closest('[data-menu-id]') || e.currentTarget.closest('[role="menu"]');
          if (container?.hasAttribute('data-keyboard-nav')) {
            container.removeAttribute('data-keyboard-nav');
          }
          
          if (!disabled && dd && __index != null) {
            dd.setActiveIndex(__index);
          }
          
          if (!disabled && !focusOpts?.allItemsTabbable) {
            (e.currentTarget as HTMLElement).focus({ preventScroll: true });
          }
        }}
        onMouseEnter={(e) => {

          if (!isSubTrigger) {
            
            const isInsideSubmenu = !!e.currentTarget.closest('[data-submenu-content]');
            if (subMenuCloser && !isInsideSubmenu) {
              scheduleSubMenuClose(subMenuCloser.closeAllSubMenus);
            }
          } else {

            cancelSubMenuClose();
          }
          
          const wasAlreadyHovered = e.currentTarget.hasAttribute('data-hovered');
          
          if (!wasAlreadyHovered) {

            document.querySelectorAll('[data-highlighted]').forEach(el => {
              el.removeAttribute('data-highlighted');
            });
            
            document.querySelectorAll('[data-hovered]').forEach(el => {
              el.removeAttribute('data-hovered');
            });
            
            document.querySelectorAll('[data-active]').forEach(el => {
              el.removeAttribute('data-active');
            });
          }
          
          e.currentTarget.setAttribute('data-hovered', '');

          const container = e.currentTarget.closest('[data-menu-id]') || e.currentTarget.closest('[role="menu"]');

          if (!disabled && dd && __index != null) {
            if (container?.hasAttribute('data-keyboard-nav')) {
              container.removeAttribute('data-keyboard-nav');

              if (keyboardNav) {
                keyboardNav.setIsKeyboardNav(false);
              }
            }

            dd.setActiveIndex(__index);
          }
          
          if (!disabled && !focusOpts?.allItemsTabbable) {
            (e.currentTarget as HTMLElement).focus({ preventScroll: true });
          }
}}

        onFocus={() => {

        }}
        onMouseLeave={() => {

          if (dd) dd.setActiveIndex(null);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          const el = e.currentTarget as HTMLElement;
          
          
          if (e.key === "Tab" && dd && !focusOpts?.allItemsTabbable) {
            e.preventDefault();
            return;
          }
          
          
          if (e.key === "Tab" && !dd) {
            const container = el.closest('[role="menu"]') as HTMLElement;
            if (container) {
              container.removeAttribute('data-keyboard-nav');
              document.querySelectorAll('[data-highlighted]').forEach(h => h.removeAttribute('data-highlighted'));
              document.querySelectorAll('[data-hovered]').forEach(h => h.removeAttribute('data-hovered'));
              
              
              const originalTabIndex = container.tabIndex;
              container.tabIndex = -1;
              requestAnimationFrame(() => {
                container.tabIndex = originalTabIndex >= 0 ? originalTabIndex : 0;
              });
            }
            if (keyboardNav) {
              keyboardNav.setIsKeyboardNav(false);
            }
            
            return;
          }
          
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
            if (!isSubTrigger) {
              if (e.key !== "ArrowRight") {
                e.preventDefault();
                e.stopPropagation();
                activate();
              }

            }

            return;
          }
          
          if (e.key === "ArrowLeft") {
            
            const currentMenu = el.closest('[role="menu"]');
            const submenuContent = currentMenu?.closest('[data-submenu-content]');
            if (submenuContent) {
              e.preventDefault();
              e.stopPropagation();
              
              
              const parentSubTrigger = document.querySelector<HTMLElement>('[data-subtrigger][aria-expanded="true"]');
              
              if (parentSubTrigger) {
                
                const closeCallback = (parentSubTrigger as HTMLElement & { __pfuiCloseSubmenu?: () => void }).__pfuiCloseSubmenu;
                if (closeCallback) {
                  closeCallback();
                }
                
                
                document.querySelectorAll('[data-highlighted]').forEach(h => h.removeAttribute('data-highlighted'));
                document.querySelectorAll('[data-hovered]').forEach(h => h.removeAttribute('data-hovered'));
                parentSubTrigger.setAttribute('data-highlighted', '');
                parentSubTrigger.focus();
                
                
                const parentMenu = parentSubTrigger.closest('[data-menu-id]') as HTMLElement | null;
                if (parentMenu) {
                  parentMenu.setAttribute('data-keyboard-nav', '');
                }
              }
              return;
            }
          }
          
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            rootBus?.closeAll();

            const menu = el.closest('[role="menu"]');
            if (menu) {
              const trigger = document.querySelector<HTMLElement>('[aria-expanded="true"][aria-haspopup="menu"]');
              trigger?.focus();
            }
            return;
          }
          
          if (e.key === "ArrowDown") {
            e.preventDefault();
            e.stopPropagation();
            
            const container = (el.closest('[data-menu-id]') || el.closest('[role="menu"]')) as HTMLElement;
            if (!container) return;
            
            container.setAttribute('data-keyboard-nav', '');
            if (keyboardNav) {
              keyboardNav.setIsKeyboardNav(true);
            }
            
            document.querySelectorAll('[data-highlighted]').forEach(h => h.removeAttribute('data-highlighted'));
            document.querySelectorAll('[data-hovered]').forEach(h => h.removeAttribute('data-hovered'));
            
            moveFocus(el, (len, cur) => (cur + 1) % len);
            return;
          }
          
          if (e.key === "ArrowUp") {
            e.preventDefault();
            e.stopPropagation();
            
            const container = (el.closest('[data-menu-id]') || el.closest('[role="menu"]')) as HTMLElement;
            if (!container) return;
            
            container.setAttribute('data-keyboard-nav', '');
            if (keyboardNav) {
              keyboardNav.setIsKeyboardNav(true);
            }
            
            document.querySelectorAll('[data-highlighted]').forEach(h => h.removeAttribute('data-highlighted'));
            document.querySelectorAll('[data-hovered]').forEach(h => h.removeAttribute('data-hovered'));
            
            moveFocus(el, (len, cur) => (cur - 1 + len) % len);
            return;
          }
          
          if (e.key === "Home") {
            e.preventDefault();
            e.stopPropagation();
            const container = (el.closest('[data-menu-id]') || el.closest('[role="menu"]')) as HTMLElement;
            if (container) {
              container.setAttribute('data-keyboard-nav', '');
            }
            document.querySelectorAll('[data-highlighted]').forEach(h => h.removeAttribute('data-highlighted'));
            document.querySelectorAll('[data-hovered]').forEach(h => h.removeAttribute('data-hovered'));
            moveFocus(el, () => 0);
            return;
          }
          
          if (e.key === "End") {
            e.preventDefault();
            e.stopPropagation();
            const container = (el.closest('[data-menu-id]') || el.closest('[role="menu"]')) as HTMLElement;
            if (container) {
              container.setAttribute('data-keyboard-nav', '');
            }
            document.querySelectorAll('[data-highlighted]').forEach(h => h.removeAttribute('data-highlighted'));
            document.querySelectorAll('[data-hovered]').forEach(h => h.removeAttribute('data-hovered'));
            moveFocus(el, (len) => len - 1);
            return;
          }
        }}
        className={["plainframe-ui-menu-item", className || ""].join(" ").trim()}
        css={emCss(
          ...[
            itemCss,
            ...(overlayCss as Interpolation<Theme>[]),
            userCss as any
          ].flat()
        )}
        {...rest}
        onClick={(e) => {
          if (disabled) return;

          e.currentTarget.removeAttribute('data-highlighted');
          activate();
        }}
      >
        {startIcon && (
          <span className="plainframe-ui-menu-item-start" css={iconStartBox}>
            {startIcon}
          </span>
        )}
        {children}
        {(meta != null || effectiveEndIcon || selected) && (
          <span className="plainframe-ui-menu-item-end" css={iconEndBox}>
            {meta != null ? (
              <span
                className="plainframe-ui-menu-item-meta"
                css={emCss({
                  lineHeight: 1,
                  fontSize: theme.typography.sizes.sm,
                  color: theme.text.secondary,
                  whiteSpace: "nowrap",
                })}
              >
                {meta}
              </span>
            ) : null}
            {effectiveEndIcon}
            {selected && (
              <span className="plainframe-ui-menu-item-selected" css={selectedIndicatorCss}>
                <Check size={16} strokeWidth={2.5} />
              </span>
            )}
          </span>
        )}
      </div>
    );
  }
);

type CheckboxCtxT = {
  values: Array<string | number>;
  toggle: (v: string | number) => void;
};

const CheckboxCtx = React.createContext<CheckboxCtxT | null>(null);

export const MenuCheckboxGroup: React.FC<{
  values?: Array<string | number>;
  defaultValues?: Array<string | number>;
  onValuesChange?: (v: Array<string | number>) => void;
  children: React.ReactNode;
}> = ({ values, defaultValues, onValuesChange, children }) => {
  const [internal, setInternal] = useState<Array<string | number>>(defaultValues ?? []);
  const isControlled = values !== undefined;
  const vals = isControlled ? (values as Array<string | number>) : internal;

  const valsRef = useRef(vals);
  valsRef.current = vals;
  const onValuesChangeRef = useRef(onValuesChange);
  onValuesChangeRef.current = onValuesChange;

  const toggle = useCallback((v: string | number) => {
    const currentVals = valsRef.current;
    const exists = currentVals.some((x) => Object.is(x, v));
    const next = exists ? currentVals.filter((x) => !Object.is(x, v)) : [...currentVals, v];
    if (!isControlled) setInternal(next);
    onValuesChangeRef.current?.(next);
  }, [isControlled]);

  const ctx = useMemo<CheckboxCtxT>(() => ({ values: vals, toggle }), [vals, toggle]);
  return <CheckboxCtx.Provider value={ctx}>{children}</CheckboxCtx.Provider>;
};

export const MenuCheckboxItem: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<MenuCheckboxItemProps & ItemPrivate> & React.RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, MenuCheckboxItemProps & ItemPrivate>(
  function MenuCheckboxItem(
    { checked, defaultChecked = false, onCheckedChange, value, children, __index, disabled = false, css: userCss, className, startIcon, endIcon, ...rest },
    ref
  ) {
    const group = useContext(CheckboxCtx);
    const grouped = !!group && value !== undefined;

    const isControlled = !grouped && checked !== undefined;
    const [internal, setInternal] = useState<boolean>(() => {
      if (grouped) return group!.values.some((v) => Object.is(v, value));
      return !!defaultChecked;
    });

    const isChecked = grouped
      ? group!.values.some((v) => Object.is(v, value))
      : isControlled
        ? !!checked
        : internal;

    const theme = usePlainframeUITheme();
    const dense = useContext(MenuDenseCtx);
    const isDense = !!dense;

    const handleToggle = () => {
      if (disabled) return;
      if (grouped) {
        group!.toggle(value!);
      } else {
        const next = !isChecked;
        if (!isControlled) setInternal(next);
        onCheckedChange?.(next);
      }
    };

    const checkboxWrapCss = emCss({
      width: 18,
      height: 18,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "0 0 auto",
      lineHeight: 0,
      marginLeft: isDense ? -1 : -3,
      borderRadius: theme.radius.xs,
      transition: "background-color .12s ease",
    });

    const checkboxCss = emCss({ pointerEvents: "none" });

    
    const checkboxWrapRef = useCallback((node: HTMLSpanElement | null) => {
      if (node) {
        
        node.querySelectorAll('[tabindex]').forEach((el) => {
          (el as HTMLElement).tabIndex = -1;
        });
        
        node.querySelectorAll('input, button, a, [role="checkbox"]').forEach((el) => {
          (el as HTMLElement).tabIndex = -1;
        });
      }
    }, []);

    const combinedStartIcon = (
      <>
        <span
          ref={checkboxWrapRef}
          data-menu-checkbox-wrapper
          className="plainframe-ui-menu-checkbox-wrapper"
          css={checkboxWrapCss}
          aria-hidden="true"
        >
          <Checkbox size="sm" checked={isChecked} css={checkboxCss} />
        </span>
        {startIcon}
      </>
    );

    return (
      <MenuItem
        {...rest}
        className={["plainframe-ui-menu-checkbox-item", className || ""].join(" ").trim()}
        ref={ref}
        __index={__index}
        role="menuitemcheckbox"
        aria-checked={isChecked}
        closeOnSelect={false}
        onSelect={handleToggle}
        disabled={disabled}
        startIcon={combinedStartIcon}
        endIcon={endIcon}
        css={userCss}
        selected={false}
      >
        {children}
      </MenuItem>
    );
  }
);
MenuCheckboxItem.displayName = "MenuCheckboxItem";

export type MenuSwitchItemProps = Omit<MenuItemProps, "onSelect" | "startIcon" | "endIcon" | "selected"> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (next: boolean) => void;
  switchSize?: "sm" | "md" | "lg";
  switchCss?: Interpolation<Theme>;
  startIcon?: React.ReactNode;
};

export const MenuSwitchItem: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<MenuSwitchItemProps & ItemPrivate> & React.RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, MenuSwitchItemProps & ItemPrivate>(
  function MenuSwitchItem(
    {
      checked,
      defaultChecked = false,
      onCheckedChange,
      children,
      __index,
      disabled = false,
      css: userCss,
      switchSize = "md",
      switchCss,
      startIcon,
      className,
      ...rest
    },
    ref
  ) {
    const isControlled = checked !== undefined;
    const [internal, setInternal] = useState<boolean>(!!defaultChecked);
    const value = isControlled ? !!checked : internal;

    const dense = useContext(MenuDenseCtx);
    const isDense = !!dense;

    const labelCss = emCss({
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    });

    const switchWrapCss = emCss({
      marginLeft: "auto",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "flex-end",
      flex: "0 0 auto",
      flexShrink: 0,
      paddingRight: isDense ? 2 : undefined,
    });

    const toggle = () => {
      if (disabled) return;
      const next = !value;
      if (!isControlled) setInternal(next);
      onCheckedChange?.(next);
    };

    const iconStartBox = emCss({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "0 0 auto",
      lineHeight: 0,

      "& > *": { flexShrink: 0 },

      "& > svg:only-child": { width: 16, height: 16, display: "block" },
    });

    return (
      <MenuItem
        {...rest}
        className={["plainframe-ui-menu-switch-item", className || ""].join(" ").trim()}
        ref={ref}
        __index={__index}
        disabled={disabled}
        closeOnSelect={false}
        onSelect={toggle}
        css={userCss}
        selected={false}
      >
        {startIcon && (
          <span className="plainframe-ui-menu-item-start" css={iconStartBox}>
            {startIcon}
          </span>
        )}
        <span data-label css={labelCss} className="plainframe-ui-menu-item-label">
          {children}
        </span>
        <span className="plainframe-ui-menu-switch-wrap" css={switchWrapCss}>
          <Switch
            checked={value}
            css={emCss({ pointerEvents: "none", padding: 0, marginRight: -1 }, switchCss as any)}
            className="plainframe-ui-menu-switch"
            tabIndex={-1}
            size={switchSize}
          />
        </span>
      </MenuItem>
    );
  }
);
MenuSwitchItem.displayName = "MenuSwitchItem";

type RadioCtxT = {
  value?: string | number;
  onChange?: (v: string | number) => void;
};
const RadioCtx = React.createContext<RadioCtxT | null>(null);

export const MenuRadioGroup: React.FC<MenuRadioGroupProps> = ({
  value,
  defaultValue,
  onValueChange,
  children,
}) => {
  const [uc, setUc] = useState<string | number | undefined>(defaultValue);
  const val = value ?? uc;
  const onChange = (v: string | number) => {
    if (value !== undefined) onValueChange?.(v);
    else {
      setUc(v);
      onValueChange?.(v);
    }
  };
  const ctx = useMemo<RadioCtxT>(() => ({ value: val, onChange }), [val]);
  return <RadioCtx.Provider value={ctx}>{children}</RadioCtx.Provider>;
};
MenuRadioGroup.displayName = "MenuRadioGroup";

export const MenuRadioItem: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<MenuRadioItemProps & ItemPrivate> & React.RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, MenuRadioItemProps & ItemPrivate>(
  function MenuRadioItem({ value, children, __index, disabled = false, css: userCss, className, ...rest }, ref) {
    const radio = useContext(RadioCtx);
    const checked = radio?.value === value;
    const theme = usePlainframeUITheme();

    const dotBoxCss = emCss({
      width: theme.spacing.md,
      display: "inline-flex",
      justifyContent: "center",
      alignItems: "center",
      marginLeft: -1,
    });

    const dotInnerCss = emCss({
      width: 7,
      height: 7,
      borderRadius: "100%",
      backgroundColor: theme.palette.primary[600],
      transform: checked ? "scale(1)" : "scale(0.4)",
      opacity: checked ? 1 : 0,
      transition: "transform 140ms ease-out, opacity 140ms linear",
      transformOrigin: "center center",
    });

    const textCss = emCss({ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" });

    return (
      <MenuItem
        {...rest}
        className={["plainframe-ui-menu-radio-item", className || ""].join(" ").trim()}
        ref={ref}
        __index={__index}
        role="menuitemradio"
        aria-checked={checked}
        closeOnSelect={false}
        onSelect={() => {
          if (!disabled) (radio as any)?.onChange?.(value as any);
        }}
        disabled={disabled}
        css={userCss}
        selected={false}
      >
        <span className="plainframe-ui-menu-radio-dotbox" css={dotBoxCss}>
          <span className="plainframe-ui-menu-radio-dot" css={dotInnerCss} />
        </span>
        <span className="plainframe-ui-menu-item-label" css={textCss}>
          {children}
        </span>
      </MenuItem>
    );
  }
);

export const MenuLabel: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<MenuLabelProps> & React.RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, MenuLabelProps>(function MenuLabel(
  { inset, className, css: userCss, children, startIcon, endIcon, wrap = false, color = "primary", ...rest },
  ref
) {
  const theme = usePlainframeUITheme();
  const denseFromMenu = useContext(MenuDenseCtx);
  const dense = !!denseFromMenu;

  const textColor = 
    color === "primary" ? theme.text.primary :
    color === "secondary" ? theme.text.secondary :
    theme.palette[color]?.[700] ?? theme.text.primary;

  const base = emCss({
    display: "flex",
    alignItems: "center",
    padding: dense ? `${theme.spacing.sm} ${theme.spacing.md}` : `${theme.spacing.sm} ${theme.spacing.md}`,
    fontSize: theme.typography.sizes.sm,
    color: textColor,
    fontWeight: 500,
    ...(inset ? { paddingLeft: `calc(${theme.spacing.lg} * 2)` } : null),
    gap: theme.spacing.xs,
  });

  const textCss = emCss({
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: wrap ? "normal" : "nowrap",
  });

  const iconStartBox = emCss({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 auto",
    lineHeight: 0,
    padding: "0 3px 0 2px",
    marginLeft: -2,
    "& > svg": { width: 16, height: 16, display: "block" },
  });

  const iconEndBox = emCss({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: "0 0 auto",
    flexShrink: 0,
    lineHeight: 0,
    "& > svg": { width: 16, height: 16, display: "block" },
  });

  return (
    <div
      ref={ref}
      role="presentation"
      className={["plainframe-ui-menu-label", className || ""].join(" ").trim()}
      css={emCss(base, userCss as any)}
      {...rest}
    >
      {startIcon && <span className="plainframe-ui-menu-label-start" css={iconStartBox}>{startIcon}</span>}
      <span className="plainframe-ui-menu-label-text" css={textCss}>
        {children}
      </span>
      {endIcon && <span className="plainframe-ui-menu-label-end" css={iconEndBox}>{endIcon}</span>}
    </div>
  );
});
MenuLabel.displayName = "MenuLabel";

export const MenuSeparator: React.FC<MenuSeparatorProps> = ({
  className,
  css: userCss,
  variant = "full",
  ...rest
}) => {
  const theme = usePlainframeUITheme();

  const padVar = `var(--pfui-panel-pad, ${typeof theme.spacing.xs === "number" ? theme.spacing.xs + "px" : String(theme.spacing.xs)
    })`;

  const fullCss = emCss({
    height: 1,
    background: theme.surface.border,
    marginTop: padVar,
    marginBottom: padVar,
    marginLeft: "calc(var(--pfui-panel-pad, 0px) * -1)",
    marginRight: "calc(var(--pfui-panel-pad, 0px) * -1)",
  });

  const middleCss = emCss({
    height: 1,
    background: theme.surface.border,
    marginTop: padVar,
    marginBottom: padVar,
    marginLeft: `${theme.spacing.md}`,
    marginRight: `${theme.spacing.md}`,
  });

  const insetCss = emCss({
    height: 1,
    background: theme.surface.border,
    marginTop: padVar,
    marginBottom: padVar,
    marginLeft: `${theme.spacing.lg}`,
    marginRight: 0,
  });

  const variantCss = variant === "full" ? fullCss : variant === "middle" ? middleCss : insetCss;

  return (
    <div
      role="separator"
      className={["plainframe-ui-menu-separator", className || ""].join(" ").trim()}
      css={emCss(variantCss, userCss as any)}
      {...rest}
    />
  );
};