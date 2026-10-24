import { useState } from "react";
import { CATEGORY_OPTIONS } from "../../categories.js";
import SketchButton from "../ui/SketchButton.jsx";

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low priority" },
  { value: "medium", label: "Medium priority" },
  { value: "high", label: "High priority" },
];

const EMPTY_VALUES = {
  title: "",
  description: "",
  category: "general",
  status: "not_started",
  priority: "medium",
  target_date: "",
  estimated_duration: "",
  steps: [],
};

function generateStepId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function PlanForm({
  idPrefix,
  initialValues = EMPTY_VALUES,
  onSubmit,
  onCancel,
  submitLabel,
  busyLabel,
  resetAfterSubmit = false,
}) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_VALUES,
    ...initialValues,
    target_date: initialValues.target_date ?? "",
    estimated_duration: initialValues.estimated_duration ?? "",
    description: initialValues.description ?? "",
    category: initialValues.category ?? "general",
  }));
  const [steps, setSteps] = useState(() =>
    Array.isArray(initialValues.steps) ? [...initialValues.steps] : [],
  );
  const [newStepText, setNewStepText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handleAddStep(event) {
    event?.preventDefault();
    const trimmed = newStepText.trim();
    if (!trimmed) return;

    setSteps((currentSteps) => [
      ...currentSteps,
      {
        id: generateStepId(),
        text: trimmed,
        completed: false,
      },
    ]);
    setNewStepText("");
  }

  function handleStepKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddStep();
    }
  }

  function handleToggleStepCompleted(index) {
    setSteps((currentSteps) =>
      currentSteps.map((step, idx) =>
        idx === index ? { ...step, completed: !step.completed } : step,
      ),
    );
  }

  function handleStepTextChange(index, text) {
    setSteps((currentSteps) =>
      currentSteps.map((step, idx) =>
        idx === index ? { ...step, text } : step,
      ),
    );
  }

  function handleMoveStep(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= steps.length) return;

    setSteps((currentSteps) => {
      const nextSteps = [...currentSteps];
      const [moved] = nextSteps.splice(index, 1);
      nextSteps.splice(targetIndex, 0, moved);
      return nextSteps;
    });
  }

  function handleRemoveStep(index) {
    setSteps((currentSteps) => currentSteps.filter((_, idx) => idx !== index));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const validSteps = steps
      .map((step) => ({
        ...step,
        text: step.text.trim(),
      }))
      .filter((step) => Boolean(step.text));

    try {
      await onSubmit({
        title: form.title,
        description: form.description || null,
        category: form.category || "general",
        status: form.status,
        priority: form.priority,
        target_date: form.target_date || null,
        estimated_duration: form.estimated_duration || null,
        steps: validSteps,
      });

      if (resetAfterSubmit) {
        setForm({ ...EMPTY_VALUES });
        setSteps([]);
        setNewStepText("");
      }
    } catch (error) {
      console.error("Unable to save plan", {
        error,
        requestId: error?.requestId,
      });
      setFormError(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving this plan.",
      );
      setFieldErrors(error?.fields ?? {});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="item-form plan-form" onSubmit={handleSubmit}>
      <fieldset disabled={isSubmitting}>
        <div className="form-field form-field--wide">
          <label htmlFor={`${idPrefix}-title`}>Plan Title</label>
          <input
            id={`${idPrefix}-title`}
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Master Italian Cooking, Road Trip to Alaska…"
            data-autofocus
            autoComplete="off"
            maxLength="120"
            aria-invalid={Boolean(fieldErrors.title)}
            aria-describedby={
              fieldErrors.title ? `${idPrefix}-title-error` : undefined
            }
            required
          />
          {fieldErrors.title && (
            <p id={`${idPrefix}-title-error`} className="field-error">
              {fieldErrors.title}
            </p>
          )}
        </div>

        <div className="form-field form-field--wide">
          <label htmlFor={`${idPrefix}-description`}>Objective &amp; Details</label>
          <textarea
            id={`${idPrefix}-description`}
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="What is the goal? Outline key milestones or context…"
            rows="3"
            maxLength="2000"
            aria-invalid={Boolean(fieldErrors.description)}
            aria-describedby={
              fieldErrors.description
                ? `${idPrefix}-description-error`
                : undefined
            }
          />
          {fieldErrors.description && (
            <p id={`${idPrefix}-description-error`} className="field-error">
              {fieldErrors.description}
            </p>
          )}
        </div>

        <div className="form-grid-row">
          <div className="form-field">
            <label htmlFor={`${idPrefix}-category`}>Category</label>
            <select
              id={`${idPrefix}-category`}
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor={`${idPrefix}-status`}>Status</label>
            <select
              id={`${idPrefix}-status`}
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            {fieldErrors.status && (
              <p id={`${idPrefix}-status-error`} className="field-error">
                {fieldErrors.status}
              </p>
            )}
          </div>
        </div>

        <div className="form-grid-row">
          <div className="form-field">
            <label htmlFor={`${idPrefix}-priority`}>Priority</label>
            <select
              id={`${idPrefix}-priority`}
              name="priority"
              value={form.priority}
              onChange={handleChange}
            >
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
            {fieldErrors.priority && (
              <p id={`${idPrefix}-priority-error`} className="field-error">
                {fieldErrors.priority}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor={`${idPrefix}-target-date`}>Target Date (Optional)</label>
            <input
              id={`${idPrefix}-target-date`}
              name="target_date"
              type="date"
              value={form.target_date}
              onChange={handleChange}
            />
            {fieldErrors.target_date && (
              <p id={`${idPrefix}-target-date-error`} className="field-error">
                {fieldErrors.target_date}
              </p>
            )}
          </div>
        </div>

        <div className="form-field form-field--wide">
          <label htmlFor={`${idPrefix}-estimated-duration`}>
            Estimated Duration (Optional)
          </label>
          <input
            id={`${idPrefix}-estimated-duration`}
            name="estimated_duration"
            type="text"
            value={form.estimated_duration}
            onChange={handleChange}
            placeholder="e.g. 10–12 days, 3 months, 6 weeks…"
            maxLength="100"
          />
        </div>

        <div className="form-field form-field--wide plan-form__steps-section">
          <label htmlFor={`${idPrefix}-new-step`}>
            Checklist &amp; Steps ({steps.filter((s) => s.completed).length}/{steps.length} done)
          </label>
          <div className="plan-form__add-step-row">
            <input
              id={`${idPrefix}-new-step`}
              type="text"
              value={newStepText}
              onChange={(e) => setNewStepText(e.target.value)}
              onKeyDown={handleStepKeyDown}
              placeholder="e.g. Book flights, buy equipment, submit application…"
              maxLength="200"
            />
            <button
              type="button"
              className="ghost"
              onClick={handleAddStep}
              disabled={!newStepText.trim()}
            >
              Add step
            </button>
          </div>

          {steps.length > 0 && (
            <ul className="plan-form__steps-list">
              {steps.map((step, idx) => (
                <li key={step.id || idx} className="plan-form__step-row">
                  <button
                    type="button"
                    className="step-check-btn"
                    aria-label={
                      step.completed
                        ? "Mark step as incomplete"
                        : "Mark step as complete"
                    }
                    onClick={() => handleToggleStepCompleted(idx)}
                  >
                    <span aria-hidden="true">{step.completed ? "✓" : ""}</span>
                  </button>
                  <input
                    type="text"
                    className="step-input"
                    value={step.text}
                    onChange={(e) => handleStepTextChange(idx, e.target.value)}
                    maxLength="200"
                  />
                  <div className="plan-form__step-reorder">
                    <button
                      type="button"
                      className="ghost icon small"
                      disabled={idx === 0}
                      onClick={() => handleMoveStep(idx, -1)}
                      title="Move up"
                      aria-label="Move step up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="ghost icon small"
                      disabled={idx === steps.length - 1}
                      onClick={() => handleMoveStep(idx, 1)}
                      title="Move down"
                      aria-label="Move step down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="ghost icon small"
                      data-variant="danger"
                      onClick={() => handleRemoveStep(idx)}
                      title="Remove step"
                      aria-label="Remove step"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </fieldset>

      {(formError || fieldErrors.request) && (
        <p className="form-error" role="alert">
          {fieldErrors.request ?? formError}
        </p>
      )}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="ghost" onClick={onCancel}>
            Cancel
          </button>
        )}

        <SketchButton type="submit" disabled={isSubmitting} variant="yellow">
          {isSubmitting ? busyLabel : submitLabel}
        </SketchButton>
      </div>
    </form>
  );
}

export default PlanForm;
