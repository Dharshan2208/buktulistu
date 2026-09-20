const CREATE_FIELDS = new Set([
  "title",
  "description",
  "category",
  "priority",
  "target_date",
]);

const UPDATE_FIELDS = new Set([...CREATE_FIELDS, "completed"]);
const VALID_PRIORITIES = new Set(["low", "medium", "high"]);
const CATEGORY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ITEM_LIMITS = {
  title: 120,
  description: 1_000,
  category: 50,
};

function findUnexpectedFields(body, allowedFields) {
  return Object.keys(body).filter((field) => !allowedFields.has(field));
}

function isValidDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validateTitle(value, fields) {
  if (typeof value !== "string") {
    fields.title = "Title must be text";
    return null;
  }

  const title = value.trim();

  if (!title) {
    fields.title = "Title is required";
  } else if (title.length > ITEM_LIMITS.title) {
    fields.title = `Title cannot exceed ${ITEM_LIMITS.title} characters`;
  }

  return title;
}

function validateDescription(value, fields) {
  if (value === undefined || value === null || value === "") return null;

  if (typeof value !== "string") {
    fields.description = "Description must be text or null";
    return null;
  }

  const description = value.trim();

  if (description.length > ITEM_LIMITS.description) {
    fields.description =
      `Description cannot exceed ${ITEM_LIMITS.description} characters`;
  }

  return description || null;
}

function validateCategory(value, fields) {
  if (typeof value !== "string") {
    fields.category = "Category must be text";
    return null;
  }

  const category = value.trim().toLowerCase();

  if (!category) {
    fields.category = "Category is required";
  } else if (category.length > ITEM_LIMITS.category) {
    fields.category = `Category cannot exceed ${ITEM_LIMITS.category} characters`;
  } else if (!CATEGORY_PATTERN.test(category)) {
    fields.category =
      "Category may contain lowercase letters, numbers, and hyphens";
  }

  return category;
}

function validatePriority(value, fields) {
  if (typeof value !== "string" || !VALID_PRIORITIES.has(value)) {
    fields.priority = "Priority must be low, medium, or high";
  }

  return value;
}

function validateTargetDate(value, fields) {
  if (value === undefined || value === null || value === "") return null;

  if (typeof value !== "string" || !isValidDate(value)) {
    fields.target_date = "Target date must be a valid YYYY-MM-DD date";
    return null;
  }

  return value;
}

export function validateCreateItem(body) {
  const fields = {};
  const unexpectedFields = findUnexpectedFields(body, CREATE_FIELDS);

  if (unexpectedFields.length > 0) {
    fields.request = `Unsupported fields: ${unexpectedFields.join(", ")}`;
  }

  const data = {
    title: validateTitle(body.title, fields),
    description: validateDescription(body.description, fields),
    category: validateCategory(body.category ?? "general", fields),
    priority: validatePriority(body.priority ?? "medium", fields),
    target_date: validateTargetDate(body.target_date, fields),
  };

  return { data, fields };
}

export function validateUpdateItem(body) {
  const fields = {};
  const data = {};
  const unexpectedFields = findUnexpectedFields(body, UPDATE_FIELDS);

  if (unexpectedFields.length > 0) {
    fields.request = `Unsupported fields: ${unexpectedFields.join(", ")}`;
  }

  if (Object.hasOwn(body, "title")) {
    data.title = validateTitle(body.title, fields);
  }

  if (Object.hasOwn(body, "description")) {
    data.description = validateDescription(body.description, fields);
  }

  if (Object.hasOwn(body, "category")) {
    data.category = validateCategory(body.category, fields);
  }

  if (Object.hasOwn(body, "priority")) {
    data.priority = validatePriority(body.priority, fields);
  }

  if (Object.hasOwn(body, "target_date")) {
    data.target_date = validateTargetDate(body.target_date, fields);
  }

  if (Object.hasOwn(body, "completed")) {
    if (typeof body.completed !== "boolean") {
      fields.completed = "Completed must be a boolean";
    } else {
      data.completed = body.completed;
    }
  }

  const suppliedFields = Object.keys(body).filter((field) =>
    UPDATE_FIELDS.has(field),
  );

  if (suppliedFields.length === 0) {
    fields.request = "At least one supported field must be updated";
  }

  return { data, fields };
}
