/** @jsxImportSource @emotion/react */
import React from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { useFocusRing } from "../utils/focusRing";
import { Check } from "lucide-react";

export type StepProps = {
  value: string | number | boolean;
  index?: number;
  label?: number | React.ReactNode;
  disabled?: boolean;
  complete?: boolean;
  icon?: React.ReactNode;
  completedIcon?: React.ReactNode;
};

type TitlePos = "top" | "right" | "bottom" | "left";

type StepperProps = Omit<React.HTMLAttributes<HTMLDivElement>, "style"> & {
  variant?: "subtle" | "outlined" | "filled";
  value?: StepProps["value"];
  defaultValue?: StepProps["value"];
  onChange?: (value: StepProps["value"]) => void;
  disabled?: boolean;
  allowForward?: boolean | ((fromIndex: number, toIndex: number) => boolean);
  allComplete?: boolean;
  color?: string;
  activeBgColor?: string;
  activeColor?: string;
  completeBgColor?: string;
  completeColor?: string;
  separator?: React.ReactNode;
  titlePosition?: TitlePos;
  width?: number | string;
  css?: Interpolation<Theme>;
  className?: string;
  children?: React.ReactNode;
};

const rootCss = (mw?: number | string) =>
  css({
    "--pf-ease": "cubic-bezier(.4,0,.2,1)",
    display: "flex",
    flexDirection: "column",
    maxWidth: mw == null ? "100%" : typeof mw === "number" ? `${mw}px` : mw,
    width: "100%",
  });

const trackCss = css({
  display: "flex",
  alignItems: "center",
  width: "100%",
  gap: 12,
});

const stepWrapCss = (pos: TitlePos) =>
  css({
    display: "flex",
    minWidth: 0,
    flex: "0 0 auto",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexDirection:
      pos === "left"
        ? "row-reverse"
        : pos === "right"
        ? "row"
        : pos === "top"
        ? "column-reverse"
        : "column",
  });

const connectorTrackCss = (neutral300: string) =>
  css({
    position: "relative",
    flex: "1 1 24px",
    minWidth: 6,
    height: 2,
    borderRadius: 1,
    background: neutral300,
    overflow: "hidden",
  });

const connectorFillCss = (pct: number, color: string, animate: boolean) =>
  css({
    position: "absolute",
    inset: 0,
    transformOrigin: "left center",
    transform: `scaleX(${pct})`,
    background: color,
    transition: animate ? "all .28s var(--pf-ease)" : "none",
    willChange: "transform",
  });

const separatorWrapCss = css({
  flex: "1 1 24px",
  minWidth: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const nodeCss = (
  size: number,
  bg: string,
  fg: string,
  outline: string,
  radiusFull: string
) =>
  css({
    position: "relative",
    appearance: "none",
    border: `2px solid ${outline}`,
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius: radiusFull,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    userSelect: "none",
    background: bg,
    color: fg,
    transition: "all .22s var(--pf-ease)",
    "&:disabled, &[aria-disabled='true']": { opacity: 0.55, cursor: "not-allowed" },
  });

const numCss = css({
  fontWeight: 700,
  fontSize: 14,
  lineHeight: 1,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

const layerCss = (show: boolean) =>
  css({
    position: "absolute",
    inset: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transform: `scale(${show ? 1 : 0.3})`,
    opacity: show ? 1 : 0,
    transition: "background .22s var(--pf-ease), transform .16s var(--pf-ease), opacity .16s var(--pf-ease)",
    willChange: "transform, opacity",
  });

const labelCss = (
  strong: boolean,
  textPrimary: string,
  textSecondary: string,
  radiusXs: string,
  spacingXs: number
) =>
  css({
    fontSize: 14,
    color: strong ? textPrimary : textSecondary,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    transition: "all .16s ease",
    textAlign: "center",
    fontWeight: 700,
    margin: `0 ${spacingXs}px`,
    borderRadius: radiusXs,
  });

type NormalizedVariant = "subtle" | "outlined";

type StepItemProps = {
  i: number;
  item: StepProps;
  size: number;
  tokens: {
    MAIN: string;
    ACTIVE_TEXT: string;
    ACTIVE_TEXT_OUTLINED: string;
    COMPLETE_BG: string;
    COMPLETE_FG: string;
    UPCOMING_BG_FILLED: string;
    UPCOMING_OUTLINE: string;
    UPCOMING_FG: string;
  };
  variant: NormalizedVariant;
  titlePosition: TitlePos;
  isActive: boolean;
  completed: boolean;
  disabled: boolean;
  connectorColor: string;
  showConnector: boolean;
  animate: boolean;
  separator?: React.ReactNode;
  canGoToIndex: (toIndex: number) => boolean;
  setSelected: (v: StepProps["value"]) => void;
};

const StepItem = React.memo<StepItemProps>(function StepItem({
  i,
  item,
  size,
  tokens,
  variant,
  titlePosition,
  isActive,
  completed,
  disabled,
  connectorColor,
  showConnector,
  animate,
  separator,
  canGoToIndex,
  setSelected,
}) {
  const theme = usePlainframeUITheme();
  const focusRing = useFocusRing();

  const {
    MAIN,
    ACTIVE_TEXT,
    ACTIVE_TEXT_OUTLINED,
    COMPLETE_BG,
    COMPLETE_FG,
    UPCOMING_BG_FILLED,
    UPCOMING_OUTLINE,
    UPCOMING_FG,
  } = tokens;

  let bg = "transparent",
    fg = UPCOMING_FG,
    outline = UPCOMING_OUTLINE;

  if (variant === "subtle") {
    if (completed) {
      bg = COMPLETE_BG;
      fg = COMPLETE_FG;
      outline = COMPLETE_BG;
    } else if (isActive) {
      bg = MAIN;
      fg = ACTIVE_TEXT;
      outline = MAIN;
    } else {
      bg = UPCOMING_BG_FILLED;
      fg = UPCOMING_FG;
      outline = UPCOMING_BG_FILLED;
    }
  } else {
    if (completed) {
      bg = COMPLETE_BG;
      fg = COMPLETE_FG;
      outline = COMPLETE_BG;
    } else if (isActive) {
      bg = "transparent";
      fg = ACTIVE_TEXT_OUTLINED;
      outline = MAIN;
    } else {
      bg = "transparent";
      fg = UPCOMING_FG;
      outline = UPCOMING_OUTLINE;
    }
  }

  const label = item.label;
  const baseIcon = item.icon ?? <span css={numCss}>{typeof label === "number" ? label : i + 1}</span>;
  const doneIcon = item.completedIcon ?? <Check strokeWidth={3.25} size={16} />;

  return (
    <>
      <div className="plainframe-ui-step" css={stepWrapCss(titlePosition)}>
        <button
          className="plainframe-ui-step-node"
          css={[nodeCss(size, bg, fg, outline, String(theme.radius.full)), !disabled && focusRing({color: isActive ? "primary" : "neutral"})]}
          onClick={() => {
            if (!disabled && canGoToIndex(i)) setSelected(item.value);
          }}
          tabIndex={disabled ? -1 : 0}
          aria-current={isActive ? "step" : undefined}
          aria-disabled={disabled || undefined}
          disabled={disabled}
          aria-label={typeof label === "string" ? label : `Step ${i + 1}`}
        >
          <span className="plainframe-ui-step-content" css={layerCss(!completed)}>
            {baseIcon}
          </span>
          <span className="plainframe-ui-step-check" css={layerCss(!!completed)}>
            {doneIcon}
          </span>
        </button>

        {label && (
          <span
            className="plainframe-ui-step-label"
            css={labelCss(
              completed || isActive,
              theme.text.primary,
              theme.text.secondary,
              String(theme.radius.xs),
              Number(theme.spacing.xs)
            )}
          >
            {label}
          </span>
        )}
      </div>

      {showConnector &&
        (separator ? (
          <div className="plainframe-ui-stepper-separator" css={separatorWrapCss}>
            {separator}
          </div>
        ) : (
          <div className="plainframe-ui-step-connector" css={connectorTrackCss(theme.neutral[300])}>
            <div
              className="plainframe-ui-step-connector-fill"
              css={connectorFillCss(completed ? 1 : 0, connectorColor, animate)}
              aria-hidden="true"
            />
          </div>
        ))}
    </>
  );
},
(a, b) =>
  a.isActive === b.isActive &&
  a.completed === b.completed &&
  a.disabled === b.disabled &&
  a.variant === b.variant &&
  a.separator === b.separator &&
  a.connectorColor === b.connectorColor &&
  a.titlePosition === b.titlePosition &&
  a.size === b.size);

export const Step: React.FC<StepProps> = () => null;
Step.displayName = "PlainframeUIStep";

export const Stepper: React.FC<StepperProps> = ({
  variant = "subtle",
  value,
  defaultValue,
  onChange,
  disabled = false,
  allowForward = true,
  allComplete = false,
  color,
  activeBgColor,
  activeColor,
  completeBgColor,
  completeColor,
  separator,
  titlePosition = "right",
  width,
  css: userCss,
  className,
  children,
  ...rest
}) => {
  const theme = usePlainframeUITheme();
  const normalizedVariant: NormalizedVariant = variant === "outlined" ? "outlined" : "subtle";

  const steps: StepProps[] = React.useMemo(() => {
    const arr = React.Children.toArray(children).filter(
      (child): child is React.ReactElement<StepProps> =>
        React.isValidElement(child) && child.type === Step
    );
    if (!arr.length) return [{ value: 1 }, { value: 2 }, { value: 3 }];
    return arr.map((child, index) => ({ index, ...child.props }));
  }, [children]);

  const resolve = React.useCallback(
    (c?: string, fallback?: string) => (c ? ((theme.palette)?.[c] ?? c) : fallback),
    [theme.palette]
  );

  const tokens = React.useMemo(
    () => ({
      MAIN: String(resolve(activeBgColor, typeof theme.palette.primary[600] === "string" ? theme.palette.primary[600] : "")),
      ACTIVE_TEXT: String(resolve(activeColor, typeof theme.text.onColors?.primary === "string" ? theme.text.onColors?.primary : "")),
      ACTIVE_TEXT_OUTLINED: String(resolve(activeColor, typeof theme.text.primary === "string" ? theme.text.primary : "")),
      COMPLETE_BG: String(resolve(completeBgColor, typeof theme.palette.primary[600] === "string" ? theme.palette.primary[600] : "")),
      COMPLETE_FG: String(resolve(completeColor, typeof theme.text.onColors?.primary === "string" ? theme.text.onColors?.primary : "")),
      UPCOMING_BG_FILLED: String(typeof theme.neutral[100] === "string" ? theme.neutral[100] : ""),
      UPCOMING_OUTLINE: String(typeof theme.neutral[300] === "string" ? theme.neutral[300] : ""),
      UPCOMING_FG: String(typeof theme.text.secondary === "string" ? theme.text.secondary : ""),
    }),
    [
      resolve,
      activeBgColor,
      activeColor,
      completeBgColor,
      completeColor,
      theme.palette.primary,
      theme.neutral,
      theme.text,
    ]
  );

  const connectorColor = React.useMemo(
    () => {
      const resolved = resolve(color, theme.palette.primary[600]);
      return typeof resolved === "string" ? resolved : String(resolved);
    },
    [resolve, color, theme.palette.primary]
  );

  const [internal, setInternal] = React.useState<StepProps["value"]>(() => {
    const has = steps.some((i) => i?.value === defaultValue);
    return has ? (defaultValue as StepProps["value"]) : steps[0]?.value;
  });

  const isControlled = value !== undefined;
  const current = (isControlled ? value : internal) as StepProps["value"];

  const { activeIndex, afterLast } = React.useMemo(() => {
    const directIdx = steps.findIndex((i) => i.value === current);
    if (directIdx !== -1) return { activeIndex: directIdx, afterLast: false };
    if (typeof current === "number") {
      const inferred = Math.floor(current) - 1;
      if (inferred >= steps.length) return { activeIndex: steps.length - 1, afterLast: true };
      if (inferred >= 0) return { activeIndex: inferred, afterLast: false };
    }
    return { activeIndex: 0, afterLast: false };
  }, [steps, current]);

  const setSelected = React.useCallback(
    (v: StepProps["value"]) => {
      if (disabled) return;
      if (!isControlled) setInternal(v);
      onChange?.(v);
    },
    [disabled, isControlled, onChange]
  );

  const isStepComplete = React.useCallback(
    (idx: number) => allComplete || !!steps[idx]?.complete || (afterLast ? true : idx < activeIndex),
    [allComplete, steps, afterLast, activeIndex]
  );

  const canGoToIndex = React.useCallback(
    (toIndex: number) => {
      if (disabled) return false;
      const target = steps[toIndex];
      if (!target || target.disabled) return false;
      if (typeof allowForward === "boolean") {
        if (allowForward === false && toIndex > activeIndex) return false;
      } else if (typeof allowForward === "function") {
        if (!allowForward(activeIndex, toIndex)) return false;
      }
      return true;
    },
    [disabled, steps, allowForward, activeIndex]
  );

  const [animate, setAnimate] = React.useState(false);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!steps.length || disabled) return;
      let next = activeIndex;
      if (e.key === "ArrowRight") next = Math.min(steps.length - 1, activeIndex + 1);
      else if (e.key === "ArrowLeft") next = Math.max(0, activeIndex - 1);
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = steps.length - 1;
      else return;
      e.preventDefault();
      if (canGoToIndex(next)) setSelected(steps[next]!.value);
    },
    [steps, disabled, activeIndex, canGoToIndex, setSelected]
  );

  const size = 34;

  return (
    <div
      tabIndex={-1}
      className={["plainframe-ui-stepper", className || ""].join(" ").trim()}
      css={[rootCss(width), userCss as Interpolation<Theme>]}
      {...rest}
    >
      <div
        tabIndex={-1}
        className="plainframe-ui-stepper-track"
        role="list"
        onKeyDown={onKeyDown}
        css={trackCss}
      >
        {steps.map((step, i) => (
          <React.Fragment key={String(step.value ?? i)}>
            <StepItem
              i={i}
              item={step}
              size={size}
              tokens={tokens}
              variant={normalizedVariant}
              titlePosition={titlePosition}
              isActive={!afterLast && i === activeIndex}
              completed={isStepComplete(i)}
              disabled={disabled || !!step.disabled}
              connectorColor={connectorColor}
              showConnector={i < steps.length - 1}
              animate={animate}
              separator={separator}
              canGoToIndex={canGoToIndex}
              setSelected={setSelected}
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
