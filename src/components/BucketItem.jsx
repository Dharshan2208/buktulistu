import { useState } from "react";
import { formatCategory } from "../categories";
import BucketItemForm from "./BucketItemForm";
import Modal from "./ui/Modal";
import SketchButton from "./ui/SketchButton";
import SketchCard from "./ui/SketchCard";

function BucketItem({ item, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  async function handleToggleCompleted() {
    setIsBusy(true);
    setActionError(null);

    try {
      await onUpdate(item.id, {
        completed: !item.completed,
      });
    } catch (error) {
      console.error("Unable to update bucket-list item", error);
      setActionError("Couldn't update this item. Please try again.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleEdit(values) {
    await onUpdate(item.id, values);
    setIsEditing(false);
  }

  async function handleDelete() {
    setIsBusy(true);
    setActionError(null);

    try {
      await onDelete(item.id);
    } catch (error) {
      console.error("Unable to delete bucket-list item", error);
      setActionError("Couldn't delete this item. Please try again.");
      setIsDeleteOpen(false);
      setIsBusy(false);
    }
  }

  return (
    <li className={item.completed ? "is-completed" : ""}>
      <SketchCard
        className="bucket-card"
        contentClassName="bucket-card__content"
        variant={item.completed ? "green" : "paper"}
        seed={220 + item.id}
      >
        <div className="bucket-card__topline">
          <button
            type="button"
            className="completion-toggle"
            aria-label={
              item.completed
                ? `Mark ${item.title} as incomplete`
                : `Mark ${item.title} as completed`
            }
            aria-pressed={Boolean(item.completed)}
            disabled={isBusy}
            onClick={handleToggleCompleted}
          >
            <span aria-hidden="true">{item.completed ? "✓" : ""}</span>
          </button>

          <span className="category-tag">{formatCategory(item.category)}</span>
        </div>

        <div className="bucket-card__body">
          <h3>{item.title}</h3>
          {item.description && <p>{item.description}</p>}
        </div>

        <div className="bucket-card__footer">
          <div className="bucket-card__actions">
            <button
              type="button"
              className="icon-button"
              aria-label={`Edit ${item.title}`}
              disabled={isBusy}
              onClick={() => setIsEditing(true)}
            >
              <span aria-hidden="true">✎</span>
              <span>Edit</span>
            </button>
            <button
              type="button"
              className="icon-button icon-button--danger"
              aria-label={`Delete ${item.title}`}
              disabled={isBusy}
              onClick={() => setIsDeleteOpen(true)}
            >
              <span aria-hidden="true">⌫</span>
              <span>Delete</span>
            </button>
          </div>
        </div>

        {actionError && (
          <p className="inline-error" role="alert">
            {actionError}
          </p>
        )}
      </SketchCard>

      <Modal
        open={isEditing}
        title="Edit this dream"
        description="Keep the details useful and the goal meaningful."
        onClose={() => setIsEditing(false)}
      >
        <BucketItemForm
          idPrefix={`edit-${item.id}`}
          initialValues={{
            title: item.title,
            description: item.description ?? "",
            category: item.category,
          }}
          onSubmit={handleEdit}
          onCancel={() => setIsEditing(false)}
          submitLabel="Save changes"
          busyLabel="Saving…"
        />
      </Modal>

      <Modal
        open={isDeleteOpen}
        title={`Delete “${item.title}”?`}
        description="This item will be permanently removed from your bucket list."
        onClose={() => !isBusy && setIsDeleteOpen(false)}
        className="confirm-modal"
      >
        <div className="confirm-actions">
          <button
            type="button"
            className="text-button"
            disabled={isBusy}
            onClick={() => setIsDeleteOpen(false)}
          >
            Keep it
          </button>
          <SketchButton
            type="button"
            variant="red"
            disabled={isBusy}
            onClick={handleDelete}
          >
            {isBusy ? "Deleting…" : "Delete item"}
          </SketchButton>
        </div>
      </Modal>
    </li>
  );
}

export default BucketItem;
