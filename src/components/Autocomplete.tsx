/** @jsxImportSource @emotion/react */
import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { TextField } from "./TextField";
import {
  DropdownMenu as DropdownRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  MenuCtx,
  ActiveIndexContext,
} from "./DropdownMenu";
import { MenuItem, MenuCheckboxItem, MenuCheckboxGroup, MenuLabel } from "./MenuItems";
import { ChevronDown } from "lucide-react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";

type AutocompleteItem = {
  value: string;
  title?: string;
  description?: string;
  disabled?: boolean;
  group?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  css?: Interpolation<Theme>;
  [key: string]: unknown;
};

type WithCss = { css?: Interpolation<Theme> };

type AutocompleteProps = WithCss & {
  items?: AutocompleteItem[];
  onSelect?: (item: AutocompleteItem) => void;

  width?: number | string;
  fullWidth?: boolean;
  placeholder?: string;
  renderItem?: (
    item: AutocompleteItem,
    selected?: boolean
  ) => React.ReactNode;

  inputCss?: Interpolation<Theme>;
  containerCss?: Interpolation<Theme>;
  label?: string;
  helperText?: string;

  variant?: "subtle" | "outlined" | "ghost";
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  focusRingMode?: "always" | "none";
  expandIcon?: React.ReactNode;
  showExpandIcon?: boolean;
  expandIconCss?: Interpolation<Theme>;

  disabled?: boolean;
  error?: boolean;
  showClear?: boolean;

  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  openOnFocus?: boolean;
  openOnType?: boolean;
  openOnClick?: boolean;
  closeOnSelect?: boolean;
  closeOnBlur?: boolean;
  blurOnSelect?: boolean;

  freeSolo?: boolean;
  customValueLabel?: boolean | { prefix?: string; suffix?: string };

  maxHeight?: number | string;
  maxItems?: number;
  noResultsText?: string;

  highlightTypedValue?: boolean;
  typedValueHighlightCss?: Interpolation<Theme>;

  showNoResults?: boolean;
  noResultsLabelCss?: Interpolation<Theme>;

  loadingLabelCss?: Interpolation<Theme>;

  loadItems?: (query: string) => Promise<AutocompleteItem[]>;
  loading?: boolean;
  loadingText?: string;
  debounceMs?: number;

  multiple?: boolean;
  selectedValues?: string[];
  defaultSelectedValues?: string[];
  onChangeSelected?: (items: AutocompleteItem[]) => void;

  textFieldWrapperCss?: Interpolation<Theme>;
  textFieldInputCss?: Interpolation<Theme>;
  textFieldLabelCss?: Interpolation<Theme>;
  textFieldHelperRowCss?: Interpolation<Theme>;
  textFieldHelperTextCss?: Interpolation<Theme>;
  textFieldStartIconCss?: Interpolation<Theme>;
  textFieldEndIconCss?: Interpolation<Theme>;

  menuContentCss?: Interpolation<Theme>;
};

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

const STATIC_HIGHLIGHT_WRAP_CSS = css({ display: "inline" });
const STATIC_HIGHLIGHT_TEXT_CSS = css({ display: "inline", fontWeight: 700 });
const STATIC_ANCHOR_CSS = css({
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0,
  zIndex: -1,
  outline: "none",
});
const STATIC_END_ICON_CONTAINER_CSS = css({
  display: "flex",
  alignItems: "center",
  gap: 4,
});

const STATIC_CONTENT_WRAP_CSS = css({
  flex: "1 1 auto",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 2,
});

const STATIC_TITLE_CSS = css({
  fontWeight: 500,
  overflow: "hidden",
  overflowWrap: "break-word",
  wordBreak: "break-word",
});

const STATIC_DESCRIPTION_CSS = css({
  fontSize: "0.875em",
  overflow: "hidden",
  overflowWrap: "break-word",
  wordBreak: "break-word",
  fontWeight: 400,
});

const NOOP_PICK_SINGLE = () => {};
const IDENTITY_PAINT = (text: string) => text;

const autocompleteClassName = (s: string) => `plainframe-ui-autocomplete${s ? `-${s}` : ""}`;

const HANDLE_ITEM_MOUSE_DOWN = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
  e.preventDefault();
  e.stopPropagation();
};
const HANDLE_ITEM_KEY_DOWN = (e: React.KeyboardEvent<HTMLDivElement>) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    e.stopPropagation();
  }
};
const HANDLE_CHEVRON_MOUSE_DOWN = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

const CtxCapture: React.FC<{ onCapture: (ctx: any) => void }> = React.memo(({ onCapture }) => {
  const menuCtx = useContext(MenuCtx);
  const activeCtx = useContext(ActiveIndexContext);
  const combined = useMemo(() => ({
    ...menuCtx,
    activeIndex: activeCtx?.activeIndex ?? null,
    setActiveIndex: activeCtx?.setActiveIndex ?? menuCtx?.setActiveIndex,
  }), [menuCtx, activeCtx]);
  useEffect(() => { onCapture(combined); }, [combined, onCapture]);
  return null;
});
CtxCapture.displayName = "CtxCapture";

const AutocompleteRow: React.FC<{
  item: AutocompleteItem;
  absIndex: number;
  multiple: boolean;
  getCurrentMulti: () => string[];
  isSelected: boolean;
  renderItem?: (item: AutocompleteItem, selected?: boolean) => React.ReactNode;
  paint: (text: string) => React.ReactNode;
  cls: (s: string) => string;
  closeOnSelect: boolean;
  pickSingle: (value: string) => void;
  handleItemKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  handleItemMouseDown: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  descriptionColor: string;
}> = React.memo(({
  item, absIndex, multiple, getCurrentMulti, isSelected,
  renderItem, paint, cls, closeOnSelect, pickSingle,
  handleItemKeyDown, handleItemMouseDown, descriptionColor,
}) => {
 
  const currentMulti = getCurrentMulti();

  const paintedTitle = useMemo(() => {
    const itemText = String(item.title ?? item.value);
    return renderItem ? itemText : paint(itemText);
  }, [paint, item.title, item.value, renderItem]);

  const contentNode = useMemo(() => {
    if (item.description) {
      return (
        <span className="plainframe-ui-autocomplete-item-content" css={STATIC_CONTENT_WRAP_CSS}>
          <span className="plainframe-ui-autocomplete-item-title" css={STATIC_TITLE_CSS}>{paintedTitle}</span>
          <span className="plainframe-ui-autocomplete-item-description" css={[STATIC_DESCRIPTION_CSS, { color: descriptionColor }]}>{item.description}</span>
        </span>
      );
    }
    return <span className="plainframe-ui-autocomplete-item-title" css={STATIC_TITLE_CSS}>{paintedTitle}</span>;
  }, [paintedTitle, item.description, descriptionColor]);

  const handleSelect = useCallback(() => {
    if (item.disabled) return;
    pickSingle(item.value);
  }, [item.disabled, item.value, pickSingle]);

  if (multiple) {
    const selectedMulti = currentMulti.some((v) => Object.is(v, item.value));

    if (renderItem) {
      return (
        <MenuCheckboxItem
          __index={absIndex}
          key={item.value}
          value={item.value}
          disabled={!!item.disabled}
          closeOnSelect={false}
          aria-disabled={!!item.disabled}
          className={`plainframe-ui-select-option ${cls("checkbox-item")}`.trim()}
          css={item.css as Interpolation<Theme>}
          onMouseDown={handleItemMouseDown}
        >
          {renderItem(item, selectedMulti)}
        </MenuCheckboxItem>
      );
    }

    return (
      <MenuCheckboxItem
        __index={absIndex}
        key={item.value}
        value={item.value}
        disabled={!!item.disabled}
        closeOnSelect={false}
        aria-disabled={!!item.disabled}
        className={`plainframe-ui-select-option ${cls("checkbox-item")}`.trim()}
        css={item.css as Interpolation<Theme>}
        onMouseDown={handleItemMouseDown}
        startIcon={item.startIcon}
        endIcon={item.endIcon}
      >
        {contentNode}
      </MenuCheckboxItem>
    );
  }

  if (renderItem) {
    return (
      <MenuItem
        __index={absIndex}
        key={item.value}
        onClick={handleSelect}
        onSelect={handleSelect}
        onKeyDown={handleItemKeyDown}
        aria-disabled={!!item.disabled}
        disabled={!!item.disabled}
        className={cls("item")}
        css={item.css}
        closeOnSelect={closeOnSelect}
        onMouseDown={handleItemMouseDown}
        selected={isSelected}
      >
        {renderItem(item, isSelected)}
      </MenuItem>
    );
  }

  return (
    <MenuItem
      startIcon={item.startIcon}
      endIcon={item.endIcon}
      __index={absIndex}
      key={item.value}
      onClick={handleSelect}
      onSelect={handleSelect}
      onKeyDown={handleItemKeyDown}
      aria-disabled={!!item.disabled}
      disabled={!!item.disabled}
      className={cls("item")}
      css={item.css}
      closeOnSelect={closeOnSelect}
      onMouseDown={handleItemMouseDown}
      selected={isSelected}
    >
      {contentNode}
    </MenuItem>
  );
}, (prev, next) => {
  if (
    prev.item.value !== next.item.value ||
    prev.item.disabled !== next.item.disabled ||
    prev.item.description !== next.item.description ||
    prev.absIndex !== next.absIndex ||
    prev.multiple !== next.multiple ||
    prev.closeOnSelect !== next.closeOnSelect ||
    prev.renderItem !== next.renderItem ||
    prev.pickSingle !== next.pickSingle ||
    prev.isSelected !== next.isSelected ||
    prev.paint !== next.paint ||
    prev.descriptionColor !== next.descriptionColor
  ) return false;
  return true;
});
AutocompleteRow.displayName = "AutocompleteRow";

export const Autocomplete: React.FC<AutocompleteProps> = React.memo(({
  items = [],
  onSelect,

  width = 300,
  fullWidth = false,
  placeholder,

  renderItem,

  focusRingMode,
  css: rootCssOverride,
  inputCss,
  containerCss,
  label,
  helperText,
  variant,
  startIcon,
  endIcon,
  size,

  disabled = false,
  error = false,
  showClear = false,

  open: openProp,
  onOpenChange,
  openOnFocus = false,
  openOnType = true,
  openOnClick = true,
  closeOnSelect = true,
  closeOnBlur = true,
  blurOnSelect = false,

  freeSolo = false,
  customValueLabel = false,

  maxHeight,
  maxItems,
  noResultsText = "No Items Found",

  highlightTypedValue,
  typedValueHighlightCss,

  showNoResults = true,

  noResultsLabelCss,
  loadingLabelCss,

  loadItems,
  loading: loadingProp,
  loadingText = "Loading…",
  debounceMs = 200,

  multiple = false,
  selectedValues,
  defaultSelectedValues,
  onChangeSelected,
  expandIcon,
  showExpandIcon = true,
  expandIconCss,

  textFieldWrapperCss,
  textFieldInputCss,
  textFieldLabelCss,
  textFieldHelperRowCss,
  textFieldHelperTextCss,
  textFieldStartIconCss,
  textFieldEndIconCss,

  menuContentCss,
}) => {
  const theme = usePlainframeUITheme();
  const descriptionColor = theme.text.secondary;
  
  const [inputValue, setInputValue] = useState("");
  const isOpenControlled = typeof openProp === "boolean";
  const [ucOpen, setUcOpen] = useState(false);
  const open = isOpenControlled ? (openProp as boolean) : ucOpen;

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuCtxRef = useRef<any>(null);
  const blurAnchorRef = useRef<HTMLSpanElement>(null);

  const shouldKeepOpenRef = useRef(false);
  const chevronRef = useRef<HTMLSpanElement>(null);
  const justClosedRef = useRef(false);
  const focusOpenedAtRef = useRef<number>(0);

  const ignoreOutsidePressRefs = useMemo(() => [wrapperRef], []);

  const [ucMulti, setUcMulti] = useState<string[]>(defaultSelectedValues ?? []);
  const currentMulti = selectedValues ?? ucMulti;
  const currentMultiRef = useRef(currentMulti);
  currentMultiRef.current = currentMulti;

  const [selected, setSelected] = useState<AutocompleteItem | null>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const getCurrentMulti = useCallback(() => currentMultiRef.current, []);

  const [asyncItems, setAsyncItems] = useState<AutocompleteItem[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const isAsync = typeof loadItems === "function";
  const effectiveItems = isAsync ? asyncItems : items;
  const effectiveItemsRef = useRef(effectiveItems);
  effectiveItemsRef.current = effectiveItems;
  const isLoading = Boolean(loadingProp) || (internalLoading && isAsync);

  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => { onOpenChangeRef.current = onOpenChange; }, [onOpenChange]);

  const requestOpen = useCallback((next: boolean) => {
    if (!isOpenControlled) setUcOpen(next);
    onOpenChangeRef.current?.(next);
  }, [isOpenControlled]);

  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isAsync) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const q = inputValue;
    debounceRef.current = window.setTimeout(async () => {
      setInternalLoading(true);
      try {
        const next = (await loadItems!(q)) || [];
        setAsyncItems(Array.isArray(next) ? next : []);
      } catch {
        setAsyncItems([]);
      } finally {
        setInternalLoading(false);
      }
    }, Math.max(0, debounceMs));
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [inputValue, isAsync, loadItems, debounceMs]);

  const equalExists = useMemo(() => {
    const q = normalize(inputValue);
    if (!q) return false;
    return effectiveItems.some((o) => normalize(o.title ?? o.value) === q);
  }, [effectiveItems, inputValue]);

  const allowFree = freeSolo && !!customValueLabel && inputValue.trim().length > 0 && !equalExists;

  const buildFreeLabel = (v: string) => {
    if (typeof customValueLabel === "object") {
      const hasPrefix = Object.prototype.hasOwnProperty.call(customValueLabel, "prefix");
      const hasSuffix = Object.prototype.hasOwnProperty.call(customValueLabel, "suffix");
      if (hasPrefix || hasSuffix) {
        const prefix = hasPrefix ? customValueLabel.prefix ?? "" : "";
        const suffix = hasSuffix ? customValueLabel.suffix ?? "" : "";
        return `${prefix}${v}${suffix}`;
      }
      return `Add "${v}"`;
    }
    return `Add "${v}"`;
  };

  const filteredBase = useMemo(() => {
    if (isAsync) return effectiveItems;
    const q = normalize(inputValue);
    if (!q) return effectiveItems;
    
    const startsWithMatches: AutocompleteItem[] = [];
    const includesMatches: AutocompleteItem[] = [];
    
    for (const it of effectiveItems) {
      const label = normalize(it.title ?? it.value);
      const words = label.split(" ");
      if (words.some((w) => w.startsWith(q))) {
        startsWithMatches.push(it);
      } else if (label.includes(q)) {
        includesMatches.push(it);
      }
    }
    
    return startsWithMatches.length > 0 ? startsWithMatches : includesMatches;
  }, [effectiveItems, inputValue, isAsync]);

  const baseWithFree = useMemo(() => {
    if (allowFree) {
      const v = inputValue.trim();
      return [...filteredBase, { value: v, title: buildFreeLabel(v), __pfui_free__: true } as AutocompleteItem];
    }
    return filteredBase;
  }, [filteredBase, allowFree, inputValue]);

  const sections = useMemo(() => {
    const order: string[] = [];
    const groups = new Map<string, AutocompleteItem[]>();
    
    for (const o of baseWithFree) {
      const k = o.group ?? "__ungrouped__";
      if (!groups.has(k)) {
        groups.set(k, []);
        order.push(k);
      }
      groups.get(k)!.push(o);
    }
    
    const max = typeof maxItems === "number" ? Math.max(0, maxItems) : Infinity;
    let remaining = max;
    const out: Array<{ label?: string; items: AutocompleteItem[] }> = [];
    
    for (const k of order) {
      if (remaining <= 0) break;
      const list = groups.get(k)!;
      const take = list.slice(0, remaining);
      if (take.length > 0) {
        out.push({ label: k === "__ungrouped__" ? undefined : k, items: take });
        remaining -= take.length;
      }
    }
    
    return out;
  }, [baseWithFree, maxItems]);

  const flatItems = useMemo(
    () => sections.reduce<AutocompleteItem[]>((acc, s) => { acc.push(...s.items); return acc; }, []),
    [sections]
  );

  const hasItems = flatItems.length > 0;
  const shouldShowNoResults = !hasItems && !!showNoResults && !isLoading && inputValue.trim().length > 0;

  const panelHasContent = isLoading || hasItems || shouldShowNoResults;
  const canOpenMenu = panelHasContent || isAsync;

  useEffect(() => {
    if (!isAsync && open && !panelHasContent) {
      justClosedRef.current = true;
      requestOpen(false);
      setTimeout(() => { justClosedRef.current = false; }, 150);
    }
  }, [isAsync, open, panelHasContent, requestOpen]);

  const lastFreeSoloValueRef = useRef<string | null>(null);
  const skipFreeSoloEmitRef = useRef(false);

  useEffect(() => {
    if (freeSolo && !multiple) {
      if (skipFreeSoloEmitRef.current) {
        skipFreeSoloEmitRef.current = false;
        return;
      }
      const val = inputValue.trim();
      if (lastFreeSoloValueRef.current === val) return;
      lastFreeSoloValueRef.current = val;
      const it = { value: val, title: val } as AutocompleteItem;
      onSelect?.(it);
    }
  }, [inputValue, freeSolo, multiple, onSelect]);

  const emitMultiChange = useCallback((nextValues: string[]) => {
    const items = effectiveItemsRef.current;
    const itemMap = new Map(items.map(i => [i.value, i]));
    
    const nextItems = nextValues.map(v => 
      itemMap.get(v) ?? ({ value: v, title: v } as AutocompleteItem)
    );
    
    onChangeSelected?.(nextItems);
  }, [onChangeSelected]);

  const handleMultiValuesChange = useCallback((vals: Array<string | number>) => {
    const next = vals.map(String);
    if (selectedValues) {
      emitMultiChange(next);
    } else {
      setUcMulti(next);
      emitMultiChange(next);
    }
  }, [selectedValues, emitMultiChange]);

  const toggleMultiFromKeyboard = useCallback((value: string) => {
    const exists = currentMulti.includes(value);
    const next = exists ? currentMulti.filter((v) => v !== value) : [...currentMulti, value];
    handleMultiValuesChange(next);
  }, [currentMulti, handleMultiValuesChange]);

  const pickSingle = useCallback((value: string) => {
    const it = effectiveItemsRef.current.find((o) => o.value === value) ?? ({ value, title: value } as AutocompleteItem);
    if (it.disabled) return;

    skipFreeSoloEmitRef.current = true;
    lastFreeSoloValueRef.current = (it.title ?? it.value).trim();

    setSelected(it);
    setInputValue(it.title ?? it.value);
    onSelect?.(it);

    if (!isOpenControlled) {
      if (closeOnSelect) {
        shouldKeepOpenRef.current = false;
        justClosedRef.current = true;
        setUcOpen(false);
        onOpenChangeRef.current?.(false);
        setTimeout(() => { justClosedRef.current = false; }, 150);
      } else {
        shouldKeepOpenRef.current = true;
      }
    }

    if (!closeOnSelect && menuCtxRef.current?.setActiveIndex) {
      menuCtxRef.current.setActiveIndex(null);
    }

    if (blurOnSelect) {
      shouldKeepOpenRef.current = false;
      setTimeout(() => {
        if (blurAnchorRef.current && inputRef.current) {
          blurAnchorRef.current.tabIndex = 0;
          blurAnchorRef.current.focus();
          blurAnchorRef.current.blur();
          blurAnchorRef.current.tabIndex = -1;
        } else {
          inputRef.current?.blur();
        }
      }, 0);
    } else {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [onSelect, isOpenControlled, closeOnSelect, blurOnSelect]);

  const handleInputChange = useCallback((val: string) => {
    if (disabled) return;
    setInputValue(val);
    
    const isEmpty = !val.trim();
    
    if (!multiple) {
      if (isEmpty) {
        setSelected(null);
        onSelect?.(null as any);
      } else if (freeSolo) {
        setSelected(null);
      }
    }

    if (!isOpenControlled && !isEmpty && openOnType && !open) {
      requestOpen(true);
    }
  }, [multiple, isOpenControlled, openOnType, open, requestOpen, disabled, freeSolo, onSelect]);

  const cls = autocompleteClassName;

  const noopPickSingle = NOOP_PICK_SINGLE;
  const identityPaint = IDENTITY_PAINT;

  const highlightTextCss = useMemo(
    () => typedValueHighlightCss ? [STATIC_HIGHLIGHT_TEXT_CSS, typedValueHighlightCss] : STATIC_HIGHLIGHT_TEXT_CSS,
    [typedValueHighlightCss]
  );

  const highlightPaint = useCallback((text: string) => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || trimmedInput.length < 1) return text;
    const lowerInput = trimmedInput.toLowerCase();
    const lower = text.toLowerCase();
    const idx = lower.indexOf(lowerInput);
    if (idx < 0) return text;
    return (
      <span className="plainframe-ui-autocomplete-highlight-wrap" css={STATIC_HIGHLIGHT_WRAP_CSS}>
        {text.slice(0, idx)}
        <span className="plainframe-ui-autocomplete-highlight" css={highlightTextCss}>
          {text.slice(idx, idx + trimmedInput.length)}
        </span>
        {text.slice(idx + trimmedInput.length)}
      </span>
    );
  }, [inputValue, highlightTextCss]);

  const paint = highlightTypedValue ? highlightPaint : identityPaint;

  const wrapCss = useMemo(() => css({
    position: "relative",
    display: fullWidth ? "block" : "inline-block",
    width: "100%",
    maxWidth: fullWidth ? "100%" : width,
  }), [fullWidth, width]);

  const handleItemMouseDown = HANDLE_ITEM_MOUSE_DOWN;
  const handleItemKeyDown = HANDLE_ITEM_KEY_DOWN;

  const handleCtxCapture = useCallback((ctx: any) => {
    menuCtxRef.current = ctx;
  }, []);

  const moveActive = useCallback((direction: 1 | -1) => {
    const ctx = menuCtxRef.current;
    if (!ctx) return;
    
    const total = flatItems.length;
    if (total === 0) return;
    
    const container = wrapperRef.current?.querySelector('[data-menu-id]') 
      ?? document.querySelector('[data-menu-id]');
    
    let cur = -1;
    if (container) {
      const items = container.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"]');
      const activeItem = container.querySelector('[data-active]') || container.querySelector('[data-hovered]');
      if (activeItem) {
        cur = Array.from(items).indexOf(activeItem as Element);
      }
    }
    
    if (cur < 0 && typeof ctx.activeIndex === "number") {
      cur = ctx.activeIndex;
    }
    
    const next = cur < 0 
      ? (direction === 1 ? 0 : total - 1) 
      : (cur + direction + total) % total;
    
    ctx.setActiveIndex?.(next);
    
    requestAnimationFrame(() => {
      const menuContainer = wrapperRef.current?.querySelector('[data-menu-id]') 
        ?? document.querySelector('[data-menu-id]');
      if (!menuContainer) return;
      
      menuContainer.setAttribute('data-keyboard-nav', '');
      
      menuContainer.querySelectorAll('[data-active]').forEach(el => el.removeAttribute('data-active'));
      menuContainer.querySelectorAll('[data-hovered]').forEach(el => el.removeAttribute('data-hovered'));
      
      const items = menuContainer.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"]');
      const item = items[next];
      if (item) {
        item.setAttribute('data-active', '');
        (item as HTMLElement).scrollIntoView?.({ block: 'nearest' });
      }
    });
  }, [flatItems.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.code === "Space" || e.key === "Spacebar") {
      e.stopPropagation();
      return;
    }

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (disabled) return;
      if (!panelHasContent && !isAsync) return;
      e.preventDefault();
      if (!open && !isOpenControlled) {
        requestOpen(true);
      }
      moveActive(e.key === "ArrowDown" ? 1 : -1);
      return;
    }

    if (e.key === "Enter") {
      if (disabled) return;
      const idx = menuCtxRef.current && typeof menuCtxRef.current.activeIndex === "number"
        ? menuCtxRef.current.activeIndex
        : -1;
      const activeItem = idx >= 0 && idx < flatItems.length ? flatItems[idx] : null;

      if (open && activeItem && idx >= 0) {
        e.preventDefault();
        e.stopPropagation();
        if (multiple) {
          toggleMultiFromKeyboard(activeItem.value);
          if (!closeOnSelect) requestAnimationFrame(() => inputRef.current?.focus());
        } else {
          pickSingle(activeItem.value);
        }
        return;
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      if (open && !isOpenControlled) {
        justClosedRef.current = true;
        requestOpen(false);
        (e.target as HTMLInputElement).focus();
        setTimeout(() => { justClosedRef.current = false; }, 150);
      }
    } else if (e.key === "Tab") {
      if (open && !isOpenControlled) {
        requestOpen(false);
      }
    }
  }, [
    panelHasContent, isAsync, open, isOpenControlled,
    flatItems, multiple, closeOnSelect, moveActive,
    toggleMultiFromKeyboard, pickSingle, requestOpen, disabled,
  ]);

  const handleInputFocus = useCallback(() => {
    if (disabled) return;
    if (justClosedRef.current) return;
    if (openOnFocus && canOpenMenu) {
      focusOpenedAtRef.current = Date.now();
      if (!isOpenControlled) {
        requestOpen(true);
      }
    }
  }, [isOpenControlled, openOnFocus, canOpenMenu, requestOpen, disabled]);

  const handleInputBlur = useCallback(() => {
    if (shouldKeepOpenRef.current) {
      shouldKeepOpenRef.current = false;
      return;
    }
    if (closeOnBlur) {
      requestOpen(false);
    }
    if (!freeSolo && !multiple) {
      if (selected) {
        setInputValue(selected.title ?? selected.value);
      } else if (inputValue.trim()) {
        setInputValue("");
      }
    }
  }, [closeOnBlur, freeSolo, multiple, selected, inputValue, requestOpen]);

  const renderMultipleContent = useCallback(() => {
    const groupChildren: React.ReactNode[] = [];
    let abs = 0;
    
    sections.forEach((sec, gi) => {
      if (sec.label) {
        groupChildren.push(<MenuLabel key={`g-${gi}`} className={cls("group-label")}>{sec.label}</MenuLabel>);
      }
      sec.items.forEach((it) => {
        groupChildren.push(
          <AutocompleteRow
            key={`${it.group ?? "__"}|${it.value}`}
            item={it}
            absIndex={abs}
            multiple={true}
            getCurrentMulti={getCurrentMulti}
            isSelected={false}
            renderItem={renderItem}
            paint={paint}
            cls={cls}
            closeOnSelect={false}
            pickSingle={noopPickSingle}
            handleItemKeyDown={handleItemKeyDown}
            handleItemMouseDown={handleItemMouseDown}
            descriptionColor={descriptionColor}
          />
        );
        abs += 1;
      });
    });

    return (
      <MenuCheckboxGroup key="multi-group" values={currentMulti} onValuesChange={handleMultiValuesChange}>
        {groupChildren}
      </MenuCheckboxGroup>
    );
  }, [sections, cls, getCurrentMulti, renderItem, paint, currentMulti, handleMultiValuesChange, noopPickSingle, handleItemKeyDown, handleItemMouseDown, descriptionColor]);

  const renderSingleContent = useCallback(() => {
    const nodes: React.ReactNode[] = [];
    let abs = 0;
    
    sections.forEach((sec, gi) => {
      if (sec.label) {
        nodes.push(<MenuLabel key={`g-${gi}`} className={cls("group-label")}>{sec.label}</MenuLabel>);
      }
      sec.items.forEach((it) => {
        const itemIsSelected = selected?.value === it.value;
        nodes.push(
          <AutocompleteRow
            key={`${it.group ?? "__"}|${it.value}`}
            item={it}
            absIndex={abs}
            multiple={false}
            getCurrentMulti={getCurrentMulti}
            isSelected={itemIsSelected}
            renderItem={renderItem}
            paint={paint}
            cls={cls}
            closeOnSelect={closeOnSelect}
            pickSingle={pickSingle}
            handleItemKeyDown={handleItemKeyDown}
            handleItemMouseDown={handleItemMouseDown}
            descriptionColor={descriptionColor}
          />
        );
        abs += 1;
      });
    });
    
    return nodes;
  }, [sections, cls, selected, getCurrentMulti, renderItem, paint, closeOnSelect, pickSingle, handleItemKeyDown, handleItemMouseDown, descriptionColor]);

  const contentNodes = useMemo(() => {
    if (isLoading) {
      return <MenuLabel css={loadingLabelCss} key="loading" className={cls("label-loading")}>{loadingText}</MenuLabel>;
    }
    if (shouldShowNoResults) {
      return <MenuLabel css={noResultsLabelCss} key="empty" className={cls("label-empty")}>{noResultsText}</MenuLabel>;
    }
    if (sections.length === 0) return null;
    
    return multiple ? renderMultipleContent() : renderSingleContent();
  }, [isLoading, shouldShowNoResults, sections.length, cls, loadingText, noResultsText, multiple, renderMultipleContent, renderSingleContent]);

    const chevronDisabled = open ? false : disabled || (!isAsync && (!hasItems && !showNoResults));

  const onChevronClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (chevronDisabled || disabled) return;
    if (isOpenControlled) return;

    if (open) {
      justClosedRef.current = true;
      requestOpen(false);
      queueMicrotask(() => inputRef.current?.focus());
      setTimeout(() => { justClosedRef.current = false; }, 150);
    } else {
      requestOpen(true);
      queueMicrotask(() => inputRef.current?.focus());
    }
  }, [open, hasItems, isAsync, requestOpen, chevronDisabled, disabled, isOpenControlled]);

  const chevronIconCss = useMemo(() => css({
    transition: "transform 0.3s cubic-bezier(.6,1.3,.5,1), opacity 0.15s ease",
    transform: open ? "rotate(180deg)" : "rotate(0deg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: chevronDisabled ? "not-allowed" : "pointer",
    userSelect: "none",
    opacity: chevronDisabled ? 0.5 : 1,
  }), [open, chevronDisabled]);

  const chevronNode = useMemo(() => {
    if (!showExpandIcon) return null;
    return (
      <span
        ref={chevronRef}
        role="button"
        tabIndex={-1}
        css={[chevronIconCss, expandIconCss]}
        aria-disabled={chevronDisabled || undefined}
        onMouseDown={HANDLE_CHEVRON_MOUSE_DOWN}
        onClick={onChevronClick}
      >
        {expandIcon ?? <ChevronDown size={18} strokeWidth={2} />}
      </span>
    );
  }, [showExpandIcon, chevronIconCss, expandIconCss, chevronDisabled, onChevronClick, expandIcon]);

  const computedEndIcon = useMemo(() => {
    if (endIcon && chevronNode) {
      return (
        <span css={STATIC_END_ICON_CONTAINER_CSS}>
          {endIcon}
          {chevronNode}
        </span>
      );
    }
    return endIcon ?? chevronNode;
  }, [endIcon, chevronNode]);

  const handleSurfaceClick = useCallback((e: React.MouseEvent) => {
    if (chevronRef.current && chevronRef.current.contains(e.target as Node)) return;
    if (justClosedRef.current) return;
    if (disabled) return;
    
    const timeSinceFocusOpen = Date.now() - focusOpenedAtRef.current;
    if (timeSinceFocusOpen < 300) return;

    if (open) {
      if (!inputValue.trim() && !isOpenControlled) {
        justClosedRef.current = true;
        requestOpen(false);
        setTimeout(() => { justClosedRef.current = false; }, 150);
      }
      return;
    }

    if (openOnClick && canOpenMenu && (!isOpenControlled || openOnClick)) {
      requestOpen(true);
    }
  }, [open, inputValue, openOnClick, canOpenMenu, requestOpen, disabled, isOpenControlled]);

  return (
    <div ref={wrapperRef} className={cls("")} css={[wrapCss, containerCss, rootCssOverride]}>
      <DropdownRoot open={disabled ? false : open} onOpenChange={disabled ? undefined : requestOpen}>
        <CtxCapture onCapture={handleCtxCapture} />
        <DropdownMenuTrigger asChild>
          <span
            className={cls("anchor")}
            css={STATIC_ANCHOR_CSS}
            style={{ pointerEvents: "none", position: "absolute", visibility: "hidden" }}
            tabIndex={-1}
          />
        </DropdownMenuTrigger>

        <TextField
          ref={inputRef}
          className={cls("input")}
          focusRingMode={focusRingMode}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onSurfaceClick={handleSurfaceClick}
          placeholder={placeholder}
          label={label}
          helperText={helperText}
          variant={variant}
          startIcon={startIcon}
          endIcon={computedEndIcon}
          size={size}
          width={width}
          fullWidth={fullWidth}
          disabled={disabled}
          error={error}
          showClear={showClear}
          css={inputCss}
          wrapperCss={textFieldWrapperCss}
          inputCss={textFieldInputCss}
          labelCss={textFieldLabelCss}
          helperRowCss={textFieldHelperRowCss}
          helperTextCss={textFieldHelperTextCss}
          startIconCss={textFieldStartIconCss}
          endIconCss={textFieldEndIconCss}
        />

        <span
          ref={blurAnchorRef}
          tabIndex={-1}
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        />

        {panelHasContent && (
          <DropdownMenuContent
            className={cls("menu")}
            side="bottom"
            align="start"
            sameWidth
            allItemsTabbable
            maxHeight={typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight}
            css={menuContentCss}
            ignoreOutsidePressRefs={ignoreOutsidePressRefs}
            disableOutsidePressDismiss={isOpenControlled}
            returnFocus={!blurOnSelect}
          >
            {contentNodes}
          </DropdownMenuContent>
        )}
      </DropdownRoot>
    </div>
  );
});

Autocomplete.displayName = "Autocomplete";