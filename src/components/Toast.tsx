/** @jsxImportSource @emotion/react */
import React, { useEffect, useSyncExternalStore } from "react";
import { css, type CSSObject } from "@emotion/react";
import { createRoot, type Root } from "react-dom/client";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { ThemeProvider, usePlainframeUITheme } from "../theme/ThemeProvider";
import { defaultLightTheme } from "../theme/theme";
import { X } from "lucide-react";

const THEME = defaultLightTheme;

type CoreStatus = "default" | "success" | "error" | "warning" | "info";
type Status = CoreStatus | "danger";
type Position =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
type ShowDismissMode = "hover" | "always" | "never";

export type ToastRendererCtx = {
  toast: ToastItem;
  close: (id?: string) => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
};
export type ToastRenderer = (ctx: ToastRendererCtx) => React.ReactNode;

export type ToastItem = {
  id: string;
  status: Status;
  content?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  render?: React.ReactNode | ToastRenderer;
  bare?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  action?: React.ReactNode;
  duration: number | null;
  createdAt: number;
  onClose?: () => void;
  pauseOnHover?: boolean;
  showDismiss?: boolean | ShowDismissMode;
  onClick?: (id: string, e: React.MouseEvent | MouseEvent) => void;
  width?: number | string;
};

type Options = Partial<
  Pick<
    ToastItem,
    | "status"
    | "content"
    | "title"
    | "description"
    | "render"
    | "bare"
    | "startIcon"
    | "endIcon"
    | "action"
    | "onClose"
    | "pauseOnHover"
    | "showDismiss"
    | "onClick"
    | "width"
    | "duration"
    | "createdAt"
    | "id"
  >
> & { id?: string; duration?: number | null };

type Styles = {
  stack?: CSSObject;
  item?: CSSObject;
  surface?: CSSObject | ((t: ToastItem) => CSSObject);
  close?: CSSObject;
};

type Config = {
  max: number;
  position: Position;
  gutter: number;
  zIndex: number;
  duration: number | null;
  showDismiss: ShowDismissMode;
  styles: Styles;
  renderer?: React.ReactNode | ToastRenderer;
  bareRenderer: boolean;
};

const ENTER_SPRING = { type: "spring" as const, stiffness: 920, damping: 100 };
const ROOT_KEY = "__toast_root__";

const getIn = (obj: unknown, path: string): unknown =>
  path.split(".").reduce((o: unknown, k) => (o != null && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);

const first = (theme: unknown, paths: string[]): unknown => {
  for (const p of paths) {
    const v = getIn(theme, p);
    if (v != null && v !== "") return v;
  }
  return undefined;
};
const px = (v: unknown, fb: number): string =>
  v == null ? `${fb}px` : typeof v === "number" ? `${v}px` : String(v);

function resolveToastTokens(theme: unknown) {
  const radius = first(theme, ["radius.md", "shape.borderRadius", "radii.md"]);
  const padX = first(theme, ["spacing.lg", "space.4", "spacing.4"]);
  const padY = first(theme, ["spacing.md", "space.3", "spacing.3"]);
  const shadow =
    first(theme, ["shadows.lg", "elevation.lg"]) ??
    "0 8px 24px rgba(0,0,0,.03), 0 2px 8px rgba(0,0,0,.05)";
  return { radius: px(radius, 16), padX: px(padX, 14), padY: px(padY, 12), shadow: String(shadow) };
}
const TOK = resolveToastTokens(THEME);

let hostEl: HTMLElement | null = null;
let root: Root | null = null;

const cfg: Config = {
  max: 5,
  position: "bottom-right",
  gutter: 5,
  zIndex: 1000,
  duration: 5000,
  showDismiss: "hover",
  styles: {},
  renderer: undefined,
  bareRenderer: false,
};

function ensureHost() {
  if (typeof document === "undefined") return;
  if (!hostEl) {
    hostEl = document.getElementById("toast-host");
    if (!hostEl) {
      hostEl = document.createElement("div");
      hostEl.id = "toast-host";
      document.body.appendChild(hostEl);
    }
  }
  if (!root) {
    root = ((hostEl as any)[ROOT_KEY] as Root | undefined) ?? null;
    if (!root) {
      root = createRoot(hostEl!);
      (hostEl as any)[ROOT_KEY] = root;
      root.render(
        <ThemeProvider>
          <ToastHost />
        </ThemeProvider>
      );
    }
  }
}

const store = {
  displayed: [] as ToastItem[],
  queue: [] as ToastItem[],
  entering: {} as Record<string, boolean>,
  exiting: {} as Record<string, boolean>,
  enterFrom: {} as Record<string, "head" | "tail">,
  timers: new Map<string, number>(),
  expiry: new Map<string, number>(),
  remaining: new Map<string, number>(),
  paused: new Set<string>(),
  listeners: new Set<() => void>(),
  snapshot: {
    displayed: [] as ToastItem[],
    entering: {} as Record<string, boolean>,
    exiting: {} as Record<string, boolean>,
    enterFrom: {} as Record<string, "head" | "tail">,
  },
  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },
  notify() {
    this.listeners.forEach((fn) => fn());
  },
  sync() {
    this.snapshot = {
      displayed: [...this.displayed],
      entering: { ...this.entering },
      exiting: { ...this.exiting },
      enterFrom: { ...this.enterFrom },
    };
  },
};

const syncAndNotify = () => {
  store.sync();
  store.notify();
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function armTimer(t: ToastItem, override?: number | null) {
  if (override === null) return;
  const dur = override ?? t.duration;
  if (dur == null) return;
  if (store.timers.has(t.id)) return;
  const now = Date.now();
  const remaining = store.remaining.get(t.id);
  const timeoutMs = remaining != null ? Math.max(0, remaining) : dur;
  store.expiry.set(t.id, now + timeoutMs);
  const handle = window.setTimeout(() => toast.dismiss(t.id), timeoutMs);
  store.timers.set(t.id, handle);
}

function clearTimer(id: string) {
  const handle = store.timers.get(id);
  if (handle) {
    clearTimeout(handle);
    store.timers.delete(id);
  }
}

function flushQueueIntoDisplayed() {
  let changed = false;
  while (store.displayed.length < cfg.max && store.queue.length) {
    const t = store.queue.shift()!;
    store.displayed = [t, ...store.displayed];
    store.enterFrom[t.id] = "head";
    store.entering[t.id] = true;
    changed = true;
    requestAnimationFrame(() => {
      delete store.entering[t.id];
      syncAndNotify();
    });
    armTimer(t);
  }
  if (changed) syncAndNotify();
}

function pushOutOldestIntoQueue() {
  if (store.displayed.length < cfg.max) return;
  const candidates = store.displayed.filter((d) => !store.exiting[d.id]);
  if (!candidates.length) return;
  const oldest = candidates.reduce((a, b) => (a.createdAt <= b.createdAt ? a : b));
  const exp = store.expiry.get(oldest.id);
  if (exp != null) store.remaining.set(oldest.id, Math.max(0, exp - Date.now()));
  clearTimer(oldest.id);
  store.exiting[oldest.id] = true;
  store.displayed = store.displayed.filter((x) => x.id !== oldest.id);
  delete store.enterFrom[oldest.id];
  store.queue.push(oldest);
  syncAndNotify();
}

const normalizeStatus = (s: unknown): CoreStatus => {
  if (s === "danger") return "error";
  const allowed = ["default", "success", "error", "warning", "info"] as const;
  return (allowed as readonly string[]).includes(s as string) ? (s as CoreStatus) : "default";
};

function statusColors(theme: unknown, s: Status) {
  const st = normalizeStatus(s);
  const themeObj = theme as Record<string, unknown>;
  const surface = themeObj.surface as Record<string, unknown> | undefined;
  const text = themeObj.text as Record<string, unknown> | undefined;
  const panelBg = (surface?.panelBg as string | undefined) ?? "#fff";
  const panelFg = (text?.primary as string | undefined) ?? "#111";
  const border = surface?.border as string | undefined;
  if (st === "default" || st === "info") return { bg: panelBg, fg: panelFg, border };
  const on = (text?.onColors as Record<string, unknown> | undefined) ?? {};
  const pick = (
    k: "success" | "warning" | "error",
    fallbackBg: string,
    fallbackFg: string
  ) => {
    const colors = themeObj.colors as Record<string, unknown> | undefined;
    const palette = themeObj.palette as Record<string, Record<number, unknown>> | undefined;
    return {
      bg: (colors?.[k] as string | undefined) ?? (palette?.[k]?.[700] as string | undefined) ?? fallbackBg,
      fg: (on?.[k] as string | undefined) ?? fallbackFg,
      border: "transparent",
    };
  };
  if (st === "success") return pick("success", "#22C55E", "#fff");
  if (st === "warning") return pick("warning", "#F59E0B", "#fff");
  if (st === "error") return pick("error", "#EF4444", "#fff");
  return { bg: panelBg, fg: panelFg, border };
}

export const toast = Object.assign(
  (contentOrOptions: React.ReactNode | Options, opts?: Options): string => {
    ensureHost();

    const isIterable = (obj: unknown): obj is Iterable<unknown> =>
      obj != null && typeof (obj as Record<symbol, unknown>)[Symbol.iterator] === "function";
    const isPromise = (obj: unknown): obj is Promise<unknown> =>
      !!obj && (typeof obj === "object" || typeof obj === "function") && typeof (obj as Record<string, unknown>).then === "function";

    let o: Options;
    if (
      typeof contentOrOptions === "object" &&
      contentOrOptions != null &&
      !React.isValidElement(contentOrOptions) &&
      !isIterable(contentOrOptions) &&
      !isPromise(contentOrOptions)
    ) {
      o = contentOrOptions as Options;
    } else {
      o = {
        content: React.isValidElement(contentOrOptions) ? contentOrOptions : (contentOrOptions as React.ReactNode),
        ...(opts || {}),
      };
    }

    if (o.content == null && (o.title != null || o.description != null)) {
      o.content = (
        <div>
          {o.title && <strong style={{ display: "block", marginBottom: 2 }}>{o.title}</strong>}
          {o.description}
        </div>
      );
    }

    const id = o.id ?? uid();

    const updateIn = (arr: ToastItem[]) => {
      const i = arr.findIndex((x) => x.id === id);
      if (i === -1) return false;
      const prev = arr[i];
      const next: ToastItem = {
        ...prev,
        status: (o.status ?? prev.status) as Status,
        content: o.content ?? prev.content,
        title: o.title ?? prev.title,
        description: o.description ?? prev.description,
        startIcon: o.startIcon ?? prev.startIcon,
        endIcon: o.endIcon ?? prev.endIcon,
        action: o.action ?? prev.action,
        onClose: o.onClose ?? prev.onClose,
        duration: o.duration === undefined ? prev.duration : o.duration,
        pauseOnHover: o.pauseOnHover ?? prev.pauseOnHover,
        showDismiss: o.showDismiss ?? prev.showDismiss,
        render: o.render ?? prev.render,
        bare: o.bare ?? prev.bare,
        onClick: o.onClick ?? prev.onClick,
        width: o.width ?? prev.width,
      };
      arr[i] = next;
      clearTimer(id);
      store.remaining.delete(id);
      if (!store.paused.has(id)) armTimer(next);
      syncAndNotify();
      return true;
    };

    if (updateIn(store.displayed) || updateIn(store.queue)) return id;

    const t: ToastItem = {
      id,
      status: (o.status ?? "default") as Status,
      content: o.content,
      title: o.title,
      description: o.description,
      startIcon: o.startIcon,
      endIcon: o.endIcon,
      action: o.action,
      duration: o.duration === undefined ? cfg.duration : o.duration,
      onClose: o.onClose,
      createdAt: Date.now(),
      pauseOnHover: o.pauseOnHover ?? true,
      showDismiss: o.showDismiss,
      render: o.render,
      bare: o.bare,
      onClick: o.onClick,
      width: o.width ?? 300,
    };

    if (store.displayed.length >= cfg.max) pushOutOldestIntoQueue();

    store.displayed = [...store.displayed, t];
    store.enterFrom[t.id] = "tail";
    store.entering[t.id] = true;
    requestAnimationFrame(() => {
      delete store.entering[t.id];
      syncAndNotify();
    });
    syncAndNotify();
    armTimer(t);

    return id;
  },
  {
    success: (msg: React.ReactNode, o: Options = {}) => toast(msg, { ...o, status: "success" }),
    error: (msg: React.ReactNode, o: Options = {}) => toast(msg, { ...o, status: "error" }),
    warning: (msg: React.ReactNode, o: Options = {}) => toast(msg, { ...o, status: "warning" }),
    info: (msg: React.ReactNode, o: Options = {}) => toast(msg, { ...o, status: "info" }),
    custom: (node: React.ReactNode, o: Options = {}) => toast(node, { ...o }),

    update: (id: string, o: Options) => toast({ id, ...o }),

    dismiss: (id?: string) => {
      if (!id) {
        const first = store.displayed.find((d) => !store.exiting[d.id])?.id;
        if (first) toast.dismiss(first);
        return;
      }
      clearTimer(id);
      store.remaining.delete(id);
      store.paused.delete(id);
      store.exiting[id] = true;
      const item = store.displayed.find((x) => x.id === id);
      store.displayed = store.displayed.filter((x) => x.id !== id);
      delete store.enterFrom[id];
      syncAndNotify();
      window.setTimeout(() => item?.onClose?.(), 120);
      flushQueueIntoDisplayed();
    },

    clear: () => {
      const ids = [...store.displayed.map((t) => t.id)];
      ids.forEach((id) => toast.dismiss(id));
    },

    pause: (id: string) => {
      if (store.paused.has(id)) return;
      const exp = store.expiry.get(id);
      if (exp != null) store.remaining.set(id, Math.max(0, exp - Date.now()));
      store.paused.add(id);
      clearTimer(id);
    },

    resume: (id: string) => {
      if (!store.paused.has(id)) return;
      store.paused.delete(id);
      const t =
        store.displayed.find((x) => x.id === id) ?? store.queue.find((x) => x.id === id);
      const left = store.remaining.get(id);
      if (t) armTimer(t, left ?? undefined);
      store.remaining.delete(id);
    },

    pauseLatest: () => {
      const latest = store.displayed.at(-1);
      if (latest) toast.pause(latest.id);
    },

    resumeLatest: () => {
      const latest = store.displayed.at(-1);
      if (latest) toast.resume(latest.id);
    },

    promise: <T,>(
      p: Promise<T>,
      msgs: {
        loading: React.ReactNode;
        success: (val: T) => React.ReactNode;
        error: (err: unknown) => React.ReactNode;
      },
      o: Options = {}
    ) => {
      const id = toast(msgs.loading, { ...o, status: "info", duration: null });
      p.then((v) => {
        toast.update(id, {
          status: "success",
          content: msgs.success(v),
          duration: o.duration ?? 2500,
        });
      }).catch((err) => {
        toast.update(id, {
          status: "error",
          content: msgs.error(err),
          duration: o.duration ?? 3000,
        });
      });
      return p;
    },

    config: (opts: Partial<{
      max: number;
      position: Position;
      gutter: number;
      zIndex: number;
      duration: number | null;
      showDismiss: ShowDismissMode;
      styles: Styles;
      renderer: React.ReactNode | ToastRenderer;
      bareRenderer: boolean;
    }>) => {
      if (opts.max != null) cfg.max = opts.max;
      if (opts.position) cfg.position = opts.position;
      if (opts.gutter != null) cfg.gutter = opts.gutter;
      if (opts.zIndex != null) cfg.zIndex = opts.zIndex;
      if (opts.duration !== undefined) cfg.duration = opts.duration;
      if (opts.showDismiss) cfg.showDismiss = opts.showDismiss;
      if (opts.styles) cfg.styles = { ...cfg.styles, ...opts.styles };
      if (opts.renderer !== undefined) cfg.renderer = opts.renderer;
      if (opts.bareRenderer !== undefined) cfg.bareRenderer = opts.bareRenderer;
    },
  }
);

function normalizeDismiss(show?: boolean | ShowDismissMode): ShowDismissMode {
  if (typeof show === "string") return show;
  if (show === true) return "always";
  if (show === false) return "never";
  return cfg.showDismiss;
}

function positionCss(pos: Position): CSSObject {
  const map: Record<Position, CSSObject> = {
    "top-left": { top: 16, left: 16, alignItems: "flex-start" },
    "top-center": { top: 16, left: "50%", transform: "translateX(-50%)", alignItems: "center" },
    "top-right": { top: 16, right: 16, alignItems: "flex-end" },
    "bottom-left": { bottom: 16, left: 16, alignItems: "flex-start" },
    "bottom-center": { bottom: 16, left: "50%", transform: "translateX(-50%)", alignItems: "center" },
    "bottom-right": { bottom: 16, right: 16, alignItems: "flex-end" },
  };
  return map[pos];
}

const rowCss = css({ display: "flex", alignItems: "flex-start", gap: 10 });
const iconWrapCss = css({
  flex: "0 0 auto",
  paddingTop: 1,
  lineHeight: 0,
  marginLeft: -3,
  "& svg, & img, & canvas, & video": { display: "block" },
});
const textCss = css({ fontSize: 14, lineHeight: 1.4, fontWeight: 500, flex: 1, minWidth: 0 });
const actionRowCss = css({ display: "flex", alignItems: "center", gap: 6, marginRight: -2 });

const ToastHost = React.memo(function ToastHost() {
  const snap = useSyncExternalStore(store.subscribe.bind(store), () => store.snapshot, () => store.snapshot);
  const theme = usePlainframeUITheme();
  const isBottom = cfg.position.startsWith("bottom");
  const list = React.useMemo(() => 
    isBottom ? snap.displayed : [...snap.displayed].reverse(),
    [snap.displayed, isBottom]
  );

  const stackStyle = React.useMemo<CSSObject>(() => ({
    position: "fixed",
    zIndex: cfg.zIndex,
    pointerEvents: "none",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    ...positionCss(cfg.position),
    ...(cfg.styles.stack ?? {}),
  }), []);

  return (
    <div className="plainframe-ui-toast-stack" css={css(stackStyle)}>
      <AnimatePresence initial={false}>
        {list.map((t, index) => {
          const from = snap.enterFrom[t.id] || "tail";
          const enterY = isBottom ? (from === "head" ? -16 : 16) : from === "head" ? 16 : -16;
          const mt = index > 0 ? cfg.gutter : 0;
          const ctx: ToastRendererCtx = {
            toast: t,
            close: toast.dismiss,
            pause: toast.pause,
            resume: toast.resume,
          };
          const { bg, fg, border } = statusColors(theme, t.status);

          const baseSurface: CSSObject = {
            position: "relative",
            overflow: "hidden",
            borderRadius: theme.radius.md,
            boxShadow: TOK.shadow,
            padding: `${theme.spacing.md} calc(${theme.spacing.lg} + 30px) ${theme.spacing.md} ${theme.spacing.lg}`,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 10,
            background: bg,
            color: fg,
            cursor: t.onClick ? "pointer" : "default",
            border: border ? `1px solid ${border}` : "1px solid transparent",
          };

          const extraSurface =
            typeof cfg.styles.surface === "function" ? cfg.styles.surface(t) : cfg.styles.surface ?? {};

          const dismissMode = normalizeDismiss(t.showDismiss);
          const modeStyles: CSSObject = {};
          const closeSel = "& .plainframe-ui-toast-close";
          const hoverSel = "&:hover .plainframe-ui-toast-close";
          if (dismissMode === "hover") {
            modeStyles[closeSel] = { opacity: 0, pointerEvents: "none" };
            modeStyles[hoverSel] = { opacity: 1, pointerEvents: "auto" };
          } else if (dismissMode === "always") {
            modeStyles[closeSel] = { opacity: 1, pointerEvents: "auto" };
          } else if (dismissMode === "never") {
            modeStyles[closeSel] = { display: "none" };
          }

          const wrapCss = css({ ...baseSurface, ...extraSurface, ...modeStyles });
          const closeCss = css({
            position: "absolute",
            top: 8,
            right: 8,
            appearance: "none",
            border: 0,
            background: "transparent",
            color: fg,
            width: 28,
            height: 28,
            borderRadius: 8,
            cursor: "pointer",
            lineHeight: 1,
            transition: "opacity .12s ease",
            display: "grid",
            placeItems: "center",
            ...(cfg.styles.close ?? {}),
          });

          let content: React.ReactNode;

          if (t.bare && t.render) {
            const inner = typeof t.render === "function" ? (t.render as ToastRenderer)(ctx) : t.render;
            content = (
              <div style={{ pointerEvents: "auto" }} onClick={(e) => t.onClick?.(t.id, e)}>
                {inner}
              </div>
            );
          } else if (cfg.bareRenderer && cfg.renderer) {
            const inner =
              typeof cfg.renderer === "function"
                ? (cfg.renderer as ToastRenderer)(ctx)
                : cfg.renderer;
            content = (
              <div style={{ pointerEvents: "auto" }} onClick={(e) => t.onClick?.(t.id, e)}>
                {inner}
              </div>
            );
          } else {
            let innerBlock: React.ReactNode;
            if (cfg.renderer) {
              innerBlock =
                typeof cfg.renderer === "function"
                  ? (cfg.renderer as ToastRenderer)(ctx)
                  : cfg.renderer;
            } else if (t.render && !t.bare) {
              innerBlock = typeof t.render === "function" ? (t.render as ToastRenderer)(ctx) : t.render;
            } else {
              innerBlock = (
                <>
                  <div css={rowCss}>
                    {t.startIcon && <div css={iconWrapCss}>{t.startIcon}</div>}
                    <div css={textCss}>{t.content}</div>
                    {t.endIcon && <div css={iconWrapCss}>{t.endIcon}</div>}
                  </div>
                  {t.action && <div css={actionRowCss}>{t.action}</div>}
                </>
              );
            }
            content = (
              <div css={wrapCss} onClick={(e) => t.onClick?.(t.id, e)}>
                {innerBlock}
                <button
                  className="plainframe-ui-toast-close"
                  aria-label="Close"
                  css={closeCss}
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.dismiss(t.id);
                  }}
                >
                  <X strokeWidth={2.5} size={14} />
                </button>
              </div>
            );
          }

          return (
            <SwipeItem
              key={t.id}
              id={t.id}
              isBottom={isBottom}
              mt={mt}
              enterY={enterY}
              width={t.width}
              pauseOnHover={t.pauseOnHover !== false}
            >
              {content}
            </SwipeItem>
          );
        })}
      </AnimatePresence>
    </div>
  );
});

const SwipeItem = React.memo(function SwipeItem(
  props: React.PropsWithChildren<{
    id: string;
    isBottom: boolean;
    mt: number;
    enterY: number;
    width?: number | string;
    pauseOnHover: boolean;
  }>
) {
  const { id, isBottom, mt, enterY, width, pauseOnHover, children } = props;
  const controls = useAnimationControls();

  useEffect(() => {
    controls.start({ opacity: 1, y: 0, height: "auto", x: 0, transition: ENTER_SPRING });
  }, [controls]);

  const itemStyle: CSSObject = {
    pointerEvents: "auto",
    willChange: "transform, opacity, height, margin, scale, width, max-width",
    marginTop: mt,
    width: "100%",
    maxWidth: width != null ? (typeof width === "number" ? `${width}px` : width) : "none",
    ...(cfg.styles.item ?? {}),
  };

  return (
    <motion.div
      layout="position"
      className="plainframe-ui-toast-item"
      css={css(itemStyle)}
      initial={{ opacity: 0, y: enterY, height: "auto", x: 0 }}
      animate={controls}
      exit={{ opacity: 0, y: isBottom ? 6 : -6, height: 0, marginTop: 0, transition: { type: "tween", ease: "easeInOut", duration: 0.14 } }}
      drag="x"
      dragElastic={0.2}
      dragMomentum
      whileDrag={{ scale: 0.98, opacity: 0.95 }}
      onDragEnd={(_, info) => {
        const dist = Math.abs(info.offset.x);
        const velo = Math.abs(info.velocity.x);
        const shouldFling = dist > 60 || velo > 600;
        if (!shouldFling) {
          controls.start({ x: 0, opacity: 1, transition: { type: "spring", stiffness: 700, damping: 40 } });
          return;
        }
        const dir = info.offset.x !== 0 ? Math.sign(info.offset.x) : Math.sign(info.velocity.x || 1);
        const targetX = dir * (window.innerWidth + 160);
        const velocity = typeof info.velocity.x === "number" ? info.velocity.x / 10 : 0;
        controls.start({ x: targetX, opacity: 0.9, transition: { type: "spring", stiffness: 280, damping: 24, velocity } })
          .then(() => toast.dismiss(id));
      }}
      onMouseEnter={pauseOnHover ? () => toast.pause(id) : undefined}
      onMouseLeave={pauseOnHover ? () => toast.resume(id) : undefined}
    >
      {children}
    </motion.div>
  );
});

let mounted = false;
(function mountHostOnce() {
  if (mounted) return;
  mounted = true;
  ensureHost();
})();
