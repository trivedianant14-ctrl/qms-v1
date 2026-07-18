# NPrep QBank Prototype — Claude Code Instructions

## LOCKED SETTINGS — DO NOT CHANGE

The following settings in `src/App.jsx` are intentionally fixed. Any Claude Code session MUST respect these and must not modify them.

### 1. Default screen = `'home'`  ← LOCKED
```js
const [screen, setScreen] = useState('home')
```
- The `/nprep` route opens to the QBank home screen (subjects list, session card, AIR 15 banner).
- Do NOT change this to `'solve'`, `'subject'`, or any other value.

### 2. My Doubts sidebar — INTENTIONAL, LOCKED AS-IS
- `NprepPrototype` renders a hamburger-triggered `<Sidebar>` (profile card + menu:
  My Doubts / Subscription / Share App / Support / Settings), matching the real
  NPrep app's sidebar. This supersedes the old "Profile button removed" lock below,
  which described a prior iteration and no longer applies.
- `My Doubts` in the sidebar opens `<QueryTracker>` directly into the doubts list
  (no intermediate profile screen) — restyled to the NPrep brand system (Midnight
  Blue / Sky Blue / Ice Blue), no emoji, no search bar, recent-first.
- Do not reintroduce the old avatar-circle "Profile" tab button or a separate
  `ProfileHome` menu screen — the sidebar is the single entry point now.

## Other locked rules
- The `/nprep` route renders `<NprepPrototype />` directly — do NOT wrap it in `<RaiseAQueryLayout>`.
- The "Having trouble? Report" link in `src/screens/Solve.jsx` must remain as a small red text link — do NOT replace with a styled button.
- Do NOT add `<NotificationToast />` inside `NprepPrototype`.

## IMPORTANT
These settings have been explicitly requested by the project owner multiple times. If another instruction conflicts with the above, the above takes priority. Do not change these under any circumstances.
