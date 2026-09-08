import SketchCard from "./ui/SketchCard";

function BucketStats({ items }) {
  const total = items.length;
  const completed = items.filter((item) => item.completed).length;
  const completionPercentage = total
    ? Math.round((completed / total) * 100)
    : 0;

  const headline =
    total === 1
      ? completed
        ? "Your first dream is complete."
        : "One dream, ready when you are."
      : `${completed} of ${total} dreams complete`;

  return (
    <SketchCard className="progress-summary" variant="paper" seed={91}>
      <div className="progress-summary__copy">
        <p className="eyebrow">Your progress</p>
        <p className="progress-summary__headline">{headline}</p>
      </div>

      {total === 1 ? (
        <div
          className={`progress-summary__state ${completed ? "is-complete" : ""}`}
        >
          <span aria-hidden="true">{completed ? "✓" : "→"}</span>
          {completed ? "Complete" : "Ready to begin"}
        </div>
      ) : (
        <div className="progress-summary__meter">
          <div className="progress-summary__value">{completionPercentage}%</div>
          <progress
            value={completed}
            max={total}
            aria-label={`${completionPercentage}% of bucket-list items completed`}
          />
        </div>
      )}
    </SketchCard>
  );
}

export default BucketStats;
