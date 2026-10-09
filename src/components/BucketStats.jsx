import SketchCard from "./ui/SketchCard";

function BucketStats({ items }) {
  const total = items.length;
  const completed = items.filter((item) => item.completed).length;

  return (
    <SketchCard className="progress-summary" variant="paper" seed={91}>
      <div className="progress-summary__copy">
        <p className="eyebrow">Your progress</p>
      </div>

      <div className="progress-summary__meter">
        <progress
          value={completed}
          max={total}
          aria-label={`${completed} of ${total} bucket-list items completed`}
        />
        <span className="badge outline" aria-hidden="true">
          {completed}/{total}
        </span>
      </div>
    </SketchCard>
  );
}

export default BucketStats;
