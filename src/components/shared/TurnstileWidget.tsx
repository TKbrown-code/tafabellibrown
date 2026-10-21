import { useEffect, useRef } from "react";

type TurnstileWidgetApi = {
  render: (container: HTMLElement, options: {
    sitekey: string;
    theme: "auto";
    size: "flexible";
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": (errorCode: string | number) => void;
  }) => string;
  remove: (widgetId: string) => void;
};
type TurnstileWindow = Window & { turnstile?: TurnstileWidgetApi };

export const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || (import.meta.env.DEV ? "1x00000000000000000000AA" : "");

export function turnstileErrorMessage(errorCode?: string | number) {
  if (String(errorCode) === "110200") {
    return `This domain (${window.location.hostname}) is not authorized for this Turnstile widget. Add it in Cloudflare Turnstile Hostname Management.`;
  }
  return "Robot verification could not load. Refresh and try again.";
}

export function TurnstileWidget({ onVerify, onExpire, onError }: { onVerify: (token: string) => void; onExpire: () => void; onError: (errorCode?: string | number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const callbackRef = useRef({ onVerify, onExpire, onError });
  callbackRef.current = { onVerify, onExpire, onError };

  useEffect(() => {
    let active = true;
    const render = () => {
      const api = (window as TurnstileWindow).turnstile;
      if (!active || !containerRef.current || !api || widgetIdRef.current) return;
      widgetIdRef.current = api.render(containerRef.current, {
        sitekey: turnstileSiteKey,
        theme: "auto",
        size: "flexible",
        callback: (token) => callbackRef.current.onVerify(token),
        "expired-callback": () => callbackRef.current.onExpire(),
        "error-callback": (errorCode) => callbackRef.current.onError(errorCode),
      });
    };
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-turnstile="true"]');
    if ((window as TurnstileWindow).turnstile) render();
    else {
      const script = existingScript ?? document.createElement("script");
      if (!existingScript) {
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.dataset.turnstile = "true";
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
      script.addEventListener("error", () => callbackRef.current.onError(), { once: true });
    }
    return () => {
      active = false;
      const api = (window as TurnstileWindow).turnstile;
      if (widgetIdRef.current && api) api.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, []);

  return <div ref={containerRef} aria-label="Cloudflare robot verification" />;
}
