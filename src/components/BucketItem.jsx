import { useEffect, useId, useRef, useState } from "react";
import { formatCategory } from "../categories";
import BucketItemForm from "./BucketItemForm";
import Modal from "./ui/Modal";
import SketchButton from "./ui/SketchButton";
import SketchCard from "./ui/SketchCard";

function BucketItem({ item, isOwner, onUpdate, onDelete }) {
  const generatedId = useId();
  const detailsId = `bucket-item-details-${generatedId}`;
  const actionMenuRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    function closeActionMenu(event) {
      if (!actionMenuRef.current?.contains(event.target)) {
        actionMenuRef.current?.removeAttribute("open");
      }
    }

    document.addEventListener("pointerdown", closeActionMenu);
    return () => document.removeEventListener("pointerdown", closeActionMenu);
  }, []);

  function openEdit() {
    actionMenuRef.current?.removeAttribute("open");
    setIsEditing(true);
  }

  function openDelete() {
    actionMenuRef.current?.removeAttribute("open");
    setIsDeleteOpen(true);
  }

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
    <li
      className={[
        item.completed ? "is-completed" : "",
        isExpanded ? "is-expanded" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <SketchCard
        className="bucket-card"
        contentClassName="bucket-card__content"
        variant={item.completed ? "green" : "paper"}
        seed={220 + item.id}
      >
        <div className="bucket-card__topline">
          {isOwner ? (
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
          ) : (
            <span
              className="completion-indicator"
              data-completed={item.completed}
              aria-label={item.completed ? "Completed" : "Not completed"}
              title={item.completed ? "Completed" : "Not completed"}
            >
              <span aria-hidden="true">{item.completed ? "✓" : ""}</span>
            </span>
          )}

          <span className="category-tag category-tag--desktop">
            {formatCategory(item.category)}
          </span>

          {isOwner && (
            <div className="bucket-card__actions bucket-card__actions--desktop">
              <button
                type="button"
                className="icon-button"
                aria-label={`Edit ${item.title}`}
                disabled={isBusy}
                onClick={openEdit}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 20h4l11-11-4-4L4 16v4Z" />
                  <path d="m13.5 6.5 4 4" />
                </svg>
              </button>
              <button
                type="button"
                className="icon-button icon-button--danger"
                aria-label={`Delete ${item.title}`}
                disabled={isBusy}
                onClick={openDelete}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 7h16" />
                  <path d="M9 7V4h6v3" />
                  <path d="m6 7 1 13h10l1-13" />
                  <path d="M10 11v5M14 11v5" />
                </svg>
              </button>
            </div>
          )}

          {isOwner && (
            <details ref={actionMenuRef} className="card-action-menu">
              <summary aria-label={`Open actions for ${item.title}`}>
                <span aria-hidden="true">•••</span>
              </summary>
              <div className="card-action-menu__panel">
                <button type="button" disabled={isBusy} onClick={openEdit}>
                  Edit dream
                </button>
                <button
                  type="button"
                  className="is-danger"
                  disabled={isBusy}
                  onClick={openDelete}
                >
                  Delete dream
                </button>
              </div>
            </details>
          )}
        </div>

        <div className="bucket-card__body">
          {item.description ? (
            <>
              <h3 className="bucket-card__title">
                <button
                  type="button"
                  className="bucket-card__summary"
                  aria-expanded={isExpanded}
                  aria-controls={detailsId}
                  aria-label={`${isExpanded ? "Hide" : "Show"} details for ${item.title}`}
                  onClick={() => setIsExpanded((expanded) => !expanded)}
                >
                  <span>{item.title}</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m7 9.5 5 5 5-5" />
                  </svg>
                </button>
              </h3>
              <span className="category-tag category-tag--mobile">
                {formatCategory(item.category)}
              </span>
              <div
                id={detailsId}
                className="bucket-card__details"
                hidden={!isExpanded}
              >
                <p>{item.description}</p>
              </div>
            </>
          ) : (
            <>
              <h3 className="bucket-card__title">{item.title}</h3>
              <span className="category-tag category-tag--mobile">
                {formatCategory(item.category)}
              </span>
            </>
          )}
        </div>

        {actionError && (
          <p className="inline-error" role="alert">
            {actionError}
          </p>
        )}
      </SketchCard>

      {isOwner && (
        <>
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
        </>
      )}
    </li>
  );
}

export default BucketItem;
