function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function BucketStats({ items }) {
  const total = items.length;

  const completed = items.filter((item) => Boolean(item.completed)).length;

  const remaining = total - completed;

  const highPriority = items.filter(
    (item) => !item.completed && item.priority === "high",
  ).length;

  const today = getToday();

  const overdue = items.filter(
    (item) => !item.completed && item.target_date && item.target_date < today,
  ).length;

  const completionPercentage =
    total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <section aria-labelledby="stats-heading">
      <h2 id="stats-heading">Your progress</h2>

      <dl>
        <div>
          <dt>Total items</dt>
          <dd>{total}</dd>
        </div>

        <div>
          <dt>Completed</dt>
          <dd>{completed}</dd>
        </div>

        <div>
          <dt>Remaining</dt>
          <dd>{remaining}</dd>
        </div>

        <div>
          <dt>Overdue</dt>
          <dd>{overdue}</dd>
        </div>

        <div>
          <dt>High priority remaining</dt>
          <dd>{highPriority}</dd>
        </div>
      </dl>

      <div>
        <progress
          value={completed}
          max={total || 1}
          aria-label="Bucket-list completion"
        />

        <p>{completionPercentage}% complete</p>
      </div>
    </section>
  );
}

export default BucketStats;
