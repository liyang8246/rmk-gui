# Svelte/SvelteKit Documentation Catalog

This is the complete list of all documentation sections available via the `@sveltejs/mcp` CLI. Use these paths with `get-documentation` to fetch full docs.

## AI Tools

| Title | Path |
|-------|------|
| Overview | `ai/overview` |
| Local setup | `ai/local-setup` |
| Remote setup | `ai/remote-setup` |
| Tools | `ai/tools` |
| Resources | `ai/resources` |
| Prompts | `ai/prompts` |
| Plugin | `ai/plugin` |
| Subagent | `ai/subagent` |
| OpenCode Plugin | `ai/opencode-plugin` |
| OpenCode Subagent | `ai/opencode-subagent` |
| Skills | `ai/skills` |

## CLI

| Title | Path | Use Cases |
|-------|------|-----------|
| Overview | `cli/overview` | project setup, creating new svelte apps, scaffolding, cli tools, initializing projects |
| Frequently asked questions | `cli/faq` | project setup, initializing new svelte projects, troubleshooting cli installation, package manager configuration |
| sv create | `cli/sv-create` | project setup, starting new sveltekit app, initializing project, creating from playground, choosing project template |
| sv add | `cli/sv-add` | project setup, adding features to existing projects, integrating tools, testing setup, styling setup, authentication, database setup, deployment adapters |
| sv check | `cli/sv-check` | code quality, ci/cd pipelines, error checking, typescript projects, pre-commit hooks, finding unused css, accessibility auditing, production builds |
| sv migrate | `cli/sv-migrate` | migration, upgrading svelte versions, upgrading sveltekit versions, modernizing codebase, svelte 3 to 4, svelte 4 to 5, sveltekit 1 to 2, adopting runes, refactoring deprecated apis |
| devtools-json | `cli/devtools-json` | development setup, chrome devtools integration, browser-based editing, local development workflow, debugging setup |
| drizzle | `cli/drizzle` | database setup, sql queries, orm integration, data modeling, postgresql, mysql, sqlite, server-side data access, database migrations, type-safe queries |
| eslint | `cli/eslint` | code quality, linting, error detection, project setup, code standards, team collaboration, typescript projects |
| better-auth | `cli/better-auth` | use title and path to estimate use case |
| mcp | `cli/mcp` | use title and path to estimate use case |
| mdsvex | `cli/mdsvex` | blog, content sites, markdown rendering, documentation sites, technical writing, cms integration, article pages |
| paraglide | `cli/paraglide` | internationalization, multi-language sites, i18n, translation, localization, language switching, global apps, multilingual content |
| playwright | `cli/playwright` | browser testing, e2e testing, integration testing, test automation, quality assurance, ci/cd pipelines, testing user flows |
| prettier | `cli/prettier` | code formatting, project setup, code style consistency, team collaboration, linting configuration |
| storybook | `cli/storybook` | component development, design systems, ui library, isolated component testing, documentation, visual testing, component showcase |
| sveltekit-adapter | `cli/sveltekit-adapter` | deployment, production builds, hosting setup, choosing deployment platform, configuring adapters, static site generation, node server, vercel, cloudflare, netlify |
| tailwindcss | `cli/tailwind` | project setup, styling, css framework, rapid prototyping, utility-first css, design systems, responsive design, adding tailwind to svelte |
| vitest | `cli/vitest` | testing, unit tests, component testing, test setup, quality assurance, ci/cd pipelines, test-driven development |
| add-on | `cli/add-on` | use title and path to estimate use case |
| sv-utils | `cli/sv-utils` | use title and path to estimate use case |

## SvelteKit

| Title | Path | Use Cases |
|-------|------|-----------|
| Introduction | `kit/introduction` | learning sveltekit, project setup, understanding framework basics, choosing between svelte and sveltekit, getting started with full-stack apps |
| Creating a project | `kit/creating-a-project` | project setup, starting new sveltekit app, initial development environment, first-time sveltekit users, scaffolding projects |
| Project types | `kit/project-types` | deployment, project setup, choosing adapters, ssg, spa, ssr, serverless, mobile apps, desktop apps, pwa, offline apps, browser extensions, separate backend, docker containers |
| Project structure | `kit/project-structure` | project setup, understanding file structure, organizing code, starting new project, learning sveltekit basics |
| Web standards | `kit/web-standards` | always, any sveltekit project, data fetching, forms, api routes, server-side rendering, deployment to various platforms |
| Routing | `kit/routing` | routing, navigation, multi-page apps, project setup, file structure, api endpoints, data loading, layouts, error pages, always |
| Loading data | `kit/load` | data fetching, api calls, database queries, dynamic routes, page initialization, loading states, authentication checks, ssr data, form data, content rendering |
| Form actions | `kit/form-actions` | forms, user input, data submission, authentication, login systems, user registration, progressive enhancement, validation errors |
| Page options | `kit/page-options` | prerendering static sites, ssr configuration, spa setup, client-side rendering control, url trailing slash handling, adapter deployment config, build optimization |
| State management | `kit/state-management` | sveltekit, server-side rendering, ssr, state management, authentication, data persistence, load functions, context api, navigation, component lifecycle |
| Remote functions | `kit/remote-functions` | data fetching, server-side logic, database queries, type-safe client-server communication, forms, user input, mutations, authentication, crud operations, optimistic updates |
| Building your app | `kit/building-your-app` | production builds, deployment preparation, build process optimization, adapter configuration, preview before deployment |
| Adapters | `kit/adapters` | deployment, production builds, hosting setup, choosing deployment platform, configuring adapters |
| Zero-config deployments | `kit/adapter-auto` | deployment, production builds, hosting setup, choosing deployment platform, ci/cd configuration |
| Node servers | `kit/adapter-node` | deployment, production builds, node.js hosting, custom server setup, environment configuration, reverse proxy setup, docker deployment, systemd services |
| Static site generation | `kit/adapter-static` | static site generation, ssg, prerendering, deployment, github pages, spa mode, blogs, documentation sites, marketing sites |
| Single-page apps | `kit/single-page-apps` | spa mode, single-page apps, client-only rendering, static hosting, mobile app wrappers, no server-side logic, adapter-static setup, fallback pages |
| Cloudflare | `kit/adapter-cloudflare` | deployment, cloudflare workers, cloudflare pages, hosting setup, production builds, serverless deployment, edge computing |
| Cloudflare Workers | `kit/adapter-cloudflare-workers` | deploying to cloudflare workers, cloudflare workers sites deployment, legacy cloudflare adapter, wrangler configuration, cloudflare platform bindings |
| Netlify | `kit/adapter-netlify` | deployment, netlify hosting, production builds, serverless functions, edge functions, static site hosting |
| Vercel | `kit/adapter-vercel` | deployment, vercel hosting, production builds, serverless functions, edge functions, isr, image optimization, environment variables |
| Writing adapters | `kit/writing-adapters` | custom deployment, building adapters, unsupported platforms, adapter development, custom hosting environments |
| Advanced routing | `kit/advanced-routing` | advanced routing, dynamic routes, file viewers, nested paths, custom 404 pages, url validation, route parameters, multi-level navigation |
| Hooks | `kit/hooks` | authentication, logging, error tracking, request interception, api proxying, custom routing, internationalization, database initialization, middleware logic, session management |
| Errors | `kit/errors` | error handling, custom error pages, 404 pages, api error responses, production error logging, error tracking, type-safe errors |
| Link options | `kit/link-options` | routing, navigation, multi-page apps, performance optimization, link preloading, forms with get method, search functionality, focus management, scroll behavior |
| Service workers | `kit/service-workers` | offline support, pwa, caching strategies, performance optimization, precaching assets, network resilience, progressive web apps |
| Server-only modules | `kit/server-only-modules` | api keys, environment variables, sensitive data protection, backend security, preventing data leaks, server-side code isolation |
| Snapshots | `kit/snapshots` | forms, user input, preserving form data, multi-step forms, navigation state, preventing data loss, textarea content, input fields, comment systems, surveys |
| Shallow routing | `kit/shallow-routing` | modals, dialogs, image galleries, overlays, history-driven ui, mobile-friendly navigation, photo viewers, lightboxes, drawer menus |
| Observability | `kit/observability` | performance monitoring, debugging, observability, tracing requests, production diagnostics, analyzing slow requests, finding bottlenecks, monitoring server-side operations |
| Packaging | `kit/packaging` | building component libraries, publishing npm packages, creating reusable svelte components, library development, package distribution |
| Auth | `kit/auth` | authentication, login systems, user management, session handling, jwt tokens, protected routes, user credentials, authorization checks |
| Performance | `kit/performance` | performance optimization, slow loading pages, production deployment, debugging performance issues, reducing bundle size, improving load times |
| Icons | `kit/icons` | icons, ui components, styling, css frameworks, tailwind, unocss, performance optimization, dependency management |
| Images | `kit/images` | image optimization, responsive images, performance, hero images, product photos, galleries, cms integration, cdn setup, asset management |
| Accessibility | `kit/accessibility` | always, any sveltekit project, screen reader support, keyboard navigation, multi-page apps, client-side routing, internationalization, multilingual sites |
| SEO | `kit/seo` | seo optimization, search engine ranking, content sites, blogs, marketing sites, public-facing apps, sitemaps, amp pages, meta tags, performance optimization |
| Frequently asked questions | `kit/faq` | troubleshooting package imports, library compatibility issues, client-side code execution, external api integration, middleware setup, database configuration, view transitions, yarn configuration |
| Integrations | `kit/integrations` | project setup, css preprocessors, postcss, scss, sass, less, stylus, typescript setup, adding integrations, tailwind, testing, auth, linting, formatting |
| Breakpoint Debugging | `kit/debugging` | debugging, breakpoints, development workflow, troubleshooting issues, vscode setup, ide configuration, inspecting code execution |
| Migrating to SvelteKit v2 | `kit/migrating-to-sveltekit-2` | migration, upgrading from sveltekit 1 to 2, breaking changes, version updates |
| Migrating from Sapper | `kit/migrating` | migrating from sapper, upgrading legacy projects, sapper to sveltekit conversion, project modernization |
| Additional resources | `kit/additional-resources` | troubleshooting, getting help, finding examples, learning sveltekit, project templates, common issues, community support |
| Glossary | `kit/glossary` | rendering strategies, performance optimization, deployment configuration, seo requirements, static sites, spas, server-side rendering, prerendering, edge deployment, pwa development |

## SvelteKit Modules

| Title | Path |
|-------|------|
| @sveltejs/kit | `kit/@sveltejs-kit` |
| @sveltejs/kit/hooks | `kit/@sveltejs-kit-hooks` |
| @sveltejs/kit/node/polyfills | `kit/@sveltejs-kit-node-polyfills` |
| @sveltejs/kit/node | `kit/@sveltejs-kit-node` |
| @sveltejs/kit/vite | `kit/@sveltejs-kit-vite` |
| $app/environment | `kit/$app-environment` |
| $app/forms | `kit/$app-forms` |
| $app/navigation | `kit/$app-navigation` |
| $app/paths | `kit/$app-paths` |
| $app/server | `kit/$app-server` |
| $app/state | `kit/$app-state` |
| $app/stores | `kit/$app-stores` |
| $app/types | `kit/$app-types` |
| $env/dynamic/private | `kit/$env-dynamic-private` |
| $env/dynamic/public | `kit/$env-dynamic-public` |
| $env/static/private | `kit/$env-static-private` |
| $env/static/public | `kit/$env-static-public` |
| $lib | `kit/$lib` |
| $service-worker | `kit/$service-worker` |
| Configuration | `kit/configuration` |
| Command Line Interface | `kit/cli` |
| Types | `kit/types` |

## Svelte Core

| Title | Path | Use Cases |
|-------|------|-----------|
| Overview | `svelte/overview` | always, any svelte project, getting started, learning svelte, introduction, project setup, understanding framework basics |
| Getting started | `svelte/getting-started` | project setup, starting new svelte project, initial installation, choosing between sveltekit and vite, editor configuration |
| .svelte files | `svelte/svelte-files` | always, any svelte project, component creation, project setup, learning svelte basics |
| .svelte.js and .svelte.ts files | `svelte/svelte-js-files` | shared reactive state, reusable reactive logic, state management across components, global stores, custom reactive utilities |
| What are runes? | `svelte/what-are-runes` | always, any svelte 5 project, understanding core syntax, learning svelte 5, migration from svelte 4 |
| $state | `svelte/$state` | always, any svelte project, core reactivity, state management, counters, forms, todo apps, interactive ui, data updates, class-based components |
| $derived | `svelte/$derived` | always, any svelte project, computed values, reactive calculations, derived data, transforming state, dependent values |
| $effect | `svelte/$effect` | canvas drawing, third-party library integration, dom manipulation, side effects, intervals, timers, network requests, analytics tracking |
| $props | `svelte/$props` | always, any svelte project, passing data to components, component communication, reusable components, component props |
| $bindable | `svelte/$bindable` | forms, user input, two-way data binding, custom input components, parent-child communication, reusable form fields |
| $inspect | `svelte/$inspect` | debugging, development, tracking state changes, reactive state monitoring, troubleshooting reactivity issues |
| $host | `svelte/$host` | custom elements, web components, dispatching custom events, component library, framework-agnostic components |
| Basic markup | `svelte/basic-markup` | always, any svelte project, basic markup, html templating, component structure, attributes, events, props, text rendering |
| {#if ...} | `svelte/if` | always, conditional rendering, showing/hiding content, dynamic ui, user permissions, loading states, error handling, form validation |
| {#each ...} | `svelte/each` | always, lists, arrays, iteration, product listings, todos, tables, grids, dynamic content, shopping carts, user lists, comments, feeds |
| {#key ...} | `svelte/key` | animations, transitions, component reinitialization, forcing component remount, value-based ui updates, resetting component state |
| {#await ...} | `svelte/await` | async data fetching, api calls, loading states, promises, error handling, lazy loading components, dynamic imports |
| {#snippet ...} | `svelte/snippet` | reusable markup, component composition, passing content to components, table rows, list items, conditional rendering, reducing duplication |
| {@render ...} | `svelte/@render` | reusable ui patterns, component composition, conditional rendering, fallback content, layout components, slot alternatives, template reuse |
| {@html ...} | `svelte/@html` | rendering html strings, cms content, rich text editors, markdown to html, blog posts, wysiwyg output, sanitized html injection, dynamic html content |
| {@attach ...} | `svelte/@attach` | tooltips, popovers, dom manipulation, third-party libraries, canvas drawing, element lifecycle, interactive ui, custom directives, wrapper components |
| {@const ...} | `svelte/@const` | computed values in loops, derived calculations in blocks, local variables in each iterations, complex list rendering |
| {@debug ...} | `svelte/@debug` | debugging, development, troubleshooting, tracking state changes, monitoring variables, reactive data inspection |
| bind: | `svelte/bind` | forms, user input, two-way data binding, interactive ui, media players, file uploads, checkboxes, radio buttons, select dropdowns, contenteditable, dimension tracking |
| use: | `svelte/use` | custom directives, dom manipulation, third-party library integration, tooltips, click outside, gestures, focus management, element lifecycle hooks |
| transition: | `svelte/transition` | animations, interactive ui, modals, dropdowns, notifications, conditional content, show/hide elements, smooth state changes |
| in: and out: | `svelte/in-and-out` | animation, transitions, interactive ui, conditional rendering, independent enter/exit effects, modals, tooltips, notifications |
| animate: | `svelte/animate` | sortable lists, drag and drop, reorderable items, todo lists, kanban boards, playlist editors, priority queues, animated list reordering |
| style: | `svelte/style` | dynamic styling, conditional styles, theming, dark mode, responsive design, interactive ui, component styling |
| class | `svelte/class` | always, conditional styling, dynamic classes, tailwind css, component styling, reusable components, responsive design |
| await | `svelte/await-expressions` | async data fetching, loading states, server-side rendering, awaiting promises in components, async validation, concurrent data loading |
| Scoped styles | `svelte/scoped-styles` | always, styling components, scoped css, component-specific styles, preventing style conflicts, animations, keyframes |
| Global styles | `svelte/global-styles` | global styles, third-party libraries, css resets, animations, styling body/html, overriding component styles, shared keyframes, base styles |
| Custom properties | `svelte/custom-properties` | theming, custom styling, reusable components, design systems, dynamic colors, component libraries, ui customization |
| Nested `<style>` elements | `svelte/nested-style-elements` | component styling, scoped styles, dynamic styles, conditional styling, nested style tags, custom styling logic |
| `<svelte:boundary>` | `svelte/svelte-boundary` | error handling, async data loading, loading states, error recovery, flaky components, error reporting, resilient ui |
| `<svelte:window>` | `svelte/svelte-window` | keyboard shortcuts, scroll tracking, window resize handling, responsive layouts, online/offline detection, viewport dimensions, global event listeners |
| `<svelte:document>` | `svelte/svelte-document` | document events, visibility tracking, fullscreen detection, pointer lock, focus management, document-level interactions |
| `<svelte:body>` | `svelte/svelte-body` | mouse tracking, hover effects, cursor interactions, global body events, drag and drop, custom cursors, interactive backgrounds, body-level actions |
| `<svelte:head>` | `svelte/svelte-head` | seo optimization, page titles, meta tags, social media sharing, dynamic head content, multi-page apps, blog posts, product pages |
| `<svelte:element>` | `svelte/svelte-element` | dynamic content, cms integration, user-generated content, configurable ui, runtime element selection, flexible components |
| `<svelte:options>` | `svelte/svelte-options` | migration, custom elements, web components, legacy mode compatibility, runes mode setup, svg components, mathml components, css injection control |
| Stores | `svelte/stores` | shared state, cross-component data, reactive values, async data streams, manual control over updates, rxjs integration, extracting logic |
| Context | `svelte/context` | shared state, avoiding prop drilling, component communication, theme providers, user context, authentication state, configuration sharing, deeply nested components |
| Lifecycle hooks | `svelte/lifecycle-hooks` | component initialization, cleanup tasks, timers, subscriptions, dom measurements, chat windows, autoscroll features, migration from svelte 4 |
| Imperative component API | `svelte/imperative-component-api` | project setup, client-side rendering, server-side rendering, ssr, hydration, testing, programmatic component creation, tooltips, dynamic mounting |
| Hydratable data | `svelte/hydratable` | use title and path to estimate use case |
| Best practices | `svelte/best-practices` | use title and path to estimate use case |
| Testing | `svelte/testing` | testing, quality assurance, unit tests, integration tests, component tests, e2e tests, vitest setup, playwright setup, test automation |
| TypeScript | `svelte/typescript` | typescript setup, type safety, component props typing, generic components, wrapper components, dom type augmentation, project configuration |
| Custom elements | `svelte/custom-elements` | web components, custom elements, component library, design system, framework-agnostic components, embedding svelte in non-svelte apps, shadow dom |
| Svelte 4 migration guide | `svelte/v4-migration-guide` | upgrading svelte 3 to 4, version migration, updating dependencies, breaking changes, legacy project maintenance |
| Svelte 5 migration guide | `svelte/v5-migration-guide` | migrating from svelte 4 to 5, upgrading projects, learning svelte 5 syntax changes, runes migration, event handler updates |
| Frequently asked questions | `svelte/faq` | getting started, learning svelte, beginner setup, project initialization, vs code setup, formatting, testing, routing, mobile apps, troubleshooting, community support |

## Svelte Modules

| Title | Path |
|-------|------|
| svelte | `svelte/svelte` |
| svelte/action | `svelte/svelte-action` |
| svelte/animate | `svelte/svelte-animate` |
| svelte/attachments | `svelte/svelte-attachments` |
| svelte/compiler | `svelte/svelte-compiler` |
| svelte/easing | `svelte/svelte-easing` |
| svelte/events | `svelte/svelte-events` |
| svelte/legacy | `svelte/svelte-legacy` |
| svelte/motion | `svelte/svelte-motion` |
| svelte/reactivity/window | `svelte/svelte-reactivity-window` |
| svelte/reactivity | `svelte/svelte-reactivity` |
| svelte/server | `svelte/svelte-server` |
| svelte/store | `svelte/svelte-store` |
| svelte/transition | `svelte/svelte-transition` |

## Errors and Warnings

| Title | Path |
|-------|------|
| Compiler errors | `svelte/compiler-errors` |
| Compiler warnings | `svelte/compiler-warnings` |
| Runtime errors | `svelte/runtime-errors` |
| Runtime warnings | `svelte/runtime-warnings` |

## Legacy Svelte (3/4)

| Title | Path |
|-------|------|
| Overview | `svelte/legacy-overview` |
| Reactive let/var declarations | `svelte/legacy-let` |
| Reactive $: statements | `svelte/legacy-reactive-assignments` |
| export let | `svelte/legacy-export-let` |
| $$props and $$restProps | `svelte/legacy-$$props-and-$$restProps` |
| on: | `svelte/legacy-on` |
| `<slot>` | `svelte/legacy-slots` |
| $$slots | `svelte/legacy-$$slots` |
| `<svelte:fragment>` | `svelte/legacy-svelte-fragment` |
| `<svelte:component>` | `svelte/legacy-svelte-component` |
| `<svelte:self>` | `svelte/legacy-svelte-self` |
| Imperative component API | `svelte/legacy-component-api` |
