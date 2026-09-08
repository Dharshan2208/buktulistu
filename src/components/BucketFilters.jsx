import { formatCategory } from "../categories";

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
    <div className="filters" aria-label="Bucket-list controls">
      <div className="filters__top-row">
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

        <p className="filters__count">
          {visibleCount === totalCount
            ? `${totalCount} ${totalCount === 1 ? "item" : "items"}`
            : `${visibleCount} of ${totalCount}`}
        </p>
      </div>

      <div className="filters__bottom-row">
        <div className="status-tabs" aria-label="Filter by status">
          {[
            ["all", "All"],
            ["active", "To Do"],
            ["completed", "Completed"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={statusFilter === value ? "is-active" : ""}
              aria-pressed={statusFilter === value}
              onClick={() => onStatusChange(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="filter-selects">
          <label>
            <span className="sr-only">Filter by category</span>
            <select
              value={categoryFilter}
              onChange={(event) => onCategoryChange(event.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {formatCategory(category)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Sort bucket-list items</span>
            <select
              value={sortBy}
              onChange={(event) => onSortChange(event.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title">Title A–Z</option>
            </select>
          </label>

          {hasActiveFilters && (
            <button type="button" className="text-button" onClick={onClear}>
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default BucketFilters;
