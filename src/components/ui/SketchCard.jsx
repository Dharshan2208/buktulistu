import { useEffect, useRef } from "react";
import rough from "roughjs";

const CARD_COLORS = {
  paper: "#fffdf7",
  yellow: "#fff3bf",
  green: "#dcfce7",
  blue: "#dbeafe",
  gray: "#f3f4f6",
  red: "#fee2e2",
};

const DARK_CARD_COLORS = {
  paper: "#242620",
  yellow: "#3b341f",
  green: "#203b2b",
  blue: "#202f3d",
  gray: "#2c2e29",
  red: "#4a2c2a",
};

function roundedRectanglePath(x, y, width, height, radius) {
  const corner = Math.min(radius, width / 2, height / 2);

  return `
    M ${x + corner} ${y}
    L ${x + width - corner} ${y}
    Q ${x + width} ${y} ${x + width} ${y + corner}
    L ${x + width} ${y + height - corner}
    Q ${x + width} ${y + height} ${x + width - corner} ${y + height}
    L ${x + corner} ${y + height}
    Q ${x} ${y + height} ${x} ${y + height - corner}
    L ${x} ${y + corner}
    Q ${x} ${y} ${x + corner} ${y}
    Z
  `;
}

function SketchCard({
  children,
  className = "",
  contentClassName = "",
  variant = "paper",
  seed = 220,
  dashed = false,
}) {
  const wrapperRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const svg = svgRef.current;

    if (!wrapper || !svg) {
      return undefined;
    }

    function drawCard() {
      if (window.matchMedia("(max-width: 600px)").matches) {
        svg.replaceChildren();
        return;
      }

      const { width, height } = wrapper.getBoundingClientRect();

      if (width <= 0 || height <= 0) {
        return;
      }

      svg.replaceChildren();
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

      const sketch = rough.svg(svg);
      const isDark = document.documentElement.dataset.theme === "dark";
      const colors = isDark ? DARK_CARD_COLORS : CARD_COLORS;
      const shape = sketch.path(
        roundedRectanglePath(3, 3, width - 6, height - 6, 18),
        {
          seed,
          stroke: isDark ? "#62675d" : "#918a7b",
          strokeWidth: 1.1,
          strokeLineDash: dashed ? [7, 6] : undefined,
          fill: colors[variant] ?? variant,
          fillStyle: "solid",
          roughness: 0.8,
          bowing: 0.45,
          disableMultiStroke: true,
        },
      );

      svg.appendChild(shape);
    }

    drawCard();

    const observer = new ResizeObserver(drawCard);
    observer.observe(wrapper);

    const themeObserver = new MutationObserver(drawCard);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      observer.disconnect();
      themeObserver.disconnect();
    };
  }, [dashed, seed, variant]);

  return (
    <div
      ref={wrapperRef}
      className={`sketch-card sketch-card--${variant} ${className}`.trim()}
    >
      <svg ref={svgRef} className="sketch-card__canvas" aria-hidden="true" />
      <div className={`sketch-card__content ${contentClassName}`.trim()}>
        {children}
      </div>
    </div>
  );
}

export default SketchCard;
