# Project Progress

This file tracks the features added and progress made on the project.

## Pending Tasks
- [ ] List specific tasks to work on here...

## Completed Features
- [x] Cloned repository and set up locally
- [x] Ran `npm install` to install dependencies
- [x] Added password visibility toggle (Eye icon) to all login and signup forms
- [x] Removed exposed super admin credentials from placeholder
- [x] Fixed Runtime Error `[object Event]` caused by form submission bug
- [x] Added `type="button"` to tab switcher buttons to prevent form submission interference
- [x] Fixed `Cannot read properties of undefined (reading 'toLowerCase')` crash in `auth.ts` and `api/data/route.ts` — added null-safety checks to all `.toLowerCase()` calls on email fields
- [x] Resolved frozen/unresponsive UI caused by stale `.next` build cache (cleared cache and restarted dev server)
- [x] Fixed Super Admin & Sign Up tabs — now fully clickable and functional
- [x] Fixed Super Admin dashboard not showing submitted test entries — Super Admin now sees ALL candidates & sessions instead of filtering by email
- [x] Fixed dashboard performance/latency — reduced aggressive polling from every 2s to 15s with concurrency guard to prevent overlapping refresh calls
