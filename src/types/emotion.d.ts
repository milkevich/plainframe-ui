/// <reference types="@emotion/react/types/css-prop" />

import "@emotion/react";

declare module "@emotion/react" {
  export interface Theme {
    radius: { sm: number; md: number; lg: number };
    spacing: { xxs: number | string; xs: number | string; sm: number | string; md: number | string; lg: number | string; xl: number | string };
    fontSizes: { sm: number; md: number; lg: number };
    componentHeights: { sm: number; md: number; lg: number };
    neutral: Record<number, string>;
    text: { primary: string; secondary: string };
    surface: {
      border: string;
      subtleBg?: string;
      subtleHover?: string;
      panelBg?: string;
    };
    palette: {
      primary: Record<number, string>;
      danger: Record<number, string>;
    };
  }
}
