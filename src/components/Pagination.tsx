/** @jsxImportSource @emotion/react */
import React, { useMemo, useState, useCallback } from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import { useFocusRing } from "../utils/focusRing";

type Variant = "subtle" | "outlined" | "ghost";

export type PaginationProps = {
  count: number;
  page?: number;
  defaultPage?: number;
  onChange?: (page: number) => void;
  siblingCount?: number;
  boundaryCount?: number;
  disabled?: boolean;
  showFirstLast?: boolean;
  loop?: boolean;
  variant?: Variant;
  gap?: number;
  className?: string;
  css?: Interpolation<Theme>;
};

export const Pagination: React.FC<PaginationProps> = ({
  count,
  page,
  defaultPage = 1,
  onChange,
  siblingCount = 1,
  boundaryCount = 1,
  disabled = false,
  showFirstLast = false,
  loop = false,
  variant = "subtle",
  gap,
  className,
  css: cssOverride,
}) => {
  const theme = usePlainframeUITheme();
  const focusRing = useFocusRing();

  const isControlled = page !== undefined;
  const [inner, setInner] = useState(defaultPage);
  const normCount = Math.max(1, count);
  const current = clamp(isControlled ? (page as number) : inner, 1, normCount);

  const setPage = useCallback(
    (p: number) => {
      const next = clamp(p, 1, normCount);
      if (!isControlled) setInner(next);
      onChange?.(next);
    },
    [isControlled, normCount, onChange]
  );

  const items = useMemo(
    () => buildItems({ count: normCount, page: current, siblingCount, boundaryCount }),
    [normCount, current, siblingCount, boundaryCount]
  );

  const accent = theme.palette?.primary?.[600];
  const borderCol = theme.surface?.border;
  const hoverBg =
    variant === "subtle"
      ? theme.surface.subtleHover
      : variant === "ghost"
      ? theme.surface?.subtleBg
      : theme.surface.panelHover;
  const txt = theme.text?.primary ?? "#111";
  const containerBg = variant === "subtle" ? theme.surface?.subtleBg : "transparent";

  const containerCss = css(
    {
      display: "inline-flex",
      alignItems: "center",
      gap: gap ?? 6,
      flexWrap: "wrap",
      borderRadius: theme.radius?.md,
      background: containerBg,
      padding: variant === "subtle" ? theme.spacing.xs : 0,
      userSelect: "none",
    },
    ...(Array.isArray(cssOverride) ? cssOverride : cssOverride ? [cssOverride] : [])
  );

  const baseBtn = css({
    minWidth: 28,
    height: 28,
    padding: `0 10px`,
    borderRadius: theme.radius.sm,
    fontSize: 13,
    lineHeight: 1,
    border: "1px solid transparent",
    background: "transparent",
    color: txt,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    outline: "none",
    transition: "all .16s ease !important",
    "&[aria-disabled='true']": { opacity: 0.55, pointerEvents: "none", cursor: "not-allowed" },
    fontWeight: 600,
  });

  const iconSquareBtn = css({
    width: 28,
    minWidth: 28,
    height: 28,
    padding: 0,
  });

  const btnCss = (selected = false) =>
    css([
      baseBtn,
      focusRing({color: selected ? "primary" : "neutral"}),
      variant === "outlined"
        ? selected
          ? { background: accent, color: theme.text.onColors.primary, borderColor: accent }
          : {
              background: "transparent",
              borderColor: borderCol,
              ":hover": { background: hoverBg },
            }
        : variant === "ghost"
        ? selected
          ? { background: accent, color: theme.text.onColors.primary }
          : { ":hover": { background: hoverBg } }
        : selected
        ? { background: accent, color: theme.text.onColors.primary, borderColor: accent }
        : { ":hover": { background: hoverBg } },
    ]);

  const goFirst = useCallback(() => setPage(1), [setPage]);
  const goLast = useCallback(() => setPage(normCount), [setPage, normCount]);
  const goPrev = useCallback(() => {
    if (current === 1) {
      if (loop) setPage(normCount);
    } else setPage(current - 1);
  }, [current, loop, normCount, setPage]);
  const goNext = useCallback(() => {
    if (current === normCount) {
      if (loop) setPage(1);
    } else setPage(current + 1);
  }, [current, loop, normCount, setPage]);

  const prevDisabled = disabled || (current === 1 && !loop);
  const nextDisabled = disabled || (current === normCount && !loop);

  return (
    <nav
      aria-label="Pagination"
      className={["plainframe-ui-pagination", className || ""].join(" ").trim()}
      css={containerCss}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goPrev();
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          goNext();
        }
        if (e.key === "Home") {
          e.preventDefault();
          goFirst();
        }
        if (e.key === "End") {
          e.preventDefault();
          goLast();
        }
      }}
    >
      {showFirstLast && (
        <button
        className="plainframe-ui-pagination-first-button"
          type="button"
          aria-label="First page"
          aria-disabled={prevDisabled}
          disabled={prevDisabled}
          css={[btnCss(false), iconSquareBtn]}
          onClick={goFirst}
          style={{ backgroundColor: variant === "subtle" ? theme.surface?.panelBg : undefined }}
        >
          <ChevronFirst strokeWidth={3} css={{ width: 14, height: 14 }} />
        </button>
      )}

      <button
        className="plainframe-ui-pagination-previous-button"
        type="button"
        aria-label="Previous page"
        aria-disabled={prevDisabled}
        disabled={prevDisabled}
        css={[btnCss(false), iconSquareBtn]}
        onClick={goPrev}
        style={{ backgroundColor: variant === "subtle" ? theme.surface?.panelBg : undefined }}
      >
        <ChevronLeft strokeWidth={3} css={{ width: 14, height: 14 }} />
      </button>

      {items.map((it, idx) =>
        typeof it === "number" ? (
          <button
            className="plainframe-ui-pagination-page-button"
            key={it}
            type="button"
            aria-label={it === current ? `Page ${it}, current page` : `Go to page ${it}`}
            aria-current={it === current ? "page" : undefined}
            css={btnCss(it === current)}
            onClick={() => setPage(it)}
          >
            {it}
          </button>
        ) : (
          <span
            className="plainframe-ui-pagination-ellipsis"
            key={`e${idx}`}
            aria-hidden
            css={css([
              baseBtn,
              focusRing(),
              { borderColor: "transparent", cursor: "default", opacity: 0.8, padding: 0, minWidth: 28 },
            ])}
          >
            …
          </span>
        )
      )}

      <button
        className="plainframe-ui-pagination-next-button"
        type="button"
        aria-label="Next page"
        aria-disabled={nextDisabled}
        disabled={nextDisabled}
        css={[btnCss(false), iconSquareBtn]}
        onClick={goNext}
        style={{ backgroundColor: variant === "subtle" ? theme.surface?.panelBg : undefined }}
      >
        <ChevronRight strokeWidth={3} css={{ width: 14, height: 14 }} />
      </button>

      {showFirstLast && (
        <button
          className="plainframe-ui-pagination-last-button"
          type="button"
          aria-label="Last page"
          aria-disabled={nextDisabled}
          disabled={nextDisabled}
          css={[btnCss(false), iconSquareBtn]}
          onClick={goLast}
          style={{ backgroundColor: variant === "subtle" ? theme.surface?.panelBg : undefined }}
        >
          <ChevronLast strokeWidth={3} css={{ width: 14, height: 14 }} />
        </button>
      )}
    </nav>
  );
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function buildItems({
  count,
  page,
  siblingCount,
  boundaryCount,
}: {
  count: number;
  page: number;
  siblingCount: number;
  boundaryCount: number;
}): Array<number | "ellipsis"> {
  if (count <= 0) return [1];
  const maxVisibleWithoutEllipses = 2 * boundaryCount + 2 * siblingCount + 3;
  if (count <= maxVisibleWithoutEllipses) return range(1, count);

  const startPages = range(1, Math.min(boundaryCount, count));
  const endPages = range(Math.max(count - boundaryCount + 1, boundaryCount + 1), count);

  const siblingsStart = clamp(
    page - siblingCount,
    boundaryCount + 2,
    Math.max(boundaryCount + 2, count - boundaryCount - 2 * siblingCount - 1)
  );
  const siblingsEnd = clamp(
    page + siblingCount,
    Math.min(boundaryCount + 2 + 2 * siblingCount, count - boundaryCount - 1),
    count - boundaryCount - 1
  );

  const out: Array<number | "ellipsis"> = [];
  const push = (v: number | "ellipsis") => {
    const last = out[out.length - 1];
    if (last === v) return;
    if (last === "ellipsis" && v === "ellipsis") return;
    out.push(v);
  };

  startPages.forEach(push);
  if (siblingsStart > boundaryCount + 2) push("ellipsis");
  else if (boundaryCount + 1 < siblingsStart) push(boundaryCount + 1);

  range(siblingsStart, siblingsEnd).forEach(push);

  if (siblingsEnd < count - boundaryCount - 1) push("ellipsis");
  else if (count - boundaryCount > siblingsEnd) push(count - boundaryCount);

  endPages.forEach(push);

  return out;
}

function range(a: number, b: number) {
  if (b < a) return [] as number[];
  const r: number[] = [];
  for (let i = a; i <= b; i++) r.push(i);
  return r;
}
