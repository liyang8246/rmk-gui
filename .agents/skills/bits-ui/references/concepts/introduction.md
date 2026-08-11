# Introduction

Bits UI is a headless component library for Svelte 5 focused on developer experience, accessibility, and full creative control. Use it to build high-quality, accessible UIs without giving up styling freedom or performance.

## Why Bits UI?

### Bring Your Own Styles

Most components ship completely unstyled, with the exception of those required for core functionality. No CSS resets, no design system assumptions. You bring the styles using standard `class` props or `data-*` attributes. See the [Styling](./styling.md) guide.

### Building for Developer Experience

Everything is designed to stay out of your way:
- Full TypeScript coverage
- Stable, predictable APIs
- Flexible event override system
- Great defaults, easily overridden
- Comprehensive documentation and examples

### Production-Ready Accessibility

Accessibility isn't just an afterthought — it's baked in:
- WAI-ARIA compliance
- Keyboard navigation by default
- Focus management handled for you
- Screen reader support built-in

### Composable by Design

Components are primitives, not black boxes. They compose cleanly and play well together:
- [Render Delegation](./child-snippet.md) for total flexibility
- Chainable events and callbacks
- Override-friendly defaults
- Minimal dependencies

## Acknowledgments

Built on the shoulders of giants:
- [Melt UI](https://melt-ui.com) — inspired the internal architecture
- [Radix UI](https://radix-ui.com) — API design inspiration
- [React Spectrum](https://react-spectrum.adobe.com) — inspiration for the date/time components and excellence in accessibility
