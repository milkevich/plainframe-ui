/** @jsxImportSource @emotion/react */
import React, {
  useLayoutEffect,
  useRef,
  useState,
  useId,
  useMemo,
  useCallback,
} from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { useFocusWithinRing } from "../utils/focusRing";

type SizeKey = "sm" | "md" | "lg";
type Variant = "outlined" | "subtle" | "ghost";
type WithCss = { css?: Interpolation<Theme> };

export type TextAreaProps = WithCss & {
  label?: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  helperText?: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  width?: number | string;
  size?: SizeKey;
  variant?: Variant;
  rounded?: boolean;
  rows?: number;
  maxRows?: number;
  maxLength?: number;
  showCharCount?: boolean;
  focusRingMode?: "always" | "none";
  resizable?: boolean;
  wrapperCss?: Interpolation<Theme>;
  inputCss?: Interpolation<Theme>;
  labelCss?: Interpolation<Theme>;
  helperRowCss?: Interpolation<Theme>;
  helperTextCss?: Interpolation<Theme>;
  charCountCss?: Interpolation<Theme>;
  className?: string;
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  autoFocus?: boolean;
  name?: string;
  id?: string;
  tabIndex?: number;
  autoComplete?: string;
  readOnly?: boolean;
  required?: boolean;
};

const u = (v: number | string | undefined): string | undefined =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : v;

const asArr = (v?: Interpolation<Theme>): Interpolation<Theme>[] =>
  v == null ? [] : (Array.isArray(v) ? v : [v]);

const mergeCss = (
  ...parts: Array<Interpolation<Theme> | false | null | undefined>
): Interpolation<Theme> => css(parts.filter(Boolean) as any);

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  value,
  defaultValue = "",
  onChange,
  placeholder,
  error,
  helperText,
  disabled = false,
  fullWidth = false,
  width = 235,
  size = "md",
  variant = "subtle",
  rounded = false,
  rows = 3,
  maxRows,
  maxLength,
  showCharCount,
  focusRingMode = "always",
  resizable = false,
  className,
  wrapperCss: userWrapperCss,
  inputCss: userInputCss,
  labelCss: userLabelCss,
  helperRowCss: userHelperRowCss,
  helperTextCss: userHelperTextCss,
  charCountCss: userCharCountCss,
  css: userSurfaceCss,
  onBlur,
  onFocus,
  onKeyDown,
  autoFocus,
  name,
  id,
  tabIndex,
  autoComplete,
  readOnly,
  required,
}) => {
  const theme = usePlainframeUITheme();
  const ring = useFocusWithinRing();
  const reactId = useId();

  const sizeMap = useMemo(
    () =>
      ({
        sm: {
          fontSize: theme.typography.sizes.sm,
          minHeight: theme.componentHeights.sm,
          labelFont: theme.typography.sizes.xs,
          helperFont: theme.typography.sizes.xs,
          width: "12.5rem",
          paddingY: 0,
          paddingX: theme.spacing.md,
        },
        md: {
          fontSize: theme.typography.sizes.sm,
          minHeight: theme.componentHeights.md,
          labelFont: theme.typography.sizes.sm,
          helperFont: theme.typography.sizes.xs,
          width: "15rem",
          paddingY: 0,
          paddingX: theme.spacing.md,
        },
        lg: {
          fontSize: theme.typography.sizes.sm,
          minHeight: theme.componentHeights.lg,
          labelFont: theme.typography.sizes.md,
          helperFont: theme.typography.sizes.sm,
          width: "18.125rem",
          paddingY: 0,
          paddingX: theme.spacing.md,
        },
      }) as const,
    [theme]
  );

  const sizeKey: SizeKey = (["sm", "md", "lg"] as const).includes(size as any)
    ? (size as SizeKey)
    : "md";
  const s = sizeMap[sizeKey];

  const N = theme.neutral;
  const T = theme.text;

  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string>(defaultValue);
  const curr: string = isControlled ? (value as string) : internal;

  const setValue = useCallback(
    (next: string): void => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange]
  );

  const surfaceBg = useMemo<string>(
    () =>
      disabled
        ? N[200]
        : error && variant === "outlined"
        ? theme.palette.danger?.[50] ?? theme.surface.panelBg
        : error && variant === "subtle"
        ? theme.palette.danger?.[50] ?? theme.surface.subtleBg
        : variant === "outlined"
        ? theme.surface.panelBg
        : variant === "subtle"
        ? theme.surface.subtleBg
        : "transparent",
    [disabled, error, variant, N, theme.surface, theme.palette.danger]
  );

  const borderW = theme.componentHeights.border;
  const surfaceBorder = useMemo<string>(
    () =>
      variant === "outlined"
        ? `${borderW} solid ${
            error ? theme.palette.danger?.[300] ?? theme.surface.border : theme.surface.border
          }`
        : `none`,
    [variant, borderW, error, theme.palette.danger, theme.surface.border]
  );

  const rootCss = useMemo(
    () =>
      css({
        boxSizing: "border-box",
        display: "block",
        minWidth: 0,
        width: "100%",
        maxWidth: fullWidth ? "100%" : width != null ? u(width) : undefined,
        flex: "0 0 auto",
        fontWeight: 500,
      }),
    [fullWidth, width]
  );

  const labelCss = useMemo(
    () =>
      mergeCss(
        {
          fontSize: s.labelFont,
          fontWeight: 500,
          color: error
            ? theme.palette.danger?.[700] ?? T.primary
            : disabled
            ? N[500]
            : T.primary,
          marginBottom: 4,
          display: "inline-block",
        },
        ...asArr(userLabelCss)
      ),
    [s.labelFont, error, disabled, N, T, theme.palette.danger, userLabelCss]
  );

  const surfaceBaseCss = useMemo(
    () => [
      {
        display: "flex",
        alignItems: "stretch",
        gap: theme.spacing.sm,
        padding: `${u(s.paddingY)} 0 ${u(s.paddingY)} ${u(s.paddingX)}`,
        background: surfaceBg,
        border: surfaceBorder,
        borderRadius: rounded ? (theme.radius.full as string) : (theme.radius.md as string),
        minHeight: s.minHeight,
        width: "100%",
        cursor: disabled ? "not-allowed" : "text",
        opacity: disabled ? 0.65 : 1,
        transition: "box-shadow .18s, border-color .16s",
      },
      ...asArr(userWrapperCss),
      ...asArr(userSurfaceCss),
    ] as Interpolation<Theme>,
    [theme, s, surfaceBg, surfaceBorder, borderW, rounded, disabled, userWrapperCss, userSurfaceCss]
  );

  const ctrlMinH: string = typeof s.minHeight === "number" ? `${s.minHeight}px` : s.minHeight;

  const textareaCss = useMemo(
    () =>
      mergeCss(
        {
          width: "100%",
          minWidth: 0,
          flex: 1,
          resize: resizable ? ("vertical" as const) : ("none" as const),
          font: "inherit",
          fontWeight: 500,
          fontSize: s.fontSize,
          lineHeight: 1.5,
          color: disabled ? N[500] : error ? theme.palette.danger?.[800] ?? T.primary : T.primary,
          background: "transparent",
          border: "none",
          outline: "none",
          padding: 0,
          paddingRight: u(s.paddingX),
          overflowY: "auto",
          minHeight: ctrlMinH,
          "&::placeholder": { color: error ? theme.palette.danger?.[700] ?? T.secondary : T.secondary },
          "&:-webkit-autofill,&:-webkit-autofill:hover,&:-webkit-autofill:focus": {
            WebkitTextFillColor: `${error ? theme.palette.danger?.[800] ?? T.primary : T.primary} !important`,
            boxShadow: `0 0 0 1000px ${surfaceBg} inset !important`,
            transition: "opacity 99999s ease-out",
            caretColor: error ? theme.palette.danger?.[800] ?? T.primary : T.primary,
          },
          ":focus-within": { outline: "none", boxShadow: "none" },
          ...(rows === 1
            ? { paddingBlock: `calc((${ctrlMinH} - 1.5em) / 2)` }
            : { paddingBlock: "clamp(4px, 0.5em, 12px)" }),
        },
        ...asArr(userInputCss)
      ),
    [resizable, s, disabled, error, N, T, theme.palette.danger, ctrlMinH, surfaceBg, rows, userInputCss]
  );

  const helperRowCss = useMemo(
    () =>
      mergeCss(
        {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
          paddingTop: 3,
        },
        ...asArr(userHelperRowCss)
      ),
    [userHelperRowCss]
  );

  const helperTextCss = useMemo(
    () =>
      mergeCss(
        {
          fontSize: s.helperFont,
          color: error ? theme.palette.danger?.[700] ?? T.secondary : T.secondary,
          flex: 1,
          minWidth: 0,
        },
        ...asArr(userHelperTextCss)
      ),
    [s.helperFont, error, theme.palette.danger, T, userHelperTextCss]
  );

  const charCountCss = useMemo(
    () =>
      mergeCss(
        {
          fontSize: s.helperFont,
          color:
            maxLength && curr.length > maxLength
              ? theme.palette.danger?.[700] ?? T.secondary
              : T.secondary,
          flexShrink: 0,
        },
        ...asArr(userCharCountCss)
      ),
    [s.helperFont, maxLength, curr.length, theme.palette.danger, T, userCharCountCss]
  );

  const ref = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect((): void => {
    if (typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;

    if (resizable) {
      const cs = window.getComputedStyle(el);
      const lh = parseFloat(cs.lineHeight || "20");
      const tokenMin = typeof s.minHeight === "number" ? s.minHeight : parseFloat(String(s.minHeight));
      const baseMin = Math.max(lh * (rows ?? 1), tokenMin);
      el.style.setProperty("--pf-minh", `${baseMin}px`);
      return;
    }

    const measure = (): void => {
      const cs = window.getComputedStyle(el);
      const lh = parseFloat(cs.lineHeight || "20");
      const tokenMin = typeof s.minHeight === "number" ? s.minHeight : parseFloat(String(s.minHeight));
      const baseMin = Math.max(lh * (rows ?? 1), tokenMin);
      el.style.setProperty("--pf-minh", `${baseMin}px`);
      const maxH = maxRows ? lh * maxRows : Infinity;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
    };

    measure();
  }, [curr, rows, maxRows, s.minHeight, resizable]);

  const helperId: string | undefined =
    helperText != null || showCharCount ? `${id ?? reactId}-help` : undefined;
  const inputId: string = id ?? reactId;

  return (
    <div className={["plainframe-ui-textarea", className || ""].join(" ").trim()} css={rootCss}>
      {label && (
        <label htmlFor={inputId} className="plainframe-ui-textarea-label" css={labelCss}>
          {label}
        </label>
      )}

      <div
        className="plainframe-ui-textarea-surface"
        css={[
          ring({
            enabled: focusRingMode !== "none",
            disabled,
            color: error ? "danger" : undefined,
          }),
          surfaceBaseCss,
        ]}
        aria-invalid={!!error || undefined}
        aria-disabled={disabled || undefined}
        onClick={() => !disabled && ref.current?.focus()}
      >
        <textarea
          ref={ref}
          id={inputId}
          className="plainframe-ui-textarea-input"
          css={textareaCss}
          rows={rows}
          value={curr}
          onChange={(e): void => {
            const next = e.target.value;
            if (maxLength && next.length > maxLength) return;
            setValue(next);
          }}
          placeholder={placeholder || ""}
          disabled={disabled}
          onBlur={onBlur}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
          name={name}
          tabIndex={tabIndex}
          autoComplete={autoComplete}
          readOnly={readOnly}
          required={required}
          aria-invalid={!!error || undefined}
          aria-describedby={helperId}
        />
      </div>

      {(helperText != null || (showCharCount && maxLength != null)) && (
        <div className="plainframe-ui-textarea-helper-row" css={helperRowCss}>
          <span id={helperId} className="plainframe-ui-textarea-helper-text" css={helperTextCss}>
            {helperText}
          </span>
          {showCharCount && maxLength != null && (
            <span className="plainframe-ui-textarea-char-count" css={charCountCss}>
              {curr.length}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
