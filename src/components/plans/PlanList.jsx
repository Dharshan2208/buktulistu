import SketchButton from "../ui/SketchButton.jsx";
import SketchCard from "../ui/SketchCard.jsx";
import PlanCard from "./PlanCard.jsx";

function LoadingCards() {
  return (
    <div className="bucket-grid" aria-label="Loading plans">
      {[1, 2, 3, 4].map((item) => (
        <div className="card" key={item} role="status" aria-hidden="true">
          <div className="skeleton line" />
          <div className="skeleton line" />
        </div>
      ))}
      <span className="sr-only">Loading your plans…</span>
    </div>
  );
}

function PlanList({
  plans,
  isLoading,
  error,
  isOwner,
  onAdd,
  onUpdate,
  onDelete,
}) {
  if (isLoading) {
    return <LoadingCards />;
  }

  if (error) {
    return (
      <SketchCard variant="paper" dashed className="state-card">
        <span className="state-card__mark" aria-hidden="true">
          !
        </span>
        <h3>Couldn't load your plans</h3>
        <p>Check your connection and refresh the page to try again.</p>
      </SketchCard>
    );
  }

  if (plans.length === 0) {
    return (
      <SketchCard variant="paper" dashed className="state-card">
        <span className="state-card__mark" aria-hidden="true">
          {isOwner ? "+" : "○"}
        </span>
        <h3>
          {isOwner ? "Your plans are ready" : "Nothing to view yet"}
        </h3>
        <p>
          {isOwner
            ? "Document an upcoming project, trip, or personal goal."
            : "The owner hasn't added any plans yet. Check back soon."}
        </p>
        {isOwner && (
          <SketchButton type="button" onClick={onAdd} variant="yellow">
            Create your first plan
          </SketchButton>
        )}
      </SketchCard>
    );
  }

  return (
    <ul className="bucket-grid">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          isOwner={isOwner}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

export default PlanList;
