<p align="start">
  <img src="./pfui-logo.png" width="160" alt="Plainframe UI" />
</p>


# Plainframe UI

Token-driven React UI components with built-in theming, color modes, and accessible primitives.

Plainframe UI is a practical component library for apps that need consistent styling without fighting the system.
You get a theme with spacing/radius/typography + neutral/primary scales, plus components that are keyboard-safe by default.

## Install

npm:
```bash
npm install plainframe-ui @emotion/react
```

pnpm:
```bash
pnpm add plainframe-ui @emotion/react
```

yarn:
```bash
yarn add plainframe-ui @emotion/react
```

## Requirements

- React 18 / 19
- @emotion/react 11+

## Quick start

```tsx
import { ThemeProvider, CssBaseline, Button } from "plainframe-ui";

export default function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <Button variant="filled">Hello</Button>
    </ThemeProvider>
  );
}
```

## What you get

- **Theme tokens**: spacing, radius, typography, neutral scale, primary palettes
- **Color modes**: light/dark + system-friendly patterns
- **Accessible defaults**: focus states, keyboard behavior, sensible ARIA patterns
- **TypeScript-first**: predictable prop typing, good autocomplete
- **Composable primitives**: easy to build custom UI on top without rewriting everything

## Theming

### Default mode

```tsx
<ThemeProvider defaultMode="dark">
  {/* ... */}
</ThemeProvider>
```

### Read the theme inside components

```tsx
/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { Button, usePlainframeUITheme } from "plainframe-ui";

export function Example() {
  const theme = usePlainframeUITheme();

  return (
    <Button
      css={css({
        borderRadius: theme.radius.lg,
        paddingInline: theme.spacing.md,
      })}
    >
      Styled by tokens
    </Button>
  );
}
```

### Change primary palette

```tsx
<ThemeProvider theme={{ primaryKey: "indigo" }}>
  {/* components use theme.palette[primaryKey] */}
</ThemeProvider>
```

### Override tokens (spacing / radius)

```tsx
<ThemeProvider
  theme={{
    spacing: {
      xxs: "0.25rem",
      xs: "0.4rem",
      sm: "0.6rem",
      md: "0.85rem",
      lg: "1.2rem",
      xl: "1.8rem",
    },
    radius: {
      xxs: "0.2rem",
      xs: "0.35rem",
      sm: "0.55rem",
      md: "0.75rem",
      lg: "1rem",
      xl: "1.5rem",
      full: "9999px",
    },
  }}
>
  {/* ... */}
</ThemeProvider>
```

## Components

Grouped so it’s easier to scan.

### Foundation & layout
- Container
- Flex
- Divider
- Typography
- Kbd
- Image
- Quote
- Card
- CardGroup
- ContextZone
- ActionBar

### Inputs
- Button
- ButtonGroup
- Checkbox
- Switch
- Slider
- RadioGroup
- TextField
- TextArea
- Select
- Autocomplete
- CodeField
- Chip

### Navigation
- Menu
- DropdownMenu
- Tabs
- Pagination
- Breadcrumbs
- Stepper

### Overlay
- Modal
- Drawer
- Popover
- Tooltip
- Backdrop

### Feedback
- Alert
- Toast
- Progress
- Skeleton
- Badge

### Transitions
- Fade
- Grow
- Slide
- Rotate
- Swap

## License

MIT
