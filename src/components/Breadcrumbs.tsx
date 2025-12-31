/** @jsxImportSource @emotion/react */
import React from "react";
import { css, type Interpolation, type Theme } from "@emotion/react";
import { usePlainframeUITheme } from "../theme/ThemeProvider";
import { useFocusRing } from "../utils/focusRing";

type WithCss = { css?: Interpolation<Theme> };

export type BreadCrumbItemProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "style" | "href"
> &
  WithCss & {
    href?: string;
    disabled?: boolean;
    className?: string;
    children?: React.ReactNode;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
  };

export const BreadCrumbItem: React.FC<BreadCrumbItemProps> = () => null;
Object.defineProperty(BreadCrumbItem, "displayName", {
  value: "PF.BreadCrumbItem",
  configurable: true,
});

function unwrapEmotion(child: React.ReactElement) {
  const p = child.props ?? {};
  const hasEmotionType =
    typeof (p as { __EMOTION_TYPE_PLEASE_DO_NOT_USE__?: unknown })
      .__EMOTION_TYPE_PLEASE_DO_NOT_USE__ !== "undefined";
  const t = hasEmotionType
    ? (p as { __EMOTION_TYPE_PLEASE_DO_NOT_USE__: unknown })
        .__EMOTION_TYPE_PLEASE_DO_NOT_USE__
    : child.type;
  return { type: t, props: p };
}

export type BreadCrumbsProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  "style"
> & {
  children?: React.ReactNode;
  separator?: React.ReactNode;
  css?: Interpolation<Theme>;
  crumbCss?: Interpolation<Theme>;
  activeCrumbCss?: Interpolation<Theme>;
  inactiveCrumbCss?: Interpolation<Theme>;
  linkCrumbCss?: Interpolation<Theme>;
  separatorCss?: Interpolation<Theme>;
  hover?: boolean;
  className?: string;
};

export const BreadCrumbs: React.FC<BreadCrumbsProps> = React.memo(({
  children,
  separator = "/",
  css: userRootCss,
  crumbCss: userCrumbCss,
  activeCrumbCss: userActiveCrumbCss,
  inactiveCrumbCss: userInactiveCrumbCss,
  linkCrumbCss: userLinkCrumbCss,
  separatorCss: userSepCss,
  hover = true,
  className,
  ...rest
}) => {
  const theme = usePlainframeUITheme();
  const focusRing = useFocusRing();

  const items = React.useMemo(() =>
    React.Children.toArray(children).flatMap((child) => {
      if (!React.isValidElement(child)) return [];
      const { type, props } = unwrapEmotion(child as React.ReactElement);
      const isCrumb =
        type === BreadCrumbItem ||
        (typeof type === "function" && "displayName" in type && type.displayName === BreadCrumbItem.displayName);
      if (!isCrumb) return [];
      const p = props as BreadCrumbItemProps;
      return [
        {
          href: p.href,
          disabled: p.disabled,
          node: p.children,
          className: p.className,
          css: p.css,
          onClick: p.onClick,
          startIcon: p.startIcon,
          endIcon: p.endIcon,
        },
      ];
    })
  , [children]);

  const rootCss = React.useMemo(() => css({
    display: "flex",
    alignItems: "center",
    fontSize: theme.typography.sizes.sm,
    fontWeight: 500,
    gap: theme.spacing.xs,
    cursor: "default",
  }), [theme]);

  const sepCss = React.useMemo(() => css({
    margin: "0 0.15rem",
    color: theme.neutral[500],
    flex: "0 0 auto",
    justifyContent: "center",
    alignItems: "center",
    display: "flex",
  }), [theme]);

  const makeCrumbCss = React.useCallback((
    isLast: boolean,
    isLink: boolean,
    disabled?: boolean
  ) => {
    const baseColor = isLast ? theme.text.primary : theme.text.secondary;
    const interactive = hover && isLink && !disabled;
    return css({
      display: "inline-flex",
      alignItems: "center",
      gap: theme.spacing.xs,
      color: baseColor,
      cursor: isLink && !disabled ? "pointer" : "default",
      textDecoration: "none",
      borderRadius: theme.radius.xs,
      fontWeight: 500,
      outline: "none",
      transition: "all .16s ease !important",
      "&:hover": interactive
        ? {
            textDecoration: "underline",
            color: theme.text.primary,
          }
        : {
            textDecoration: "none",
          },
    });
  }, [theme, hover]);

  const iconCss = React.useMemo(() => css({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 0,
  }), []);

  const labelCss = React.useMemo(() => css({
    display: "inline-block",
  }), []);

  return (
    <nav
      aria-label="Breadcrumb"
      className={["plainframe-ui-breadcrumbs", className || ""]
        .join(" ")
        .trim()}
      css={[rootCss, userRootCss]}
      {...rest}
    >
      {items.map((it, idx) => {
        const isLast = idx === items.length - 1;
        const isLink = !!it.href && !it.disabled && !isLast;

        const commonClass = [
          "plainframe-ui-breadcrumb",
          isLast
            ? "plainframe-ui-breadcrumb--active"
            : "plainframe-ui-breadcrumb--inactive",
          isLink ? "plainframe-ui-breadcrumb--link" : "",
          it.className || "",
        ]
          .join(" ")
          .trim();

        const commonCss = [
          makeCrumbCss(isLast, isLink, it.disabled),
          userCrumbCss,
          isLast ? userActiveCrumbCss : userInactiveCrumbCss,
          isLink ? userLinkCrumbCss : undefined,
          focusRing(),
          it.css,
        ];

        const content = (
          <>
            {it.startIcon && (
              <span
                className="plainframe-ui-breadcrumb-icon-start"
                css={iconCss}
              >
                {it.startIcon}
              </span>
            )}
            <span className="plainframe-ui-breadcrumb-label" css={labelCss}>
              {it.node}
            </span>
            {it.endIcon && (
              <span
                className="plainframe-ui-breadcrumb-icon-end"
                css={iconCss}
              >
                {it.endIcon}
              </span>
            )}
          </>
        );

        return (
          <React.Fragment key={idx}>
            {idx !== 0 && (
              <span
                className="plainframe-ui-breadcrumb-separator"
                css={[sepCss, userSepCss]}
              >
                {separator}
              </span>
            )}

            {isLink ? (
              <a
                href={it.href}
                onClick={it.onClick}
                tabIndex={0}
                data-active={isLast ? "true" : "false"}
                data-link="true"
                className={commonClass}
                css={commonCss}
              >
                {content}
              </a>
            ) : (
              <span
                aria-current={isLast ? "page" : undefined}
                tabIndex={isLast ? -1 : 0}
                data-active={isLast ? "true" : "false"}
                data-link="false"
                className={commonClass}
                css={commonCss}
              >
                {content}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
});
