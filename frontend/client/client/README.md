# AI Agent Firewall — frontend

## 1. Install the two extra packages this UI needs

```bash
npm install react-router-dom lucide-react
```

## 2. Drop in the files

Copy everything inside this zip's `src/` folder into your Vite project's
`src/` folder, **overwriting** the default `App.jsx`, `main.jsx`, and
`index.css` that `npm create vite@latest` generated.

Final structure:

```
your-vite-project/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── components/
    │   ├── layout/
    │   │   ├── Sidebar.jsx
    │   │   ├── Sidebar.css
    │   │   ├── AppShell.jsx
    │   │   └── AppShell.css
    │   └── common/
    │       ├── CodeEditor.jsx
    │       ├── CodeEditor.css
    │       ├── CodeBlock.jsx
    │       ├── CodeBlock.css
    │       ├── StatusPill.jsx
    │       ├── StatusPill.css
    │       ├── SectionCard.jsx
    │       └── SectionCard.css
    └── pages/
        ├── Home/
        │   ├── Home.jsx
        │   └── Home.css
        ├── Execute/
        │   ├── Execute.jsx
        │   ├── Execute.css
        │   └── executeService.js
        ├── ExecutionResult/
        │   ├── ExecutionResult.jsx
        │   └── ExecutionResult.css
        ├── History/
        │   ├── History.jsx
        │   └── History.css
        ├── Policies/
        │   └── Policies.jsx
        └── Settings/
            └── Settings.jsx
```

## 3. Update `index.html`

Change the `<title>` tag to:

```html
<title>AI Agent Firewall</title>
```

## 4. Run it

```bash
npm run dev
```

## Where the backend plugs in

Everything currently talking to "the backend" is mocked in one file:

- `src/pages/Execute/executeService.js` — `runExecution()` and
  `getExecutionById()`. Replace their bodies with real `fetch()` calls to
  your API; keep the same return shape (or update `ExecutionResult.jsx`
  alongside it) and the rest of the UI keeps working unchanged.

Every other backend seam is marked with a `// TODO(backend)` comment:
`Sidebar.jsx` (current user), `History.jsx`, `Policies.jsx`, `Settings.jsx`.
