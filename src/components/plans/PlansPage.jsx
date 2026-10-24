import { useEffect, useState } from "react";
import { ApiError } from "../../api/bucketApi.js";
import {
  createPlan,
  deletePlan,
  getPlans,
  updatePlan,
} from "../../api/plansApi.js";
import Modal from "../ui/Modal.jsx";
import PlanForm from "./PlanForm.jsx";
import PlanList from "./PlanList.jsx";
import PlanStats from "./PlanStats.jsx";

let nextTemporaryId = -1;

function normalizePlan(plan) {
  let steps = [];

  if (typeof plan.steps === "string") {
    try {
      steps = JSON.parse(plan.steps);
    } catch {
      steps = [];
    }
  } else if (Array.isArray(plan.steps)) {
    steps = plan.steps;
  }

  return {
    ...plan,
    category: plan.category || "general",
    status: plan.status || "not_started",
    priority: plan.priority || "medium",
    steps,
  };
}

function PlansPage({
  isOwner,
  onToast,
  onSessionExpired,
  isCreateOpen,
  setIsCreateOpen,
}) {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await getPlans();

        if (!ignore) {
          setPlans(data.map(normalizePlan));
        }
      } catch (error) {
        console.error("Unable to load plans", error);

        if (ignore) return;

        if (error instanceof ApiError && error.status === 401) {
          setPlans([]);
          onSessionExpired?.();
          return;
        }

        setLoadError("Couldn't load your plans.");
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [onSessionExpired]);

  function handleMutationError(error) {
    if (!(error instanceof ApiError)) {
      return;
    }

    if (error.status === 401) {
      setPlans([]);
      setLoadError(null);
      setIsLoading(true);
      setIsCreateOpen(false);
      onSessionExpired?.();
      return;
    }

    if (error.status === 403) {
      onToast("This session is read-only. Sign in as the owner to make changes.");
    }
  }

  async function handleCreate(values) {
    const temporaryId = nextTemporaryId--;
    const optimisticPlan = {
      id: temporaryId,
      title: values.title,
      description: values.description,
      category: values.category || "general",
      status: values.status,
      priority: values.priority,
      target_date: values.target_date,
      steps: values.steps || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setPlans((current) => [optimisticPlan, ...current]);

    try {
      const newPlan = normalizePlan(await createPlan(values));

      setPlans((current) =>
        current.map((plan) => (plan.id === temporaryId ? newPlan : plan)),
      );
      setIsCreateOpen(false);
      onToast("Plan created successfully");
    } catch (error) {
      setPlans((current) => current.filter((plan) => plan.id !== temporaryId));
      handleMutationError(error);
      throw error;
    }
  }

  async function handleUpdate(id, updates) {
    const previousPlan = plans.find((plan) => plan.id === id);

    if (!previousPlan) {
      throw new Error("Plan not found locally");
    }

    const optimisticPlan = {
      ...previousPlan,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    setPlans((current) =>
      current.map((plan) => (plan.id === id ? optimisticPlan : plan)),
    );

    try {
      const updatedPlan = normalizePlan(await updatePlan(id, updates));

      setPlans((current) =>
        current.map((plan) => (plan.id === id ? updatedPlan : plan)),
      );

      onToast("Plan updated");
    } catch (error) {
      setPlans((current) =>
        current.map((plan) => (plan.id === id ? previousPlan : plan)),
      );
      handleMutationError(error);
      throw error;
    }
  }

  async function handleDelete(id) {
    const deletedIndex = plans.findIndex((plan) => plan.id === id);
    const deletedPlan = plans[deletedIndex];

    if (!deletedPlan) return;

    setPlans((current) => current.filter((plan) => plan.id !== id));

    try {
      await deletePlan(id);
      onToast("Plan removed");
    } catch (error) {
      setPlans((current) => {
        const restored = [...current];
        restored.splice(deletedIndex, 0, deletedPlan);
        return restored;
      });
      handleMutationError(error);

      if (!(error instanceof ApiError) || ![401, 403].includes(error.status)) {
        onToast("Couldn't delete this plan. Please try again.");
      }

      throw error;
    }
  }

  return (
    <>
      <section className="intro" aria-labelledby="plans-heading">
        <p className="eyebrow">Roadmaps &amp; Objectives</p>
        <h1 id="plans-heading">Plans</h1>
        <p className="intro__lead">
          Structured roadmaps, milestones, and actionable steps for what lies
          ahead.
        </p>
      </section>

      {!isLoading && !loadError && plans.length > 0 && (
        <section id="plans-progress" aria-label="Plans progress">
          <PlanStats plans={plans} />
        </section>
      )}

      <section
        id="plans-list"
        className="list-section"
        aria-labelledby="plans-list-heading"
      >
        <div className="section-heading">
          <div>
            <h2 id="plans-list-heading">Actionable Roadmaps</h2>
          </div>
          <span className="badge outline">
            {isOwner ? "Owner · editing" : "Viewer · read only"}
          </span>
        </div>

        <PlanList
          plans={plans}
          isLoading={isLoading}
          error={loadError}
          isOwner={isOwner}
          onAdd={() => setIsCreateOpen(true)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </section>

      {isOwner && (
        <Modal
          open={isCreateOpen}
          title="Create a new plan"
          description="Outline your goal, set a target timeline, and map your next move."
          onClose={() => setIsCreateOpen(false)}
        >
          <PlanForm
            idPrefix="create-plan"
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
            submitLabel="Create plan"
            busyLabel="Creating…"
            resetAfterSubmit
          />
        </Modal>
      )}
    </>
  );
}

export default PlansPage;
