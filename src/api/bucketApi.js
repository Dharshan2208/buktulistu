export async function getItems() {
  const response = await fetch("/api/items");

  if (!response.ok) {
    throw new Error("Failed to fetch bucket items");
  }

  return response.json();
}
