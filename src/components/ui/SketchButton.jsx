function SketchButton({
  children,
  className = "",
  variant = "primary",
  type = "button",
  disabled = false,
  onClick,
  ...props
}) {
  // Oat styles native buttons. Map legacy variants to Oat variants.
  const variantMap = {
    yellow: undefined,
    green: undefined,
    paper: "secondary",
    red: "danger",
    primary: undefined,
    secondary: "secondary",
    danger: "danger",
  };
  const oatVariant = variantMap[variant];

  return (
    <button
      className={className}
      data-variant={oatVariant}
      type={type}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

export default SketchButton;
