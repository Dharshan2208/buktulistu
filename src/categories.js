export const CATEGORY_OPTIONS = [
  { value: "travel", label: "Travel" },
  { value: "skills", label: "Skills" },
  { value: "career", label: "Career" },
  { value: "finance", label: "Finance" },
  { value: "health", label: "Health" },
  { value: "fitness", label: "Fitness" },
  { value: "adventure", label: "Adventure" },
  { value: "creativity", label: "Creativity" },
  { value: "relationships", label: "Relationships" },
  { value: "home-lifestyle", label: "Home & Lifestyle" },
  { value: "giving-back", label: "Giving Back" },
  { value: "general", label: "General" },
];

export function formatCategory(category) {
  const knownCategory = CATEGORY_OPTIONS.find(
    (option) => option.value === category,
  );

  return knownCategory
    ? knownCategory.label
    : category.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
