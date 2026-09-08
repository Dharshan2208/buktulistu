import BucketItem from "./BucketItem";
import SketchButton from "./ui/SketchButton";
import SketchCard from "./ui/SketchCard";

function LoadingCards() {
  return (
    <div className="bucket-grid" aria-label="Loading bucket-list items">
      {[1, 2, 3, 4].map((item) => (
        <div className="skeleton-card" key={item} aria-hidden="true">
          <div className="skeleton skeleton--tag" />
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line-short" />
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
    return (
      <SketchCard variant="paper" dashed className="state-card">
        <span className="state-card__mark" aria-hidden="true">
          {hasItems ? "⌕" : "+"}
        </span>
        <h3>{hasItems ? "No matching dreams" : "No bucket-list items yet"}</h3>
        <p>{emptyMessage}</p>
        {!hasItems && (
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
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

export default BucketList;
