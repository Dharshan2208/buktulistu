import { useEffect, useState } from "react";
import { createItem, deleteItem, getItems, updateItem } from "./api/bucketApi";
import BucketItemForm from "./components/BucketItemForm";
import BucketList from "./components/BucketList";

function App() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

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

  return (
    <main>
      <header>
        <h1>Buktu Listu</h1>
        <p>Build the life you want to remember</p>
      </header>

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

        <BucketList
          items={items}
          isLoading={isLoading}
          error={loadError}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </section>
    </main>
  );
}

export default App;
