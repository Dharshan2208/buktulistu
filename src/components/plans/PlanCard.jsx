import { useState } from "react";
import { formatCategory } from "../../categories.js";
import { navigate } from "../../utils/router.js";
import Modal from "../ui/Modal.jsx";
import SketchButton from "../ui/SketchButton.jsx";
import SketchCard from "../ui/SketchCard.jsx";
import PlanForm from "./PlanForm.jsx";

const STATUS_LABELS = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  archived: "Archived",
};

function formatTargetDate(dateString) {
  if (!dateString) return null;

  try {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return dateString;
  }
}

function PlanCard({ plan, isOwner, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  const isCompleted = plan.status === "completed";
  const formattedDate = formatTargetDate(plan.target_date);

  function handleCardClick(event) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    navigate(`/plans/${plan.id}`);
  }

  function openEdit(event) {
    event.stopPropagation();
    setIsEditing(true);
  }

  function openDelete(event) {
    event.stopPropagation();
    setIsDeleteOpen(true);
  }

  async function handleEdit(values) {
    await onUpdate(plan.id, values);
    setIsEditing(false);
  }

  async function handleDelete() {
    setIsBusy(true);
    setActionError(null);

    try {
      await onDelete(plan.id);
    } catch (error) {
      console.error("Unable to delete plan", error);
      setActionError("Couldn't delete this plan. Please try again.");
      setIsDeleteOpen(false);
      setIsBusy(false);
    }
  }

  return (
    <li
      className={[
        isCompleted ? "is-completed" : "",
        `plan-status--${plan.status}`,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <SketchCard
        className="bucket-card plan-card plan-card--clickable"
        contentClassName="bucket-card__content"
        onClick={handleCardClick}
      >
        <div className="bucket-card__topline">
          <span
            className={`badge plan-badge plan-badge--${plan.status}`}
            data-status={plan.status}
          >
            {STATUS_LABELS[plan.status] ?? plan.status}
          </span>

          <span className="badge outline category-tag--desktop">
            {formatCategory(plan.category)}
          </span>

          {plan.priority === "high" && (
            <span
              className="badge outline plan-priority--high"
              title="High Priority"
            >
              High
            </span>
          )}

          {isOwner && (
            <div className="bucket-card__actions bucket-card__actions--desktop">
              <button
                type="button"
                className="ghost small"
                aria-label={`Edit ${plan.title}`}
                disabled={isBusy}
                onClick={openEdit}
              >
                Edit
              </button>
              <button
                type="button"
                className="ghost small"
                data-variant="danger"
                aria-label={`Delete ${plan.title}`}
                disabled={isBusy}
                onClick={openDelete}
              >
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="bucket-card__body">
          <h3 className="bucket-card__title">
            <a
              href={`/plans/${plan.id}`}
              className="plan-card__link"
              onClick={(e) => {
                e.preventDefault();
                navigate(`/plans/${plan.id}`);
              }}
            >
              {plan.title}
            </a>
          </h3>

          {plan.description && (
            <div className="plan-card__description">
              <p>{plan.description}</p>
            </div>
          )}

          <div className="plan-card__meta-row">
            {formattedDate && (
              <div className="plan-card__target-date">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Target: {formattedDate}</span>
              </div>
            )}

            {plan.estimated_duration && (
              <span className="plan-card__duration">
                ⏱ {plan.estimated_duration}
              </span>
            )}
          </div>

          <div className="plan-card__view-action">
            <span className="plan-card__view-cta">
              View plan <span aria-hidden="true">→</span>
            </span>
          </div>
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
            title="Edit plan"
            description="Update details, timeline, milestones, or roadmap status."
            onClose={() => setIsEditing(false)}
          >
            <PlanForm
              idPrefix={`edit-plan-${plan.id}`}
              initialValues={{
                title: plan.title,
                description: plan.description ?? "",
                category: plan.category || "general",
                status: plan.status,
                priority: plan.priority,
                target_date: plan.target_date ?? "",
                estimated_duration: plan.estimated_duration ?? "",
                steps: plan.steps ?? [],
              }}
              onSubmit={handleEdit}
              onCancel={() => setIsEditing(false)}
              submitLabel="Save changes"
              busyLabel="Saving…"
            />
          </Modal>

          <Modal
            open={isDeleteOpen}
            title={`Delete “${plan.title}”?`}
            description="This plan and its milestones will be permanently removed."
            onClose={() => !isBusy && setIsDeleteOpen(false)}
            className="confirm-modal"
          >
            <div className="confirm-actions">
              <button
                type="button"
                className="ghost"
                disabled={isBusy}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteOpen(false);
                }}
              >
                Keep it
              </button>
              <SketchButton
                type="button"
                variant="red"
                disabled={isBusy}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
              >
                {isBusy ? "Deleting…" : "Delete plan"}
              </SketchButton>
            </div>
          </Modal>
        </>
      )}
    </li>
  );
}

export default PlanCard;
