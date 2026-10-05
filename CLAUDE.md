# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `bun dev` - Start the development server with Vite (http://localhost:5173)
- `bun build` - Build the production version to the `dist` directory
- `bun preview` - Preview the production build locally
- `bun test` - Run tests (currently outputs an error as no test is specified)

## Code Architecture & Structure

### Overview
Lazy Prompter is a React application built with Vite, Tailwind CSS, and React Refresh. The application generates optimized AI prompts by transforming user input through predefined prompt engineering frameworks.

### Key Directories
- `src/` - Main application source code
  - `components/` - Reusable React components
    - `Header/` - Application header
    - `Footer/` - Application footer
    - `Layout/` - Main layout wrapper
    - `PromptGenerator/` - Core component for prompt generation UI and logic
  - `assets/` - Static assets (e.g., React logo)
  - `App.jsx` - Root application component
  - `main.jsx` - Application entry point
  - `index.css` - Global CSS styles (including Tailwind directives)
- `config/` - Configuration files
  - `prompts/` - JavaScript files containing prompt templates (systemPrompt.js, advancePrompt.js)
- `public/` - Static assets served directly (e.g., index.html)

### Data Flow
1. User enters a prompt idea in the PromptGenerator component
2. The component selects between "Fast" and "Advanced" model modes
3. Based on the mode, it applies the appropriate prompt template from `config/prompts/`
4. The optimized prompt is displayed and can be copied to clipboard

### Build Process
- Vite is used for development and building
- Environment variables are loaded via `loadEnv` and made available to the client
- Prompt files are read at build time and injected as environment variables (`import.meta.env.PROMPTS`)
- The build output is optimized and placed in the `dist` directory

### Styling
- Tailwind CSS is configured via `tailwind.config.js` (inherited from dependencies)
- PostCSS configuration is handled through `@tailwindcss/postcss` and `@tailwindcss/vite`
- Global styles are defined in `src/index.css`

### Linting
- ESLint is configured with recommended JavaScript, React Hooks, and React Refresh rules
- Configuration is in `eslint.config.js`
- To lint manually, you would need to install eslint globally or via npx (not defined in scripts)

### Notes
- The application uses environment variables to store prompt templates, which are loaded from the `config/prompts/` directory during the build process
- No test framework is currently configured; `bun test` will exit with an error
- The project uses Bun as its package manager (see `bun.lock`)

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `antislop.md` (core) and then the skill for the task:
- UI / visual: `skills/antislop-ui/SKILL.md`
- Copy & text: `skills/antislop-copywriting/SKILL.md`
- People: `skills/antislop-human/SKILL.md`
- Mobile / responsive: `skills/antislop-layoutmobile/SKILL.md`
- Code comments: `skills/antislop-code/SKILL.md`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: download `antislop.md` again, or run `npx antislop-ai --update` if it was installed as skill folders.
<!-- antislop:end -->