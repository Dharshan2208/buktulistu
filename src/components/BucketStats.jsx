import SketchCard from "./ui/SketchCard";

function BucketStats({ items }) {
  const total = items.length;
  const completed = items.filter((item) => item.completed).length;
  const completionPercentage = total ? (completed / total) * 100 : 0;

  return (
    <SketchCard className="progress-summary" variant="paper" seed={91}>
      <div className="progress-summary__copy">
        <p className="eyebrow">Your progress</p>
      </div>

      <div className="progress-summary__meter">
        <div
          className="sketch-progress"
          role="progressbar"
          aria-label={`${completed} of ${total} bucket-list items completed`}
          aria-valuemin="0"
          aria-valuemax={total}
          aria-valuenow={completed}
        >
          <span
            className="sketch-progress__fill"
            style={{
              width: `${completionPercentage}%`,
              opacity: completed === 0 ? 0 : 1,
            }}
          />
        </div>
        <span className="progress-summary__count" aria-hidden="true">
          {completed}/{total}
        </span>
      </div>
    </SketchCard>
  );
}

export default BucketStats;
