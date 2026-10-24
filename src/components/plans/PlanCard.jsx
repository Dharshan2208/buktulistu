import { useState } from "react";
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

  const steps = Array.isArray(plan.steps) ? plan.steps : [];
  const totalSteps = steps.length;
  const completedSteps = steps.filter((step) => step.completed).length;
  const isCompleted = plan.status === "completed";
  const formattedDate = formatTargetDate(plan.target_date);

  function openEdit() {
    setIsEditing(true);
  }

  function openDelete() {
    setIsDeleteOpen(true);
  }

  async function handleToggleStep(stepId) {
    if (!isOwner || isBusy) return;

    const nextSteps = steps.map((step) =>
      step.id === stepId ? { ...step, completed: !step.completed } : step,
    );

    let nextStatus = plan.status;
    const allDone = nextSteps.length > 0 && nextSteps.every((s) => s.completed);
    const someDone = nextSteps.some((s) => s.completed);

    if (allDone && plan.status !== "completed") {
      nextStatus = "completed";
    } else if (!allDone && plan.status === "completed") {
      nextStatus = "in_progress";
    } else if (someDone && plan.status === "not_started") {
      nextStatus = "in_progress";
    }

    setIsBusy(true);
    setActionError(null);

    try {
      await onUpdate(plan.id, {
        steps: nextSteps,
        status: nextStatus,
      });
    } catch (error) {
      console.error("Unable to update step", error);
      setActionError("Couldn't update step. Please try again.");
    } finally {
      setIsBusy(false);
    }
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
        className="bucket-card plan-card"
        contentClassName="bucket-card__content"
      >
        <div className="bucket-card__topline">
          <span
            className={`badge plan-badge plan-badge--${plan.status}`}
            data-status={plan.status}
          >
            {STATUS_LABELS[plan.status] ?? plan.status}
          </span>

          {plan.priority === "high" && (
            <span className="badge outline plan-priority--high" title="High Priority">
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
          <h3 className="bucket-card__title">{plan.title}</h3>

          {plan.description && (
            <div className="plan-card__description">
              <p>{plan.description}</p>
            </div>
          )}

          {totalSteps > 0 && (
            <div className="plan-card__progress-wrap">
              <div className="plan-card__progress-info">
                <span className="plan-card__progress-label">Milestones</span>
                <span className="plan-card__progress-count">
                  {completedSteps}/{totalSteps}
                </span>
              </div>
              <progress
                value={completedSteps}
                max={totalSteps}
                aria-label={`${completedSteps} of ${totalSteps} steps completed`}
              />
            </div>
          )}

          {totalSteps > 0 && (
            <ul className="plan-card__steps-checklist" aria-label="Checklist steps">
              {steps.map((step) => (
                <li
                  key={step.id}
                  className={`plan-card__step-row ${step.completed ? "is-step-completed" : ""}`}
                >
                  {isOwner ? (
                    <button
                      type="button"
                      className="step-check-btn"
                      aria-label={
                        step.completed
                          ? `Mark "${step.text}" as incomplete`
                          : `Mark "${step.text}" as complete`
                      }
                      aria-pressed={Boolean(step.completed)}
                      disabled={isBusy}
                      onClick={() => handleToggleStep(step.id)}
                    >
                      <span aria-hidden="true">{step.completed ? "✓" : ""}</span>
                    </button>
                  ) : (
                    <span
                      className="step-check-indicator"
                      data-completed={step.completed}
                      aria-label={step.completed ? "Step completed" : "Step to do"}
                    >
                      <span aria-hidden="true">{step.completed ? "✓" : ""}</span>
                    </span>
                  )}
                  <span className="plan-card__step-text">{step.text}</span>
                </li>
              ))}
            </ul>
          )}

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
