function SketchCard({
  children,
  className = "",
  contentClassName = "",
  variant,
  seed,
  dashed,
  ...props
}) {
  // Oat uses .card on a plain div. Legacy sketch props are ignored.
  void variant;
  void seed;
  void dashed;

  return (
    <div className={`card ${className}`.trim()} {...props}>
      <div className={contentClassName}>{children}</div>
    </div>
  );
}

export default SketchCard;
