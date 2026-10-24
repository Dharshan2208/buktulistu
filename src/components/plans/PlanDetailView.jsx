import { useEffect, useId, useRef, useState } from "react";
import { updatePlan } from "../../api/plansApi.js";
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
  if (Array.isArray(plan?.steps) && plan.steps.length > 0) {
    return plan.steps.map((step, idx) => ({
      id: step.id || `task-${idx + 1}`,
      title: step.title || step.text || `Task ${idx + 1}`,
      description: step.description || null,
      completed: Boolean(step.completed),
    }));
  }

  // Fallback: if plan had legacy phases, flatten tasks
  if (Array.isArray(plan?.phases) && plan.phases.length > 0) {
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
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function PlanDetailView({
  plan,
  isOwner,
  onUpdate,
  onDelete,
  onToast,
  onOptimisticUpdate,
  onServerConfirmed,
  onRollback,
}) {
  const addTaskInputId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteBusy, setIsDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Local task state updated immediately for instant UI response
  const [tasks, setTasks] = useState(() => normalizeTasks(plan));

  // Refs for debouncing, in-flight background persistence, and rollback
  const tasksRef = useRef(tasks);
  const lastConfirmedTasksRef = useRef(tasks);
  const debounceTimerRef = useRef(null);
  const retryTimerRef = useRef(null);
  const isPersistingRef = useRef(false);
  const pendingSyncRef = useRef(false);

  // Sync tasksRef whenever tasks state changes
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Task adding inline form state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const formattedTargetDate = formatTargetDate(plan.target_date);

  // Flush any pending debounced changes when unmounting or navigating away
  useEffect(() => {
    const planId = plan.id;
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;

        const currentTasks = tasksRef.current;
        const stepsPayload = currentTasks.map((t) => ({
          id: t.id,
          text: t.title,
          title: t.title,
          description: t.description || null,
          completed: t.completed,
        }));

        updatePlan(planId, {
          steps: stepsPayload,
          phases: [],
        }).catch((err) => {
          console.error("Flush on unmount failed:", err);
        });
      }

      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [plan.id]);

  function calculateStatus(taskList) {
    const total = taskList.length;
    const completed = taskList.filter((t) => t.completed).length;

    if (total > 0 && completed === total) {
      return "completed";
    }
    if (completed > 0 && plan.status === "not_started") {
      return "in_progress";
    }
    if (completed < total && plan.status === "completed") {
      return "in_progress";
    }
    return plan.status;
  }

  // Central task updater with immediate UI change + debounced background D1 persistence
  function applyTaskChanges(nextTasks, { immediate = false, toastMessage = null } = {}) {
    // 1. Immediately update React state for 0ms UI latency
    setTasks(nextTasks);
    tasksRef.current = nextTasks;
    setActionError(null);

    if (toastMessage) {
      onToast(toastMessage);
    }

    const nextStatus = calculateStatus(nextTasks);

    const stepsPayload = nextTasks.map((t) => ({
      id: t.id,
      text: t.title,
      title: t.title,
      description: t.description || null,
      completed: t.completed,
    }));

    // 2. Immediately update parent plan state without full remount
    onOptimisticUpdate?.(plan.id, {
      steps: stepsPayload,
      phases: [],
      status: nextStatus,
    });

    // 3. Background persistence: debounced for rapid actions, immediate for additions/deletions
    if (immediate) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      triggerBackgroundPersistence(stepsPayload, nextStatus);
    } else {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        triggerBackgroundPersistence(stepsPayload, nextStatus);
      }, 350);
    }
  }

  // Asynchronous background sync with retry & rollback
  async function triggerBackgroundPersistence(stepsPayload, nextStatus, retryCount = 0) {
    // If a network request is already in-flight, queue a sync for when it finishes
    if (isPersistingRef.current) {
      pendingSyncRef.current = true;
      return;
    }

    isPersistingRef.current = true;
    pendingSyncRef.current = false;

    try {
      const updatedPlan = await updatePlan(plan.id, {
        steps: stepsPayload,
        phases: [],
        status: nextStatus,
      });

      // Update confirmed state on success
      lastConfirmedTasksRef.current = normalizeTasks(updatedPlan);
      onServerConfirmed?.(plan.id, updatedPlan);
    } catch (error) {
      console.error("Background D1 persistence error:", error);

      // Auto-retry once after 1 second for transient network issues
      if (retryCount < 1) {
        isPersistingRef.current = false;
        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          triggerBackgroundPersistence(stepsPayload, nextStatus, retryCount + 1);
        }, 1000);
        return;
      }

      // Unrecoverable failure: Roll back local and parent state to last confirmed
      setTasks(lastConfirmedTasksRef.current);
      tasksRef.current = lastConfirmedTasksRef.current;
      onRollback?.(plan.id);

      onToast("Couldn't save changes to server. Please check your connection.");
      setActionError("Unable to save changes to the server. Your tasks have been reverted.");
    } finally {
      isPersistingRef.current = false;

      // If changes occurred while the request was in-flight, send the freshest state now
      if (pendingSyncRef.current) {
        pendingSyncRef.current = false;
        const freshestTasks = tasksRef.current;
        const freshestPayload = freshestTasks.map((t) => ({
          id: t.id,
          text: t.title,
          title: t.title,
          description: t.description || null,
          completed: t.completed,
        }));
        const freshestStatus = calculateStatus(freshestTasks);
        triggerBackgroundPersistence(freshestPayload, freshestStatus);
      }
    }
  }

  function handleToggleTask(taskId) {
    if (!isOwner) return;

    const nextTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task,
    );

    applyTaskChanges(nextTasks, { immediate: false });
  }

  function handleDragStart(event, index) {
    if (!isOwner) return;
    setDraggedIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }

  function handleDragOver(event, index) {
    if (!isOwner) return;
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
    if (!isOwner) return;
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

    // Update order immediately and debounce background persistence
    applyTaskChanges(reordered, { immediate: false, toastMessage: "Tasks reordered" });
  }

  function handleAddTaskSubmit(event) {
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

    // Immediate addition & immediate background sync
    applyTaskChanges(nextTasks, { immediate: true, toastMessage: "Task added" });
  }

  function handleDeleteTask(taskId) {
    if (!isOwner) return;

    const nextTasks = tasks.filter((task) => task.id !== taskId);
    applyTaskChanges(nextTasks, { immediate: true, toastMessage: "Task removed" });
  }

  async function handleEdit(values) {
    // Flush any pending debounced tasks
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const currentTasks = tasksRef.current;
    const stepsPayload = currentTasks.map((t) => ({
      id: t.id,
      text: t.title,
      title: t.title,
      description: t.description || null,
      completed: t.completed,
    }));

    await onUpdate(
      plan.id,
      {
        ...values,
        steps: stepsPayload,
        phases: [],
      },
      { toastMessage: "Plan details updated" },
    );

    setIsEditing(false);
  }

  async function handleDelete() {
    setIsDeleteBusy(true);
    setActionError(null);

    try {
      await onDelete(plan.id);
      navigate("/plans");
    } catch (error) {
      console.error("Unable to delete plan", error);
      setActionError("Couldn't delete this plan. Please try again.");
      setIsDeleteOpen(false);
      setIsDeleteBusy(false);
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
            >
              Edit plan
            </button>
            <button
              type="button"
              className="ghost small"
              data-variant="danger"
              onClick={() => setIsDeleteOpen(true)}
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
              <span className="plan-detail__meta-label">Estimated Duration</span>
              <span className="plan-detail__meta-val">
                ⏱ {plan.estimated_duration}
              </span>
            </div>
          )}
        </div>

        {plan.description && (
          <div className="plan-detail__overview">
            <h2 className="plan-detail__section-title">Overview &amp; Objective</h2>
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
      <section className="plan-detail__tasks" aria-labelledby="tasks-section-title">
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
                      draggable={isOwner}
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
            onClose={() => !isDeleteBusy && setIsDeleteOpen(false)}
            className="confirm-modal"
          >
            <div className="confirm-actions">
              <button
                type="button"
                className="ghost"
                disabled={isDeleteBusy}
                onClick={() => setIsDeleteOpen(false)}
              >
                Keep plan
              </button>
              <SketchButton
                type="button"
                variant="red"
                disabled={isDeleteBusy}
                onClick={handleDelete}
              >
                {isDeleteBusy ? "Deleting…" : "Delete plan"}
              </SketchButton>
            </div>
          </Modal>
        </>
      )}
    </article>
  );
}

export default PlanDetailView;
