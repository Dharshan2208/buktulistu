import { useEffect, useRef } from "react";
import rough from "roughjs";

const BUTTON_COLORS = {
  yellow: "#f7d154",
  green: "#a7e3bd",
  paper: "#fffdf7",
  red: "#fecaca",
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
      const { width, height } = button.getBoundingClientRect();

      if (width <= 0 || height <= 0) {
        return;
      }

      svg.replaceChildren();
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

      const sketch = rough.svg(svg);
      const shape = sketch.path(
        roundedRectanglePath(2.5, 2.5, width - 5, height - 5, 11),
        {
          seed: variant === "green" ? 150 : variant === "red" ? 260 : 50,
          stroke: "#20231f",
          strokeWidth: 1.45,
          fill: BUTTON_COLORS[variant] ?? variant,
          fillStyle: "hachure",
          hachureGap: 4.5,
          hachureAngle: -10,
          roughness: 1.2,
          bowing: 0.75,
        },
      );

      svg.appendChild(shape);
    }

    drawButton();

    const observer = new ResizeObserver(drawButton);
    observer.observe(button);

    return () => observer.disconnect();
  }, [variant]);

  return (
    <button
      ref={buttonRef}
      className={`sketch-button ${className}`.trim()}
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
