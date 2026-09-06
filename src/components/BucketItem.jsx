import { useState } from "react";
import BucketItemForm from "./BucketItemForm";

function BucketItem({ item, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  async function handleToggleCompleted() {
    setIsBusy(true);
    setActionError(null);

    try {
      await onUpdate(item.id, {
        completed: !item.completed,
      });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleEdit(values) {
    await onUpdate(item.id, values);
    setIsEditing(false);
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${item.title}" from your bucket list?`,
    );

    if (!confirmed) {
      return;
    }

    setIsBusy(true);
    setActionError(null);

    try {
      await onDelete(item.id);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Something went wrong",
      );
      setIsBusy(false);
    }
  }

  if (isEditing) {
    return (
      <li>
        <BucketItemForm
          idPrefix={`edit-${item.id}`}
          initialValues={{
            title: item.title,
            description: item.description ?? "",
            category: item.category,
            priority: item.priority,
            target_date: item.target_date ?? "",
          }}
          onSubmit={handleEdit}
          onCancel={() => setIsEditing(false)}
          submitLabel="Save changes"
          busyLabel="Saving..."
        />
      </li>
    );
  }

  return (
    <li>
      <h3>{item.title}</h3>

      {item.description && <p>{item.description}</p>}

      <p>Category: {item.category}</p>
      <p>Priority: {item.priority}</p>
      <p>Status: {item.completed ? "Completed" : "Not completed"}</p>

      {item.target_date && <p>Target date: {item.target_date}</p>}

      <div>
        <button type="button" disabled={isBusy} onClick={handleToggleCompleted}>
          {isBusy
            ? "Saving..."
            : item.completed
              ? "Mark incomplete"
              : "Mark complete"}
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => setIsEditing(true)}
        >
          Edit
        </button>

        <button type="button" disabled={isBusy} onClick={handleDelete}>
          {isBusy ? "Working..." : "Delete"}
        </button>
      </div>

      {actionError && <p>Action failed: {actionError}</p>}
    </li>
  );
}

export default BucketItem;
