import { useEffect, useRef } from "react";

function FilterMenu({ label, value, options, onChange }) {
  const detailsRef = useRef(null);
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function closeOnOutsidePress(event) {
      if (!detailsRef.current?.contains(event.target)) {
        detailsRef.current?.removeAttribute("open");
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        detailsRef.current?.removeAttribute("open");
        detailsRef.current?.querySelector("summary")?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function selectOption(nextValue) {
    onChange(nextValue);
    detailsRef.current?.removeAttribute("open");
    detailsRef.current?.querySelector("summary")?.focus();
  }

  return (
    <div className="filter-menu-field">
      <span className="sr-only">{label}</span>
      <details ref={detailsRef} className="filter-menu">
        <summary>
          <span>{selectedOption.label}</span>
        </summary>

        <div className="filter-menu__options" role="group" aria-label={label}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={option.value === value}
              className={option.value === value ? "is-selected" : ""}
              onClick={() => selectOption(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}

export default FilterMenu;
