import { useId, useMemo, useState } from "react";
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

function normalizeTasks(plan) {
  if (Array.isArray(plan.steps) && plan.steps.length > 0) {
    return plan.steps.map((step, idx) => ({
      id: step.id || `task-${idx + 1}`,
      title: step.title || step.text || `Task ${idx + 1}`,
      description: step.description || null,
      completed: Boolean(step.completed),
    }));
  }

  // Fallback: if plan only had legacy phases, flatten tasks
  if (Array.isArray(plan.phases) && plan.phases.length > 0) {
    const flattened = [];
    for (const phase of plan.phases) {
      if (Array.isArray(phase.tasks)) {
        for (const task of phase.tasks) {
          flattened.push({
            id: task.id || createId("task"),
            title: task.title || task.text || "Task",
            description: task.description || null,
            completed: Boolean(task.completed),
          });
        }
      }
    }
    if (flattened.length > 0) return flattened;
  }

  return [];
}

function createId(prefix) {
  return `${prefix}-${Date.now()}`;
}

function PlanDetailView({ plan, isOwner, onUpdate, onDelete, onToast }) {
  const addTaskInputId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Task adding state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const tasks = useMemo(() => normalizeTasks(plan), [plan]);
  const formattedTargetDate = formatTargetDate(plan.target_date);

  function handleDragStart(event, index) {
    if (!isOwner || isBusy) return;
    setDraggedIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }

  function handleDragOver(event, index) {
    if (!isOwner || isBusy) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function handleDrop(event, targetIndex) {
    event.preventDefault();
    if (!isOwner || isBusy) return;
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...tasks];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    setDraggedIndex(null);
    setDragOverIndex(null);

    persistTasks(reordered);
    onToast("Tasks reordered");
  }

  async function persistTasks(nextTasks) {
    setIsBusy(true);
    setActionError(null);

    const totalTasks = nextTasks.length;
    const completedTasks = nextTasks.filter((t) => t.completed).length;

    let nextStatus = plan.status;
    if (totalTasks > 0 && completedTasks === totalTasks) {
      nextStatus = "completed";
    } else if (completedTasks > 0 && plan.status === "not_started") {
      nextStatus = "in_progress";
    } else if (completedTasks < totalTasks && plan.status === "completed") {
      nextStatus = "in_progress";
    }

    const stepsPayload = nextTasks.map((t) => ({
      id: t.id,
      text: t.title,
      title: t.title,
      description: t.description || null,
      completed: t.completed,
    }));

    try {
      await onUpdate(plan.id, {
        steps: stepsPayload,
        phases: [],
        status: nextStatus,
      });
    } catch (error) {
      console.error("Unable to update tasks", error);
      setActionError("Failed to save changes. Please try again.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleToggleTask(taskId) {
    if (!isOwner || isBusy) return;

    const nextTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task,
    );

    await persistTasks(nextTasks);
  }

  async function handleAddTaskSubmit(event) {
    event.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;

    const newTask = {
      id: createId("task"),
      title,
      description: newTaskDesc.trim() || null,
      completed: false,
    };

    const nextTasks = [...tasks, newTask];
    setNewTaskTitle("");
    setNewTaskDesc("");
    setIsAddingTask(false);

    await persistTasks(nextTasks);
    onToast("Task added");
  }

  async function handleDeleteTask(taskId) {
    if (!isOwner || isBusy) return;

    const nextTasks = tasks.filter((task) => task.id !== taskId);
    await persistTasks(nextTasks);
    onToast("Task removed");
  }

  async function handleEdit(values) {
    await onUpdate(plan.id, values);
    setIsEditing(false);
    onToast("Plan details updated");
  }

  async function handleDelete() {
    setIsBusy(true);
    setActionError(null);

    try {
      await onDelete(plan.id);
      navigate("/plans");
    } catch (error) {
      console.error("Unable to delete plan", error);
      setActionError("Couldn't delete this plan. Please try again.");
      setIsDeleteOpen(false);
      setIsBusy(false);
    }
  }

  return (
    <article className="plan-detail" aria-labelledby="plan-detail-title">
      {/* Back button and quick actions */}
      <div className="plan-detail__nav">
        <button
          type="button"
          className="ghost small plan-detail__back-btn"
          onClick={() => navigate("/plans")}
          aria-label="Back to all plans"
        >
          <span aria-hidden="true">←</span> Back to plans
        </button>

        {isOwner && (
          <div className="plan-detail__top-actions">
            <button
              type="button"
              className="ghost small"
              onClick={() => setIsEditing(true)}
              disabled={isBusy}
            >
              Edit plan
            </button>
            <button
              type="button"
              className="ghost small"
              data-variant="danger"
              onClick={() => setIsDeleteOpen(true)}
              disabled={isBusy}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Main Plan Header banner */}
      <header className="plan-detail__header">
        <div className="plan-detail__badges">
          <span
            className={`badge plan-badge plan-badge--${plan.status}`}
            data-status={plan.status}
          >
            {STATUS_LABELS[plan.status] ?? plan.status}
          </span>

          <span className="badge outline">{formatCategory(plan.category)}</span>

          {plan.priority === "high" && (
            <span
              className="badge outline plan-priority--high"
              title="High Priority"
            >
              High Priority
            </span>
          )}
        </div>

        <h1 id="plan-detail-title" className="plan-detail__title">
          {plan.title}
        </h1>

        <div className="plan-detail__meta-grid">
          {formattedTargetDate && (
            <div className="plan-detail__meta-item">
              <span className="plan-detail__meta-label">Target Deadline</span>
              <span className="plan-detail__meta-val">
                {formattedTargetDate}
              </span>
            </div>
          )}

          {plan.estimated_duration && (
            <div className="plan-detail__meta-item">
              <span className="plan-detail__meta-label">
                Estimated Duration
              </span>
              <span className="plan-detail__meta-val">
                ⏱ {plan.estimated_duration}
              </span>
            </div>
          )}
        </div>

        {plan.description && (
          <div className="plan-detail__overview">
            <h2 className="plan-detail__section-title">
              Overview &amp; Objective
            </h2>
            <p className="plan-detail__overview-text">{plan.description}</p>
          </div>
        )}
      </header>

      {actionError && (
        <p className="inline-error" role="alert">
          {actionError}
        </p>
      )}

      {/* Direct Tasks Section (No Phases) */}
      <section
        className="plan-detail__tasks"
        aria-labelledby="tasks-section-title"
      >
        <div className="section-heading">
          <div>
            <h2 id="tasks-section-title">Tasks &amp; Action Items</h2>
          </div>
          {isOwner && !isAddingTask && (
            <button
              type="button"
              className="ghost small"
              onClick={() => setIsAddingTask(true)}
            >
              ＋ Add task
            </button>
          )}
        </div>

        {tasks.length === 0 && !isAddingTask ? (
          <SketchCard variant="paper" dashed className="state-card">
            <span className="state-card__mark" aria-hidden="true">
              ○
            </span>
            <h3>No tasks yet</h3>
            <p>Add action items and milestones to track your progress.</p>
            {isOwner && (
              <SketchButton
                type="button"
                variant="yellow"
                onClick={() => setIsAddingTask(true)}
              >
                Add first task
              </SketchButton>
            )}
          </SketchCard>
        ) : (
          <div className="plan-tasks-container">
            {tasks.length > 0 && (
              <ul className="plan-tasks-list" aria-label="Tasks list">
                {tasks.map((task, index) => {
                  const isDragging = draggedIndex === index;
                  const isDragOver =
                    dragOverIndex === index && draggedIndex !== index;

                  return (
                    <li
                      key={task.id}
                      draggable={isOwner && !isBusy}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`plan-task-item ${
                        task.completed ? "is-task-completed" : ""
                      } ${isDragging ? "is-dragging" : ""} ${
                        isDragOver ? "is-drag-over" : ""
                      }`}
                    >
                      <div className="plan-task-item__main">
                        {isOwner && (
                          <span
                            className="plan-task-item__drag-handle"
                            aria-hidden="true"
                            title="Drag to rearrange"
                          >
                            <svg
                              width="10"
                              height="14"
                              viewBox="0 0 10 14"
                              fill="currentColor"
                            >
                              <circle cx="3" cy="3" r="1.5" />
                              <circle cx="7" cy="3" r="1.5" />
                              <circle cx="3" cy="7" r="1.5" />
                              <circle cx="7" cy="7" r="1.5" />
                              <circle cx="3" cy="11" r="1.5" />
                              <circle cx="7" cy="11" r="1.5" />
                            </svg>
                          </span>
                        )}

                        {isOwner ? (
                          <button
                            type="button"
                            className="step-check-btn"
                            aria-label={
                              task.completed
                                ? `Mark "${task.title}" as incomplete`
                                : `Mark "${task.title}" as complete`
                            }
                            aria-pressed={task.completed}
                            disabled={isBusy}
                            onClick={() => handleToggleTask(task.id)}
                          >
                            <span aria-hidden="true">
                              {task.completed ? "✓" : ""}
                            </span>
                          </button>
                        ) : (
                          <span
                            className="step-check-indicator"
                            data-completed={task.completed}
                            aria-label={
                              task.completed ? "Completed task" : "Pending task"
                            }
                          >
                            <span aria-hidden="true">
                              {task.completed ? "✓" : ""}
                            </span>
                          </span>
                        )}

                        <div className="plan-task-item__body">
                          <div className="plan-task-item__header-line">
                            <span className="plan-task-item__title">
                              {task.title}
                            </span>
                            {isOwner && (
                              <button
                                type="button"
                                className="ghost small plan-task-item__delete-btn"
                                aria-label={`Delete "${task.title}"`}
                                disabled={isBusy}
                                onClick={() => handleDeleteTask(task.id)}
                                title="Delete task"
                              >
                                ✕
                              </button>
                            )}
                          </div>

                          {task.description && (
                            <p className="plan-task-item__desc">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {isOwner && isAddingTask && (
              <div className="plan-inline-task-wrap">
                <form
                  className="plan-inline-task-form"
                  onSubmit={handleAddTaskSubmit}
                >
                  <div className="form-field">
                    <label htmlFor={addTaskInputId}>Task Title</label>
                    <input
                      id={addTaskInputId}
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="e.g. Book reservations or confirm equipment…"
                      required
                      autoFocus
                      maxLength="140"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="inline-task-desc">Notes (Optional)</label>
                    <input
                      id="inline-task-desc"
                      type="text"
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      placeholder="Details or checklist notes…"
                      maxLength="300"
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="ghost small"
                      onClick={() => {
                        setIsAddingTask(false);
                        setNewTaskTitle("");
                        setNewTaskDesc("");
                      }}
                    >
                      Cancel
                    </button>
                    <SketchButton
                      type="submit"
                      variant="yellow"
                      disabled={!newTaskTitle.trim()}
                    >
                      Add task
                    </SketchButton>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Owner Modals */}
      {isOwner && (
        <>
          {/* Modal to edit plan metadata */}
          <Modal
            open={isEditing}
            title="Edit plan"
            description="Update overall objective, duration, timeline, or category."
            onClose={() => setIsEditing(false)}
          >
            <PlanForm
              idPrefix={`edit-detail-${plan.id}`}
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

          {/* Delete confirmation modal */}
          <Modal
            open={isDeleteOpen}
            title={`Delete “${plan.title}”?`}
            description="This plan and all its tasks will be permanently removed."
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
                Keep plan
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
    </article>
  );
}

export default PlanDetailView;
