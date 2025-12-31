/** @jsxImportSource @emotion/react */
import React, { useMemo, useRef, useCallback, useId, useState } from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { useFocusRing } from "../utils/focusRing";
import type { PlainframeUITheme } from "../theme/theme";

type SizeKey = "sm" | "md" | "lg";
type Variant = "outlined" | "subtle" | "ghost";
type WithCss = { css?: Interpolation<Theme> };

export type CodeFieldProps = WithCss & {
  label?: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  separator?: React.ReactNode;
  error?: boolean;
  helperText?: React.ReactNode;
  disabled?: boolean;
  gap?: number | string;
  size?: SizeKey;
  variant?: Variant;
  length?: number;
  focusRingMode?: "always" | "none";
  wrapperCss?: Interpolation<Theme>;
  labelCss?: Interpolation<Theme>;
  helperRowCss?: Interpolation<Theme>;
  helperTextCss?: Interpolation<Theme>;
  className?: string;
};

const u = (v: number | string | undefined) =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : v;

const CodeBoxes: React.FC<{
  value: string;
  onChange: (v: string) => void;
  len: number;
  theme: PlainframeUITheme;
  sizeKey: SizeKey;
  s: { codeFontSize: number };
  variant: Variant;
  error?: boolean;
  disabled?: boolean;
  ringEnabled: boolean;
  focusRingMode: "always" | "none";
  placeholder?: string;
  separator?: React.ReactNode;
  gapPx: string;
}> = React.memo(function CodeBoxesImpl({
  value,
  onChange,
  len,
  theme,
  sizeKey,
  s,
  variant,
  error,
  disabled,
  ringEnabled,
  focusRingMode,
  placeholder,
  separator,
  gapPx,
}) {
  const ring = useFocusRing();
  const N = theme.neutral;
  const T = theme.text;
  const borderW = theme.componentHeights.border;

  const boxesRef = useRef<Array<HTMLInputElement | null>>([]);
  const [focusIdx, setFocusIdx] = useState<number>(0);

  const chars = useMemo(
    () => (value ?? "").padEnd(len, "").slice(0, len).split(""),
    [value, len]
  );

  const ph = useMemo(() => {
    if (!placeholder) return Array(len).fill("");
    if (placeholder.length === 1) return Array(len).fill(placeholder);
    const a = placeholder.slice(0, len).split("");
    while (a.length < len) a.push("");
    return a;
  }, [placeholder, len]);

  const sideCss = useMemo(() => {
    const H = theme.componentHeights[sizeKey] as number | string;
    const Hpx = typeof H === "number" ? `${H}px` : H;
    return `calc(${Hpx} * 1.5)`;
  }, [theme.componentHeights, sizeKey]);

  const boxBg =
    disabled
      ? (N[200] as string)
      : error && variant === "outlined"
      ? (theme.palette.danger?.[50] ?? theme.surface.panelBg)
      : error && variant === "subtle"
      ? (theme.palette.danger?.[50] ?? theme.surface.subtleBg)
      : variant === "subtle"
      ? (theme.surface.subtleBg as string)
      : variant === "outlined"
      ? (theme.surface.panelBg as string)
      : "transparent";

  const boxBorder =
    variant === "outlined"
      ? `${borderW} solid ${
          error ? theme.palette.danger?.[300] ?? theme.surface.border : theme.surface.border
        }`
      : "none";

  const boxCss = (active: boolean) =>
    css(
      {
        width: sideCss,
        height: sideCss,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        background: boxBg,
        border: boxBorder,
        borderRadius: theme.radius.lg,
        transition: "box-shadow .16s, border-color .16s, background .16s",
        fontSize: s.codeFontSize,
        fontWeight: 600,
        color: disabled
          ? N[500]
          : error
          ? theme.palette.danger?.[800] ?? T.primary
          : T.primary,
        textAlign: "center",
        backgroundClip: "padding-box",
        appearance: "textfield",
        outline: "none",
        caretColor: error ? theme.palette.danger?.[800] ?? T.primary : T.primary,
        "&::placeholder": {
          color: error ? theme.palette.danger?.[700] ?? T.secondary : T.secondary,
          opacity: 0.85,
        },
      },
      ringEnabled
        ? ring({
            enabled: true,
            disabled,
            mode: focusRingMode === "always" ? "always" : "visible",
            color: error ? "danger" : undefined,
          })
        : undefined,
      active ? css({}) : null
    );

  const wrapCss = css({
    display: "flex",
    gap: gapPx,
    justifyContent: "center",
    width: "auto",
    pointerEvents: disabled ? "none" : "auto",
    opacity: disabled ? 0.65 : 1,
  });

  const sepCss = css({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: T.secondary,
    userSelect: "none",
  });

  const sanitize = (c: string) => c.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  const focusAt = useCallback(
    (i: number) => {
      const idx = Math.max(0, Math.min(len - 1, i));
      setFocusIdx(idx);
      boxesRef.current[idx]?.focus();
    },
    [len]
  );

  const handleBoxChange = useCallback(
    (i: number, char: string) => {
      const clean = sanitize(char).slice(0, 1);
      const next = [...chars];
      next[i] = clean;
      onChange(next.join(""));
      if (clean && i < len - 1) focusAt(i + 1);
    },
    [chars, len, onChange, focusAt]
  );

  const handleBoxKeyDown = useCallback(
    (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (!chars[i] && i > 0) {
          const next = [...chars];
          next[i - 1] = "";
          onChange(next.join(""));
          focusAt(i - 1);
          e.preventDefault();
          return;
        } else {
          const next = [...chars];
          next[i] = "";
          onChange(next.join(""));
          return;
        }
      }
      if (e.key === "ArrowLeft" && i > 0) {
        e.preventDefault();
        focusAt(i - 1);
        return;
      }
      if (e.key === "ArrowRight" && i < len - 1) {
        e.preventDefault();
        focusAt(i + 1);
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        focusAt(0);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        focusAt(len - 1);
        return;
      }
    },
    [chars, len, onChange, focusAt]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const paste = sanitize(e.clipboardData.getData("text")).slice(0, len);
      if (!paste) return;
      onChange(paste);
      requestAnimationFrame(() => {
        const idx = Math.min(paste.length, len - 1);
        focusAt(idx);
      });
      e.preventDefault();
    },
    [len, onChange, focusAt]
  );

  return (
    <div className="plainframe-ui-code-boxes" css={wrapCss}>
      {Array.from({ length: len }).map((_, i) => (
        <React.Fragment key={i}>
          <input
            ref={(el) => {
              boxesRef.current[i] = el;
            }}
            type="text"
            inputMode="text"
            maxLength={1}
            value={chars[i] || ""}
            placeholder={chars[i] ? "" : ph[i] || ""}
            disabled={disabled}
            onChange={(e) => handleBoxChange(i, e.target.value)}
            onKeyDown={(e) => handleBoxKeyDown(i, e)}
            onFocus={() => setFocusIdx(i)}
            onPaste={i === 0 ? handlePaste : undefined}
            className="plainframe-ui-code-box"
            css={boxCss(i === focusIdx)}
            aria-label={`Code character ${i + 1}`}
            tabIndex={i === focusIdx ? 0 : -1}
          />
          {separator && i < len - 1 ? (
            <span aria-hidden role="presentation" css={sepCss}>
              {separator}
            </span>
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
});

export const CodeField: React.FC<CodeFieldProps> = ({
  label,
  value,
  defaultValue = "",
  onChange,
  placeholder,
  separator,
  error,
  helperText,
  disabled = false,
  gap,
  size = "md",
  variant = "subtle",
  length = 4,
  focusRingMode = "always",
  className,
  wrapperCss: userWrapperCss,
  labelCss: userLabelCss,
  helperRowCss: userHelperRowCss,
  helperTextCss: userHelperTextCss,
  css: userLayoutCss,
}) => {
  const theme = usePlainframeUITheme();
  const labelId = useId();

  const sizeMap = useMemo(
    () =>
      ({
        sm: {
          labelFont: theme.typography.sizes.xs,
          helperFont: theme.typography.sizes.xs,
          minHeight: theme.componentHeights.sm,
          paddingY: 0,
          paddingX: theme.spacing.md,
          codeFontSize: 21,
        },
        md: {
          labelFont: theme.typography.sizes.sm,
          helperFont: theme.typography.sizes.xs,
          minHeight: theme.componentHeights.md,
          paddingY: 0,
          paddingX: theme.spacing.md,
          codeFontSize: 24,
        },
        lg: {
          labelFont: theme.typography.sizes.md,
          helperFont: theme.typography.sizes.sm,
          minHeight: theme.componentHeights.lg,
          paddingY: 0,
          paddingX: theme.spacing.md,
          codeFontSize: 28,
        },
      } as const),
    [theme]
  );

  const sizeKey: SizeKey = (["sm", "md", "lg"] as const).includes(size)
    ? size
    : "md";
  const s = sizeMap[sizeKey];

  const N = theme.neutral;
  const T = theme.text;

  const isControlled = value != null;
  const [internal, setInternal] = useState<string>(defaultValue);
  const curr = isControlled ? (value as string) : internal;
  const setValue = (next: string) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  const len = Math.max(2, Math.min(length, 10));
  const defaultGap = theme.spacing.sm;
  const gapPx = u(gap ?? defaultGap) ?? "0px";

  const rootCss = css(
    {
      boxSizing: "border-box",
      display: "inline-flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 4,
      width: "auto",
      maxWidth: "unset",
      fontWeight: 500,
      cursor: disabled ? "not-allowed" : "auto",
    },
    ...(Array.isArray(userWrapperCss)
      ? userWrapperCss
      : userWrapperCss
      ? [userWrapperCss]
      : [])
  );

  const labelCss = css(
    {
      fontSize: s.labelFont,
      fontWeight: 500,
      color: error
        ? theme.palette.danger?.[700] ?? T.primary
        : disabled
        ? N[500]
        : T.primary,
      marginBottom: 4,
      display: "block",
      cursor: disabled ? "not-allowed" : "auto",
    },
    ...(Array.isArray(userLabelCss)
      ? userLabelCss
      : userLabelCss
      ? [userLabelCss]
      : [])
  );

  const rowCss = css(
    {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: gapPx,
      width: "auto",
      background: "transparent",
      outline: "none",
      boxShadow: "none",
    },
    ...(Array.isArray(userLayoutCss)
      ? userLayoutCss
      : userLayoutCss
      ? [userLayoutCss]
      : [])
  );

  const helperRowCss = css(
    {
      minHeight: 16,
      fontSize: s.helperFont,
      color: error ? theme.palette.danger?.[700] ?? T.secondary : T.secondary,
      paddingTop: 3,
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 8,
      width: "100%",
    },
    ...(Array.isArray(userHelperRowCss)
      ? userHelperRowCss
      : userHelperRowCss
      ? [userHelperRowCss]
      : [])
  );

  const helperTextCss = css(
    {
      flex: 1,
      wordBreak: "break-word",
      whiteSpace: "pre-wrap",
      minWidth: 0,
      fontWeight: 400,
      color: error
        ? theme.palette.danger?.[700] ?? T.primary
        : disabled
        ? N[500]
        : T.primary,
    },
    ...(Array.isArray(userHelperTextCss)
      ? userHelperTextCss
      : userHelperTextCss
      ? [userHelperTextCss]
      : [])
  );

  return (
    <div
      className={["plainframe-ui-codefield", className || ""].join(" ").trim()}
      css={rootCss}
    >
      {label && (
        <span id={labelId} className="plainframe-ui-codefield-label" css={labelCss}>
          {label}
        </span>
      )}

      <div
        className="plainframe-ui-codefield-row"
        css={rowCss}
        role="group"
        aria-labelledby={label ? labelId : undefined}
        tabIndex={-1}
      >
        <CodeBoxes
          value={curr || ""}
          onChange={setValue}
          len={len}
          theme={theme}
          sizeKey={sizeKey}
          s={{ codeFontSize: s.codeFontSize }}
          variant={variant}
          error={!!error}
          disabled={disabled}
          ringEnabled={focusRingMode !== "none"}
          focusRingMode={focusRingMode}
          placeholder={placeholder}
          separator={separator}
          gapPx={gapPx}
        />
      </div>

      {helperText != null && (
        <div className="plainframe-ui-codefield-helper" css={helperRowCss}>
          <span className="plainframe-ui-codefield-helper-text" css={helperTextCss}>
            {helperText}
          </span>
        </div>
      )}
    </div>
  );
};
