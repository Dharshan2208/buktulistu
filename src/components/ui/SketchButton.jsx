import { useEffect, useRef } from "react";
import rough from "roughjs";

const BUTTON_COLORS = {
  yellow: "#f7d154",
  green: "#a7e3bd",
  paper: "#fffdf7",
  red: "#fecaca",
};

const DARK_BUTTON_COLORS = {
  yellow: "#d5ad42",
  green: "#39744e",
  paper: "#292b25",
  red: "#7e3f3b",
};

function roundedRectanglePath(x, y, width, height, radius) {
  return `
    M ${x + radius} ${y}
    L ${x + width - radius} ${y}
    Q ${x + width} ${y} ${x + width} ${y + radius}
    L ${x + width} ${y + height - radius}
    Q ${x + width} ${y + height} ${x + width - radius} ${y + height}
    L ${x + radius} ${y + height}
    Q ${x} ${y + height} ${x} ${y + height - radius}
    L ${x} ${y + radius}
    Q ${x} ${y} ${x + radius} ${y}
    Z
  `;
}

function SketchButton({
  children,
  className = "",
  variant = "yellow",
  type = "button",
  disabled = false,
  onClick,
  ...props
}) {
  const buttonRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    const button = buttonRef.current;
    const svg = svgRef.current;

    if (!button || !svg) {
      return undefined;
    }

    function drawButton() {
      if (window.matchMedia("(max-width: 600px)").matches) {
        svg.replaceChildren();
        return;
      }

      const { width, height } = button.getBoundingClientRect();

      if (width <= 0 || height <= 0) {
        return;
      }

      svg.replaceChildren();
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

      const sketch = rough.svg(svg);
      const isDark = document.documentElement.dataset.theme === "dark";
      const colors = isDark ? DARK_BUTTON_COLORS : BUTTON_COLORS;
      const shape = sketch.path(
        roundedRectanglePath(2.5, 2.5, width - 5, height - 5, 11),
        {
          seed: variant === "green" ? 150 : variant === "red" ? 260 : 50,
          stroke: isDark ? "#f0d77d" : "#20231f",
          strokeWidth: isDark ? 1.15 : 1.45,
          fill: colors[variant] ?? variant,
          fillStyle: isDark ? "solid" : "hachure",
          hachureGap: 4.5,
          hachureAngle: -10,
          roughness: isDark ? 0.65 : 1.2,
          bowing: isDark ? 0.4 : 0.75,
          disableMultiStroke: true,
        },
      );

      svg.appendChild(shape);
    }

    drawButton();

    const observer = new ResizeObserver(drawButton);
    observer.observe(button);

    const themeObserver = new MutationObserver(drawButton);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      observer.disconnect();
      themeObserver.disconnect();
    };
  }, [variant]);

  return (
    <button
      ref={buttonRef}
      className={`sketch-button sketch-button--${variant} ${className}`.trim()}
      type={type}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      <svg ref={svgRef} className="sketch-button__canvas" aria-hidden="true" />
      <span className="sketch-button__label">{children}</span>
    </button>
  );
}

export default SketchButton;
