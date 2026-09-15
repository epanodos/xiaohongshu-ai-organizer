# Case study: from one-off browser cleanup to a reusable workflow

## Background

The source experience contained two different requests on one Xiaohongshu account:

1. keep one specified published note and remove the other published notes;
2. keep only the contents associated with two selected favorite albums and remove the rest.

The goal of this repository is not to publish private account data or replay one account's exact actions. It extracts the parts that can be made repeatable and testable.

## What worked

- A separate persistent Agent browser solved the conflict between the user's everyday browser and the browser used for automation.
- Manual login inside that browser preserved normal platform authentication without passing credentials to the Agent.
- Stable item IDs were more reliable than titles, counts, or visual position.
- Read-only inventory before writes made it possible to show an exact deletion preview.
- Rechecking after the operation was necessary; a successful click did not prove the account reached the intended state.

## What caused delay or failure

- Browser-control capability and an ordinary local browser were initially treated as if they were the same thing. A browser window can exist while the automation channel is unavailable, and an automation session can exist without being visible in the user's usual browser.
- Login state belonged to a particular browser profile. Opening another browser or a temporary profile appeared as “login expired” even when the user's normal browser remained logged in.
- Xiaohongshu can present guest pages, verification, request errors, or rate limits. Repeated retries make diagnosis slower and can increase account risk.
- Destructive requests expressed only in natural language left ambiguity about whether “delete folders” also meant “remove the notes from global favorites.” These are separate operations.

## Published-note model

Published cleanup is a direct set operation:

```text
delete targets = all published note IDs - protected note IDs
```

Before deletion, every keep rule must resolve to a protected ID. After deletion, verification compares the new published-note ID set with both the protected set and the confirmed target set.

## Favorites model

Favorites require a different model because one note can belong to multiple albums:

```text
protected notes = union(notes in every kept album)
remove-favorite targets = global favorites - protected notes
delete-album targets = all albums - kept albums
```

Deleting an album is not treated as proof that its notes were removed from global favorites. Therefore note-level actions happen first and album deletion happens last.

## Design outcome

The reusable solution is one repository containing two Skills. They share principles but retain separate triggers and execution order. A local JSON plan is the contract between inventory, preview, confirmation, execution, checkpoints, and verification. The confirmation stores a hash of the exact plan, so later edits invalidate it.

## Limits of the evidence

This repository's plan guard and repository checks are automated and reproducible. Browser behavior remains dependent on the current Xiaohongshu UI and account state. A past successful cleanup is evidence that the workflow can work, not a guarantee that every future run or account will behave identically.
