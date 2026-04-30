---
title: Common Issues
description: Quick checks for the most common Tracker 360 problems.
---

## I cannot sign in

- Confirm you are using the correct account.
- Confirm your invitation has been accepted.
- Ask your admin to verify your account status.

## I do not see expected data

- Confirm you are in the right organization context.
- Check filters, date ranges, and status filters.
- Confirm your role has visibility to that data.

## Build/deploy issue in app environments

If deployments fail with environment variable errors, verify:

- `DATABASE_URL` is configured.
- `DATABASE_URL_UNPOOLED` is configured where needed.
- Vercel project environment variables are set for the target environment.
