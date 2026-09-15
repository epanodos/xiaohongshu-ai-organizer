# Security policy

## Supported version

Only the latest commit on the default branch is supported during the preview stage.

## Safety guarantees provided by this repository

- destructive targets are checked against protected ID sets;
- confirmation is bound to the exact plan with SHA-256;
- unresolved items block confirmed execution;
- favorites actions enforce note removal before album deletion;
- examples use synthetic IDs;
- repository checks look for common credential assignments and sensitive share URLs.

These controls reduce risk but do not guarantee compatibility with Xiaohongshu's current UI.

## Operator responsibilities

- Run only on an account you own or are explicitly authorized to manage.
- Review every proposed destructive action.
- Keep a dedicated browser profile and do not publish its data.
- Stop when the platform asks for verification or shows rate limiting.
- Start with a small batch after any UI change.

## Never commit

- browser profiles or storage state;
- cookies, session values, access/refresh tokens, passwords, or QR codes;
- HAR files, private screenshots, or logs containing personal account data;
- real inventory or plan files.

The `.gitignore` covers common local artifacts, but review `git status` before every commit.

## Reporting a vulnerability

Open a GitHub security advisory for the repository. Do not include active account credentials or private Xiaohongshu data in an issue.
