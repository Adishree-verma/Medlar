---
name: replit-auth-web lib setup in pnpm workspace
description: Steps needed to make lib/replit-auth-web work as a composite TypeScript lib
---

**Problems encountered and fixes:**

1. **tsconfig missing composite flags** — The template's tsconfig.json doesn't have `composite: true`, `declarationMap: true`, or `emitDeclarationOnly: true`. These are required for workspace references to work with `tsc --build`.

2. **`import.meta.env` in composite lib** — `use-auth.ts` uses `import.meta.env.BASE_URL` which is Vite-specific. Composite libs don't have Vite client types. Replace with `(window as any).__VITE_BASE_URL__ || "/"`.

3. **Adding to workspace** — Can't use `pnpm add @workspace/replit-auth-web` (treats it as npm package). Instead, directly edit package.json via `node -e "..."` to add `"@workspace/replit-auth-web": "workspace:*"` to devDependencies. Then add to root tsconfig.json references and artifact tsconfig.json references.

**How to apply:** Follow these fixes any time the replit-auth-web template is copied into a new project.
