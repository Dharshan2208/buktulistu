import SketchCard from "./SketchCard";

function SketchToast({ message, onDismiss }) {
  if (!message) {
    return null;
  }

  const isError = /couldn\u2019t|couldn't|expired|read-only/i.test(message);

  return (
    <div className="toast-region" aria-live="polite" aria-atomic="true">
      <SketchCard
        variant={isError ? "red" : "green"}
        seed={303}
        className={`toast-card ${isError ? "toast-card--error" : ""}`}
      >
        <p role="status">
          <span aria-hidden="true">{isError ? "!" : "✓"}</span> {message}
        </p>
        {isError && (
          <button type="button" aria-label="Dismiss message" onClick={onDismiss}>
            ×
          </button>
        )}
      </SketchCard>
    </div>
  );
}

export default SketchToast;
