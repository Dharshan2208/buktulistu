import { useEffect, useState } from "react";
import { createItem, getItems } from "./api/bucketApi";

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

        {!isLoading && !loadError && items.length === 0 && (
          <p>Your bucket list is empty.</p>
        )}

        {!isLoading && !loadError && items.length > 0 && (
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <h3>{item.title}</h3>

                {item.description && <p>{item.description}</p>}

                <p>Category: {item.category}</p>
                <p>Priority: {item.priority}</p>
                <p>Status: {item.completed ? "Completed" : "Not completed"}</p>

                {item.target_date && <p>Target date: {item.target_date}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
