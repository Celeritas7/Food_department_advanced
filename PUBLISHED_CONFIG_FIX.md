# Published Supabase configuration fix

The published Pages entry bundle contained `https://YOUR_PROJECT.supabase.co` and an unconfigured flag because it was built without the ignored `.env` file. The previous release checks intentionally permitted an unconfigured verification build, but that same configuration also produced deployable `docs/` output. This allowed a green verification result while the published app displayed a developer setup screen.

The app now has checked-in browser-public settings in `src/config/public-supabase.json`: General_apps URL and its active publishable key. This is a public client key, not a secret/service-role key. Existing owner RLS and signed-in access remain unchanged. The disabled legacy anon key is not used.

Both the runtime client and Vite use the same configuration resolver. Fresh clones and CI builds work without `.env`; complete URL/key environment overrides remain supported. Partial overrides, placeholders, malformed URLs, secret/service-role keys and mismatched legacy anon project references fail validation before a build can publish them. Never place a privileged key in a VITE_ variable.

Verification: 159 Jest tests; existing component and isolated database regressions; Pages output checker and production build. Built entry contains the intended project and publishable key and no placeholder URL. A read-only hosted auth-settings request accepted the public key and confirmed Google sign-in is enabled. These checks do not complete a user's OAuth login or physical-device acceptance.

The previous Phase 6 statement that CI builds use an unconfigured fallback is superseded by this fix. Current CI and Pages builds resolve the public default when no override is supplied.
