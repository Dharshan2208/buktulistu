import BucketItem from "./BucketItem";

function BucketList({
  items,
  isLoading,
  error,
  emptyMessage,
  onUpdate,
  onDelete,
}) {
  if (isLoading) {
    return <p>Loading items...</p>;
  }

  if (error) {
    return <p>Something went wrong: {error}</p>;
  }

  if (items.length === 0) {
    return <p>{emptyMessage}</p>;
  }

  return (
    <ul>
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
