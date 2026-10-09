function SketchToast({ message, onDismiss }) {
  if (!message) {
    return null;
  }

  const isError = /couldn\u2019t|couldn't|expired|read-only/i.test(message);

  return (
    <div className="toast-region" aria-live="polite" aria-atomic="true">
      <div
        role="alert"
        data-variant={isError ? "danger" : "success"}
        className="toast-card"
      >
        <p role="status">
          {message}
        </p>
        {isError && (
          <button type="button" aria-label="Dismiss message" onClick={onDismiss}>
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export default SketchToast;
