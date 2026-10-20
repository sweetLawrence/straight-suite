// import { createTheme, MantineColorsTuple } from '@mantine/core';

// /**
//  * Brand palette - generated from #664934 (deep coffee brown).
//  * 10 shades from light → dark. Mantine uses index 6 as the "primary"
//  * action color by default (buttons, links, active states, focus rings).
//  */
// const brand: MantineColorsTuple = [
//   '#f6f1ed', // 0
//   '#e9dcd3', // 1
//   '#d5bda9', // 2
//   '#c09d80', // 3
//   '#ae825f', // 4
//   '#a3714c', // 5
//   '#664934', // 6  ← primary
//   '#5a402e', // 7
//   '#4c3627', // 8
//   '#3e2c20', // 9
// ];

// /**
//  * Neutral "ink" palette - cooler than Mantine's default gray,
//  * tuned to sit next to #0f172a surfaces without clashing.
//  */
// const ink: MantineColorsTuple = [
//   '#f8fafc',
//   '#f1f5f9',
//   '#e2e8f0',
//   '#cbd5e1',
//   '#94a3b8',
//   '#64748b',
//   '#475569',
//   '#334155',
//   '#1e293b', // 8  ← sidebar border
//   '#0f172a', // 9  ← sidebar / dark surface
// ];

// export const theme = createTheme({
//   primaryColor: 'brand',
//   primaryShade: { light: 6, dark: 5 },
//   colors: { brand, ink },

//   // Global defaults
//   defaultRadius: 'md',
//   fontFamily:
//     'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
//   fontFamilyMonospace:
//     'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',

//   headings: {
//     fontFamily:
//       'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
//     fontWeight: '700',
//     sizes: {
//       h1: { fontSize: '1.75rem', lineHeight: '1.3' },
//       h2: { fontSize: '1.5rem', lineHeight: '1.35' },
//       h3: { fontSize: '1.25rem', lineHeight: '1.4' },
//       h4: { fontSize: '1.125rem', lineHeight: '1.4' },
//       h5: { fontSize: '1rem', lineHeight: '1.5' },
//       h6: { fontSize: '0.875rem', lineHeight: '1.5' },
//     },
//   },

//   shadows: {
//     xs: '0 1px 2px rgba(15, 23, 42, 0.04)',
//     sm: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
//     md: '0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)',
//     lg: '0 12px 24px rgba(15, 23, 42, 0.10), 0 4px 8px rgba(15, 23, 42, 0.05)',
//     xl: '0 20px 40px rgba(15, 23, 42, 0.12)',
//   },

//   radius: {
//     xs: '4px',
//     sm: '6px',
//     md: '8px',
//     lg: '12px',
//     xl: '16px',
//   },

//   components: {
//     Button: {
//       defaultProps: {
//         radius: 'md',
//       },
//       styles: {
//         root: {
//           fontWeight: 600,
//         },
//       },
//     },
//     Card: {
//       defaultProps: {
//         radius: 'lg',
//         shadow: 'sm',
//         withBorder: true,
//       },
//     },
//     Paper: {
//       defaultProps: {
//         radius: 'lg',
//       },
//     },
//     TextInput: {
//       defaultProps: {
//         radius: 'md',
//       },
//     },
//     Select: {
//       defaultProps: {
//         radius: 'md',
//       },
//     },
//     Modal: {
//       defaultProps: {
//         radius: 'lg',
//         centered: true,
//       },
//     },
//     Badge: {
//       defaultProps: {
//         radius: 'sm',
//       },
//     },
//   },
// });

// src/theme.ts
import { createTheme, MantineColorsTuple } from '@mantine/core'

/**
 * Primary accent - Teal.
 * Cool-toned, harmonizes with the slate sidebar (#0f172a).
 * No purple anywhere.
 */
const brand: MantineColorsTuple = [
  '#f0fdfa', // 0  subtle bg / hover tints
  '#ccfbf1', // 1
  '#99f6e4', // 2
  '#5eead4', // 3
  '#2dd4bf', // 4
  '#14b8a6', // 5
  '#0d9488', // 6  ← primary (buttons, links, active)
  '#0f766e', // 7
  '#115e59', // 8
  '#134e4a' // 9
]

/**
 * Ink / surface - cool slate, anchors the app in #0f172a.
 */
const ink: MantineColorsTuple = [
  '#f8fafc', // 0  page bg
  '#f1f5f9', // 1
  '#e2e8f0', // 2  borders
  '#cbd5e1', // 3
  '#94a3b8', // 4  muted text
  '#64748b', // 5
  '#475569', // 6
  '#334155', // 7
  '#1e293b', // 8  sidebar border
  '#0f172a' // 9  sidebar / dark surface
]

export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 5 },
  colors: { brand, ink },

  defaultRadius: 'md',
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',

  headings: {
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '1.75rem', lineHeight: '1.3' },
      h2: { fontSize: '1.5rem', lineHeight: '1.35' },
      h3: { fontSize: '1.25rem', lineHeight: '1.4' },
      h4: { fontSize: '1.125rem', lineHeight: '1.4' },
      h5: { fontSize: '1rem', lineHeight: '1.5' },
      h6: { fontSize: '0.875rem', lineHeight: '1.5' }
    }
  },

  shadows: {
    xs: '0 1px 2px rgba(15, 23, 42, 0.04)',
    sm: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
    md: '0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)',
    lg: '0 12px 24px rgba(15, 23, 42, 0.10), 0 4px 8px rgba(15, 23, 42, 0.05)',
    xl: '0 20px 40px rgba(15, 23, 42, 0.12)'
  },

  radius: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px'
  },

  components: {
    Button: {
      defaultProps: { radius: 'md' },
      styles: { root: { fontWeight: 600 } }
    },
    Card: {
      defaultProps: { radius: 'lg', shadow: 'sm', withBorder: true }
    },
    Paper: { defaultProps: { radius: 'lg' } },
    TextInput: { defaultProps: { radius: 'md' } },
    Select: { defaultProps: { radius: 'md' } },
    // Dropdowns (Select, MultiSelect, Autocomplete, date pickers, menus) sit on Popover.
    // hideDetached hides the list whenever the field looks off screen; on phones, inside a
    // bottom-sheet modal with the keyboard up, that check flips every frame and the list
    // flickers open and closed. Keep the list shown, and keep it on the side it opened on.
    Popover: { defaultProps: { hideDetached: false, preventPositionChangeWhenVisible: true } },
    Combobox: { defaultProps: { hideDetached: false, preventPositionChangeWhenVisible: true } },
    Modal: { defaultProps: { radius: 'lg', centered: true } },
    Badge: { defaultProps: { radius: 'sm' } }
  }
})
