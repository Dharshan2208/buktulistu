import SketchCard from "./SketchCard";

function SketchToast({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div className="toast-region" aria-live="polite" aria-atomic="true">
      <SketchCard variant="green" seed={303} className="toast-card">
        <p role="status">
          <span aria-hidden="true">✓</span> {message}
        </p>
      </SketchCard>
    </div>
  );
}

export default SketchToast;
