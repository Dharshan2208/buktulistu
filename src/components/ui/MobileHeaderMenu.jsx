import { useEffect, useRef } from "react";

function MobileHeaderMenu({ role, onLogout }) {
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
      <summary aria-label="Open account menu">···</summary>
      <div className="mobile-header-menu__panel">
        <p className="text-light">
          {role === "owner" ? "Owner · editing" : "Viewer · read only"}
        </p>
        <button type="button" onClick={() => runAction(onLogout)}>
          Lock and sign out
        </button>
      </div>
    </details>
  );
}

export default MobileHeaderMenu;
