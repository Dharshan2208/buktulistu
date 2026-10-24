import { getPlanTaskStats } from "../../utils/planStats.js";
import SketchCard from "../ui/SketchCard.jsx";

function PlanStats({ plans }) {
  const totalPlans = plans.length;
  const completedPlans = plans.filter((plan) => plan.status === "completed").length;
  const inProgressPlans = plans.filter((plan) => plan.status === "in_progress").length;

  let totalTasks = 0;
  let completedTasks = 0;

  for (const plan of plans) {
    const stats = getPlanTaskStats(plan);
    totalTasks += stats.total;
    completedTasks += stats.completed;
  }

  const pendingMilestones = totalTasks - completedTasks;
  const overallTaskPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <SketchCard className="progress-summary plan-stats" variant="paper" seed={95}>
      <div className="progress-summary__meter">
        <progress
          value={completedPlans}
          max={totalPlans}
          aria-label={`${completedPlans} of ${totalPlans} plans completed`}
        />
        <span className="badge outline" aria-hidden="true">
          {completedPlans}/{totalPlans} plans
        </span>
      </div>

      <div className="plan-stats__meta">
        <span className="plan-stats__pill">
          <strong>{inProgressPlans}</strong> in progress
        </span>
        {totalTasks > 0 && (
          <>
            <span className="plan-stats__pill">
              <strong>{pendingMilestones}</strong> pending milestones
            </span>
            <span className="plan-stats__pill">
              <strong>{overallTaskPercent}%</strong> overall execution
            </span>
          </>
        )}
      </div>
    </SketchCard>
  );
}

export default PlanStats;
