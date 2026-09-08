import { formatCategory } from "../categories";
import FilterMenu from "./ui/FilterMenu";

function BucketFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  sortBy,
  onSortChange,
  categories,
  statusCounts,
  visibleCount,
  totalCount,
  onClear,
}) {
  const hasActiveFilters =
    searchTerm ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    sortBy !== "newest";

  return (
    <div className="filters" role="region" aria-label="Bucket-list controls">
      <div className="filters__controls">
        <div className="search-field">
          <span className="search-field__icon" aria-hidden="true">
            ⌕
          </span>
          <label className="sr-only" htmlFor="item-search">
            Search bucket-list items
          </label>
          <input
            id="item-search"
            type="search"
            placeholder="Search your dreams…"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="status-tabs" aria-label="Filter by status">
          {[
            ["all", "All", statusCounts.all],
            ["active", "To Do", statusCounts.active],
            ["completed", "Completed", statusCounts.completed],
          ].map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              className={statusFilter === value ? "is-active" : ""}
              aria-pressed={statusFilter === value}
              onClick={() => onStatusChange(value)}
            >
              <span>{label}</span>
              <span className="status-tabs__count">{count}</span>
            </button>
          ))}
        </div>

        <div className="filter-selects">
          <FilterMenu
            label="Category"
            value={categoryFilter}
            onChange={onCategoryChange}
            options={[
              { value: "all", label: "All categories" },
              ...categories.map((category) => ({
                value: category,
                label: formatCategory(category),
              })),
            ]}
          />
          <FilterMenu
            label="Sort"
            value={sortBy}
            onChange={onSortChange}
            options={[
              { value: "newest", label: "Newest first" },
              { value: "oldest", label: "Oldest first" },
              { value: "title", label: "Title A–Z" },
            ]}
          />
        </div>
      </div>

      <div className="filters__meta">
        <p className="filters__count" aria-live="polite">
          {visibleCount === totalCount
            ? `${totalCount} ${totalCount === 1 ? "dream" : "dreams"}`
            : `${visibleCount} of ${totalCount} dreams shown`}
        </p>
        {hasActiveFilters && (
          <button type="button" className="text-button" onClick={onClear}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

export default BucketFilters;
