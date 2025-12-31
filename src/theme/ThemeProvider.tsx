import React, { useCallback, useMemo, useRef } from "react";
import { ThemeProvider as EmotionThemeProvider, useTheme as useEmotionTheme } from "@emotion/react";
import {
  defaultDarkTheme,
  defaultLightTheme,
  surfaceFromNeutral,
  textLight,
  textDark,
  type Mode,
  type PlainframeUITheme,
  type PartialTheme,
  type Scale,
} from "./theme";

export type ThemeProp = PartialTheme & {
  primaryKey?: string;
  light?: PartialTheme & { primaryKey?: string };
  dark?: PartialTheme & { primaryKey?: string };
};

export type ThemeProviderProps = {
  theme?: ThemeProp;
  initialMode?: Mode | "system";
  storageKey?: string;
  scope?: string;
  children: React.ReactNode;
};

function createStore<T>(initial: T) {
  let v = initial;
  const subs = new Set<() => void>();
  return {
    get: () => v,
    set: (nv: T) => {
      v = nv;
      subs.forEach((f) => f());
    },
    subscribe: (f: () => void) => {
      subs.add(f);
      return () => {
        subs.delete(f);
      };
    },
  };
}

const aliasOf: Record<string, string> = {
  destructive: "danger",
  error: "danger",
  violet: "purple",
  fuchsia: "magenta",
  gray: "mono",
  grey: "mono",
  neutral: "mono",
};
const resolveAlias = (k: string) => aliasOf[k] ?? k;

function mirrorOnColors(on: Record<string, string>): Record<string, string> {
  const out = { ...on };
  Object.entries(aliasOf).forEach(([alias, target]) => {
    if (out[target] != null && out[alias] == null) out[alias] = out[target];
  });
  return out;
}

const ModeStoreContext = React.createContext<ReturnType<typeof createStore<Mode>> | null>(null);
const PrimaryStoreContext = React.createContext<ReturnType<typeof createStore<string>> | null>(null);
const ModeActionsContext = React.createContext({ setMode: (m: Mode) => void m, toggleMode: () => {} });
const PrimaryActionsContext = React.createContext({ setPrimary: (p: string) => void p });
type BaseResolvedCtxT = { light: PlainframeUITheme; dark: PlainframeUITheme } | null;
const BaseResolvedContext = React.createContext<BaseResolvedCtxT>(null);

export function usePlainframeUITheme() {
  return useEmotionTheme() as any as PlainframeUITheme;
}

export function useColorMode() {
  const store = React.useContext(ModeStoreContext);
  if (!store) throw new Error("useColorMode must be used within ThemeProvider");

  const actions = React.useContext(ModeActionsContext);
  const [mode, setModeState] = React.useState<Mode>(() => store.get());

  React.useEffect(() => {
    setModeState(store.get());
    const unsubscribe = store.subscribe(() => setModeState(store.get()));
    return () => {
      unsubscribe();
    };
  }, [store]);

  return { mode, setMode: actions.setMode, toggleMode: actions.toggleMode };
}

export function usePrimary() {
  const store = React.useContext(PrimaryStoreContext);
  if (!store) throw new Error("usePrimary must be used within ThemeProvider");

  const actions = React.useContext(PrimaryActionsContext);
  const [primary, setPrimaryState] = React.useState<string>(() => store.get());

  React.useEffect(() => {
    setPrimaryState(store.get());
    const unsubscribe = store.subscribe(() => setPrimaryState(store.get()));
    return () => {
      unsubscribe();
    };
  }, [store]);

  return { primary, setPrimary: actions.setPrimary };
}

export function usePrimitives<T = PlainframeUITheme>(selector?: (t: PlainframeUITheme) => T): T {
  const base = React.useContext(BaseResolvedContext);
  if (!base) throw new Error("usePrimitives must be used within ThemeProvider");
  const { mode } = useColorMode();
  const { primary } = usePrimary();

  const raw = React.useMemo(() => {
    const theme = mode === "light" ? base.light : base.dark;
    const chosen = theme.palette[resolveAlias(primary)] ?? theme.palette.primary;
    const onPrim = mirrorOnColors(theme.text.onColors)[resolveAlias(primary)] ?? onColorFor(chosen[600]);
    return {
      ...theme,
      palette: { ...theme.palette, primary: chosen },
      text: {
        ...theme.text,
        onColors: {
          ...mirrorOnColors(theme.text.onColors),
          primary: onPrim,
          [resolveAlias(primary)]: onPrim,
          [primary]: onPrim,
        },
      },
    } as PlainframeUITheme;
  }, [base, mode, primary]);

  return selector ? selector(raw) : (raw as unknown as T);
}

function mergeTheme(base: PlainframeUITheme, patch?: PartialTheme): PlainframeUITheme {
  if (!patch) return base;

  const mergedPalette = { ...base.palette };
  if (patch.palette) {
    for (const key of Object.keys(patch.palette)) {
      const patchScale = patch.palette[key];
      if (patchScale) {
        mergedPalette[key] = { ...(base.palette[key] ?? {}), ...patchScale } as Scale;
      }
    }
  }

  return {
    ...base,
    spacing: { ...base.spacing, ...(patch.spacing ?? {}) },
    radius: { ...base.radius, ...(patch.radius ?? {}) },
    componentHeights: { ...base.componentHeights, ...(patch.componentHeights ?? {}) },
    typography: {
      fonts: { ...base.typography.fonts, ...(patch.typography?.fonts ?? {}) },
      sizes: { ...base.typography.sizes, ...(patch.typography?.sizes ?? {}) },
    },
    palette: mergedPalette,
    neutral: patch.neutral ? ({ ...base.neutral, ...patch.neutral } as Scale) : base.neutral,
    surface: { ...base.surface, ...(patch.surface ?? {}) },
    text: { ...base.text, ...(patch.text ?? {}), onColors: { ...base.text.onColors, ...(patch.text?.onColors ?? {}) } },
  };
}

function onColorFor(hex: string) {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16),
    g = parseInt(m.slice(2, 4), 16),
    b = parseInt(m.slice(4, 6), 16);
  const f = (x: number) => {
    const s = x / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const L = 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  return L > 0.53 ? "#000" : "#FFF";
}

function ensureTag(ref: React.MutableRefObject<HTMLStyleElement | null>, id: string) {
  if (ref.current) return;
  const el = document.createElement("style");
  el.id = id;
  document.head.appendChild(el);
  ref.current = el;
}

function selectorFor(scope?: string) {
  return scope ? `[data-pfui-scope="${scope}"]` : ":root";
}

function buildVarPairs(theme: PlainframeUITheme, primaryKey: string, mode: Mode): string[] {
  const out: string[] = [];
  const normalize = (v: string) =>
    v.startsWith("var(") ? v.replace(/^var\([^,]+,\s*/, "").replace(/\)\s*$/, "").trim() : v;

  out.push(`--pf-font-sans:${normalize(theme.typography.fonts.sans)};`);
  out.push(`--pf-font-mono:${normalize(theme.typography.fonts.mono)};`);
  out.push(`--pf-text-primary:${theme.text.primary};`);
  out.push(`--pf-text-secondary:${theme.text.secondary};`);
  out.push(`--pf-text-muted:${theme.text.muted};`);
  Object.entries(theme.text.onColors).forEach(([k, v]) => out.push(`--pf-text-on-${k}:${v};`));
  Object.entries(theme.spacing).forEach(([k, v]) => out.push(`--pf-space-${k}:${typeof v === "number" ? `${v}px` : v};`));
  Object.entries(theme.radius).forEach(([k, v]) => out.push(`--pf-radius-${k}:${typeof v === "number" ? `${v}px` : v};`));
  Object.entries(theme.typography.sizes).forEach(([k, v]) => out.push(`--pf-fontSize-${k}:${typeof v === "number" ? `${v}px` : v};`));
  Object.entries(theme.componentHeights).forEach(([k, v]) => out.push(`--pf-cmph-${k}:${typeof v === "number" ? `${v}px` : v};`));
  Object.entries(theme.neutral).forEach(([k, v]) => out.push(`--pf-neutral-${k}:${v};`));

  out.push(`--pf-surface-appBg:${theme.surface.appBg};`);
  out.push(`--pf-surface-panelBg:${theme.surface.panelBg};`);
  out.push(`--pf-surface-subtleBg:${theme.surface.subtleBg};`);
  out.push(`--pf-surface-panelHover:${theme.surface.panelHover};`);
  out.push(`--pf-surface-subtleHover:${theme.surface.subtleHover};`);
  out.push(`--pf-surface-overlayBg:${theme.surface.overlayBg};`);
  out.push(`--pf-surface-border:${theme.surface.border};`);

  out.push(`--pf-focus-main:var(--pf-neutral-400);`);
  out.push(mode === "dark" ? `--pf-focus-soft:var(--pf-neutral-200);` : `--pf-focus-soft:var(--pf-neutral-300);`);

  Object.entries(theme.palette).forEach(([name, scale]) => {
    Object.entries(scale).forEach(([shade, val]) => {
      out.push(`--pf-palette-${name}-${shade}:${val};`);
    });
  });

  const focusShade = "300";
  Object.keys(theme.palette).forEach((name) => {
    out.push(`--pf-focus-${name}-main: var(--pf-palette-${name}-${focusShade});`);
    out.push(`--pf-focus-${name}-soft: transparent;`);
  });

  const pk = primaryKey;
  ([0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const).forEach((s) =>
    out.push(`--pf-primary-${s}:var(--pf-palette-${pk}-${s});`)
  );
  out.push(`--pf-focus-accent-main:var(--pf-primary-300);`);
  out.push(`--pf-focus-accent-soft: transparent;`);

  const onPrimary =
    theme.text.onColors[pk] ??
    (() => {
      const ref = theme.palette[pk]?.[600] ?? theme.palette.primary[600];
      const m = ref.replace("#", "");
      const r = parseInt(m.slice(0, 2), 16),
        g = parseInt(m.slice(2, 4), 16),
        b = parseInt(m.slice(4, 6), 16);
      const f = (x: number) => {
        const s = x / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      const L = 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      return L > 0.53 ? "#000" : "#FFF";
    })();
  out.push(`--pf-text-on-primary:${onPrimary};`);

  out.push(`color-scheme:${mode === "dark" ? "dark" : "light"};`);
  return out;
}

function renderVars(theme: PlainframeUITheme, primaryKey: string, mode: Mode) {
  return buildVarPairs(theme, primaryKey, mode).join("");
}

const stripInlinePFVars = (el: HTMLElement): void => {
  for (let i = el.style.length - 1; i >= 0; i--) {
    const prop = el.style.item(i);
    if (prop && prop.startsWith("--pf-")) el.style.removeProperty(prop);
  }
};

const applyPairsInline = (el: HTMLElement, pairs: string[]): void => {
  stripInlinePFVars(el);
  for (const decl of pairs) {
    const idx = decl.indexOf(":");
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim();
    let val = decl.slice(idx + 1).trim();
    if (val.endsWith(";")) val = val.slice(0, -1);
    if (!prop) continue;
    el.style.setProperty(prop, val);
  }
};

const applyModeClass = (el: HTMLElement, m: Mode): void => {
  el.classList.toggle("pf-light", m === "light");
  el.classList.toggle("pf-dark", m === "dark");
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  theme,
  initialMode = "light",
  storageKey = "pfui:pref",
  scope,
}) => {
  const scoped = !!scope;
  const basePrimary = theme?.primaryKey ?? "mono";

  const parentModeStore = React.useContext(ModeStoreContext);
  const parentModeActions = React.useContext(ModeActionsContext);
  const inheritMode = !!parentModeStore;

  const getInitialMode = () => {
    if (!scoped) {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
        if (saved?.mode === "light" || saved?.mode === "dark") return saved.mode;
      } catch {}
    }
    if (initialMode === "system") {
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return (initialMode as Mode) ?? "light";
  };

  const initialModeRef = useRef<Mode>(getInitialMode());

  const modeStore = React.useMemo(() => parentModeStore ?? createStore<Mode>(initialModeRef.current), [parentModeStore]);
  const primaryStore = React.useMemo(() => createStore<string>(basePrimary), []);

  React.useLayoutEffect(() => {
    if (primaryStore.get() !== basePrimary) primaryStore.set(basePrimary);
  }, [basePrimary, primaryStore]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const scopeDepthRef = useRef(0);
  const scopeId = useRef<string>(scope ?? "__root__");

  React.useLayoutEffect(() => {
    let depth = 0;
    let node: HTMLElement | null = wrapperRef.current;
    while (node && node !== document.body) {
      if (node.hasAttribute("data-pfui-scope")) depth++;
      node = node.parentElement;
    }
    scopeDepthRef.current = depth;
  }, [scope]);

  const lightResolved = useMemo(() => {
    const base = mergeTheme(defaultLightTheme, theme);
    const withLight = mergeTheme(base, theme?.light);
    const key = theme?.light?.primaryKey ?? basePrimary;
    const k = resolveAlias(key);
    const selected = withLight.palette.primary ?? withLight.palette[k] ?? withLight.palette.mono;

    const mergedOn = mirrorOnColors({ ...textLight(withLight.neutral).onColors, ...withLight.text.onColors });
    const onPrimary = mergedOn[k] ?? onColorFor(selected[600]);

    const nextSurface = theme?.surface || theme?.light?.surface ? withLight.surface : surfaceFromNeutral("light", withLight.neutral);
    const baseText = theme?.text || theme?.light?.text ? withLight.text : textLight(withLight.neutral);

    const nextText = {
      ...baseText,
      onColors: mirrorOnColors({ ...mergedOn, primary: onPrimary, [k]: onPrimary }),
    };

    return { ...withLight, palette: { ...withLight.palette, primary: selected }, surface: nextSurface, text: nextText };
  }, [theme, basePrimary]);

  const darkResolved = useMemo(() => {
    const base = mergeTheme(defaultDarkTheme, theme);
    const withDark = mergeTheme(base, theme?.dark);
    const key = theme?.dark?.primaryKey ?? basePrimary;
    const k = resolveAlias(key);
    const selected = withDark.palette.primary ?? withDark.palette[k] ?? withDark.palette.mono;

    const mergedOn = mirrorOnColors({ ...textDark(withDark.neutral).onColors, ...withDark.text.onColors });
    const onPrimary = mergedOn[k] ?? onColorFor(selected[600]);

    const nextSurface = theme?.surface || theme?.dark?.surface ? withDark.surface : surfaceFromNeutral("dark", withDark.neutral);
    const baseText = theme?.text || theme?.dark?.text ? withDark.text : textDark(withDark.neutral);

    const nextText = {
      ...baseText,
      onColors: mirrorOnColors({ ...mergedOn, primary: onPrimary, [k]: onPrimary }),
    };

    return { ...withDark, palette: { ...withDark.palette, primary: selected }, surface: nextSurface, text: nextText };
  }, [theme, basePrimary]);

  const varsRef = useRef<HTMLStyleElement | null>(null);
  const guardRef = useRef<HTMLStyleElement | null>(null);
  const useIsoInsertionEffect = (React as any).useInsertionEffect || React.useLayoutEffect;

  const runSwitchGuard = useCallback(() => {
    const sel = selectorFor(scope);
    ensureTag(guardRef, scoped ? `pfui-guard-${scope}` : "pfui-guard-root");
    guardRef.current!.textContent = `${sel} *{transition:none!important;animation:none!important}`;
    requestAnimationFrame(() => {
      guardRef.current!.textContent = "";
    });
  }, [scope, scoped]);

  useIsoInsertionEffect(() => {
    ensureTag(varsRef, scoped ? `pfui-vars-${scope}` : "pfui-vars-root");

    const keyLight = theme?.light?.primaryKey ?? theme?.primaryKey ?? basePrimary;
    const keyDark = theme?.dark?.primaryKey ?? theme?.primaryKey ?? basePrimary;

    const sel = selectorFor(scope);
    const lightCss = renderVars(lightResolved, resolveAlias(keyLight), "light");
    const darkCss = renderVars(darkResolved, resolveAlias(keyDark), "dark");

    varsRef.current!.textContent =
      `${sel}.pf-light{${lightCss}}\n${sel}.pf-dark{${darkCss}}` +
      (scoped ? `\n${sel}{background:var(--pf-surface-appBg);color:var(--pf-text-primary);}` : "");
  }, [lightResolved, darkResolved, theme?.primaryKey, theme?.light?.primaryKey, theme?.dark?.primaryKey, scope, scoped, basePrimary]);

  const didInitRef = useRef(false);
  React.useLayoutEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const host = scoped ? (wrapperRef.current as HTMLElement) : document.documentElement;
    if (!host) return;

    const m = modeStore.get();

    stripInlinePFVars(host);
    applyModeClass(host, m);

    host.setAttribute("data-pfui-mode", m);
    host.setAttribute("data-pfui-primary", primaryStore.get());

    if (!inheritMode) modeStore.set(m);
  }, [scoped, modeStore, primaryStore, inheritMode]);

  type ActiveScope = { id: string; depth: number; ts: number };
  const setActiveScope = useCallback(() => {
    (window as any).__pfuiActiveScope = { id: scopeId.current, depth: scopeDepthRef.current, ts: Date.now() } as ActiveScope;
  }, []);

  const attachActiveScopeListeners = useCallback(() => {
    const host = scoped ? (wrapperRef.current as HTMLElement) : document.documentElement;
    const opts = { capture: true } as AddEventListenerOptions;
    const mark = () => setActiveScope();
    host?.addEventListener("pointerdown", mark, opts);
    host?.addEventListener("mouseenter", mark, opts);
    host?.addEventListener("focusin", mark, opts);
    host?.addEventListener("keydown", mark, opts);
    return () => {
      host?.removeEventListener("pointerdown", mark, opts);
      host?.removeEventListener("mouseenter", mark, opts);
      host?.removeEventListener("focusin", mark, opts);
      host?.removeEventListener("keydown", mark, opts);
    };
  }, [scoped, setActiveScope]);

  const claimIfActiveScope = useCallback(
    (el: HTMLElement) => {
      const act = (window as any).__pfuiActiveScope as ActiveScope | undefined;
      const fresh = act && Date.now() - act.ts < 1500;
      if (!act || !fresh) return;
      if (act.id !== scopeId.current) return;

      const m = modeStore.get();
      const pk = primaryStore.get();
      const t = m === "light" ? lightResolved : darkResolved;

      const pairs = buildVarPairs(t, resolveAlias(pk), m);
      applyPairsInline(el, pairs);
      applyModeClass(el, m);

      el.setAttribute("data-pfui-portal-owner", scopeId.current);
      el.setAttribute("data-pfui-mode", m);
      el.setAttribute("data-pfui-primary", pk);
    },
    [modeStore, primaryStore, lightResolved, darkResolved]
  );

  const looksLikePortalRoot = (el: HTMLElement) => {
    if (el.getAttribute("data-floating-ui-portal") === "true") return true;
    if (el.getAttribute("data-radix-portal") === "true") return true;
    if (el.getAttribute("data-portal") === "true") return true;
    const role = el.getAttribute("role");
    if (role === "tooltip" || role === "dialog") return true;
    const cs = window.getComputedStyle(el);
    return cs.position === "fixed" || cs.position === "absolute";
  };

  const watchPortals = useCallback(() => {
    const mo = new MutationObserver((recs) => {
      for (const r of recs) {
        r.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          if (looksLikePortalRoot(n)) claimIfActiveScope(n);
          n
            .querySelectorAll<HTMLElement>(
              '[data-floating-ui-portal="true"],[data-radix-portal="true"],[data-portal="true"],[role="tooltip"],[role="dialog"]'
            )
            .forEach((el) => claimIfActiveScope(el));
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [claimIfActiveScope]);

  React.useEffect(() => {
    const detachActive = attachActiveScopeListeners();
    const disconnectMO = watchPortals();
    return () => {
      detachActive();
      disconnectMO();
    };
  }, [attachActiveScopeListeners, watchPortals]);

  const applyWrapper = useCallback(
    (m: Mode) => {
      const host = scoped ? (wrapperRef.current as HTMLElement) : document.documentElement;
      if (!host) return;

      stripInlinePFVars(host);
      applyModeClass(host, m);

      host.setAttribute("data-pfui-mode", m);
      host.setAttribute("data-pfui-primary", primaryStore.get());
    },
    [scoped, primaryStore]
  );

  const applyOwnedPortals = useCallback(
    (m: Mode) => {
      const pk = resolveAlias(primaryStore.get());
      const t = m === "light" ? lightResolved : darkResolved;
      const pairs = buildVarPairs(t, pk, m);

      document.querySelectorAll<HTMLElement>(`[data-pfui-portal-owner="${scopeId.current}"]`).forEach((el) => {
        applyPairsInline(el, pairs);
        applyModeClass(el, m);
        el.setAttribute("data-pfui-mode", m);
        el.setAttribute("data-pfui-primary", pk);
      });
    },
    [lightResolved, darkResolved, primaryStore]
  );

  React.useLayoutEffect(() => {
    applyOwnedPortals(modeStore.get());
  }, [applyOwnedPortals, lightResolved, darkResolved, basePrimary, modeStore]);

  React.useLayoutEffect(() => {
    if (!inheritMode) return;
    const sync = () => {
      const m = modeStore.get();
      runSwitchGuard();
      applyWrapper(m);
      applyOwnedPortals(m);
    };
    sync();
    const unsub = modeStore.subscribe(sync);
    return () => unsub();
  }, [inheritMode, modeStore, runSwitchGuard, applyWrapper, applyOwnedPortals]);

  const setMode = useCallback(
    (m: Mode) => {
      if (modeStore.get() === m) return;

      runSwitchGuard();
      modeStore.set(m);

      applyWrapper(m);
      applyOwnedPortals(m);

      if (!scoped) {
        try {
          const prev = JSON.parse(localStorage.getItem(storageKey) || "{}");
          localStorage.setItem(storageKey, JSON.stringify({ ...prev, mode: m }));
        } catch {}
      }
    },
    [modeStore, scoped, storageKey, runSwitchGuard, applyWrapper, applyOwnedPortals]
  );

  const toggleMode = useCallback(() => setMode(modeStore.get() === "light" ? "dark" : "light"), [setMode, modeStore]);

  const setPrimary = useCallback(
    (key: string) => {
      primaryStore.set(key);

      const sel = selectorFor(scope);
      const lightCss = renderVars(lightResolved, resolveAlias(key), "light");
      const darkCss = renderVars(darkResolved, resolveAlias(key), "dark");
      if (varsRef.current) {
        varsRef.current.textContent =
          `${sel}.pf-light{${lightCss}}\n${sel}.pf-dark{${darkCss}}` +
          (scoped ? `\n${sel}{background:var(--pf-surface-appBg);color:var(--pf-text-primary);}` : "");
      }

      runSwitchGuard();
      const m = modeStore.get();

      applyWrapper(m);
      applyOwnedPortals(m);

      if (!scoped) {
        try {
          const prev = JSON.parse(localStorage.getItem(storageKey) || "{}");
          localStorage.setItem(storageKey, JSON.stringify({ ...prev, primary: key }));
        } catch {}
      }
    },
    [lightResolved, darkResolved, scope, scoped, modeStore, primaryStore, runSwitchGuard, applyWrapper, applyOwnedPortals]
  );

  const modeActionsValue = inheritMode ? parentModeActions : { setMode, toggleMode };

  const content = (
    <BaseResolvedContext.Provider value={{ light: lightResolved, dark: darkResolved }}>
      <ModeStoreContext.Provider value={modeStore}>
        <PrimaryStoreContext.Provider value={primaryStore}>
          <ModeActionsContext.Provider value={modeActionsValue}>
            <PrimaryActionsContext.Provider value={{ setPrimary }}>
              <EmotionThemeProvider theme={toVarTheme(lightResolved) as any}>{children}</EmotionThemeProvider>
            </PrimaryActionsContext.Provider>
          </ModeActionsContext.Provider>
        </PrimaryStoreContext.Provider>
      </ModeStoreContext.Provider>
    </BaseResolvedContext.Provider>
  );

  if (scoped) {
    return (
      <div ref={wrapperRef} data-pfui-scope={scope} style={{ background: "var(--pf-surface-appBg)", color: "var(--pf-text-primary)" }}>
        {content}
      </div>
    );
  }

  return <div ref={wrapperRef}>{content}</div>;
};

function toVarTheme(src: PlainframeUITheme): PlainframeUITheme {
  const mapObj = (o: Record<string, any>, p: (k: string) => string) => Object.fromEntries(Object.keys(o).map((k) => [k, p(k)]));
  const spacing = mapObj(src.spacing, (k) => `var(--pf-space-${k})`) as any;
  const radius = mapObj(src.radius, (k) => `var(--pf-radius-${k})`) as any;
  const sizes = mapObj(src.typography.sizes, (k) => `var(--pf-fontSize-${k})`) as any;
  const heights = mapObj(src.componentHeights, (k) => `var(--pf-cmph-${k})`) as any;
  const fonts = { sans: "var(--pf-font-sans)", mono: "var(--pf-font-mono)" };
  const neutral = mapObj(src.neutral, (k) => `var(--pf-neutral-${k})`) as any;

  const palette: Record<string, Record<string, string>> = {};
  Object.keys(src.palette).forEach((name) => {
    palette[name] = {};
    Object.keys(src.palette[name]).forEach((sh) => {
      palette[name][sh] = `var(--pf-palette-${name}-${sh})`;
    });
  });

  palette.primary = Object.fromEntries(
    ["0", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900"].map((s) => [s, `var(--pf-primary-${s})`])
  );

  return {
    ...src,
    spacing,
    radius,
    componentHeights: heights,
    typography: { fonts, sizes },
    neutral,
    palette: palette as any,
    surface: {
      appBg: "var(--pf-surface-appBg)",
      panelBg: "var(--pf-surface-panelBg)",
      subtleBg: "var(--pf-surface-subtleBg)",
      panelHover: "var(--pf-surface-panelHover)",
      subtleHover: "var(--pf-surface-subtleHover)",
      overlayBg: "var(--pf-surface-overlayBg)",
      border: "var(--pf-surface-border)",
    },
    text: {
      primary: "var(--pf-text-primary)",
      secondary: "var(--pf-text-secondary)",
      muted: "var(--pf-text-muted)",
      onColors: Object.fromEntries(Object.keys(mirrorOnColors(src.text.onColors)).map((k) => [k, `var(--pf-text-on-${k})`])) as Record<
        string,
        string
      >,
    },
  };
}
