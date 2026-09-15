---
name: xhs-favorites-organizer
description: Safely inventory and organize a user's own Xiaohongshu favorites and favorite albums through a dedicated logged-in browser. Use when the user wants to keep only named albums, remove favorites outside selected albums, reduce duplicate or obsolete albums, or audit a messy favorites library. Requires union-based protection, a preview, explicit confirmation, note removal before album deletion, checkpoints, and final set verification.
---

# Xiaohongshu Favorites Organizer

Organize favorites while preserving every note that belongs to at least one album the user chose to keep.

## Non-negotiable rules

- Use a dedicated persistent Agent browser profile. Do not attach to the user's everyday browser unless explicitly requested.
- Ask the user to log in manually when needed. Never collect, print, export, or commit cookies, tokens, passwords, QR-login artifacts, or browser storage.
- Start read-only and inventory all albums before changing anything.
- Resolve keep-album names to stable album IDs. If a name is duplicated or ambiguous, stop for clarification.
- Inventory every note in every keep album. The union of those note IDs is `protectedNoteIds`; membership in any keep album protects the note.
- Inventory the global favorites list separately. Do not assume deleting an album removes its notes from global favorites.
- Generate a machine-checkable plan, show the exact preview, and obtain explicit confirmation for that exact plan.
- Execute `remove-favorite` actions before `delete-album` actions. Delete unwanted albums last.
- Before each write, re-check target ID against the confirmed plan and protected sets.
- Pause 2-5 seconds between writes, checkpoint every 10 successful writes, and resume by stable IDs.
- Stop on login redirect, guest state, CAPTCHA, HTTP 406/429/461, Xiaohongshu error 300011, a protected target, or two consecutive state mismatches.
- Verify ID sets after execution; visible counts alone are not proof.

## Workflow

1. Read [browser-workflow.md](references/browser-workflow.md).
2. Inventory all albums with stable IDs and visible names.
3. Resolve the requested keep albums to `protectedBoardIds`; report unresolved or duplicate names.
4. Inventory all notes in all protected albums and build the union `protectedNoteIds`.
5. Inventory the global favorites list and identify notes outside that union.
6. Build a plan following [action-plan.md](references/action-plan.md): all `remove-favorite` actions first, then `delete-album` actions.
7. Validate it before showing the preview:

   `node scripts/plan_guard.mjs validate <plan.json>`

8. Show protected albums, protected-note count, notes to un-favorite, albums to delete, unresolved items, and ordering. Ask for confirmation of this exact plan.
9. Record confirmation only after the user confirms:

   `node scripts/plan_guard.mjs confirm <plan.json> --phrase "CONFIRM XHS DESTRUCTIVE ACTIONS"`

10. Before execution and after any resume, require a valid confirmation hash:

   `node scripts/plan_guard.mjs validate <plan.json> --require-confirmed`

11. Execute and checkpoint. Remove nonprotected favorites first; delete nonprotected albums only after those actions finish.
12. Re-inventory all protected albums and global favorites. Success requires every protected note and album to remain, every successful removal target to be absent globally, and every deleted album ID to be absent.

## Browser interaction policy

Use ordinary visible UI interactions supported by the installed browser tool. Do not reverse-engineer private APIs, forge signatures, defeat rate limits, or add stealth/evasion code. DOM selectors and page text may change; rediscover the current UI rather than replaying stale coordinates.

## Output contract

Always distinguish inventory, preview, confirmed execution, partial completion, and verified completion. Include plan path, protected album and note counts, planned and successful action counts, failed/skipped IDs, stop reason, and set-comparison result. Never include credentials or private browser data.
