export async function getItems() {
  const response = await fetch("/api/items");

  if (!response.ok) {
    throw new Error("Failed to fetch bucket items");
  }

  return response.json();
}

export async function createItem(item) {
  const response = await fetch("/api/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(item),
  });

  if (!response.ok) {
    throw new Error("Failed to create bucket item");
  }

  return response.json();
}
