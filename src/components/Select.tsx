/** @jsxImportSource @emotion/react */
import React, { type JSX } from "react";
import { css as emCss } from "@emotion/react";
import type { Interpolation, Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { ChevronsUpDown } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "./DropdownMenu";
import { useFocusRing } from "../utils/focusRing";
import { MenuItem } from "./MenuItems";

type Align = "left" | "center" | "right";
type Variant = "subtle" | "outlined" | "ghost";

export type SelectItemProps<T = unknown> = {
  value: T;
  label?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  children?: React.ReactNode;
  css?: Interpolation<Theme>;
  className?: string;
};

export const SelectItem = <T,>(props: SelectItemProps<T>): JSX.Element | null => {
  void props;
  return null;
};
SelectItem.displayName = "SelectItem";

export type SelectProps<T = unknown> = {
  value?: T | T[];
  defaultValue?: T | T[];
  onChange?: (value: T | T[]) => void;

  label?: string;
  placeholder?: string | React.ReactNode;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;

  multiple?: boolean;

  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: Variant;
  fullWidth?: boolean;
  width?: number | string;

  menuAlign?: Align;
  menuWidth?: number | string;
  menuMaxHeight?: number | string;

  wrapperCss?: Interpolation<Theme>;
  labelCss?: Interpolation<Theme>;
  triggerCss?: Interpolation<Theme>;
  menuCss?: Interpolation<Theme>;
  optionCss?: Interpolation<Theme>;

  children: React.ReactNode;
  className?: string;
  menuSize?: "sm" | "md";

  triggerRender?: (selected: React.ReactNode | React.ReactNode[] | undefined) => React.ReactNode;
};

type AnyCSS = Interpolation<Theme> | null | undefined | false;
const cx = (...parts: AnyCSS[]): Interpolation<Theme>[] => parts.filter(Boolean).flat() as Interpolation<Theme>[];

const isSelectItemElement = (el: React.ReactElement<any>): boolean => {
  if (el.type === SelectItem) return true;
  const p: any = el.props;
  if (p?.type === SelectItem) return true;
  if (p?.__EMOTION_TYPE_PLEASE_DO_NOT_USE__ === SelectItem) return true;
  return false;
};

const extractSelectItemProps = (el: React.ReactElement<any>): SelectItemProps<any> => {
  if (el.type === SelectItem) return el.props as any;
  const p: any = el.props || {};
  const { type, __EMOTION_TYPE_PLEASE_DO_NOT_USE__, ...rest } = p;
  return rest as any;
};

function collectSelectItems(node: React.ReactNode, out: React.ReactElement<any>[]) {
  if (node == null || typeof node === "boolean") return;

  if (Array.isArray(node)) {
    for (const n of node) collectSelectItems(n, out);
    return;
  }

  if (!React.isValidElement(node)) return;

  const el = node as React.ReactElement<any>;

  if (isSelectItemElement(el)) {
    out.push(el);
    return;
  }

  if (el.type === React.Fragment) {
    collectSelectItems((el.props as any).children, out);
    return;
  }
}

export const Select = <T,>({
  value,
  defaultValue,
  onChange,

  label,
  placeholder = "Select…",
  startIcon,
  endIcon,

  multiple = false,

  disabled = false,
  size = "md",
  variant = "subtle",
  fullWidth,
  width = 200,

  menuAlign = "left",
  menuWidth,
  menuMaxHeight = 280,

  wrapperCss,
  labelCss,
  triggerCss,
  menuCss,
  optionCss,

  children,
  className,
  menuSize = "md",
  triggerRender,
}: SelectProps<T>): JSX.Element => {
  const theme = usePlainframeUITheme();
  const focusRing = useFocusRing();
  const ids = React.useId();
  const labelId = `${ids}-label`;
  const contentId = `${ids}-menu`;

  const sizeCfg: Record<"sm" | "md" | "lg", { minHeight: number | string; radius: string | number }> = {
    sm: { minHeight: theme.componentHeights.sm, radius: theme.radius.sm },
    md: { minHeight: theme.componentHeights.md, radius: theme.radius.md },
    lg: { minHeight: theme.componentHeights.lg, radius: theme.radius.md },
  };
  const S = sizeCfg[size] || sizeCfg.md;

  const [open, setOpen] = React.useState(false);
  const setOpenSafe = (next: boolean): void => setOpen(!!next);

  const controlled = typeof value !== "undefined";
  const inferredMulti = multiple || Array.isArray(value) || Array.isArray(defaultValue);

  const [inner, setInner] = React.useState<T | T[] | undefined>(() => {
    if (typeof defaultValue !== "undefined") return defaultValue;
    return inferredMulti ? ([] as T[]) : undefined;
  });

  const cur = (controlled ? value : inner) as T | T[] | undefined;

  const setValue = (next: T | T[]): void => {
    if (!controlled) setInner(next);
    onChange?.(next);
  };

  const optionEls: React.ReactElement<any>[] = [];
  collectSelectItems(children, optionEls);

  const options = optionEls.map((el, i) => {
    const p = extractSelectItemProps(el);

    const labelText =
      typeof p.children === "string" || typeof p.children === "number" ? String(p.children) : undefined;

    const valueText =
      typeof p.value === "string" || typeof p.value === "number" ? String(p.value) : undefined;

    const triggerLabel = p.label ?? labelText ?? valueText;

    return {
      key: el.key ?? i,
      value: p.value,
      startIcon: p.startIcon,
      endIcon: p.endIcon,
      node: p.children,
      triggerLabel,
      itemCss: p.css,
      itemClassName: p.className,
    };
  });

  const isSelected = (v: any): boolean => {
    if (inferredMulti) {
      const arr = Array.isArray(cur) ? (cur as any[]) : [];
      return arr.some((x) => Object.is(x, v));
    }
    return Object.is(cur, v);
  };

  const selectionForTrigger: React.ReactNode | React.ReactNode[] | undefined = React.useMemo(() => {
    if (inferredMulti) {
      const arr = Array.isArray(cur) ? (cur as any[]) : [];
      const selected = options.filter((it) => arr.some((x) => Object.is(x, it.value)));
      return selected.map((it) => it.triggerLabel ?? it.node);
    }
    const one = options.find((it) => Object.is(it.value, cur));
    if (!one) return undefined;
    return one.triggerLabel ?? one.node;
  }, [cur, inferredMulti, options]);

  const toggleSingleAndClose = (v: any): void => {
    if (disabled) return;
    if (!Object.is(v, cur as any)) setValue(v);
    setOpenSafe(false);
  };

  const toggleMulti = (v: any): void => {
    if (disabled) return;
    const prev = Array.isArray(cur) ? (cur as any[]) : [];
    const exists = prev.some((x) => Object.is(x, v));
    const next = exists ? prev.filter((x) => !Object.is(x, v)) : [...prev, v];
    setValue(next);
  };

  const wrapperStyles: Interpolation<Theme> = {
    position: "relative",
    width: fullWidth ? "100%" : typeof width === "number" ? `${width}px` : width,
    maxWidth: "100%",
  };

  const triggerBaseObj: Interpolation<Theme> = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: S.radius as number | string,
    minHeight: S.minHeight as number | string,
    fontSize: theme.typography.sizes.sm,
    padding: `0 ${typeof theme.spacing.sm === "number" ? `${theme.spacing.sm}px` : theme.spacing.sm} 0 ${
      typeof theme.spacing.md === "number" ? `${theme.spacing.md}px` : theme.spacing.md
    }`,
    fontWeight: 500,
    lineHeight: 1,
    userSelect: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    outline: "none",
    transition: "box-shadow .16s ease",
    color: theme.text.primary,
    background: "transparent",
    whiteSpace: "nowrap",
  };

  const triggerVariantObj: Interpolation<Theme> =
    variant === "subtle"
      ? { background: theme.surface.subtleBg }
      : variant === "outlined"
        ? { background: theme.surface.panelBg, border: `1px solid ${theme.surface.border}` }
        : { background: "transparent" };

  const triggerContentObj: Interpolation<Theme> = {
    flex: 1,
    minWidth: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "flex",
    alignItems: "center",
    textAlign: "left",
    gap: 8,
  };

  const triggerStartIconObj: Interpolation<Theme> = {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const titleObj: Interpolation<Theme> = {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontWeight: 500,
    display: "block",
  };

  const chevron = (
    <ChevronsUpDown
      size={16}
      css={emCss({ color: theme.text.secondary, flexShrink: 0 })}
      strokeWidth={2.5}
      className="plainframe-ui-select-chevron"
    />
  );

  const renderTriggerSummary = (): React.ReactNode => {
    if (triggerRender) return triggerRender(selectionForTrigger);

    if (Array.isArray(selectionForTrigger)) {
      const texts = selectionForTrigger.map((n) => (typeof n === "string" ? n : "")).filter(Boolean);
      const text =
        texts.length > 0
          ? texts.join(", ")
          : selectionForTrigger.length > 0
            ? `${selectionForTrigger.length} selected`
            : String(placeholder);

      return (
        <>
          {startIcon && <span css={emCss(triggerStartIconObj)}>{startIcon}</span>}
          <span css={emCss(titleObj)} title={text}>
            {text}
          </span>
        </>
      );
    }

    const node = selectionForTrigger ?? String(placeholder);
    return (
      <>
        {startIcon && <span css={emCss(triggerStartIconObj)}>{startIcon}</span>}
        <span css={emCss(titleObj)} title={typeof node === "string" ? node : undefined}>
          {node}
        </span>
      </>
    );
  };

  const alignMap: Record<Align, "start" | "center" | "end"> = {
    left: "start",
    center: "center",
    right: "end",
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpenSafe(true);
    }
  };

  return (
    <div css={cx(wrapperStyles, wrapperCss)} className={["plainframe-ui-select-wrapper", className || ""].join(" ").trim()}>
      {label && (
        <div
          id={labelId}
          className="plainframe-ui-select-label"
          css={cx(
            {
              marginBottom: 6,
              fontSize: theme.typography.sizes.sm,
              fontWeight: 500,
              color: theme.text.secondary,
            } as Interpolation<Theme>,
            labelCss
          )}
        >
          {label}
        </div>
      )}

      <DropdownMenu size={menuSize} open={open} onOpenChange={setOpenSafe}>
        <DropdownMenuTrigger width="100%" asChild>
          <button
            type="button"
            disabled={disabled}
            aria-haspopup="menu"
            aria-expanded={open || undefined}
            aria-controls={contentId}
            aria-labelledby={label ? labelId : undefined}
            onKeyDown={onTriggerKeyDown}
            onClick={() => setOpenSafe(!open)}
            className="plainframe-ui-select-trigger"
            css={cx(emCss(triggerBaseObj), emCss(triggerVariantObj), triggerCss, focusRing())}
          >
            <div className="plainframe-ui-select-trigger-content" css={emCss(triggerContentObj)}>
              {renderTriggerSummary()}
            </div>
            {endIcon ?? chevron}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          id={contentId}
          gap={"xs"}
          align={alignMap[menuAlign]}
          sameWidth={menuWidth == null}
          width={menuWidth ?? width}
          className="plainframe-ui-select-menu"
          css={cx(
            {
              maxHeight: typeof menuMaxHeight === "number" ? `${menuMaxHeight}px` : menuMaxHeight,
              overflowY: "auto",
            } as Interpolation<Theme>,
            menuCss
          )}
        >
          {options.map((it, idx) => {
            const selected = isSelected(it.value);
            return (
              <MenuItem
                key={it.key ?? idx}
                startIcon={it.startIcon}
                endIcon={it.endIcon}
                selected={selected}
                disabled={disabled}
                closeOnSelect={!inferredMulti}
                onSelect={() => (inferredMulti ? toggleMulti(it.value) : toggleSingleAndClose(it.value))}
                css={cx(optionCss, it.itemCss)}
                className={["plainframe-ui-select-option", it.itemClassName || ""].join(" ").trim()}
              >
                {it.node}
              </MenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

Select.displayName = "Select";
export default Select;