# Published cleanup plan

The JSON plan is the contract between preview, confirmation, execution, and verification.

```json
{
  "version": 1,
  "mode": "published-cleanup",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "keepRules": ["Keep the note linked by the user"],
  "protectedNoteIds": ["note_demo_keep_001"],
  "protectedBoardIds": [],
  "plannedActions": [
    {
      "type": "delete-note",
      "targetId": "note_demo_delete_001",
      "title": "Example old note",
      "reason": "Not included by the keep rule"
    }
  ],
  "unresolvedItems": [],
  "confirmation": {
    "confirmed": false,
    "phrase": null,
    "planHash": null
  }
}
```

Any change to keep rules, protected IDs, or actions invalidates the old confirmation hash. Create a new preview and confirmation.
