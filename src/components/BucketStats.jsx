import SketchCard from "./ui/SketchCard";

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function BucketStats({ items }) {
  const total = items.length;
  const completed = items.filter((item) => item.completed).length;
  const remaining = total - completed;
  const today = getToday();
  const overdue = items.filter(
    (item) => !item.completed && item.target_date && item.target_date < today,
  ).length;
  const completionPercentage = total
    ? Math.round((completed / total) * 100)
    : 0;

  return (
    <SketchCard className="progress-summary" variant="paper" seed={91}>
      <div className="progress-summary__copy">
        <p className="eyebrow">Your progress</p>
        <p className="progress-summary__headline">
          <strong>{completed}</strong> of {total} dreams completed
        </p>
        <p className="progress-summary__meta">
          {remaining} still waiting
          {overdue > 0 && <span> · {overdue} overdue</span>}
        </p>
      </div>

      <div className="progress-summary__meter">
        <div className="progress-summary__value">{completionPercentage}%</div>
        <progress
          value={completed}
          max={total || 1}
          aria-label={`${completionPercentage}% of bucket-list items completed`}
        />
      </div>
    </SketchCard>
  );
}

export default BucketStats;
