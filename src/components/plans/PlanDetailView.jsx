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

function isOverdue(dateString, isCompleted) {
  if (!dateString || isCompleted) return false;
  try {
    const [year, month, day] = dateString.split("-").map(Number);
    const target = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
    return Date.now() > target.getTime();
  } catch {
    return false;
  }
}

function normalizePhases(plan) {
  if (Array.isArray(plan.phases) && plan.phases.length > 0) {
    return plan.phases;
  }

  if (Array.isArray(plan.steps) && plan.steps.length > 0) {
    return [
      {
        id: "phase-1",
        title: "Milestones & Execution",
        description: "Core roadmap milestones and action items",
        target_date: plan.target_date || null,
        tasks: plan.steps.map((step, idx) => ({
          id: step.id || String(idx + 1),
          title: step.text || step.title || `Task ${idx + 1}`,
          description: null,
          deadline: null,
          completed: Boolean(step.completed),
          subtasks: [],
        })),
      },
    ];
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

  // Phase adding state
  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [newPhaseTitle, setNewPhaseTitle] = useState("");
  const [newPhaseDesc, setNewPhaseDesc] = useState("");
  const [newPhaseDate, setNewPhaseDate] = useState("");

  // Task adding state per phase
  const [activePhaseForTask, setActivePhaseForTask] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");

  const phases = useMemo(() => normalizePhases(plan), [plan]);

  // Comprehensive progress calculation
  const stats = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    let totalPhases = phases.length;
    let completedPhases = 0;

    for (const phase of phases) {
      const tasks = Array.isArray(phase.tasks) ? phase.tasks : [];
      const phaseTotal = tasks.length;
      const phaseCompleted = tasks.filter((t) => t.completed).length;

      totalTasks += phaseTotal;
      completedTasks += phaseCompleted;

      if (phaseTotal > 0 && phaseCompleted === phaseTotal) {
        completedPhases += 1;
      }
    }

    const taskPercent =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      totalPhases,
      completedPhases,
      taskPercent,
    };
  }, [phases]);

  const formattedTargetDate = formatTargetDate(plan.target_date);

  async function handleToggleTask(phaseId, taskId) {
    if (!isOwner || isBusy) return;

    const nextPhases = phases.map((phase) => {
      if (phase.id !== phaseId) return phase;

      const nextTasks = (phase.tasks || []).map((task) => {
        if (task.id !== taskId) return task;
        const nextCompleted = !task.completed;
        // Also update subtasks if completing the parent task
        const nextSubtasks = (task.subtasks || []).map((sub) => ({
          ...sub,
          completed: nextCompleted,
        }));
        return {
          ...task,
          completed: nextCompleted,
          subtasks: nextSubtasks,
        };
      });

      return { ...phase, tasks: nextTasks };
    });

    await persistPhases(nextPhases);
  }

  async function handleToggleSubtask(phaseId, taskId, subtaskId) {
    if (!isOwner || isBusy) return;

    const nextPhases = phases.map((phase) => {
      if (phase.id !== phaseId) return phase;

      const nextTasks = (phase.tasks || []).map((task) => {
        if (task.id !== taskId) return task;

        const nextSubtasks = (task.subtasks || []).map((sub) =>
          sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub,
        );

        // If all subtasks are complete, mark task complete; otherwise keep as is
        const allSubsDone =
          nextSubtasks.length > 0 && nextSubtasks.every((s) => s.completed);

        return {
          ...task,
          completed: allSubsDone ? true : task.completed,
          subtasks: nextSubtasks,
        };
      });

      return { ...phase, tasks: nextTasks };
    });

    await persistPhases(nextPhases);
  }

  async function persistPhases(nextPhases) {
    setIsBusy(true);
    setActionError(null);

    // Calculate next status
    let totalTasks = 0;
    let completedTasks = 0;

    for (const phase of nextPhases) {
      for (const task of phase.tasks || []) {
        totalTasks += 1;
        if (task.completed) completedTasks += 1;
      }
    }

    let nextStatus = plan.status;
    if (totalTasks > 0 && completedTasks === totalTasks) {
      nextStatus = "completed";
    } else if (completedTasks > 0 && plan.status === "not_started") {
      nextStatus = "in_progress";
    } else if (completedTasks < totalTasks && plan.status === "completed") {
      nextStatus = "in_progress";
    }

    // Keep flat steps in sync for backwards-compatible consumers
    const flatSteps = [];
    for (const phase of nextPhases) {
      for (const task of phase.tasks || []) {
        flatSteps.push({
          id: task.id,
          text: task.title,
          completed: task.completed,
        });
      }
    }

    try {
      await onUpdate(plan.id, {
        phases: nextPhases,
        steps: flatSteps,
        status: nextStatus,
      });
    } catch (error) {
      console.error("Unable to update roadmap", error);
      setActionError("Failed to save changes. Please try again.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAddPhaseSubmit(event) {
    event.preventDefault();
    const title = newPhaseTitle.trim();
    if (!title) return;

    const newPhase = {
      id: createId("phase"),
      title,
      description: newPhaseDesc.trim() || null,
      target_date: newPhaseDate || null,
      tasks: [],
    };

    const nextPhases = [...phases, newPhase];
    setNewPhaseTitle("");
    setNewPhaseDesc("");
    setNewPhaseDate("");
    setIsAddingPhase(false);

    await persistPhases(nextPhases);
    onToast("New phase added");
  }

  async function handleAddTaskSubmit(event) {
    event.preventDefault();
    const title = newTaskTitle.trim();
    if (!title || !activePhaseForTask) return;

    const newTask = {
      id: createId("task"),
      title,
      description: newTaskDesc.trim() || null,
      deadline: newTaskDeadline || null,
      completed: false,
      subtasks: [],
    };

    const nextPhases = phases.map((phase) =>
      phase.id === activePhaseForTask
        ? { ...phase, tasks: [...(phase.tasks || []), newTask] }
        : phase,
    );

    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskDeadline("");
    setActivePhaseForTask(null);

    await persistPhases(nextPhases);
    onToast("Task added");
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
              title="High Priority Roadmap"
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

          <div className="plan-detail__meta-item">
            <span className="plan-detail__meta-label">Overall Progress</span>
            <span className="plan-detail__meta-val">
              {stats.completedTasks} of {stats.totalTasks} tasks (
              {stats.taskPercent}%)
            </span>
          </div>
        </div>

        {plan.description && (
          <div className="plan-detail__overview">
            <h2 className="plan-detail__section-title">
              Overview &amp; Objective
            </h2>
            <p className="plan-detail__overview-text">{plan.description}</p>
          </div>
        )}

        {/* Big visual progress meter */}
        <div className="plan-detail__meter-box">
          <div className="plan-detail__meter-info">
            <span className="plan-detail__meter-percent">
              {stats.taskPercent}% Complete
            </span>
            <span className="plan-detail__meter-counts">
              {stats.completedPhases}/{stats.totalPhases} phases done ·{" "}
              {stats.completedTasks}/{stats.totalTasks} tasks done
            </span>
          </div>
          <progress
            value={stats.completedTasks}
            max={stats.totalTasks || 1}
            aria-label={`${stats.completedTasks} of ${stats.totalTasks} tasks completed`}
          />
        </div>
      </header>

      {actionError && (
        <p className="inline-error" role="alert">
          {actionError}
        </p>
      )}

      {/* Roadmap & Phases Section */}
      <section
        className="plan-detail__roadmap"
        aria-labelledby="roadmap-section-title"
      >
        <div className="section-heading">
          <div>
            <h2 id="roadmap-section-title">Execution Roadmap &amp; Timeline</h2>
          </div>
          {isOwner && (
            <button
              type="button"
              className="ghost small"
              onClick={() => setIsAddingPhase(true)}
            >
              ＋ Add phase
            </button>
          )}
        </div>

        {phases.length === 0 ? (
          <SketchCard variant="paper" dashed className="state-card">
            <span className="state-card__mark" aria-hidden="true">
              ○
            </span>
            <h3>No roadmap phases yet</h3>
            <p>
              Break down this plan into sequential phases, milestones, and
              actionable tasks.
            </p>
            {isOwner && (
              <SketchButton
                type="button"
                variant="yellow"
                onClick={() => setIsAddingPhase(true)}
              >
                Create Phase 1
              </SketchButton>
            )}
          </SketchCard>
        ) : (
          <div className="plan-timeline">
            {phases.map((phase, phaseIndex) => {
              const phaseTasks = Array.isArray(phase.tasks) ? phase.tasks : [];
              const phaseDone = phaseTasks.filter((t) => t.completed).length;
              const isPhaseComplete =
                phaseTasks.length > 0 && phaseDone === phaseTasks.length;
              const formattedPhaseDate = formatTargetDate(phase.target_date);

              return (
                <div
                  key={phase.id || phaseIndex}
                  className={`plan-timeline__node ${
                    isPhaseComplete ? "is-phase-complete" : ""
                  }`}
                >
                  {/* Timeline spine dot */}
                  <div
                    className="plan-timeline__bullet"
                    aria-hidden="true"
                    data-completed={isPhaseComplete}
                  >
                    {isPhaseComplete ? "✓" : phaseIndex + 1}
                  </div>

                  <SketchCard
                    className="plan-phase-card"
                    contentClassName="plan-phase-card__content"
                  >
                    <header className="plan-phase-card__header">
                      <div className="plan-phase-card__top">
                        <span className="badge outline">
                          Phase {phaseIndex + 1}
                        </span>
                        {formattedPhaseDate && (
                          <span className="plan-phase-card__date">
                            By {formattedPhaseDate}
                          </span>
                        )}
                        <span className="badge outline plan-phase-card__count">
                          {phaseDone}/{phaseTasks.length} tasks
                        </span>
                      </div>

                      <h3 className="plan-phase-card__title">{phase.title}</h3>

                      {phase.description && (
                        <p className="plan-phase-card__desc">
                          {phase.description}
                        </p>
                      )}
                    </header>

                    {/* Tasks list in this phase */}
                    <div className="plan-phase-card__tasks">
                      <ul
                        className="plan-phase-card__task-list"
                        aria-label={`Tasks for ${phase.title}`}
                      >
                        {phaseTasks.map((task) => {
                          const formattedDeadline = formatTargetDate(
                            task.deadline,
                          );
                          const overdue = isOverdue(
                            task.deadline,
                            task.completed,
                          );
                          const subtasks = Array.isArray(task.subtasks)
                            ? task.subtasks
                            : [];

                          return (
                            <li
                              key={task.id}
                              className={`plan-task-item ${
                                task.completed ? "is-task-completed" : ""
                              }`}
                            >
                              <div className="plan-task-item__main">
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
                                    onClick={() =>
                                      handleToggleTask(phase.id, task.id)
                                    }
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
                                      task.completed
                                        ? "Completed task"
                                        : "Pending task"
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

                                    {formattedDeadline && (
                                      <span
                                        className={`badge outline plan-task-item__deadline ${
                                          overdue ? "is-overdue" : ""
                                        }`}
                                        title={
                                          overdue
                                            ? "Overdue milestone"
                                            : "Target deadline"
                                        }
                                      >
                                        {overdue && "⚠️ "}Due{" "}
                                        {formattedDeadline}
                                      </span>
                                    )}
                                  </div>

                                  {task.description && (
                                    <p className="plan-task-item__desc">
                                      {task.description}
                                    </p>
                                  )}

                                  {/* Subtasks if present */}
                                  {subtasks.length > 0 && (
                                    <ul
                                      className="plan-subtasks-list"
                                      aria-label={`Subtasks for ${task.title}`}
                                    >
                                      {subtasks.map((sub) => (
                                        <li
                                          key={sub.id}
                                          className={`plan-subtask-item ${
                                            sub.completed
                                              ? "is-subtask-completed"
                                              : ""
                                          }`}
                                        >
                                          {isOwner ? (
                                            <button
                                              type="button"
                                              className="subtask-check-btn"
                                              aria-label={
                                                sub.completed
                                                  ? `Mark "${sub.title}" as incomplete`
                                                  : `Mark "${sub.title}" as complete`
                                              }
                                              disabled={isBusy}
                                              onClick={() =>
                                                handleToggleSubtask(
                                                  phase.id,
                                                  task.id,
                                                  sub.id,
                                                )
                                              }
                                            >
                                              <span aria-hidden="true">
                                                {sub.completed ? "✓" : ""}
                                              </span>
                                            </button>
                                          ) : (
                                            <span
                                              className="subtask-check-indicator"
                                              data-completed={sub.completed}
                                            >
                                              <span aria-hidden="true">
                                                {sub.completed ? "✓" : ""}
                                              </span>
                                            </span>
                                          )}
                                          <span className="plan-subtask-item__title">
                                            {sub.title}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>

                      {/* Add task button or form for this phase */}
                      {isOwner && (
                        <div className="plan-phase-card__add-task-wrap">
                          {activePhaseForTask === phase.id ? (
                            <form
                              className="plan-inline-task-form"
                              onSubmit={handleAddTaskSubmit}
                            >
                              <div className="form-field">
                                <label htmlFor={addTaskInputId}>
                                  Task Title
                                </label>
                                <input
                                  id={addTaskInputId}
                                  type="text"
                                  value={newTaskTitle}
                                  onChange={(e) =>
                                    setNewTaskTitle(e.target.value)
                                  }
                                  placeholder="e.g. Confirm lodging reservations…"
                                  required
                                  autoFocus
                                  maxLength="140"
                                />
                              </div>

                              <div className="form-grid-row">
                                <div className="form-field">
                                  <label htmlFor="inline-task-desc">
                                    Notes (Optional)
                                  </label>
                                  <input
                                    id="inline-task-desc"
                                    type="text"
                                    value={newTaskDesc}
                                    onChange={(e) =>
                                      setNewTaskDesc(e.target.value)
                                    }
                                    placeholder="Details or checklist tips…"
                                    maxLength="300"
                                  />
                                </div>

                                <div className="form-field">
                                  <label htmlFor="inline-task-deadline">
                                    Deadline (Optional)
                                  </label>
                                  <input
                                    id="inline-task-deadline"
                                    type="date"
                                    value={newTaskDeadline}
                                    onChange={(e) =>
                                      setNewTaskDeadline(e.target.value)
                                    }
                                  />
                                </div>
                              </div>

                              <div className="form-actions">
                                <button
                                  type="button"
                                  className="ghost small"
                                  onClick={() => setActivePhaseForTask(null)}
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
                          ) : (
                            <button
                              type="button"
                              className="ghost small plan-phase-card__add-task-btn"
                              onClick={() => setActivePhaseForTask(phase.id)}
                            >
                              ＋ Add task to this phase
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </SketchCard>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Owner Modals */}
      {isOwner && (
        <>
          {/* Modal to add a new phase */}
          <Modal
            open={isAddingPhase}
            title="Add a new phase"
            description="Define a chronological milestone phase in this plan's roadmap."
            onClose={() => setIsAddingPhase(false)}
          >
            <form onSubmit={handleAddPhaseSubmit} className="item-form">
              <div className="form-field form-field--wide">
                <label htmlFor="new-phase-title">Phase Title</label>
                <input
                  id="new-phase-title"
                  type="text"
                  value={newPhaseTitle}
                  onChange={(e) => setNewPhaseTitle(e.target.value)}
                  placeholder="e.g. Phase 2: Logistics & Booking"
                  required
                  autoFocus
                  maxLength="120"
                />
              </div>

              <div className="form-field form-field--wide">
                <label htmlFor="new-phase-desc">Description (Optional)</label>
                <textarea
                  id="new-phase-desc"
                  value={newPhaseDesc}
                  onChange={(e) => setNewPhaseDesc(e.target.value)}
                  placeholder="What is achieved in this phase?"
                  rows="2"
                  maxLength="500"
                />
              </div>

              <div className="form-field form-field--wide">
                <label htmlFor="new-phase-date">Target Date (Optional)</label>
                <input
                  id="new-phase-date"
                  type="date"
                  value={newPhaseDate}
                  onChange={(e) => setNewPhaseDate(e.target.value)}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setIsAddingPhase(false)}
                >
                  Cancel
                </button>
                <SketchButton
                  type="submit"
                  variant="yellow"
                  disabled={!newPhaseTitle.trim()}
                >
                  Add phase
                </SketchButton>
              </div>
            </form>
          </Modal>

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
            description="This plan and all its roadmap phases, tasks, and checklists will be permanently removed."
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
