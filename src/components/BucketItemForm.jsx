import { useState } from "react";
import SketchButton from "./ui/SketchButton";

const EMPTY_VALUES = {
  title: "",
  description: "",
  category: "general",
  priority: "medium",
  target_date: "",
};

function BucketItemForm({
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
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      await onSubmit({
        title: form.title,
        description: form.description || null,
        category: form.category,
        priority: form.priority,
        target_date: form.target_date || null,
      });

      if (resetAfterSubmit) {
        setForm({ ...EMPTY_VALUES });
      }
    } catch (error) {
      console.error("Unable to save bucket-list item", error);
      setFormError("Something went wrong while saving this item.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <fieldset disabled={isSubmitting}>
        <div className="form-field form-field--wide">
          <label htmlFor={`${idPrefix}-title`}>What do you want to do?</label>
          <input
            id={`${idPrefix}-title`}
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            placeholder="See the northern lights"
            autoComplete="off"
            required
          />
        </div>

        <div className="form-field form-field--wide">
          <label htmlFor={`${idPrefix}-description`}>A Few Details</label>
          <textarea
            id={`${idPrefix}-description`}
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Why this matters, where you want to go…"
            rows="3"
          />
        </div>

        <div className="form-field">
          <label htmlFor={`${idPrefix}-category`}>Category</label>
          <input
            id={`${idPrefix}-category`}
            name="category"
            type="text"
            value={form.category}
            onChange={handleChange}
            placeholder="Travel,Skills,Career,Finance,Health,Fitness,Adventure,General"
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor={`${idPrefix}-priority`}>Priority</label>
          <select
            id={`${idPrefix}-priority`}
            name="priority"
            value={form.priority}
            onChange={handleChange}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="form-field form-field--wide">
          <label htmlFor={`${idPrefix}-target-date`}>Target date</label>
          <input
            id={`${idPrefix}-target-date`}
            name="target_date"
            type="date"
            value={form.target_date}
            onChange={handleChange}
          />
        </div>
      </fieldset>

      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="text-button" onClick={onCancel}>
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

export default BucketItemForm;
