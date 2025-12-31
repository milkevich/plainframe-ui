/** @jsxImportSource @emotion/react */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { useFocusRing } from "../utils/focusRing";

type Direction = "horizontal" | "vertical";
type Variant = "filled" | "outlined" | "soft";
type HV = "left" | "center" | "right" | "top" | "bottom";

export type RadioGroupProps = {
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  direction?: Direction;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  anchorOrigin?: {
    horizontal?: Extract<HV, "left" | "center" | "right">;
    vertical?: Extract<HV, "top" | "center" | "bottom">;
  };
  css?: Interpolation<Theme>;
};

export type RadioItemProps = {
  value: string | number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  css?: Interpolation<Theme>;
};

type RegistryItem = { ref: HTMLButtonElement | null; value: string | number; disabled: boolean };

type Ctx = {
  selected: string | number | undefined;
  setSelected: (v: string | number) => void;
  disabled: boolean;
  size: "sm" | "md" | "lg";
  direction: Direction;
  variant: Variant;
  register: (item: RegistryItem) => number;
  update: (index: number, item: Partial<RegistryItem>) => void;
  moveFocusBy: (currentIndex: number, delta: number) => void;
  moveToEdge: (edge: "first" | "last") => void;
  focusValue: string | number | undefined;
  theme: ReturnType<typeof usePlainframeUITheme>;
  anchorOrigin: Required<NonNullable<RadioGroupProps["anchorOrigin"]>>;
};

const RadioCtx = createContext<Ctx | null>(null);
const useRadioCtx = () => {
  const ctx = useContext(RadioCtx);
  if (!ctx) throw new Error("RadioItem must be used within a RadioGroup");
  return ctx;
};

const normalizeOrigin = (
  o?: RadioGroupProps["anchorOrigin"]
): Required<NonNullable<RadioGroupProps["anchorOrigin"]>> => {
  const h = o?.horizontal ?? "left";
  const v = o?.vertical ?? "center";
  if (h === "center" && v === "center") return { horizontal: "left", vertical: "center" };
  return { horizontal: h, vertical: v };
};

export const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  defaultValue,
  onChange,
  disabled = false,
  size = "md",
  direction = "horizontal",
  variant = "filled",
  className,
  children,
  anchorOrigin,
  css: userCss,
}) => {
  const theme = usePlainframeUITheme();
  const isControlled = value !== undefined && onChange !== undefined;
  const [internalValue, setInternalValue] = useState<string | number | undefined>(defaultValue);
  const selected = (isControlled ? value : internalValue) as string | number | undefined;

  const registry = useRef<RegistryItem[]>([]);
  const [ver, setVer] = useState(0);
  const bump = () => setVer((v) => v + 1);

  const setSelected = useCallback(
    (v: string | number) => {
      if (!isControlled) setInternalValue(v);
      onChange?.(v);
    },
    [isControlled, onChange]
  );

  const register = useCallback((item: RegistryItem) => {
    registry.current.push(item);
    bump();
    return registry.current.length - 1;
  }, []);

  const update = useCallback((index: number, item: Partial<RegistryItem>) => {
    const curr = registry.current[index];
    if (!curr) return;
    registry.current[index] = { ...curr, ...item };
    bump();
  }, []);

  const enabledIndexes = () =>
    registry.current
      .map((it, i) => ({ it, i }))
      .filter(({ it }) => it.ref && !it.disabled)
      .map(({ i }) => i);

  const moveFocusBy = useCallback(
    (currentIndex: number, delta: number) => {
      const enabled = enabledIndexes();
      if (!enabled.length) return;
      const pos = Math.max(0, enabled.indexOf(currentIndex));
      const next = enabled[(pos + delta + enabled.length) % enabled.length];
      const nextRef = registry.current[next]?.ref;
      if (nextRef) {
        nextRef.focus();
        const nextVal = registry.current[next]?.value;
        if (nextVal !== undefined) setSelected(nextVal);
      }
    },
    [setSelected]
  );

  const moveToEdge = useCallback(
    (edge: "first" | "last") => {
      const enabled = enabledIndexes();
      if (!enabled.length) return;
      const next = edge === "first" ? enabled[0] : enabled[enabled.length - 1];
      const nextRef = registry.current[next]?.ref;
      if (nextRef) {
        nextRef.focus();
        const nextVal = registry.current[next]?.value;
        if (nextVal !== undefined) setSelected(nextVal);
      }
    },
    [setSelected]
  );

  const focusValue: string | number | undefined = useMemo(() => {
    const enabledItems = registry.current.filter((it) => it.ref && !it.disabled);
    if (!enabledItems.length) return undefined;
    const selectedEnabled = enabledItems.some((it) => it.value === selected);
    return selectedEnabled ? selected : enabledItems[0]?.value;
  }, [selected, ver]);

  const ctx: Ctx = useMemo(
    () => ({
      selected,
      setSelected,
      disabled,
      size,
      direction,
      variant,
      register,
      update,
      moveFocusBy,
      moveToEdge,
      focusValue,
      theme,
      anchorOrigin: normalizeOrigin(anchorOrigin),
    }),
    [
      selected,
      setSelected,
      disabled,
      size,
      direction,
      variant,
      register,
      update,
      moveFocusBy,
      moveToEdge,
      focusValue,
      theme,
      anchorOrigin,
    ]
  );

  const rootCss = css({ width: "fit-content" });
  const rowCss = css({
    display: "flex",
    flexDirection: direction === "vertical" ? "column" : "row",
    gap: theme.spacing.sm,
    width: "fit-content",
    alignItems: direction === "vertical" ? "stretch" : "center",
  });

  return (
    <div className={className ?? "plainframe-ui-radio-group"} css={[rootCss, userCss as Interpolation<Theme>]}>
      <div
        className="plainframe-ui-radio-row"
        role="radiogroup"
        aria-disabled={disabled || undefined}
        css={rowCss}
      >
        <RadioCtx.Provider value={ctx}>{children}</RadioCtx.Provider>
      </div>
    </div>
  );
};

export const RadioItem: React.FC<RadioItemProps> = ({
  value,
  disabled = false,
  className,
  children,
  css: userCss,
}) => {
  const {
    selected,
    setSelected,
    disabled: groupDisabled,
    size,
    register,
    update,
    moveFocusBy,
    moveToEdge,
    theme,
    variant,
    focusValue,
    anchorOrigin,
  } = useRadioCtx();

  const isDisabled = groupDisabled || disabled;
  const isChecked = selected === value;

  const sizeKey: "sm" | "md" | "lg" = (["sm", "md", "lg"] as const).includes(size) ? size : "md";
  const diameter = sizeKey === "sm" ? 16 : sizeKey === "lg" ? 24 : 20;

  const sw = (shade: 50 | 100 | 300 | 600) => (theme.palette?.primary as any)?.[shade];
  const main = sw(600);
  const soft100 = sw(100);
  const neutral300 = theme.neutral[300];
  const stroke = theme.palette.primary[300];
  const onPrimary = theme.text.onColors?.primary ?? theme.neutral[0];

  let circleBg = "transparent";
  let circleShadow: string | null = stroke;
  let dotColor = onPrimary;

  if (variant === "soft") {
    circleBg = soft100;
    circleShadow = null;
    dotColor = main;
  } else if (variant === "outlined") {
    circleBg = sw(50);
    circleShadow = stroke;
    dotColor = main;
  } else {
    circleBg = theme.neutral[200];
    circleShadow = "transparent";
    dotColor = onPrimary;
  }

  if (isChecked) {
    if (variant === "outlined") {
      circleBg = soft100;
      circleShadow = stroke;
      dotColor = main;
    } else if (variant === "filled") {
      circleBg = main;
      circleShadow = null;
      dotColor = onPrimary;
    } else {
      circleBg = soft100;
      circleShadow = null;
      dotColor = main;
    }
  }

  const hoverCircleBg = variant === "filled" ? neutral300 : variant === "outlined" ? theme.palette.primary[100] : theme.palette.primary[100];

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const myIndex = useRef<number>(-1);

  useEffect(() => {
    myIndex.current = register({ ref: btnRef.current, value, disabled: !!isDisabled });
  }, [register]);

  useEffect(() => {
    update(myIndex.current, { ref: btnRef.current, value, disabled: !!isDisabled });
  }, [update, isDisabled, value]);

  const btnCss = css({
    border: "none",
    background: "transparent",
    display: "inline-grid",
    gridTemplateColumns: "auto auto auto",
    gridTemplateRows: "auto auto auto",
    columnGap: anchorOrigin.vertical === "center" ? theme.spacing.sm : 0,
    rowGap: anchorOrigin.vertical === "center" ? 0 : theme.spacing.xs,
    justifyItems: "center",
    alignItems: "center",
    opacity: isDisabled ? 0.5 : 1,
    borderRadius: theme.radius.md,
    cursor: isDisabled ? "not-allowed" : "pointer",
    transition: "transform .16s ease",
    fontSize: theme.typography.sizes.sm,
    fontWeight: 500,
    padding: theme.spacing.sm,

    "&:hover .plainframe-ui-radio-circle-outer":
      isDisabled || isChecked
        ? {}
        : {
            background: hoverCircleBg,
            boxShadow:
              variant === "outlined"
                ? `inset 0 0 0 ${theme.componentHeights.border} ${stroke}`
                : "none",
          },

    "&:focus-visible .plainframe-ui-radio-circle-outer": {
      outline: "none",
    },
  });

  const circleCss = css({
    width: diameter,
    height: diameter,
    minWidth: diameter,
    minHeight: diameter,
    borderRadius: theme.radius.full,
    background: circleBg,
    boxShadow: circleShadow ? `inset 0 0 0 ${theme.componentHeights.border} ${circleShadow}` : "none",
    transition: "background-color .16s ease, box-shadow .16s ease, filter .16s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  });

  const dotCss = css({
    width: isChecked ? diameter * 0.45 : 0,
    height: isChecked ? diameter * 0.45 : 0,
    borderRadius: theme.radius.full,
    background: isChecked ? dotColor : "transparent",
    transition: "all 250ms cubic-bezier(.72,1.6,.32,1)",
    transform: isChecked ? "scale(1)" : "scale(0.6)",
    opacity: isChecked ? 1 : 0,
  });

  const labelCss = css({
    gridColumn: 2,
    gridRow: 2,
    minWidth: 0,
    maxWidth: "100%",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
    textAlign: "left",
  });

  const pos = (() => {
    const h = anchorOrigin.horizontal;
    const v = anchorOrigin.vertical;
    if (v === "center") {
      return { col: h === "right" ? 3 : 1, row: 2 };
    }
    return { col: 2, row: v === "top" ? 1 : 3 };
  })();

  const isFocusable = !isDisabled && focusValue === value;
  const tabIndex = isFocusable ? 0 : -1;

  const focusRing = useFocusRing()

  return (
    <button
      ref={btnRef}
      className={className ?? "plainframe-ui-radio-item"}
      type="button"
      role="radio"
      aria-checked={isChecked}
      aria-disabled={isDisabled || undefined}
      disabled={isDisabled}
      tabIndex={tabIndex}
      onClick={() => {
        if (!isDisabled) setSelected(value);
      }}
      onKeyDown={(e) => {
        if (isDisabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setSelected(value);
        } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          moveFocusBy(myIndex.current, 1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          moveFocusBy(myIndex.current, -1);
        } else if (e.key === "Home") {
          e.preventDefault();
          moveToEdge("first");
        } else if (e.key === "End") {
          e.preventDefault();
          moveToEdge("last");
        }
      }}
      css={[btnCss, focusRing({color: "primary"}), userCss as Interpolation<Theme>]}
    >
      <span
        className="plainframe-ui-radio-circle-outer"
        css={[
          circleCss,
          css({ gridColumn: pos.col, gridRow: pos.row }),
        ]}
      >
        <span className="plainframe-ui-radio-circle-dot" css={dotCss} />
      </span>

      {children != null && (
        <span className="plainframe-ui-radio-label" css={labelCss}>
          {children}
        </span>
      )}
    </button>
  );
};
