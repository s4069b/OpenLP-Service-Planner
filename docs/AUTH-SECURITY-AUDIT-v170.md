# Authentication security audit — v1.70

Scope: My ChurchSuite OIDC, Microsoft Entra ID OIDC, OpenLP Planner User password login, setup/recovery, Planner sessions, account linking, and authorization gates.

## Fixed in v1.70

- **High — ChurchSuite email-based privilege inheritance:** ChurchSuite states that email is mutable and may be shared. The previous fallback could attach a new ChurchSuite `sub` to an existing Planner account solely by matching email. v1.70 resolves ChurchSuite identities only by immutable `sub`; an email collision now stops sign-in for administrator resolution rather than linking accounts.
- **High — Microsoft identity was resolved by mutable username/email before stable identity:** v1.70 resolves existing Entra users by `oid`/`sub` first. A one-time email linkage remains only for legacy rows already explicitly marked as Microsoft accounts. Local or ChurchSuite accounts are never automatically linked to a Microsoft identity by email.
- **Medium — ChurchSuite nonce acceptance was too permissive:** because the Planner sends a nonce, v1.70 requires the ID token nonce to be present and exactly match it.
- **Medium — local account lock could be kept alive indefinitely:** repeated failed requests during an active 15-minute lock no longer extend it. After expiry, the failure counter begins a new window.
- **Defence in depth:** Microsoft/ChurchSuite ID-token signing algorithm checks are explicit, Microsoft `iat`/`nbf` validation is stricter, and unique indexes protect stable external identity values from accidental duplicate linkage.

## Remaining recommendations

- **Medium — local password work factor:** local passwords currently use PBKDF2-HMAC-SHA256 with 100,000 iterations. Current OWASP guidance recommends 600,000 for PBKDF2-HMAC-SHA256. Benchmark Cloudflare/VPS execution first, then raise the work factor and opportunistically re-hash older passwords after successful login.
- **Medium — no edge login throttling:** local accounts have account-level lockout, but the application has no IP/edge rate limit. Add Cloudflare rate limiting for `/auth/local`, `/auth/setup`, and `/auth/admin-recovery`; keep the application-level generic error messages.
- **Medium — local administrator accounts have no MFA:** prefer My ChurchSuite/Microsoft SSO for normal use where upstream MFA can be enforced. If local administrators remain important, add WebAuthn/passkeys or TOTP as a second factor.
- **Low/medium — 12-hour absolute session with no idle timeout:** session tokens are strong, server-side, hashed in D1, `Secure`, `HttpOnly`, `SameSite=Lax`, and use a `__Host-` cookie. However, there is no server-side inactivity timeout or periodic session-ID renewal. Add `last_seen_at` and an inactivity window if stronger session hygiene is desired.
- **Low — custom JWT validation:** the implementation validates signature, issuer, audience, expiry and nonce, but hand-written JWT/OIDC validation is easier to get wrong over time than a maintained standards library. Consider moving to a small, audited JOSE/OIDC library in a future version if Cloudflare/VPS bundle constraints permit.

## Positive controls already present

- 256-bit random Planner session tokens are stored only as SHA-256 hashes in the database.
- Logout deletes the server-side session and clears the cookie; password reset and user disable/delete invalidate relevant sessions.
- OIDC state values are random, expire after ten minutes, and are deleted before the token exchange is completed.
- Microsoft uses PKCE (`S256`) in addition to the confidential-client secret.
- Unsafe same-origin POST/API operations are protected by Origin/Referer/Sec-Fetch-Site checks.
- Open redirects are blocked by restricting return paths to local absolute paths.
- Access level is read from the database on each authenticated request; disabling/demoting a user is therefore effective without waiting for a signed token to expire.
