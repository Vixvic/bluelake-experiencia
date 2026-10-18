# Architecture rules

- Password changes use the Cloud Auth API, never direct writes to managed auth tables; authenticated recovery users can access the password form independently of temporary-password profile flags.
- Password update completion reloads the role-appropriate page so session and profile flags are revalidated before protected content renders.