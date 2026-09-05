import { useEffect, useState } from "react";
import { getItems } from "./api/bucketApi";

function App() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
          setError(err.message);
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

  return (
    <main>
      <h1>Buktu Listu</h1>
      <p>Build the life you want to remember</p>

      <section>
        <h2>My bucket list</h2>

        {isLoading && <p>Loading items...</p>}

        {error && <p>Something went wrong: {error}</p>}

        {!isLoading && !error && items.length === 0 && (
          <p>Your bucket list is empty.</p>
        )}

        {!isLoading && !error && items.length > 0 && (
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
