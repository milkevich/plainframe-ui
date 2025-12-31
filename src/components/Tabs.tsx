/** @jsxImportSource @emotion/react */
import React from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { useFocusRing } from "../utils/focusRing";

type Variant = "subtle" | "underlined" | "text" | "ghost";
type Direction = "horizontal" | "vertical";

export type TabsProps = {
  children?: React.ReactNode;
  defaultValue?: string | number | boolean;
  value?: string | number | boolean;
  onChange?: (value: string | number | boolean) => void;
  variant?: Variant;
  direction?: Direction;
  className?: string;
  shadow?: boolean;
  width?: number | string;
  fullWidth?: boolean;
  rounded?: boolean;
  titlePosition?: "top" | "right" | "bottom" | "left";
  align?: "left" | "center" | "right";
  css?: Interpolation<Theme>;
  trackCss?: Interpolation<Theme>;
  thumbCss?: Interpolation<Theme>;
  activeTabCss?: Interpolation<Theme>;
  activeIndicatorCss?: Interpolation<Theme>;
};

export type TabProps = {
  value: string | number | boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  activeCss?: Interpolation<Theme>;
  css?: Interpolation<Theme>;
};

export type TabContentProps = {
  value: string | number | boolean;
  className?: string;
  children?: React.ReactNode;
  css?: Interpolation<Theme>;
};

export const Tab: React.FC<TabProps> = () => null;
Tab.displayName = "PF.Tab";

export const TabContent: React.FC<TabContentProps> = () => null;
TabContent.displayName = "PF.TabContent";

function unwrapEmotion(child: React.ReactElement) {
  const propsAny = child.props as any;
  const origType = propsAny?.__EMOTION_TYPE_PLEASE_DO_NOT_USE__ ?? child.type;
  return { type: origType, props: propsAny };
}

export const Tabs: React.FC<TabsProps> = ({
  children,
  defaultValue,
  value,
  onChange,
  variant = "subtle",
  direction = "horizontal",
  className,
  shadow = false,
  width,
  fullWidth = false,
  rounded = false,
  titlePosition = "right",
  align,
  css: userCss,
  trackCss: userTrackCss,
  thumbCss: userThumbCss,
  activeTabCss,
  activeIndicatorCss,
}) => {
  const theme = usePlainframeUITheme();
  const focusRing = useFocusRing();
  const isV = direction === "vertical";
  const stretch = fullWidth || width != null;
  const effAlign: "left" | "center" | "right" = align ?? (isV ? "left" : "center");
  const justifyMap = { left: "flex-start", center: "center", right: "flex-end" } as const;

  type ParsedTab = {
    value: string | number | boolean;
    disabled?: boolean;
    node: React.ReactNode;
    className?: string;
    css?: Interpolation<Theme>;
    activeCss?: Interpolation<Theme>;
  };

  const { tabs, contents } = React.useMemo(() => {
    const t: ParsedTab[] = [];
    const c: Array<{ value: TabContentProps["value"]; node: React.ReactNode; className?: string; css?: Interpolation<Theme> }> = [];
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const { type: origType, props } = unwrapEmotion(child);
      const isTab = origType === Tab || (origType as any)?.displayName === Tab.displayName;
      const isContent = origType === TabContent || (origType as any)?.displayName === TabContent.displayName;
      if (isTab) {
        const p = props as TabProps;
        if (p?.value === undefined) return;
        t.push({ value: p.value, disabled: p.disabled, node: p.children, className: p.className, css: p.css, activeCss: p.activeCss });
      } else if (isContent) {
        const p = props as TabContentProps;
        if (p?.value === undefined) return;
        c.push({ value: p.value, node: p.children, className: p.className, css: p.css });
      }
    });
    return { tabs: t, contents: c };
  }, [children]);

  const firstEnabled = React.useMemo(() => tabs.find((t) => !t.disabled)?.value, [tabs]);
  const [internal, setInternal] = React.useState(() => {
    const ok = defaultValue !== undefined && tabs.some((t) => t.value === defaultValue && !t.disabled);
    return ok ? defaultValue : firstEnabled;
  });
  const isControlled = value !== undefined;
  const currentValue = (isControlled ? value : internal) as any;

  const listRef = React.useRef<HTMLDivElement>(null);
  const btnRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = Math.max(0, tabs.findIndex((t) => t.value === currentValue));

  type Ind = { left: number; top: number; width: number; height: number };
  const [indicator, setIndicator] = React.useState<Ind>({ left: 0, top: 0, width: 0, height: 0 });
  const [ready, setReady] = React.useState(false);
  const [animate, setAnimate] = React.useState(false);

  const measure = React.useCallback(() => {
    const list = listRef.current;
    const btn = btnRefs.current[activeIndex];
    if (!list || !btn) return;
    const listRect = list.getBoundingClientRect();
    const r = btn.getBoundingClientRect();
    setIndicator({ left: r.left - listRect.left, top: r.top - listRect.top, width: r.width, height: r.height });
  }, [activeIndex]);

  React.useLayoutEffect(() => {
    measure();
    if (!ready) {
      setReady(true);
      requestAnimationFrame(() => setAnimate(true));
    }
  }, [measure, ready]);

  React.useEffect(() => {
    const ro = new ResizeObserver(() => measure());
    if (listRef.current) ro.observe(listRef.current);
    const btn = btnRefs.current[activeIndex];
    if (btn) ro.observe(btn);
    const onWin = () => measure();
    window.addEventListener("resize", onWin);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWin);
    };
  }, [measure, activeIndex]);

  const nextEnabledIndex = (from: number, dir: 1 | -1) => {
    if (!tabs.length) return from;
    let i = from;
    for (let step = 0; step < tabs.length; step++) {
      i = (i + dir + tabs.length) % tabs.length;
      if (!tabs[i].disabled) return i;
    }
    return from;
  };

  const setSelected = (v: string | number | boolean) => {
    if (!isControlled) setInternal(v);
    onChange?.(v);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!tabs.length) return;
    let next = activeIndex;
    if (e.key === (isV ? "ArrowDown" : "ArrowRight")) next = nextEnabledIndex(activeIndex, 1);
    else if (e.key === (isV ? "ArrowUp" : "ArrowLeft")) next = nextEnabledIndex(activeIndex, -1);
    else if (e.key === "Home") next = tabs.findIndex((t) => !t.disabled);
    else if (e.key === "End") {
      const rev = [...tabs].reverse().findIndex((t) => !t.disabled);
      next = rev === -1 ? activeIndex : tabs.length - 1 - rev;
    } else return;
    e.preventDefault();
    const v = tabs[next]?.value;
    if (v !== undefined) setSelected(v);
    requestAnimationFrame(() => btnRefs.current[next]?.focus());
  };

  const textPrimary = theme.text.primary;
  const textSecondary = theme.text.secondary;
  const disabledText = theme.neutral[500];

  const trackBg = variant === "subtle" ? theme.surface.subtleBg : variant === "ghost" ? "transparent" : "transparent";
  const thumbBg = variant === "subtle" ? theme.surface.panelBg ?? theme.surface.panelBg : variant === "ghost" ? theme.surface.subtleBg : "transparent";
  const underlineColor = theme.text.primary;
  const showThumb = variant === "subtle" || variant === "ghost" || variant === "underlined";

  const rootCss = css({
    "--pf-ease": "cubic-bezier(.4,0,.2,1)",
    display: "flex",
    flexDirection: "column",
    width: fullWidth ? "100%" : width == null ? "auto" : typeof width === "number" ? `${width}px` : width,
  });

  const needsPad = variant === "subtle";

  const trackBaseCss = css({
    position: "relative",
    display: stretch ? "flex" : "inline-flex",
    width: stretch ? "100%" : "auto",
    flexDirection: isV ? "column" : "row",
    alignItems: isV ? "stretch" : "center",
    flexWrap: "nowrap",
    gap: theme.spacing.xs,
    padding: needsPad ? theme.spacing.xs : 0,
    background: trackBg,
    borderRadius:
      variant === "subtle"
        ? rounded
          ? isV
            ? (theme.radius.lg as string)
            : (theme.radius.full as string)
          : (theme.radius.lg as string)
        : "none",
  });

  const thumbBaseCss = css({
    position: "absolute",
    zIndex: 0,
    pointerEvents: "none",
    opacity: ready ? 1 : 0,
    visibility: ready ? "visible" : "hidden",
    transition: animate
      ? `${isV ? "top" : "left"} .24s var(--pf-ease), ${isV ? "height" : "width"} .24s var(--pf-ease), background-color .18s var(--pf-ease)`
      : "none",
    borderRadius: variant === "subtle" || variant === "ghost" ? (rounded ? (theme.radius.full as string) : (theme.radius.md as string)) : 0,
    background: variant === "underlined" ? "transparent" : thumbBg,
    ...(isV
      ? { top: `${indicator.top}px`, height: `${indicator.height}px`, left: theme.spacing.xs, right: theme.spacing.xs }
      : { left: `${indicator.left}px`, width: `${indicator.width}px`, top: theme.spacing.xs, bottom: theme.spacing.xs }),
    boxShadow: shadow && variant === "subtle" ? "0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.04)" : "none",
  });

  const underlineCss = css(
    variant !== "underlined"
      ? {}
      : isV
        ? { background: "transparent", top: `${indicator.top}px`, height: `${indicator.height}px`, left: 0, width: 0, borderLeft: `2px solid ${underlineColor}`, borderBottom: "none", borderRadius: 2 }
        : { background: "transparent", left: `${indicator.left}px`, width: `${indicator.width}px`, bottom: 0, top: "auto", height: 0, borderBottom: `2px solid ${underlineColor}`, borderLeft: "none", borderRadius: 2 }
  );

  const baseTabCss = css({
    position: "relative",
    zIndex: 1,
    border: "none",
    background: "transparent",
    padding:
      variant === "underlined" && direction !== "vertical"
        ? `${theme.spacing.md}`
        : variant === "ghost" && direction !== "vertical"
          ? `${theme.spacing.md}`
          : `${theme.spacing.xs} ${theme.spacing.md}`,
    borderRadius:
      variant === "subtle" || variant === "ghost"
        ? rounded
          ? (theme.radius.full as string)
          : (theme.radius.md as string)
        : (theme.radius.md as string),
    minHeight: theme.componentHeights.sm,
    outline: "none",
    transition: "color .16s ease !important",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ...(isV ? { width: stretch ? "100%" : "auto", flex: "0 0 auto", textAlign: effAlign } : stretch ? { flex: "1 1 0", minWidth: 0, textAlign: "center" } : { flex: "0 0 auto", minWidth: "max-content", textAlign: "center" }),
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    cursor: "pointer",
    userSelect: "none",
    fontSize: theme.typography.sizes.sm,
    fontWeight: 600,
    color: textSecondary,
    "&[aria-selected='true']": { color: textPrimary },
    "&:hover": { color: textPrimary },
    "&[aria-disabled='true'], &:disabled": { opacity: 0.55, cursor: "not-allowed", color: disabledText },
  });

  const contentWrapCss = css({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: isV ? justifyMap[effAlign] : "center",
    gap: 6,
    width: "100%",
    flexDirection:
      titlePosition === "top"
        ? "column-reverse"
        : titlePosition === "bottom"
          ? "column"
          : titlePosition === "left"
            ? "row-reverse"
            : "row",
  });

  const panelCss = css({ marginTop: theme.spacing.sm, width: "100%" });

  const idBase = React.useId();
  const panelIdByValue = new Map<any, string>();
  contents.forEach((c, i) => panelIdByValue.set(c.value, `${idBase}-panel-${i}`));
  const tabIdForIndex = (i: number) => `${idBase}-tab-${i}`;

  return (
    <div className={["plainframe-ui-tabs", className || ""].join(" ").trim()} css={[rootCss, userCss]}>
      <div
        className="plainframe-ui-tabs-track"
        ref={listRef}
        role="tablist"
        aria-orientation={isV ? "vertical" : "horizontal"}
        onKeyDown={onKeyDown}
        css={[trackBaseCss, userTrackCss]}
      >
        {showThumb && <div className="plainframe-ui-tabs-thumb" css={[thumbBaseCss, underlineCss, userThumbCss, activeIndicatorCss]} />}
        {tabs.map((t, i) => {
          const isActive = currentValue === t.value;
          return (
            <button
              key={String(t.value ?? i)}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              role="tab"
              id={tabIdForIndex(i)}
              aria-selected={isActive}
              aria-controls={panelIdByValue.get(t.value)}
              aria-disabled={t.disabled || undefined}
              disabled={t.disabled}
              tabIndex={t.disabled ? -1 : i === activeIndex ? 0 : -1}
              className={["plainframe-ui-tab", t.className || ""].join(" ").trim()}
              onClick={() => {
                if (!t.disabled) setSelected(t.value);
              }}
              css={[baseTabCss, !t.disabled && focusRing(), t.css, isActive ? (t.activeCss ?? activeTabCss) : undefined]}
            >
              <span className="plainframe-ui-tab-content" css={contentWrapCss}>
                {t.node}
              </span>
            </button>
          );
        })}
      </div>
      {contents.map((c, i) => {
        const isActive = c.value === currentValue;
        if (!isActive) return null;

        const labelledByIndex = tabs.findIndex((t) => t.value === c.value);
        const labelledBy =
          labelledByIndex >= 0 ? tabIdForIndex(labelledByIndex) : undefined;

        return (
          <div
            key={i}
            role="tabpanel"
            id={panelIdByValue.get(c.value)}
            aria-labelledby={labelledBy}
            className={["plainframe-ui-tab-panel", c.className || ""]
              .join(" ")
              .trim()}
            css={[panelCss, c.css]}
          >
            {c.node}
          </div>
        );
      })}
    </div>
  );
};
