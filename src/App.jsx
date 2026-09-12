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

let nextTemporaryId = -1;

function normalizeItem(item) {
  return {
    ...item,
    completed: Boolean(item.completed),
  };
}

function getInitialTheme() {
  const savedTheme = window.localStorage.getItem("buktu-theme");

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function App() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState(getInitialTheme);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("buktu-theme", theme);
  }, [theme]);

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
    const temporaryId = nextTemporaryId--;
    const optimisticItem = {
      id: temporaryId,
      title: values.title,
      description: values.description,
      category: values.category,
      priority: "medium",
      target_date: null,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setItems((currentItems) => [optimisticItem, ...currentItems]);

    try {
      const newItem = normalizeItem(await createItem(values));

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === temporaryId ? newItem : item,
        ),
      );
      setIsCreateOpen(false);
      setToast("Added to your bucket list");
    } catch (error) {
      setItems((currentItems) =>
        currentItems.filter((item) => item.id !== temporaryId),
      );
      throw error;
    }
  }

  async function handleUpdate(id, updates) {
    const previousItem = items.find((item) => item.id === id);

    if (!previousItem) {
      throw new Error("Bucket item not found locally");
    }

    const optimisticItem = {
      ...previousItem,
      ...updates,
      completed:
        updates.completed === undefined
          ? previousItem.completed
          : Boolean(updates.completed),
      updated_at: new Date().toISOString(),
    };

    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? optimisticItem : item)),
    );

    try {
      const updatedItem = normalizeItem(await updateItem(id, updates));

      setItems((currentItems) =>
        currentItems.map((item) => (item.id === id ? updatedItem : item)),
      );

      if (Object.hasOwn(updates, "completed")) {
        setToast(
          updatedItem.completed
            ? "Bucket list item completed — nicely done!"
            : "Moved back to your list",
        );
      } else {
        setToast("Changes saved");
      }
    } catch (error) {
      setItems((currentItems) =>
        currentItems.map((item) => (item.id === id ? previousItem : item)),
      );
      throw error;
    }
  }

  async function handleDelete(id) {
    const deletedIndex = items.findIndex((item) => item.id === id);
    const deletedItem = items[deletedIndex];

    if (!deletedItem) {
      return;
    }

    setItems((currentItems) => currentItems.filter((item) => item.id !== id));

    try {
      await deleteItem(id);
      setToast("Item removed");
    } catch {
      setItems((currentItems) => {
        const restoredItems = [...currentItems];
        restoredItems.splice(deletedIndex, 0, deletedItem);
        return restoredItems;
      });
      setToast("Couldn't delete this item. Please try again.");
    }
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
          <span className="brand__mark" aria-hidden="true">
            ✓
          </span>
          <span>Buktu Listu</span>
        </a>

        <div className="header-actions">
          <nav className="site-nav" aria-label="Primary navigation">
            <a href="#progress">Progress</a>
            <a href="#list">My list</a>
          </nav>

          <button
            type="button"
            className="theme-toggle"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-pressed={theme === "dark"}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            onClick={() =>
              setTheme((currentTheme) =>
                currentTheme === "dark" ? "light" : "dark",
              )
            }
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.4 15.3A8.5 8.5 0 0 1 8.7 3.6 8.5 8.5 0 1 0 20.4 15.3Z" />
              </svg>
            )}
          </button>

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
          <p className="eyebrow">Life In Progress</p>
          <h1 id="page-heading">Things to do before I die</h1>
          <p className="intro__lead">
            Places to visit, milestones to reach, and experiences to try.
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
