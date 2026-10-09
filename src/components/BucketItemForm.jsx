import { useState } from "react";
import { CATEGORY_OPTIONS } from "../categories";
import SketchButton from "./ui/SketchButton";

const EMPTY_VALUES = {
  title: "",
  description: "",
  category: "general",
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
  const [fieldErrors, setFieldErrors] = useState({});

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
    setFieldErrors({});

    try {
      await onSubmit({
        title: form.title,
        description: form.description || null,
        category: form.category,
      });

      if (resetAfterSubmit) {
        setForm({ ...EMPTY_VALUES });
      }
    } catch (error) {
      console.error("Unable to save bucket-list item", {
        error,
        requestId: error?.requestId,
      });
      setFormError(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving this item.",
      );
      setFieldErrors(error?.fields ?? {});
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
          <label htmlFor={`${idPrefix}-description`}>A Few Details</label>
          <textarea
            id={`${idPrefix}-description`}
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Why this matters, where you want to go…"
            rows="3"
            maxLength="1000"
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

        <div className="form-field form-field--wide">
          <label htmlFor={`${idPrefix}-category`}>Category</label>
          <select
              id={`${idPrefix}-category`}
              name="category"
              value={form.category}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.category)}
              aria-describedby={
                fieldErrors.category
                  ? `${idPrefix}-category-error`
                  : undefined
              }
            >
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          {fieldErrors.category && (
            <p id={`${idPrefix}-category-error`} className="field-error">
              {fieldErrors.category}
            </p>
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

export default BucketItemForm;
