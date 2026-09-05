import { useEffect, useState } from "react";
import { createItem, deleteItem, getItems, updateItem } from "./api/bucketApi";

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "general",
  priority: "medium",
  target_date: "",
};

function App() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [busyItemId, setBusyItemId] = useState(null);
  const [actionError, setActionError] = useState(null);

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
          setLoadError(err.message);
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

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsSubmitting(true);
    setFormError(null);

    try {
      const newItem = await createItem({
        title: form.title,
        description: form.description || null,
        category: form.category,
        priority: form.priority,
        target_date: form.target_date || null,
      });

      setItems((currentItems) => [newItem, ...currentItems]);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Delete "${item.title}" from your bucket list?`,
    );

    if (!confirmed) {
      return;
    }

    setBusyItemId(item.id);
    setActionError(null);

    try {
      await deleteItem(item.id);

      setItems((currentItems) =>
        currentItems.filter((currentItem) => currentItem.id !== item.id),
      );
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleToggleCompleted(item) {
    setBusyItemId(item.id);
    setActionError(null);

    try {
      const updatedItem = await updateItem(item.id, {
        completed: !(item.completed),
      });

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id ? updatedItem : currentItem,
        ),
      );
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyItemId(null);
    }
  }

  function startEditing(item) {
    setEditingId(item.id);
    setActionError(null);

    setEditForm({
      title: item.title,
      description: item.description ?? "",
      category: item.category,
      priority: item.priority,
      target_date: item.target_date ?? "",
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    setEditForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleEditSubmit(event, id) {
    event.preventDefault();

    setBusyItemId(id);
    setActionError(null);

    try {
      const updatedItem = await updateItem(id, {
        title: editForm.title,
        description: editForm.description || null,
        category: editForm.category,
        priority: editForm.priority,
        target_date: editForm.target_date || null,
      });

      setItems((currentItems) =>
        currentItems.map((item) => (item.id === id ? updatedItem : item)),
      );

      cancelEditing();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyItemId(null);
    }
  }

  return (
    <main>
      <header>
        <h1>Buktu Listu</h1>
        <p>Build the life you want to remember</p>
      </header>

      <section>
        <h2>Add a bucket-list item</h2>

        <form onSubmit={handleSubmit}>
          <fieldset disabled={isSubmitting}>
            <div>
              <label htmlFor="title">Title</label>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="category">Category</label>
              <input
                id="category"
                name="category"
                type="text"
                value={form.category}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={form.priority}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label htmlFor="target_date">Target date</label>
              <input
                id="target_date"
                name="target_date"
                type="date"
                value={form.target_date}
                onChange={handleChange}
              />
            </div>

            <button type="submit">
              {isSubmitting ? "Adding..." : "Add item"}
            </button>
          </fieldset>
        </form>

        {formError && <p>Could not add item: {formError}</p>}
      </section>

      <section>
        <h2>My bucket list</h2>

        {isLoading && <p>Loading items...</p>}
        {loadError && <p>Something went wrong: {loadError}</p>}
        {actionError && <p>Action failed: {actionError}</p>}

        {!isLoading && !loadError && items.length === 0 && (
          <p>Your bucket list is empty.</p>
        )}

        {!isLoading && !loadError && items.length > 0 && (
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                {editingId === item.id ? (
                  <form onSubmit={(event) => handleEditSubmit(event, item.id)}>
                    <fieldset disabled={busyItemId !== null}>
                      <div>
                        <label htmlFor={`edit-title-${item.id}`}>Title</label>
                        <input
                          id={`edit-title-${item.id}`}
                          name="title"
                          type="text"
                          value={editForm.title}
                          onChange={handleEditChange}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor={`edit-description-${item.id}`}>
                          Description
                        </label>
                        <textarea
                          id={`edit-description-${item.id}`}
                          name="description"
                          value={editForm.description}
                          onChange={handleEditChange}
                        />
                      </div>

                      <div>
                        <label htmlFor={`edit-category-${item.id}`}>
                          Category
                        </label>
                        <input
                          id={`edit-category-${item.id}`}
                          name="category"
                          type="text"
                          value={editForm.category}
                          onChange={handleEditChange}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor={`edit-priority-${item.id}`}>
                          Priority
                        </label>
                        <select
                          id={`edit-priority-${item.id}`}
                          name="priority"
                          value={editForm.priority}
                          onChange={handleEditChange}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor={`edit-date-${item.id}`}>
                          Target date
                        </label>
                        <input
                          id={`edit-date-${item.id}`}
                          name="target_date"
                          type="date"
                          value={editForm.target_date}
                          onChange={handleEditChange}
                        />
                      </div>

                      <button type="submit">
                        {busyItemId === item.id ? "Saving..." : "Save changes"}
                      </button>

                      <button type="button" onClick={cancelEditing}>
                        Cancel
                      </button>
                    </fieldset>
                  </form>
                ) : (
                  <>
                    <h3>{item.title}</h3>

                    {item.description && <p>{item.description}</p>}

                    <p>Category: {item.category}</p>
                    <p>Priority: {item.priority}</p>
                    <p>
                      Status: {item.completed ? "Completed" : "Not completed"}
                    </p>

                    {item.target_date && <p>Target date: {item.target_date}</p>}

                    <div>
                      <button
                        type="button"
                        disabled={busyItemId !== null}
                        onClick={() => handleToggleCompleted(item)}
                      >
                        {busyItemId === item.id
                          ? "Saving..."
                          : item.completed
                            ? "Mark incomplete"
                            : "Mark complete"}
                      </button>

                      <button
                        type="button"
                        disabled={busyItemId !== null}
                        onClick={() => startEditing(item)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={busyItemId !== null}
                        onClick={() => handleDelete(item)}
                      >
                        {busyItemId === item.id ? "Working..." : "Delete"}
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
