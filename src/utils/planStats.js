export function getPlanTaskStats(plan) {
  let total = 0;
  let completed = 0;

  if (Array.isArray(plan?.phases) && plan.phases.length > 0) {
    for (const phase of plan.phases) {
      if (Array.isArray(phase.tasks)) {
        for (const task of phase.tasks) {
          total += 1;
          if (task.completed) completed += 1;
        }
      }
    }
  } else if (Array.isArray(plan?.steps) && plan.steps.length > 0) {
    total = plan.steps.length;
    completed = plan.steps.filter((s) => s.completed).length;
  }

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, pending: total - completed, percent };
}
