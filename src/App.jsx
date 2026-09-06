import { useEffect, useMemo, useState } from "react";
import { createItem, deleteItem, getItems, updateItem } from "./api/bucketApi";
import BucketFilters from "./components/BucketFilters";
import BucketItemForm from "./components/BucketItemForm";
import BucketList from "./components/BucketList";
import BucketStats from "./components/BucketStats";

const PRIORITY_RANK = {
  low: 1,
  medium: 2,
  high: 3,
};

function App() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    let ignore = false;

    async function loadItems() {
      try {
        const data = await getItems();

        if (!ignore) {
          setItems(data);
        }
      } catch (err) {
        if (!ignore) {
          setLoadError(
            err instanceof Error ? err.message : "Something went wrong",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadItems();

    return () => {
      ignore = true;
    };
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(items.map((item) => item.category));

    return [...uniqueCategories].sort((first, second) =>
      first.localeCompare(second),
    );
  }, [items]);

  const visibleItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const nextItems = items.filter((item) => {
      const searchableText = [item.title, item.description ?? "", item.category]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch === "" || searchableText.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "completed" && Boolean(item.completed)) ||
        (statusFilter === "active" && !item.completed);

      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    nextItems.sort((first, second) => {
      if (sortBy === "oldest") {
        return first.created_at.localeCompare(second.created_at);
      }

      if (sortBy === "title") {
        return first.title.localeCompare(second.title, undefined, {
          sensitivity: "base",
        });
      }

      if (sortBy === "priority") {
        return PRIORITY_RANK[second.priority] - PRIORITY_RANK[first.priority];
      }

      if (sortBy === "target-date") {
        if (!first.target_date && !second.target_date) {
          return 0;
        }

        if (!first.target_date) {
          return 1;
        }

        if (!second.target_date) {
          return -1;
        }

        return first.target_date.localeCompare(second.target_date);
      }

      return second.created_at.localeCompare(first.created_at);
    });

    return nextItems;
  }, [items, searchTerm, statusFilter, categoryFilter, sortBy]);

  async function handleCreate(values) {
    const newItem = await createItem(values);

    setItems((currentItems) => [newItem, ...currentItems]);
  }

  async function handleUpdate(id, updates) {
    const updatedItem = await updateItem(id, updates);

    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? updatedItem : item)),
    );
  }

  async function handleDelete(id) {
    await deleteItem(id);

    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSortBy("newest");
  }

  const emptyMessage =
    items.length === 0
      ? "Your bucket list is empty."
      : "No items match the current filters.";

  return (
    <main>
      <header>
        <h1>Buktu Listu</h1>
        <p>Build the life you want to remember</p>
      </header>

      {!isLoading && !loadError && <BucketStats items={items} />}

      <section>
        <h2>Add a bucket-list item</h2>

        <BucketItemForm
          idPrefix="create"
          onSubmit={handleCreate}
          submitLabel="Add item"
          busyLabel="Adding..."
          resetAfterSubmit
        />
      </section>

      <section>
        <h2>My bucket list</h2>

        <BucketFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          categories={categories}
          visibleCount={visibleItems.length}
          totalCount={items.length}
          onClear={clearFilters}
        />

        <BucketList
          items={visibleItems}
          isLoading={isLoading}
          error={loadError}
          emptyMessage={emptyMessage}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </section>
    </main>
  );
}

export default App;
