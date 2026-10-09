import { useState } from "react";
import { formatCategory } from "../categories";
import FilterMenu from "./ui/FilterMenu";
import Modal from "./ui/Modal";

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
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const hasActiveFilters =
    searchTerm ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    sortBy !== "newest";
  const advancedFilterCount =
    Number(categoryFilter !== "all") + Number(sortBy !== "newest");

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

        <div role="tablist" aria-label="Filter by status">
          {[
            ["all", "All", statusCounts.all],
            ["active", "To Do", statusCounts.active],
            ["completed", "Completed", statusCounts.completed],
          ].map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={statusFilter === value}
              onClick={() => onStatusChange(value)}
            >
              <span>{label}</span>
              <span className="badge outline">{count}</span>
            </button>
          ))}
        </div>

        <div className="filter-selects desktop-filter-selects">
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

        <button
          type="button"
          className={`mobile-filter-trigger ${advancedFilterCount ? "is-active" : ""}`}
          aria-haspopup="dialog"
          onClick={() => setIsFilterSheetOpen(true)}
        >
          <span>Filters &amp; sort</span>
          {advancedFilterCount > 0 && (
            <span className="mobile-filter-trigger__count">
              {advancedFilterCount}
            </span>
          )}
          <span aria-hidden="true">⌄</span>
        </button>
      </div>

      <div className="filters__meta">
        <p className="filters__count" aria-live="polite">
          {visibleCount === totalCount
            ? `${totalCount} ${totalCount === 1 ? "dream" : "dreams"}`
            : `${visibleCount} of ${totalCount} dreams shown`}
        </p>
        {hasActiveFilters && (
          <button type="button" className="ghost small" onClick={onClear}>
            Clear filters
          </button>
        )}
      </div>

      <Modal
        open={isFilterSheetOpen}
        title="Filters and sorting"
        description="Narrow the list or change its order. Changes apply immediately."
        onClose={() => setIsFilterSheetOpen(false)}
        className="filter-sheet"
      >
        <div className="filter-sheet__group">
          <h3>Category</h3>
          <div className="filter-sheet__choices">
            {[
              { value: "all", label: "All categories" },
              ...categories.map((category) => ({
                value: category,
                label: formatCategory(category),
              })),
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={categoryFilter === option.value ? "is-selected" : ""}
                aria-pressed={categoryFilter === option.value}
                onClick={() => onCategoryChange(option.value)}
              >
                <span>{option.label}</span>
                {categoryFilter === option.value && <span aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-sheet__group">
          <h3>Sort by</h3>
          <div className="filter-sheet__choices">
            {[
              { value: "newest", label: "Newest first" },
              { value: "oldest", label: "Oldest first" },
              { value: "title", label: "Title A–Z" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={sortBy === option.value ? "is-selected" : ""}
                aria-pressed={sortBy === option.value}
                onClick={() => onSortChange(option.value)}
              >
                <span>{option.label}</span>
                {sortBy === option.value && <span aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-sheet__actions">
          <button
            type="button"
            className="ghost"
            disabled={!hasActiveFilters}
            onClick={onClear}
          >
            Reset all
          </button>
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(false)}
          >
            Show {visibleCount} {visibleCount === 1 ? "dream" : "dreams"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default BucketFilters;
