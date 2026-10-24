import { navigate } from "../utils/router.js";

function Navigation({ currentRoute, className = "" }) {
  const isBucketActive = currentRoute === "/";
  const isPlansActive = currentRoute === "/plans";

  function handleNav(event, path) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    navigate(path);
  }

  return (
    <nav className={`site-nav ${className}`.trim()} aria-label="Main navigation">
      <a
        href="/"
        className={`site-nav__link ${isBucketActive ? "is-active" : ""}`}
        aria-current={isBucketActive ? "page" : undefined}
        onClick={(event) => handleNav(event, "/")}
      >
        Bucket List
      </a>
      <a
        href="/plans"
        className={`site-nav__link ${isPlansActive ? "is-active" : ""}`}
        aria-current={isPlansActive ? "page" : undefined}
        onClick={(event) => handleNav(event, "/plans")}
      >
        Plans
      </a>
    </nav>
  );
}

export default Navigation;
