import { useEffect, useRef } from "react";
import rough from "roughjs";

const CARD_COLORS = {
  paper: "#fffdf7",
  yellow: "#fff3bf",
  green: "#dcfce7",
  blue: "#dbeafe",
  gray: "#f3f4f6",
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
      const { width, height } = wrapper.getBoundingClientRect();

      if (width <= 0 || height <= 0) {
        return;
      }

      svg.replaceChildren();
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

      const sketch = rough.svg(svg);
      const shape = sketch.path(
        roundedRectanglePath(3, 3, width - 6, height - 6, 18),
        {
          seed,
          stroke: "#918a7b",
          strokeWidth: 1.1,
          strokeLineDash: dashed ? [7, 6] : undefined,
          fill: CARD_COLORS[variant] ?? variant,
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

    return () => observer.disconnect();
  }, [dashed, seed, variant]);

  return (
    <div ref={wrapperRef} className={`sketch-card ${className}`.trim()}>
      <svg ref={svgRef} className="sketch-card__canvas" aria-hidden="true" />
      <div className={`sketch-card__content ${contentClassName}`.trim()}>
        {children}
      </div>
    </div>
  );
}

export default SketchCard;
