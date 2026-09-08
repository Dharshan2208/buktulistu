import { useEffect, useMemo, useState } from "react";
import { createItem, deleteItem, getItems, updateItem } from "./api/bucketApi";
import { CATEGORY_OPTIONS } from "./categories";
import BucketFilters from "./components/BucketFilters";
import BucketItemForm from "./components/BucketItemForm";
import BucketList from "./components/BucketList";
import BucketStats from "./components/BucketStats";
import Modal from "./components/ui/Modal";
import SketchButton from "./components/ui/SketchButton";
import SketchToast from "./components/ui/SketchToast";

function App() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toast, setToast] = useState("");

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
      } catch (error) {
        console.error("Unable to load bucket list items", error);

        if (!ignore) {
          setLoadError("Couldn't load your bucket list.");
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

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set([
      ...CATEGORY_OPTIONS.map((category) => category.value),
      ...items.map((item) => item.category),
    ]);

    return [...uniqueCategories].sort((first, second) =>
      first.localeCompare(second),
    );
  }, [items]);

  const statusCounts = useMemo(() => {
    const completed = items.filter((item) => item.completed).length;

    return {
      all: items.length,
      active: items.length - completed,
      completed,
    };
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
        (statusFilter === "completed" && item.completed) ||
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

      return second.created_at.localeCompare(first.created_at);
    });

    return nextItems;
  }, [items, searchTerm, statusFilter, categoryFilter, sortBy]);

  async function handleCreate(values) {
    const newItem = await createItem(values);
    setItems((currentItems) => [newItem, ...currentItems]);
    setIsCreateOpen(false);
    setToast("Added to your bucket list");
  }

  async function handleUpdate(id, updates) {
    const updatedItem = await updateItem(id, updates);
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? updatedItem : item)),
    );

    if (Object.hasOwn(updates, "completed")) {
      setToast(updatedItem.completed ? "Bucket list item completed — nicely done!" : "Moved back to your list");
    } else {
      setToast("Changes saved");
    }
  }

  async function handleDelete(id) {
    await deleteItem(id);
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    setToast("Item removed");
  }

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSortBy("newest");
  }

  const emptyMessage =
    items.length === 0
      ? "Add something you've always wanted to do."
      : "Try a different search or clear your filters.";

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Buktu Listu home">
          <span className="brand__mark" aria-hidden="true">✓</span>
          <span>Buktu Listu</span>
        </a>

        <div className="header-actions">
          <nav className="site-nav" aria-label="Primary navigation">
            <a href="#progress">Progress</a>
            <a href="#list">My list</a>
          </nav>

          <SketchButton
            className="header-add"
            variant="yellow"
            onClick={() => setIsCreateOpen(true)}
          >
            <span aria-hidden="true">＋</span> Add item
          </SketchButton>
        </div>
      </header>

      <main id="top" className="app-main">
        <section className="intro" aria-labelledby="page-heading">
          <p className="eyebrow">My lifetime list</p>
          <h1 id="page-heading">Things I want to do.</h1>
          <p className="intro__lead">
            A thoughtful home for meaningful places, experiences, and goals.
          </p>
        </section>

        {!isLoading && !loadError && items.length > 0 && (
          <section id="progress" aria-label="Bucket-list progress">
            <BucketStats items={items} />
          </section>
        )}

        <section
          id="list"
          className="list-section"
          aria-labelledby="list-heading"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">The list</p>
              <h2 id="list-heading">Dreams worth chasing</h2>
            </div>
          </div>

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
            statusCounts={statusCounts}
            visibleCount={visibleItems.length}
            totalCount={items.length}
            onClear={clearFilters}
          />

          <BucketList
            items={visibleItems}
            isLoading={isLoading}
            error={loadError}
            emptyMessage={emptyMessage}
            hasItems={items.length > 0}
            onAdd={() => setIsCreateOpen(true)}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </section>
      </main>

      <Modal
        open={isCreateOpen}
        title="Add to my bucket list"
        description="Capture the idea now. You can refine the details anytime."
        onClose={() => setIsCreateOpen(false)}
      >
        <BucketItemForm
          idPrefix="create"
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          submitLabel="Add item"
          busyLabel="Adding…"
          resetAfterSubmit
        />
      </Modal>

      <SketchToast message={toast} />
    </div>
  );
}

export default App;
