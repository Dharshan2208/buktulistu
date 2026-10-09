import BucketItem from "./BucketItem";
import SketchButton from "./ui/SketchButton";
import SketchCard from "./ui/SketchCard";

function LoadingCards() {
  return (
    <div className="bucket-grid" aria-label="Loading bucket-list items">
      {[1, 2, 3, 4].map((item) => (
        <div className="card" key={item} role="status" aria-hidden="true">
          <div className="skeleton line" />
          <div className="skeleton line" />
        </div>
      ))}
      <span className="sr-only">Loading your bucket list…</span>
    </div>
  );
}

function BucketList({
  items,
  isLoading,
  error,
  emptyMessage,
  hasItems,
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
        <h3>Couldn't load your bucket list</h3>
        <p>Check your connection and refresh the page to try again.</p>
      </SketchCard>
    );
  }

  if (items.length === 0) {
    const isFilteredEmpty = hasItems;

    return (
      <SketchCard variant="paper" dashed className="state-card">
        <span className="state-card__mark" aria-hidden="true">
          {isFilteredEmpty ? "⌕" : isOwner ? "+" : "○"}
        </span>
        <h3>
          {isFilteredEmpty
            ? "No matching dreams"
            : isOwner
              ? "Your list is ready"
              : "Nothing to view yet"}
        </h3>
        <p>
          {!isFilteredEmpty && !isOwner
            ? "The owner hasn't added any bucket-list items yet. Check back soon."
            : emptyMessage}
        </p>
        {!isFilteredEmpty && isOwner && (
          <SketchButton type="button" onClick={onAdd} variant="yellow">
            Add your first item
          </SketchButton>
        )}
      </SketchCard>
    );
  }

  return (
    <ul className="bucket-grid">
      {items.map((item) => (
        <BucketItem
          key={item.id}
          item={item}
          isOwner={isOwner}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

export default BucketList;
