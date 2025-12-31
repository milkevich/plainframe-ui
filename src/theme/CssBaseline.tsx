/** @jsxImportSource @emotion/react */
import { Global, css } from "@emotion/react";
import { usePlainframeUITheme } from "./ThemeProvider";

export function CssBaseline() {
  const t = usePlainframeUITheme();
  return (
    <Global
      styles={css`
        *,*::before,*::after{box-sizing:border-box}

        body{
          margin:0;
          font-family:${t.typography.fonts.sans};
          -webkit-font-smoothing:antialiased;
          -moz-osx-font-smoothing:grayscale;
          text-rendering:optimizeLegibility;
          background:${t.surface.appBg};
          color:${t.text.primary};
        }

        :focus-visible{outline:2px solid var(--pf-focus-accent-main); outline-offset: 4px;}
        ::selection{background:var(--pf-neutral-300);color:var(--pf-neutral-900)}

        a{color:${t.text.primary}}
        a:hover{text-decoration:underline}

        button,input,select,textarea{font:inherit;color:inherit;letter-spacing:inherit}

        h1,h2,h3,h4,h5,h6,p,figure{margin:0}
        code,kbd,pre,samp{font-family:${t.typography.fonts.mono}}
        hr{border:0;border-top: ${t.componentHeights.border} solid ${t.surface.border};margin:0}

        @media (prefers-reduced-motion:reduce){
          *{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important;scroll-behavior:auto!important}
        }
      `}
    />
  );
}

export const BaseStyles = CssBaseline;
