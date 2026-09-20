import { useId, useState } from "react";
import SketchButton from "./ui/SketchButton";
import SketchCard from "./ui/SketchCard";

function GateLoading() {
  return (
    <div className="gate-shell">
      <SketchCard variant="paper" seed={7} className="gate-card">
        <div className="gate-card__content gate-card__content--loading">
          <span className="brand__mark" aria-hidden="true">
            ✓
          </span>
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line-short" />
          <span className="sr-only">Checking your session…</span>
        </div>
      </SketchCard>
    </div>
  );
}

function AccessGate({ notice, onLogin }) {
  const generatedId = useId();
  const passwordInputId = `gate-password-${generatedId}`;
  const errorId = `gate-error-${generatedId}`;

  const [password, setPassword] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isBusy || !password) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await onLogin(password);
    } catch (loginError) {
      console.error("Unable to sign in", loginError);
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Couldn't sign in right now. Please try again.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="gate-shell">
      <SketchCard variant="paper" seed={7} className="gate-card">
        <div className="gate-card__content">
          <p className="eyebrow">Life In Progress</p>
          <h1>Things to do before I die</h1>
          <p className="gate-card__lead">
            One person&apos;s bucket list. Enter the shared password to look
            around — it&apos;s view-only for everyone except the owner.
          </p>

          {notice && (
            <p className="gate-notice" role="status">
              {notice}
            </p>
          )}

          <form className="gate-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor={passwordInputId}>Password</label>
            <div className="gate-form__row">
              <input
                id={passwordInputId}
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter the password"
                autoComplete="current-password"
                autoFocus
                required
                disabled={isBusy}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
              />
              <SketchButton
                type="submit"
                variant="yellow"
                disabled={isBusy || !password}
              >
                {isBusy ? "Checking…" : "View the list"}
              </SketchButton>
            </div>

            {error && (
              <p id={errorId} className="field-error" role="alert">
                {error}
              </p>
            )}
          </form>

          <p className="gate-card__footnote">
            One list, one owner. Friends who share the password can look but
            can&apos;t edit.
          </p>
        </div>
      </SketchCard>
    </div>
  );
}

export default AccessGate;
export { GateLoading };