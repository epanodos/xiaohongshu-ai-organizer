---
name: xhs-published-cleanup
description: Safely inventory, review, and selectively delete a user's own published Xiaohongshu notes through a dedicated logged-in browser. Use when the user asks to clean old posts, keep only specified posts, delete all other published notes, or audit their published-note library. Requires a preview, protected note IDs, explicit confirmation, checkpointed execution, and final verification; never use it to remove another person's content or bypass Xiaohongshu controls.
---

# Xiaohongshu Published Cleanup

Clean a user's own published Xiaohongshu notes without treating a vague sentence as immediate permission to delete.

## Non-negotiable rules

- Use a dedicated persistent Agent browser profile. Do not attach to the user's everyday browser unless they explicitly request it.
- Ask the user to log in manually when needed. Never collect, print, export, or commit cookies, tokens, passwords, QR-login artifacts, or browser storage.
- Treat note IDs parsed from URLs as canonical. Titles, thumbnails, dates, and counts are supporting evidence only.
- Start read-only. Inventory every reachable published note and resolve every keep rule before proposing deletion.
- If any requested keep item cannot be located unambiguously, stop before deletion.
- Generate a machine-checkable plan, show the human-readable preview, and obtain explicit confirmation for that exact plan.
- Before each destructive action, re-check that the target ID is in the confirmed plan and absent from `protectedNoteIds`.
- Pause 2-5 seconds between writes, checkpoint every 10 successful writes, and resume from IDs rather than page positions.
- Stop on login redirect, guest state, CAPTCHA, HTTP 406/429/461, Xiaohongshu error 300011, a protected target, or two consecutive state mismatches.
- Do not claim success from clicks alone. Re-inventory and compare ID sets.

## Workflow

1. Read [browser-workflow.md](references/browser-workflow.md).
2. Open the creator-center published-note list in the dedicated logged-in browser.
3. Inventory note ID, title, visible status, date, and source URL into a local working file excluded from Git.
4. Convert the user's keep rules into `protectedNoteIds`. Report unresolved or ambiguous rules.
5. Build a plan following [action-plan.md](references/action-plan.md) using only `delete-note` actions.
6. Validate it before showing the preview:

   `node scripts/plan_guard.mjs validate <plan.json>`

7. Show the exact protected notes, proposed deletions, unresolved items, and total count. Ask for confirmation of this exact plan.
8. Record confirmation only after the user confirms:

   `node scripts/plan_guard.mjs confirm <plan.json> --phrase "CONFIRM XHS DESTRUCTIVE ACTIONS"`

9. Before execution and after any resume, require a valid confirmation hash:

   `node scripts/plan_guard.mjs validate <plan.json> --require-confirmed`

10. Execute one planned ID at a time, checkpoint results, and stop immediately on a stop signal.
11. Re-inventory. Success requires all protected IDs present and all successfully deleted target IDs absent. Report partial completion honestly.

## Browser interaction policy

Use ordinary visible UI interactions supported by the installed browser tool. Do not reverse-engineer private APIs, forge signatures, defeat rate limits, or add stealth/evasion code. DOM selectors and page text may change; rediscover the current UI rather than blindly replaying stale coordinates.

## Output contract

Always distinguish:

- inventory completed;
- plan prepared but not confirmed;
- confirmed execution in progress;
- partially completed and checkpointed;
- verified complete.

Include the plan path, protected-note count, planned deletion count, successful count, failed/skipped IDs, stop reason, and verification result. Do not include credentials or private browser data.
