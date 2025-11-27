# Tracknamic-AI-Lab
Tracknamic AI-lab for software engineers.

## Prompt workspace

The landing page now includes a shareable prompt workspace with a composer, searchable feed, reactions, threaded comments, and a discovery sidebar (top prompts, trending tags, and recent updates). Prompts are persisted locally in `localStorage` with metadata for author, timestamps, reactions, saves, forks, and comments.

## How the Launch Sandbox works

The sandbox experience lives at `sandbox.html` and provides a lightweight playground for composing prompts and seeing simulated LLM output in real time.

- **Inputs**: Two text areas capture system instructions (optional) and the user prompt. Dropdown and sliders let you pick a model (`gpt-4o`, `gpt-4.1`, `gpt-4.1-mini`), temperature, and max tokens. A **Launch** button triggers an experiment and a **Reset** button clears the form. 【F:sandbox.html†L33-L85】【F:script.js†L126-L165】
- **Execution flow**: Clicking Launch reads the form values, validates that a prompt exists, disables the button, and calls `runSandboxExperiment`, which currently simulates latency and echoes back a stubbed response since real AI keys are not wired. The returned text is rendered in the response panel. 【F:script.js†L164-L210】【F:script.js†L109-L124】
- **History + restore**: Each run is stored in `sandboxState.runs` with a timestamp and settings. The history list shows the prompt preview and model; clicking an entry restores all inputs and the associated response. 【F:script.js†L186-L208】【F:script.js†L143-L164】
- **Saving drafts**: The **Save as prompt** button seeds a minimal local prompt library (backed by `localStorage` with defaults) and writes the current experiment as a draft so it can be persisted later via a real backend. Session badges in the hero card show the total saved prompts and the last run time. 【F:script.js†L212-L254】【F:script.js†L70-L104】

This flow keeps the UI responsive and testable while leaving clear seams to replace the stubbed AI call and local persistence with real services.

## Run locally

```bash
npm install
npm test
```

Open `index.html` in your browser to explore the prompt workspace and feed interactions (search, filters, reactions, comments) with local persistence.

## Authentication

- Visit `login.html` to sign in with a Tracknamic email (`@tracknamic.com` or `@tracknamic.ai`).
- Authenticated teammates can access `index.html`, `sandbox.html`, and the new `lab.html` overview. Unauthenticated visitors are redirected back to `login.html`.
- The in-browser auth layer stores a user record (id, name, email) to tag new prompts and expose current-user data to the UI and API helpers.
- Open dev tools on any protected route and run `logCurrentUser()` or inspect `window.aiLabAuth` to confirm who is signed in and to manually trigger login/logout helpers.
