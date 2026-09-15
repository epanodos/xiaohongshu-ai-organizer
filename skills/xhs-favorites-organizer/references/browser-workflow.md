# Browser workflow

## Session

Use a separate persistent Agent Chrome profile, for example:

```powershell
$env:AGENT_BROWSER_PROFILE = "$env:USERPROFILE\.agent-browser\profiles\xhs-organizer"
agent-browser --session xhs-organizer --profile $env:AGENT_BROWSER_PROFILE open https://www.xiaohongshu.com/user/profile
```

The user performs login. Reuse only this dedicated profile in later runs. Never start Chrome with the user's ordinary `Default` profile unless they explicitly authorize it.

## Inventory order

1. Inventory every album and its stable ID.
2. Resolve all keep albums.
3. Inventory every note in every keep album and take the union of note IDs.
4. Inventory global favorites.
5. Only then calculate actions.

Paginate or scroll until a full second pass produces no new IDs. Store runtime data under `.xhs-organizer/`, which is ignored by Git.

## Writes and stop signals

Remove nonprotected favorites first. Delete nonprotected albums last. Immediately before each write, verify the current target ID is planned and not protected. Stop on login/guest state, CAPTCHA, HTTP 406/429/461, error 300011, any protected target, or two consecutive mismatches. Checkpoint the last completed ID and leave the browser open for intervention.
