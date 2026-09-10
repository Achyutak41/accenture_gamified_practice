# Accenture Bubble Agent

This is a standalone implementation of the requested Bubble Agent.

## What it does

- 15-minute practice session
- Minimum target of 50 questions
- No maximum question count before the timer ends
- Clickable answer bubbles
- Random arithmetic expressions
- Tasks:
  - smallest value
  - largest value
  - closest value to a target
- Immediate correct/wrong feedback
- Score and progress tracking
- Responsive UI
- No paid API or backend required for the question engine

## Run locally

Open `index.html` directly in a browser, or use a local server:

```bash
python -m http.server 5500
```

Then open:

http://localhost:5500

## Integration into an existing app

1. Copy the question-generation functions from `bubble-agent.js`.
2. Add the Bubble Agent route/page to your router.
3. Replace the old gamified concept registry with the `GAMIFIED_CONCEPTS`
   entry shown in `concepts.js`.
4. Remove the old Pattern Recognition, Sequential, Reasoning, Memory and
   Agent registrations/routes.
5. Reuse your existing authentication, score persistence and dashboard if
   those already exist.
6. Keep the Bubble Agent question engine independent from the UI so it can
   later be connected to an API/LLM if desired.

## Important design point

The correct answer is calculated from the underlying numerical value.
The displayed bubble contains the expression, matching the screenshot style.

For example:

Bubble A: 5.5 × 1.8 + 2
Bubble B: √324 ÷ 3 + 4
Bubble C: 19.2 − 8.65

If the task is "Select the smallest value", the engine evaluates all
three expressions and marks the bubble containing the smallest result.

## GitHub Pages deployment

If this folder is pushed as the root of a repository:

1. Push all files to GitHub.
2. Open repository Settings.
3. Open Pages.
4. Select "Deploy from a branch".
5. Select your main branch and `/ (root)`.
6. Save.
7. GitHub will publish the site.

For an existing project, do not replace the whole repository with this
starter unless it is intentionally a standalone site. Merge the Bubble
Agent module into the existing application instead.
