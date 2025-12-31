/** @jsxImportSource @emotion/react */
import React, {
  useRef,
  useState,
  isValidElement,
  cloneElement,
  useId,
  useMemo,
  useCallback,
  forwardRef,
} from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { Eye, EyeOff, X } from "lucide-react";
import { useFocusWithinRing } from "../utils/focusRing";

type SizeKey = "sm" | "md" | "lg";
type Variant = "outlined" | "subtle" | "ghost";
type WithCss = { css?: Interpolation<Theme> };

const u = (v?: number | string) =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : v;

const asArray = (v?: Interpolation<Theme>): Interpolation<Theme>[] =>
  v == null ? [] : Array.isArray(v) ? v : [v];

const mergeCss = (
  ...parts: Array<Interpolation<Theme> | false | null | undefined>
): Interpolation<Theme> => css(parts.filter(Boolean) as any);

function cloneIcon(icon: React.ReactNode, px: number, color = "currentColor") {
  if (!isValidElement(icon)) return icon;
  const props = icon.props as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  if (props.size == null) next.size = px;
  if (props.color == null) next.color = color;
  const style = props.style as React.CSSProperties | undefined;
  if (style?.fontSize == null)
    next.style = { ...(style || {}), fontSize: px };
  return cloneElement(icon, { ...props, ...next });
}

export type TextFieldProps = WithCss & {
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
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  togglePasswordVisible?: boolean;
  showClear?: boolean;
  type?: "text" | "password" | "number" | (string & {});
  step?: number;
  focusRingMode?: "always" | "none";
  wrapperCss?: Interpolation<Theme>;
  inputCss?: Interpolation<Theme>;
  labelCss?: Interpolation<Theme>;
  helperRowCss?: Interpolation<Theme>;
  helperTextCss?: Interpolation<Theme>;
  startIconCss?: Interpolation<Theme>;
  endIconCss?: Interpolation<Theme>;
  className?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  autoFocus?: boolean;
  name?: string;
  id?: string;
  tabIndex?: number;
  autoComplete?: string;
  readOnly?: boolean;
  required?: boolean;
  maxLength?: number;
  onSurfaceClick?: (e: React.MouseEvent) => void;
};

export const TextField: React.ForwardRefExoticComponent<
  TextFieldProps & React.RefAttributes<HTMLInputElement>
> = React.memo(
  forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
    {
      label,
      value,
      defaultValue = "",
      onChange,
      placeholder,
      error,
      helperText,
      disabled = false,
      fullWidth = false,
      width = 250,
      size = "md",
      variant = "subtle",
      rounded = false,
      startIcon,
      endIcon,
      togglePasswordVisible = false,
      showClear,
      type = "text",
      step,
      focusRingMode = "always",
      className,
      wrapperCss: userWrapperCss,
      inputCss: userInputCss,
      labelCss: userLabelCss,
      helperRowCss: userHelperRowCss,
      helperTextCss: userHelperTextCss,
      startIconCss: userStartIconCss,
      endIconCss: userEndIconCss,
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
      maxLength,
      onSurfaceClick,
    },
    ref
  ) {
    const theme = usePlainframeUITheme();
    const ring = useFocusWithinRing();
    const reactId = useId();

    const s = useMemo(() => {
      const map = {
        sm: {
          fontSize: theme.typography.sizes.sm,
          minHeight: theme.componentHeights.sm,
          labelFont: theme.typography.sizes.xs,
          helperFont: theme.typography.sizes.xs,
          width: "12.5rem",
          paddingY: 0,
          paddingX: theme.spacing.md,
          iconSize: theme.typography.sizes.xs,
          codeFontSize: 21,
        },
        md: {
          fontSize: theme.typography.sizes.sm,
          minHeight: theme.componentHeights.md,
          labelFont: theme.typography.sizes.sm,
          helperFont: theme.typography.sizes.xs,
          width: "15rem",
          paddingY: 0,
          paddingX: theme.spacing.md,
          iconSize: theme.typography.sizes.xs,
          codeFontSize: 24,
        },
        lg: {
          fontSize: theme.typography.sizes.sm,
          minHeight: theme.componentHeights.lg,
          labelFont: theme.typography.sizes.md,
          helperFont: theme.typography.sizes.sm,
          width: "18.125rem",
          paddingY: 0,
          paddingX: theme.spacing.md,
          iconSize: theme.typography.sizes.xs,
          codeFontSize: 28,
        },
      } as const;
      const key: SizeKey = (["sm", "md", "lg"] as const).includes(size as any)
        ? (size as SizeKey)
        : "md";
      return map[key];
    }, [size, theme]);

    const N = theme.neutral;
    const T = theme.text;

    const isNumberType = type === "number";
    const isPassword = type === "password";

    const isControlled = value !== undefined;
    const [internal, setInternal] = useState<string>(defaultValue);
    const curr = isControlled ? (value as string) : internal;
    const setValue = useCallback(
      (next: string) => {
        if (!isControlled) setInternal(next);
        onChange?.(next);
      },
      [isControlled, onChange]
    );

    const numberRegex = /^-?\d*(?:[.,]\d*)?$/;
    const wantsDecimal =
      isNumberType &&
      ((step != null && String(step).includes(".")) ||
        /[.,]/.test(curr ?? ""));
    const inputMode = isNumberType
      ? wantsDecimal
        ? "decimal"
        : "numeric"
      : undefined;
    const pattern = isNumberType
      ? wantsDecimal
        ? "[0-9]*[.,]?[0-9]*"
        : "[0-9]*"
      : undefined;

    const handleNumberTyping = useCallback(
      (v: string) => {
        if (v === "" || numberRegex.test(v)) setValue(v);
      },
      [setValue]
    );

    const surfaceBg =
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
        : "transparent";

    const borderW = theme.componentHeights.border;
    const surfaceBorder =
      variant === "outlined"
        ? `${borderW} solid ${
            error ? theme.palette.danger?.[300] ?? theme.surface.border : theme.surface.border
          }`
        : "none";

    const rootCss = mergeCss({
      boxSizing: "border-box",
      display: "block",
      minWidth: 0,
      width: "100%",
      maxWidth: fullWidth ? "100%" : width != null ? u(width) : undefined,
      flex: "0 0 auto",
      fontWeight: 500,
    });

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
          ...asArray(userLabelCss)
        ),
      [s.labelFont, error, disabled, N, T, theme.palette.danger, userLabelCss]
    );

    const surfaceBaseCss = useMemo(
      () =>
        mergeCss(
          {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing.sm,
            padding: `${u(s.paddingY)} ${u(s.paddingX)}`,
            background: surfaceBg,
            border: surfaceBorder,
            borderRadius: rounded
              ? (theme.radius.full as string)
              : (theme.radius.md as string),
            minHeight: s.minHeight,
            boxSizing: "border-box",
            width: "100%",
            cursor: disabled ? "not-allowed" : "text",
            opacity: disabled ? 0.65 : 1,
            transition: "box-shadow .18s, border-color .16s",
          },
          ...asArray(userWrapperCss),
          ...asArray(userSurfaceCss)
        ),
      [
        theme,
        s.minHeight,
        s.paddingX,
        s.paddingY,
        surfaceBg,
        surfaceBorder,
        rounded,
        disabled,
        userWrapperCss,
        userSurfaceCss,
      ]
    );

    const inputBaseCss = useMemo(
      () =>
        mergeCss(
          {
            flex: 1,
            minWidth: 0,
            fontSize: s.fontSize,
            fontWeight: 500,
            fontFamily: "inherit",
            color: disabled ? N[500] : error ? theme.palette.danger?.[800] ?? T.primary : T.primary,
            background: "transparent",
            border: "none",
            outline: "none",
            padding: 0,
            lineHeight: 1.25,
            cursor: disabled ? "not-allowed" : "text",
            appearance: isNumberType ? "textfield" : "auto",
            "&::placeholder": { color: error ? theme.palette.danger?.[700] ?? T.secondary : T.secondary },
            "&:-webkit-autofill,&:-webkit-autofill:hover,&:-webkit-autofill:focus":
              {
                WebkitTextFillColor: `${error ? theme.palette.danger?.[800] ?? T.primary : T.primary} !important`,
                boxShadow: `0 0 0 1000px ${surfaceBg} inset !important`,
                transition: "opacity 99999s ease-out",
                caretColor: error ? theme.palette.danger?.[800] ?? T.primary : T.primary,
              },
            ":focus-within": {
              outline: "none",
              border: "none",
              boxShadow: "none",
            },
          },
          ...asArray(userInputCss)
        ),
      [s.fontSize, disabled, N, T, error, theme.palette.danger, isNumberType, surfaceBg, userInputCss]
    );

    const startSlotCss = useMemo(
      () =>
        mergeCss(
          {
            display: "inline-flex",
            alignItems: "center",
            color: error ? theme.palette.danger?.[800] ?? T.secondary : T.secondary,
            marginLeft: -3,
          },
          ...asArray(userStartIconCss)
        ),
      [error, theme.palette.danger, T.secondary, userStartIconCss]
    );

    const endSlotCss = useMemo(
      () =>
        mergeCss(
          {
            display: "inline-flex",
            alignItems: "center",
            color: error ? theme.palette.danger?.[800] ?? T.secondary : T.secondary,
            border: "none",
            background: "transparent",
            lineHeight: 0,
            cursor: "inherit",
            padding: 0,
          },
          ...asArray(userEndIconCss)
        ),
      [error, theme.palette.danger, T.secondary, disabled, userEndIconCss]
    );

    const helperRowCss = useMemo(
      () =>
        mergeCss(
          {
            minHeight: 16,
            fontSize: s.helperFont,
            color: error
              ? theme.palette.danger?.[700] ?? T.secondary
              : T.secondary,
            paddingTop: 3,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
            width: "100%",
          },
          ...asArray(userHelperRowCss)
        ),
      [s.helperFont, error, theme.palette.danger, T.secondary, userHelperRowCss]
    );

    const helperTextCss = useMemo(
      () =>
        mergeCss(
          {
            flex: 1,
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            minWidth: 0,
            fontWeight: 400,
          },
          ...asArray(userHelperTextCss)
        ),
      [userHelperTextCss]
    );

    const localRef = useRef<HTMLInputElement>(null);
    const setRefs = useCallback(
      (el: HTMLInputElement | null) => {
        localRef.current = el;
        if (!ref) return;
        if (typeof ref === "function") {
          ref(el);
        } else {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
        }
      },
      [ref]
    );

    const handleTextChange: React.ChangeEventHandler<HTMLInputElement> =
      useCallback(
        (e) => {
          const v = e.target.value;
          if (isNumberType) {
            handleNumberTyping(v);
            return;
          }
          if (maxLength && v.length > maxLength) return;
          setValue(v);
        },
        [isNumberType, maxLength, setValue, handleNumberTyping]
      );

    const [showPw, setShowPw] = useState(false);
    const togglePw = useCallback(() => {
      if (!disabled) setShowPw((p) => !p);
    }, [disabled]);

    const clear = useCallback(() => {
      if (disabled) return;
      setValue("");
      localRef.current?.focus();
    }, [disabled, setValue]);

    const iconPx = useMemo(() => {
      const f = s.fontSize as any;
      if (typeof f === "number") return f;
      const n = parseFloat(String(f));
      return Number.isFinite(n) ? n : 16;
    }, [s.fontSize]);

    const startAdornment = useMemo(
      () =>
        startIcon ? (
          <span css={startSlotCss}>{cloneIcon(startIcon, iconPx)}</span>
        ) : null,
      [startIcon, startSlotCss, iconPx]
    );

    const endContainerCss = useMemo(() => css({
      display: "flex",
      alignItems: "center",
      gap: 4,
    }), []);

    const endAdornment = useMemo(() => {
      const componentIcons: React.ReactNode[] = [];

      if (isPassword && togglePasswordVisible) {
        const node = showPw ? (
          <Eye strokeWidth={2.5} size={iconPx} />
        ) : (
          <EyeOff strokeWidth={2.5} size={iconPx} />
        );
        componentIcons.push(
          <button
            key="pw-toggle"
            type="button"
            css={endSlotCss}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              togglePw();
            }}
            tabIndex={-1}
            aria-label={showPw ? "Hide password" : "Show password"}
            disabled={disabled}
          >
            {node}
          </button>
        );
      }

      if (showClear && curr && curr.length > 0 && !disabled) {
        componentIcons.push(
          <button
            key="clear"
            type="button"
            css={endSlotCss}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              clear();
            }}
            tabIndex={-1}
            aria-label="Clear"
          >
            <X strokeWidth={2.5} size={iconPx} />
          </button>
        );
      }

      const userEndIconNode = endIcon ? (
        <span key="user-end" css={endSlotCss}>{cloneIcon(endIcon, iconPx)}</span>
      ) : null;

      const hasComponentIcons = componentIcons.length > 0;
      const hasUserIcon = !!userEndIconNode;

      if (!hasComponentIcons && !hasUserIcon) return null;
      if (!hasComponentIcons && hasUserIcon) return userEndIconNode;
      if (hasComponentIcons && !hasUserIcon) {
        return componentIcons.length === 1 ? componentIcons[0] : (
          <span css={endContainerCss}>{componentIcons}</span>
        );
      }

      return (
        <span css={endContainerCss}>
          {componentIcons}
          {userEndIconNode}
        </span>
      );
    }, [
      isPassword,
      togglePasswordVisible,
      showPw,
      iconPx,
      endSlotCss,
      endContainerCss,
      disabled,
      showClear,
      curr,
      endIcon,
      togglePw,
      clear,
    ]);

    const helperId = helperText != null ? `${id ?? reactId}-help` : undefined;
    const inputId = id ?? reactId;

    const handleSurfacePointerDownCapture = useCallback(
      (e: React.PointerEvent) => {
        if (disabled) return;
        e.stopPropagation();

        const input = localRef.current;
        if (!input) return;

        const target = e.target as HTMLElement;
        if (input.contains(target) || target.closest("button,[role='button']"))
          return;

        if (document.activeElement === input) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
      },
      [disabled]
    );

    const handleSurfaceClick = useCallback(
      (e: React.MouseEvent) => {
        if (disabled) return;
        const input = localRef.current;
        if (!input) return;

        onSurfaceClick?.(e);

        if (document.activeElement !== input) {
          input.focus({ preventScroll: true });
          try {
            const len = input.value?.length ?? 0;
            input.setSelectionRange?.(len, len);
          } catch {}
        }
      },
      [disabled, onSurfaceClick]
    );

    return (
      <div
        className={["plainframe-ui-textfield", className || ""]
          .join(" ")
          .trim()}
        css={rootCss}
      >
        {label && (
          <label
            htmlFor={inputId}
            className="plainframe-ui-textfield-label"
            css={labelCss}
          >
            {label}
          </label>
        )}

        <div
          className="plainframe-ui-textfield-surface"
          css={[
            ring({ 
              enabled: focusRingMode !== "none",
              color: error ? "danger" : undefined
            }),
            surfaceBaseCss
          ]}
          onPointerDownCapture={handleSurfacePointerDownCapture}
          onClick={handleSurfaceClick}
          aria-invalid={!!error || undefined}
        >
          {startAdornment}

          <input
            ref={setRefs}
            id={inputId}
            className="plainframe-ui-textfield-input"
            css={inputBaseCss}
            type={
              isPassword
                ? showPw
                  ? "text"
                  : "password"
                : type === "number"
                ? "text"
                : type
            }
            inputMode={inputMode}
            pattern={pattern}
            value={curr}
            maxLength={!isNumberType ? maxLength : undefined}
            onChange={
              isNumberType
                ? (e) => handleNumberTyping(e.target.value)
                : handleTextChange
            }
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

          {endAdornment}
        </div>

        {helperText != null && (
          <div
            className="plainframe-ui-textfield-helper-row"
            css={helperRowCss}
          >
            <span
              id={helperId}
              className="plainframe-ui-textfield-helper-text"
              css={helperTextCss}
            >
              {helperText}
            </span>
          </div>
        )}
      </div>
    );
  })
);
TextField.displayName = "TextField";
