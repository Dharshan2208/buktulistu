import SketchCard from "../ui/SketchCard.jsx";

function PlanStats({ plans }) {
  const total = plans.length;
  const completed = plans.filter((plan) => plan.status === "completed").length;
  const inProgress = plans.filter((plan) => plan.status === "in_progress").length;

  // Total steps across all plans
  let totalSteps = 0;
  let completedSteps = 0;

  for (const plan of plans) {
    if (Array.isArray(plan.steps)) {
      totalSteps += plan.steps.length;
      completedSteps += plan.steps.filter((s) => s.completed).length;
    }
  }

  return (
    <SketchCard className="progress-summary plan-stats" variant="paper" seed={95}>
      <div className="progress-summary__meter">
        <progress
          value={completed}
          max={total}
          aria-label={`${completed} of ${total} plans completed`}
        />
        <span className="badge outline" aria-hidden="true">
          {completed}/{total} plans
        </span>
      </div>
      {(inProgress > 0 || totalSteps > 0) && (
        <div className="plan-stats__meta">
          {inProgress > 0 && (
            <span className="plan-stats__pill">
              <strong>{inProgress}</strong> in progress
            </span>
          )}
          {totalSteps > 0 && (
            <span className="plan-stats__pill">
              <strong>{completedSteps}/{totalSteps}</strong> milestones done
            </span>
          )}
        </div>
      )}
    </SketchCard>
  );
}

export default PlanStats;
