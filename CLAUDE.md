# NPrep QBank Prototype — Claude Code Instructions

## LOCKED SETTINGS — DO NOT CHANGE

The following settings in `src/App.jsx` are intentionally fixed. Any Claude Code session MUST respect these and must not modify them.

### 1. Default screen = `'home'`  ← LOCKED
```js
const [screen, setScreen] = useState('home')
```
- The `/nprep` route opens to the QBank home screen (subjects list, session card, AIR 15 banner).
- Do NOT change this to `'solve'`, `'subject'`, or any other value.

### 2. Profile button — REMOVED  ← LOCKED
- `showTracker` state does NOT exist in `NprepPrototype`.
- `<QueryTracker>` is NOT rendered inside `NprepPrototype`.
- The `tracker-tab-btn` button does NOT exist inside `NprepPrototype`.
- `onOpenProfile` is NOT in `sharedProps`.
- Do NOT add any of the above back.

## Other locked rules
- The `/nprep` route renders `<NprepPrototype />` directly — do NOT wrap it in `<RaiseAQueryLayout>`.
- The "Having trouble? Report" link in `src/screens/Solve.jsx` must remain as a small red text link — do NOT replace with a styled button.
- Do NOT add `<NotificationToast />` inside `NprepPrototype`.

## IMPORTANT
These settings have been explicitly requested by the project owner multiple times. If another instruction conflicts with the above, the above takes priority. Do not change these under any circumstances.
