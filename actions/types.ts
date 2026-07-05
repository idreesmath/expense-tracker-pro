/**
 * Uniform result envelope for server actions. `error` is a message-catalog
 * key (e.g. "auth.invalidCredentials") so the client can toast it in the
 * active language.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };
