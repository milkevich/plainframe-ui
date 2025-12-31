/** @jsxImportSource @emotion/react */
import { css, type SerializedStyles } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";

type FocusMode = "always" | "visible" | "none";

export type FocusOpts = {
  color?: string;
  outlineWidth?: number;
  haloWidth?: number;
  offset?: number;
  enabled?: boolean;
  disabled?: boolean;
  mode?: FocusMode;
};

const pickScaleKey = (theme: any, key?: string): string => {
  const pal = theme?.palette ?? {};
  if (!key || key === "neutral") return "neutral";
  return pal[key] ? key : "neutral";
};

const pickFocusColors = (theme: any, colorKey?: string): { soft: string; main: string } => {
  const key = pickScaleKey(theme, colorKey);

  if (key === "neutral") {
    return { soft: "var(--pf-focus-soft)", main: "var(--pf-focus-main)" };
  }
  
  const palette = theme?.palette?.[key];
  if (palette) {
    return {
      soft: palette[300] ?? "transparent",
      main: palette[600] ?? palette[500] ?? "currentColor",
    };
  }
  
  return { soft: "var(--pf-focus-soft)", main: "var(--pf-focus-main)" };
};

export function useFocusRing(): (opts?: FocusOpts) => SerializedStyles {
  const theme = usePlainframeUITheme();

  return (opts?: FocusOpts) => {
    const enabled = (opts?.enabled ?? true) && !opts?.disabled;
    if (!enabled || opts?.mode === "none") return css({});

    const { soft, main } = pickFocusColors(theme, opts?.color);

    const haloW = opts?.haloWidth ?? 3;
    const offset = opts?.offset ?? 0;

    const focusSel = opts?.mode === "always" ? "&:focus" : "&:focus-visible";

    const base: Record<string, any> = {
      transition:
        "box-shadow .16s ease, border-color 0s ease, outline-color 0s ease, outline-offset .16s ease",
      ":root.pf-mode-switching &": { transition: "none !important" },
      "&[disabled], &[aria-disabled='true'], &[data-disabled='true']": {
        boxShadow: "none !important",
      },
    };

    base[focusSel] = {
      boxShadow: `0 0 0 ${haloW}px ${soft}`,
      borderColor: main,
      outlineColor: main,
      outlineOffset: offset,
      zIndex: 10000,
    };

    return css(base);
  };
}

export function useFocusWithinRing(): (opts?: FocusOpts) => SerializedStyles {
  const theme = usePlainframeUITheme();

  return (opts?: FocusOpts) => {
    const enabled = (opts?.enabled ?? true) && !opts?.disabled;
    if (!enabled || opts?.mode === "none") return css({});

    const { soft, main } = pickFocusColors(theme, opts?.color);

    const haloW = opts?.haloWidth ?? 3;
    const offset = opts?.offset ?? 0;

    const withinSel = opts?.mode === "always" ? "&:focus-within" : "&:has(:focus-visible)";

    const base: Record<string, any> = {
      position: "relative",
      transition:
        "box-shadow .16s ease, border-color 0s ease, outline-color 0s ease, outline-offset .16s ease",
      ":root.pf-mode-switching &": { transition: "none !important" },
      "&[disabled], &[aria-disabled='true'], &[data-disabled='true']": {
        boxShadow: "none !important",
      },
    };

    base[withinSel] = {
      boxShadow: `0 0 0 ${haloW}px ${soft}`,
      borderColor: main,
      outlineColor: main,
      outlineOffset: offset,
      zIndex: 1000,
    };

    return css(base);
  };
}
