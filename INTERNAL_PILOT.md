# Internal Pilot (Step 14)

A lightweight playbook for letting a handful of friendly developers try the lab, give feedback, and trigger a small round of improvements before wider rollout.

## Who to invite
- 2–4 product-minded engineers who can complete a real task (e.g., drafting a prompt for an active project or tuning an experiment for a teammate).
- Keep the pilot short (20–30 minutes). Pair if they want, but let them drive.

## Feedback script (ask verbatim)
1) **Was it easy to find something useful?** (Feed, discovery panels, or sandbox history.)
2) **Did Sandbox feel natural?** (Controls, defaults, restoring history.)
3) **What was the most annoying thing?** (Any friction they hit.)

Capture quotes in a shared note or in-line on this file under *Pilot notes*.

## Pilot notes
- Person / task / date:
  - Example: `Priya — rewrote data-quality prompt for ingestion playbook — 2024-07-02`
  - Example: `Sam — tuned QA prompt with sandbox history restore — 2024-07-03`

## Improvements shipped from pilot feedback (kept to 3–5)
- **Faster discovery:** A **Clear filters** control resets search/sort/tag filters so people can immediately find another useful prompt. (Workspace feed)
- **Sandbox clarity:** History chips now show model, temperature, and max tokens; the active run badge mirrors those settings so you can share exact repro steps. (Sandbox)
- **Shareable results:** A **Copy response** action lives next to the response panel to quickly paste output back into Slack or tickets. (Sandbox)

## Next rollout steps
- Run the script with at least two teammates and log their tasks in *Pilot notes*.
- Fix any new blockers in a single follow-up pass, then open the lab to the broader group.
