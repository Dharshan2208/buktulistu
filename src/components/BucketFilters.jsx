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
  return (
    <div>
      <div>
        <label htmlFor="item-search">Search</label>
        <input
          id="item-search"
          type="search"
          placeholder="Search title, description, or category"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="status-filter">Status</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="active">Not completed</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div>
        <label htmlFor="category-filter">Category</label>
        <select
          id="category-filter"
          value={categoryFilter}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="all">All categories</option>

          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="item-sort">Sort by</label>
        <select
          id="item-sort"
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A–Z</option>
          <option value="priority">Highest priority</option>
          <option value="target-date">Nearest target date</option>
        </select>
      </div>

      <button type="button" onClick={onClear}>
        Clear filters
      </button>

      <p>
        Showing {visibleCount} of {totalCount} items
      </p>
    </div>
  );
}

export default BucketFilters;
