<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Agent Guidelines for openai-cf-workers-ai

This document outlines the conventions and commands for agentic coding in this repository. Agents operating within this codebase **must** adhere to these guidelines to ensure consistency, maintainability, and successful task completion.

## Build, Lint, and Test Commands

- **Install Dependencies:** `npm install`
- **Run All Tests:** `npm test` or `vitest run`
- **Run Unit Tests:** `npm run test:unit`
- **Run Integration Tests:** `npm run test:integration`
- **Run a Single Test File:** `vitest run <path/to/test_file.test.js>`
- **Lint Code:** `npm run lint`
- **Fix Linting Issues:** `npm run lint:fix`
- **Format Code:** `npm run format`
- **Validate (Lint & Unit Tests):** `npm run validate`

## Code Style Guidelines

- **Indentation:** Tabs (tab width 2 spaces).
- **Quotes:** Single quotes.
- **Semicolons:** Always use semicolons.
- **Trailing Commas:** Use trailing commas for multi-line object and array literals (ES5 style).
- **Line Length:** Max 120 characters.
- **Variable Declaration:** Prefer `const` and `let` over `var`.
- **Unused Variables:** Avoid unused variables; variables starting with `_` are ignored.
- **Error Handling:** Follow existing patterns in `utils/errors.js`.
- **Naming Conventions:** Adhere to existing camelCase for variables and functions.
- **Imports:** Use consistent import styles as seen in `routes/` and `utils/` files.
- **Function Comments:** Add JSDoc comments for exported functions with parameters and return types.
- **Type Checking:** Use JSDoc for type annotations where needed.

## Model Management

- **Model Context Windows:** Refer to `utils/models.js` for context window information.
- **Model Categories:** Models are organized by capabilities in `utils/models.js`.
- **Model Mappings:** OpenAI-compatible model names are mapped in `utils/models.js`.
- **Updated Models:** Updated models related to Cloudflare can be retrieved from models.dev.

## Testing Guidelines

- **Unit Tests:** Located in `tests/unit/` with corresponding `.test.js` files.
- **Integration Tests:** Located in `tests/integration/`.
- **Test Fixtures:** Use files in `tests/fixtures/` for test data.
- **Test Scripts:** Use scripts in `scripts/` for running specific test scenarios.

## API Routes

- **Route Handlers:** Each route has its own file in `routes/`.
- **Utilities:** Shared functionality is in `utils/`.
- **Validation:** Input validation is handled in `utils/validation.js`.

## Cursor/Copilot Rules

No specific Cursor or Copilot instruction files were found in this repository.
