import { useEffect, useState } from "react";

const NAVIGATE_EVENT = "buktu:navigate";

export function normalizePath(pathname) {
  if (!pathname || pathname === "/") return "/";
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/";
}

export function matchPlanDetailRoute(pathname) {
  const normalized = normalizePath(pathname);
  const match = normalized.match(/^\/plans\/([1-9]\d*)$/);
  return match ? Number(match[1]) : null;
}

export function navigate(to) {
  const target = normalizePath(to);
  if (window.location.pathname !== target) {
    window.history.pushState(null, "", target);
    window.dispatchEvent(new CustomEvent(NAVIGATE_EVENT, { detail: target }));
  }
}

export function useCurrentRoute() {
  const [route, setRoute] = useState(() =>
    typeof window !== "undefined" ? normalizePath(window.location.pathname) : "/",
  );

  useEffect(() => {
    function handleLocationChange() {
      setRoute(normalizePath(window.location.pathname));
    }

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener(NAVIGATE_EVENT, handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener(NAVIGATE_EVENT, handleLocationChange);
    };
  }, []);

  return route;
}
