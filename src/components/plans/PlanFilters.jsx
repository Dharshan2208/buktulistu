import { useState } from "react";
import { formatCategory } from "../../categories.js";
import FilterMenu from "../ui/FilterMenu.jsx";
import Modal from "../ui/Modal.jsx";

function PlanFilters({
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
    <div className="filters" role="region" aria-label="Plans controls">
      <div className="filters__controls">
        <div className="search-field">
          <span className="search-field__icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <label className="sr-only" htmlFor="plan-search">
            Search plans
          </label>
          <input
            id="plan-search"
            type="search"
            placeholder="Search plans, roadmaps, milestones…"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="filter-tabs" role="tablist" aria-label="Filter by status">
          {[
            ["all", "All", statusCounts.all],
            ["in_progress", "In Progress", statusCounts.in_progress],
            ["not_started", "Not Started", statusCounts.not_started],
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
              { value: "deadline", label: "Upcoming deadline" },
              { value: "priority", label: "Priority (High to Low)" },
              { value: "progress", label: "Progress (High to Low)" },
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
          <span className="mobile-filter-trigger__arrow" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </button>
      </div>

      <div className="filters__meta">
        <p className="filters__count" aria-live="polite">
          {visibleCount === totalCount
            ? `${totalCount} ${totalCount === 1 ? "plan" : "plans"}`
            : `${visibleCount} of ${totalCount} plans shown`}
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
        description="Narrow your plans or change the display order."
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
                {categoryFilter === option.value && (
                  <span aria-hidden="true">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-sheet__group">
          <h3>Sort by</h3>
          <div className="filter-sheet__choices">
            {[
              { value: "newest", label: "Newest first" },
              { value: "deadline", label: "Upcoming deadline" },
              { value: "priority", label: "Priority (High to Low)" },
              { value: "progress", label: "Progress (High to Low)" },
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
          <button type="button" onClick={() => setIsFilterSheetOpen(false)}>
            Show {visibleCount} {visibleCount === 1 ? "plan" : "plans"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default PlanFilters;
