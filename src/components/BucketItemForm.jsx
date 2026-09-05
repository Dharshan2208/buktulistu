import { useState } from "react";

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
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <fieldset disabled={isSubmitting}>
        <div>
          <label htmlFor={`${idPrefix}-title`}>Title</label>
          <input
            id={`${idPrefix}-title`}
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor={`${idPrefix}-description`}>Description</label>
          <textarea
            id={`${idPrefix}-description`}
            name="description"
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor={`${idPrefix}-category`}>Category</label>
          <input
            id={`${idPrefix}-category`}
            name="category"
            type="text"
            value={form.category}
            onChange={handleChange}
            required
          />
        </div>

        <div>
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

        <div>
          <label htmlFor={`${idPrefix}-target-date`}>Target date</label>
          <input
            id={`${idPrefix}-target-date`}
            name="target_date"
            type="date"
            value={form.target_date}
            onChange={handleChange}
          />
        </div>

        <button type="submit">{isSubmitting ? busyLabel : submitLabel}</button>

        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </fieldset>

      {formError && <p>Could not save item: {formError}</p>}
    </form>
  );
}

export default BucketItemForm;
