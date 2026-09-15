# Browser workflow

## Session

Use a separate persistent Agent Chrome profile, for example:

```powershell
$env:AGENT_BROWSER_PROFILE = "$env:USERPROFILE\.agent-browser\profiles\xhs-organizer"
agent-browser --session xhs-organizer --profile $env:AGENT_BROWSER_PROFILE open https://creator.xiaohongshu.com/
```

The user performs login. Reuse only this dedicated profile in later runs. Never start Chrome with the user's ordinary `Default` profile unless they explicitly authorize it.

## Read-only inventory

Prefer accessibility snapshots and stable links or IDs over screen coordinates. Paginate or scroll until a full second pass produces no new IDs. Store only the minimum metadata needed to identify each item. Keep runtime files under a Git-ignored directory such as `.xhs-organizer/`.

## Writes

Re-read the visible target identity immediately before each write. After the click and confirmation dialog, verify the target disappeared or its state changed as expected. Record success or failure by ID before moving on.

## Stop signals

Stop without retry loops when any of these appears:

- login or guest page;
- CAPTCHA or unusual-verification prompt;
- HTTP 406, 429, or 461;
- Xiaohongshu error 300011;
- current target is protected or absent from the confirmed plan;
- two consecutive UI/result mismatches.

Keep the browser open for user intervention and report the last completed ID and checkpoint path.
