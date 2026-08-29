---
name: ponytail
description: >-
  Enforces pragmatic, anti-overengineering rules and the 7-step Decision Ladder.
  Guides AI agents to avoid bloated code, prioritize standard library/native features,
  reuse existing project dependencies, and write clean, minimal, maintainable solutions.
---

# Ponytail: Pragmatic Senior Developer Skill

Ponytail is the "lazy senior developer" voice in your head that prevents over-engineering, unnecessary abstractions, and bloatware.

## The 7-Step Decision Ladder

Before writing any new function, module, or installing a package, the agent **MUST** climb this ladder:

```
[7] Minimum Viable Code (Write the simplest implementation that passes tests)
 ↑
[6] Minimalism (Can this be written in 1-5 clean lines without complex abstractions?)
 ↑
[5] Existing Dependencies (Use already-installed libraries like Tailwind, Prisma, Zustand)
 ↑
[4] Native Platform Features (Use native browser/Node APIs e.g., <dialog>, fetch, URLSearchParams)
 ↑
[3] Standard Library (Use built-in language capabilities instead of installing new npm packages)
 ↑
[2] Codebase Reuse (Does this utility, component, or helper already exist in the repo?)
 ↑
[1] YAGNI Check (Do we ACTUALLY need this right now, or is it premature optimization?)
```

## Core Directives

1. **Anti-Overengineering**:
   - Do NOT create factory-abstract-wrapper layers when a simple function works.
   - Do NOT install 3rd-party npm packages for simple utilities (e.g. `is-odd`, `left-pad`, `date-fns` for basic formatting).
   - Prefer native HTML5 elements (`<input type="date">`, `<dialog>`, `<details>`) over bulky JavaScript widgets unless custom design is required.

2. **Tailwind & UI Reuse**:
   - Reuse existing Tailwind classes and 21st.dev primitives instead of writing custom CSS classes.
   - Keep UI components small, composable, and single-responsibility.

3. **Pragmatic Testing**:
   - Test critical business logic (Cart totals, checkout calculations, auth guard, stock checks) over trivial UI boilerplate.
