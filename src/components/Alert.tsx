/** @jsxImportSource @emotion/react */
import React, { createContext, useContext, forwardRef, useMemo, useId } from "react";
import { css, type Interpolation } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { CircleAlert, CircleCheckBig, Info, TriangleAlert, X } from "lucide-react";
import type { Theme } from "@emotion/react";
import { Progress } from "./Progress";

type AlertVariant = "filled" | "outlined" | "soft" | "ghost";
type AlertIntent = "danger" | "warning" | "info" | "success" | "neutral";

export type AlertProps = Omit<React.HTMLAttributes<HTMLDivElement>, "style" | "className"> & {
  intent?: AlertIntent;
  variant?: AlertVariant;
  intentIcon?: React.ReactNode;
  closeIcon?: React.ReactNode;
  onClose?: () => void;
  width?: string | number;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  css?: Interpolation<Theme>;
};

type SubProps = Omit<React.HTMLAttributes<HTMLElement>, "style" | "className"> & {
  css?: Interpolation<Theme>;
  children?: React.ReactNode;
};

type SizeScale = {
  paddingX: number | string;
  paddingY: number | string;
  gap: number | string;
  radius: number | string;
  fontSize: number | string;
  titleWeight: number;
  iconSize: number;
};

type AlertCtxT = {
  fg: string;
  iconColor: string;
  s: SizeScale;
  titleId: string;
  descId: string;
};

const AlertCtx = createContext<AlertCtxT | null>(null);
const useAlertCtx = (): AlertCtxT => {
  const v = useContext(AlertCtx);
  if (!v) throw new Error("AlertTitle and AlertDescription must be used inside <Alert>.");
  return v;
};

const staticContentCss = css({
  display: "flex",
  flexDirection: "column",
  textAlign: "left",
  minWidth: 0,
  flex: 1,
});

const staticIconWrapBaseCss = css({
  lineHeight: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
});

const staticCloseBtnBaseCss = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  background: "transparent",
  padding: 0,
  cursor: "pointer",
  lineHeight: 0,
  transition: "opacity 140ms ease",
  "&:disabled": {
    cursor: "not-allowed",
    opacity: 0.5,
  },
});

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    intent = "neutral" as AlertIntent,
    variant = "soft",
    intentIcon,
    closeIcon,
    onClose,
    width = "100%",
    size = "md",
    loading = false,
    css: userCss,
    children,
    ...rest
  },
  ref
) {
  const theme = usePlainframeUITheme();
  const titleId = useId();
  const descId = useId();

  const s: SizeScale = useMemo<SizeScale>(() => {
    const map: Record<NonNullable<typeof size>, SizeScale> = {
      sm: {
        paddingX: theme.spacing?.md,
        paddingY: theme.spacing?.md,
        gap: theme.spacing?.sm,
        radius: theme.radius?.md,
        fontSize: theme.typography?.sizes?.xs,
        titleWeight: 600,
        iconSize: 16,
      },
      md: {
        paddingX: theme.spacing?.lg,
        paddingY: theme.spacing?.lg,
        gap: theme.spacing?.md,
        radius: theme.radius?.md,
        fontSize: theme.typography?.sizes?.sm,
        titleWeight: 600,
        iconSize: 20,
      },
      lg: {
        paddingX: theme.spacing?.lg,
        paddingY: theme.spacing?.lg,
        gap: theme.spacing?.md,
        radius: theme.radius?.md,
        fontSize: theme.typography?.sizes?.md,
        titleWeight: 600,
        iconSize: 24,
      },
    };
    return (["sm", "md", "lg"].includes(size) ? map[size as "sm" | "md" | "lg"] : map.md);
  }, [size, theme.typography, theme.radius, theme.spacing]);

  const palette = theme.palette ?? {};
  const neutral = theme.neutral ?? {};

  const colors = useMemo((): { bg: string; fg: string; border?: string; iconColor: string } => {
    const pick = (sem: AlertIntent) => {
      if (sem === "danger") return palette.danger ?? palette.error ?? neutral;
      if (sem === "warning") return palette.warning ?? neutral;
      if (sem === "success") return palette.success ?? neutral;
      if (sem === "info") return palette.info ?? palette.primary ?? neutral;
      return neutral;
    };
    const scale = pick(intent) as Record<number, string>;
    const c50 = scale?.[50] ?? neutral[50];
    const c300 = scale?.[300] ?? neutral[300];
    const c600 = scale?.[600] ?? scale?.[500] ?? neutral[600];
    const c700 = scale?.[700] ?? c600;
    const c800 = scale?.[800] ?? theme.text?.primary ?? "#000";
    const onColor = theme.text?.onColors?.[intent] ?? theme.text?.onColors?.primary ?? theme.text?.primary ?? "#fff";

    if (variant === "filled") return { bg: c600, fg: onColor, border: undefined, iconColor: onColor };
    if (variant === "outlined") return { bg: c50, fg: c800, border: `1px solid ${c300}`, iconColor: c800 };
    if (variant === "ghost") return { bg: "transparent", fg: c700, border: "none", iconColor: c700 };
    return { bg: c50, fg: c800, border: undefined, iconColor: c700 };
  }, [intent, variant, neutral, palette, theme.text]);

  const role: "alert" | "status" = intent === "danger" || intent === "warning" ? "alert" : "status";

  const iconEl: React.ReactNode = useMemo(() => {
    if (loading) {
      return <Progress variant="circular" color={colors.iconColor} size={s.iconSize / 1.25} thickness={4.5} />;
    }
    if (intentIcon !== undefined && intentIcon !== null) return intentIcon;
    if (intent === "danger") return <CircleAlert css={{ width: s.iconSize, height: s.iconSize }} color={colors.iconColor} />;
    if (intent === "warning") return <TriangleAlert css={{ width: s.iconSize, height: s.iconSize }} color={colors.iconColor} />;
    if (intent === "success") return <CircleCheckBig css={{ width: s.iconSize, height: s.iconSize }} color={colors.iconColor} />;
    return <Info css={{ width: s.iconSize, height: s.iconSize }} color={colors.iconColor} />;
  }, [loading, intentIcon, intent, s.iconSize, colors.iconColor]);

  const rootCss: Interpolation<Theme> = useMemo(
    () =>
      css({
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        padding: `${s.paddingY} ${s.paddingX}`,
        gap: s.gap,
        borderRadius: s.radius,
        backgroundColor: colors.bg,
        color: colors.fg,
        border: colors.border,
        fontSize: s.fontSize,
        fontWeight: 500,
        maxWidth: typeof width === "number" ? `${width}px` : width,
        width: "100%",
      }),
    [colors.bg, colors.border, colors.fg, s.fontSize, s.gap, s.paddingX, s.paddingY, s.radius, width]
  );

  const leftCss: Interpolation<Theme> = useMemo(
    () =>
      css({
        display: "flex",
        alignItems: "flex-start",
        gap: s.gap,
        minWidth: 0,
        flex: 1,
      }),
    [s.gap]
  );

  const iconWrapCss = useMemo(
    () => [staticIconWrapBaseCss, { color: colors.iconColor }],
    [colors.iconColor]
  );



  const rightCss: Interpolation<Theme> = useMemo(
    () =>
      css({
        display: "flex",
        alignItems: "center",
        gap: s.gap,
        marginLeft: s.gap,
        flex: "0 0 auto",
      }),
    [s.gap]
  );

  const closeBtnCss = useMemo(
    () => [staticCloseBtnBaseCss, { color: colors.fg }],
    [colors.fg]
  );

  const ctxVal: AlertCtxT = useMemo(
    () => ({ fg: colors.fg, iconColor: colors.iconColor, s, titleId, descId }),
    [colors.fg, colors.iconColor, s, titleId, descId]
  );

  const hasTitle = React.Children.toArray(children).some(
    (child) => React.isValidElement(child) && child.type === AlertTitle
  );
  const hasDesc = React.Children.toArray(children).some(
    (child) => React.isValidElement(child) && child.type === AlertDescription
  );

  return (
    <AlertCtx.Provider value={ctxVal}>
      <div
        ref={ref}
        role={role}
        aria-live={role === "alert" ? "assertive" : "polite"}
        aria-atomic="true"
        aria-busy={loading}
        aria-labelledby={hasTitle ? titleId : undefined}
        aria-describedby={hasDesc ? descId : undefined}
        className={`plainframe-ui-alert plainframe-ui-alert-${intent} plainframe-ui-alert-${variant}`}
        css={[rootCss, userCss]}
        {...rest}
      >
        <div className="plainframe-ui-alert-left" css={leftCss}>
          {iconEl && <span className="plainframe-ui-alert-icon" css={iconWrapCss}>{iconEl}</span>}
          <div className="plainframe-ui-alert-content" css={staticContentCss}>{children}</div>
        </div>
        {onClose && (
          <div className="plainframe-ui-alert-actions" css={rightCss}>
            <button
              type="button"
              aria-label="Close alert"
              onClick={onClose}
              disabled={loading}
              className="plainframe-ui-alert-close"
              css={closeBtnCss}
            >
              {closeIcon ?? <X strokeWidth={2} size={s.iconSize - 2} />}
            </button>
          </div>
        )}
      </div>
    </AlertCtx.Provider>
  );
});

Alert.displayName = "Alert";

export const AlertTitle = forwardRef<HTMLSpanElement, SubProps>(function AlertTitle(
  { children, css: userCss, ...rest },
  ref
) {
  const { fg, s, titleId } = useAlertCtx();
  const titleCss: Interpolation<Theme> = useMemo(
    () =>
      css({
        color: fg,
        fontWeight: s.titleWeight,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }),
    [fg, s.titleWeight]
  );
  return (
    <span
      ref={ref}
      id={titleId}
      className="plainframe-ui-alert-title"
      css={[titleCss, userCss]}
      {...rest}
    >
      {children}
    </span>
  );
});

AlertTitle.displayName = "AlertTitle";

export const AlertDescription = forwardRef<HTMLSpanElement, SubProps>(function AlertDescription(
  { children, css: userCss, ...rest },
  ref
) {
  const { fg, descId } = useAlertCtx();
  const descCss: Interpolation<Theme> = useMemo(
    () =>
      css({
        color: fg,
        marginTop: 2,
        lineHeight: 1.35,
        wordBreak: "break-word",
      }),
    [fg]
  );
  return (
    <span
      ref={ref}
      id={descId}
      className="plainframe-ui-alert-desc"
      css={[descCss, userCss]}
      {...rest}
    >
      {children}
    </span>
  );
});

AlertDescription.displayName = "AlertDescription";
