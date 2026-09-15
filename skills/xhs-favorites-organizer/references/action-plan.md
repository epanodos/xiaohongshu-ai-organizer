# Favorites organizer plan

The JSON plan is the contract between preview, confirmation, execution, and verification.

```json
{
  "version": 1,
  "mode": "favorites-organizer",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "keepRules": ["Keep albums AI and Design"],
  "protectedNoteIds": ["note_demo_ai_001", "note_demo_design_001"],
  "protectedBoardIds": ["board_demo_ai", "board_demo_design"],
  "plannedActions": [
    {"type": "remove-favorite", "targetId": "note_demo_remove_001", "reason": "Outside the protected union"},
    {"type": "delete-album", "targetId": "board_demo_old", "reason": "Album not kept"}
  ],
  "unresolvedItems": [],
  "confirmation": {"confirmed": false, "phrase": null, "planHash": null}
}
```

All `remove-favorite` actions must precede all `delete-album` actions. Any change to keep rules, protected IDs, or actions invalidates the old confirmation hash.
