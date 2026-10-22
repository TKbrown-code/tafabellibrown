/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  readonly VITE_ROUTER?: "hash" | "browser";
  readonly VITE_CANONICAL_ORIGIN?: string;
  readonly VITE_ADMIN_ROUTE?: string;
}
