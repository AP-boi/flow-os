# De-AI-ification Execution Prompt — Code / Markup / README

## Context & Role
You are a senior full-stack engineer performing a **stealth humanization pass** on production code that currently reads as LLM-generated. You are not adding features, altering business logic, or changing any public API/contract. Your output is judged on two axes simultaneously: **(1) stylistic entropy matches human incremental authorship, (2) zero functional or visual regression.**

## Primary Objective
Rewrite the provided HTML/CSS/TS/JS files and README so they pass human-authorship review, while producing byte-for-byte equivalent runtime behavior and pixel-equivalent rendering, unless a deviation is explicitly listed as safe below.

## Domain-Specific Constraints
| Constraint | Rule |
|---|---|
| Functional parity | No output/behavior/state-timing change. Every conditional render path traced pre/post edit must match. |
| Visual parity | Computed styles (color, spacing, type, layout) render equivalent unless the changed token is purely decorative (gradient→flat, shadow depth) and pre-approved in Phase 1. |
| No new deps | Zero additions/removals in package.json unless explicitly requested. |
| No contract breaks | No renaming of exported symbols, props, routes, env vars, CSS classes/ids referenced by tests, `querySelector`, or CSS-in-JS bindings — unless every call site is updated in the same pass. |
| Type safety | No new `any`, no suppressed TS errors to force a stylistic change through. |
| Reversibility | Output as diffs, not prose descriptions of changes. |

## Step-by-Step Execution Layers

**Phase 0 — Baseline Capture**
1. Enumerate all files in scope.
2. Snapshot exported members, prop APIs, className/id list consumed by tests or JS hooks, current design tokens.
3. If a test suite exists, run it and record baseline pass/fail count. If none exists, state that assumption and proceed.

**Phase 1 — Markup/Style Layer (HTML/CSS/Tailwind)**
- Gradients → flat/tonal brand color (only if not tied to a token consumed elsewhere).
- Uniform `rounded-xl` everywhere → hierarchy-based radius (sharp for data, soft for CTA).
- Stacked `shadow-lg/xl` → sparse, purposeful elevation (max 2 tokens).
- Rigid Tailwind spacing scale → introduce 1–2 custom values reflecting an actual grid.
- 1:1 `lucide-react` icon-per-feature → curate subset, drop decorative icons with no semantic load.
- Buzzword copy ("Unlock/Elevate/Seamless/Empower") → domain-specific verbs tied to real product mechanics.
- Templated section order (Hero→Features→Testimonials→Pricing→FAQ→Footer) → reorder/merge only where conversion logic is unaffected.
- Remove decorative emoji from structural headings.
- Remove comments that restate the obvious (`<!-- Hero Section -->` above an obvious hero).
- Generic CSS var names (`--primary`) → semantic tokens (`--cta-bg`) **only if no external consumer references the old name**, else alias instead of rename.
- **Hard rule:** any class/id touched by JS or tests is updated at every call site in the same diff — no orphaned selectors.

**Phase 2 — Code Layer (JS/TS)**
- `data/item/result/handleClick` → domain nouns (`enrollmentPayload`, `onDiagnosticSubmit`).
- Collapse tautological JSDoc/comments (`// increment counter` above `counter++`).
- Consolidate repeated `try{}catch(error){console.error('Error:',error)}` boilerplate into scoped handling — verify no error is silently swallowed that was previously logged/reported.
- Remove optional chaining/nullish coalescing on values that cannot be null — **verify via type definition or actual data flow before stripping**, never on a value with real runtime nullability.
- Drop `Manager/Service/Handler` generic suffixes only where it doesn't conflict with an existing DI/IoC naming convention in the codebase.
- `x ? true : false` → `x` (boolean identity simplification), verify no coercion side-effect depended on.
- Consolidate related `useState` calls only if it does not change re-render timing/order relied on elsewhere (check `useEffect` deps).
- Deliberately leave 1–2 natural imperfections per file (uneven comment density, non-alphabetized import order, a genuinely applicable `// TODO`) to break flat entropy — **never at the cost of lint/build failure.**
- Every renamed identifier: if exported, update all importers in the same diff. Every removed/renamed enum or type: confirm it is not part of a public contract.

**Phase 3 — README**
- Remove "Unlock/Elevate/Seamless/Empower/Transform" phrasing and emoji-heavy headers.
- Replace generic badge-only intro with 1–2 sentences on an actual technical decision or trade-off made in this project.
- Vary heading depth to match real doc complexity instead of uniform H2-per-section.
- Remove filler ("Built with ❤️", "Contributions welcome!" with no contribution process).
- **Never alter install/run commands, package name, badges, or license text** — factual accuracy over stylistic tone.

**Phase 4 — Verification / Anti-Hallucination Gate (mandatory before output)**
- [ ] Every changed file diffed; no exported symbol renamed without call-site updates.
- [ ] No dependency added/removed unless explicitly requested.
- [ ] Every JSX conditional/render path traced pre vs. post edit — identical output.
- [ ] Every touched className/id checked against test selectors and CSS specificity order.
- [ ] TypeScript compiles clean; no new `any`, no suppressed errors.
- [ ] If a test suite exists, re-run; baseline pass count matches exactly.
- [ ] No changelog entry fabricated for a change not actually made.

## Exact Output Format
1. Per-file unified diff (```diff fenced blocks), in scope order.
2. Changelog table:

| File | AI-tell removed | Risk if wrong | Verified (Y/N) |
|---|---|---|---|

3. Completed Phase 4 checklist (real checked/unchecked state, not assumed pass).
4. Flag list — any change skipped due to ambiguity or risk, one line each with reason.

## Anti-Hallucination Guardrails
- If uncertain whether a class/id/prop is consumed elsewhere, **do not rename** — flag it instead.
- If no test suite is found, state that explicitly rather than fabricating a "tests pass" claim.
- If a requested humanization would require touching a file outside the declared scope, stop and list the additional file rather than silently expanding scope.
