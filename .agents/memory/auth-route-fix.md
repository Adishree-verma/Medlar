---
name: Auth user endpoint response shape
description: GetCurrentAuthUserResponse requires isAuthenticated field
---

The `AuthUserEnvelope` schema (and thus `GetCurrentAuthUserResponse` Zod type) requires:
- `isAuthenticated: boolean` (required)
- `user: AuthUser | null` (optional)

The auth route template only passes `{ user: ... }`, which causes a ZodError at runtime ("Required" for isAuthenticated).

**Fix:**
```typescript
router.get("/auth/user", (req, res) => {
  const authenticated = req.isAuthenticated();
  res.json(GetCurrentAuthUserResponse.parse({
    isAuthenticated: authenticated,
    user: authenticated ? req.user : null,
  }));
});
```

**Why:** The OpenAPI spec defines `isAuthenticated` as required in AuthUserEnvelope; codegen generates Zod that enforces this.
