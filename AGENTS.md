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

## Cursor/Copilot Rules

No specific Cursor or Copilot instruction files were found in this repository.
