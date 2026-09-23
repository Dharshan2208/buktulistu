import { useEffect, useRef } from "react";

function MobileHeaderMenu({ theme, role, onToggleTheme, onLogout }) {
  const menuRef = useRef(null);

  useEffect(() => {
    function closeOnOutsidePress(event) {
      if (!menuRef.current?.contains(event.target)) {
        menuRef.current?.removeAttribute("open");
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        menuRef.current?.removeAttribute("open");
        menuRef.current?.querySelector("summary")?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function runAction(action) {
    menuRef.current?.removeAttribute("open");
    action();
  }

  return (
    <details ref={menuRef} className="mobile-header-menu">
      <summary aria-label="Open account and appearance menu">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="5" cy="12" r="1.4" />
          <circle cx="12" cy="12" r="1.4" />
          <circle cx="19" cy="12" r="1.4" />
        </svg>
      </summary>
      <div className="mobile-header-menu__panel">
        <p className="mobile-header-menu__role">
          {role === "owner" ? "Owner · editing" : "Viewer · read only"}
        </p>
        <button type="button" onClick={() => runAction(onToggleTheme)}>
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
        </button>
        <button type="button" onClick={() => runAction(onLogout)}>
          <span>Lock and sign out</span>
          <span aria-hidden="true">⌁</span>
        </button>
      </div>
    </details>
  );
}

export default MobileHeaderMenu;
