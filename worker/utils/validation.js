const CREATE_FIELDS = new Set([
  "title",
  "description",
  "category",
  "priority",
  "target_date",
]);

const UPDATE_FIELDS = new Set([...CREATE_FIELDS, "completed"]);
const VALID_PRIORITIES = new Set(["low", "medium", "high"]);
const VALID_PLAN_STATUSES = new Set([
  "not_started",
  "in_progress",
  "completed",
  "archived",
]);
const CATEGORY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ITEM_LIMITS = {
  title: 120,
  description: 1_000,
  category: 50,
};

export const PLAN_LIMITS = {
  title: 120,
  description: 2_000,
  category: 50,
  stepText: 200,
  maxSteps: 50,
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

const CREATE_PLAN_FIELDS = new Set([
  "title",
  "description",
  "category",
  "status",
  "priority",
  "target_date",
  "estimated_duration",
  "phases",
  "steps",
]);

const UPDATE_PLAN_FIELDS = new Set(CREATE_PLAN_FIELDS);

function validatePlanStatus(value, fields) {
  if (typeof value !== "string" || !VALID_PLAN_STATUSES.has(value)) {
    fields.status =
      "Status must be not_started, in_progress, completed, or archived";
    return null;
  }
  return value;
}

function validatePlanDescription(value, fields) {
  if (value === undefined || value === null || value === "") return null;

  if (typeof value !== "string") {
    fields.description = "Description must be text or null";
    return null;
  }

  const description = value.trim();

  if (description.length > PLAN_LIMITS.description) {
    fields.description = `Description cannot exceed ${PLAN_LIMITS.description} characters`;
  }

  return description || null;
}

function validateEstimatedDuration(value, fields) {
  if (value === undefined || value === null || value === "") return null;

  if (typeof value !== "string") {
    fields.estimated_duration = "Estimated duration must be text";
    return null;
  }

  const duration = value.trim();

  if (duration.length > 100) {
    fields.estimated_duration = "Estimated duration cannot exceed 100 characters";
  }

  return duration || null;
}

function validatePhases(value, fields) {
  if (value === undefined || value === null || value === "") return "[]";

  let rawList = value;

  if (typeof rawList === "string") {
    try {
      rawList = JSON.parse(rawList);
    } catch {
      fields.phases = "Phases must be a valid JSON array";
      return "[]";
    }
  }

  if (!Array.isArray(rawList)) {
    fields.phases = "Phases must be an array";
    return "[]";
  }

  const sanitized = [];

  for (let pIdx = 0; pIdx < rawList.length; pIdx += 1) {
    const phase = rawList[pIdx];

    if (!phase || typeof phase !== "object") continue;

    const title =
      typeof phase.title === "string" ? phase.title.trim() : `Phase ${pIdx + 1}`;
    const description =
      typeof phase.description === "string" ? phase.description.trim() : null;
    const targetDate =
      typeof phase.target_date === "string" ? phase.target_date.trim() : null;

    const rawTasks = Array.isArray(phase.tasks) ? phase.tasks : [];
    const sanitizedTasks = [];

    for (let tIdx = 0; tIdx < rawTasks.length; tIdx += 1) {
      const task = rawTasks[tIdx];

      if (!task || typeof task !== "object") continue;

      const taskTitle =
        typeof task.title === "string"
          ? task.title.trim()
          : typeof task.text === "string"
            ? task.text.trim()
            : "";

      if (!taskTitle) continue;

      const rawSubtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
      const sanitizedSubtasks = [];

      for (let sIdx = 0; sIdx < rawSubtasks.length; sIdx += 1) {
        const sub = rawSubtasks[sIdx];

        if (!sub || typeof sub !== "object") continue;

        const subTitle =
          typeof sub.title === "string"
            ? sub.title.trim()
            : typeof sub.text === "string"
              ? sub.text.trim()
              : "";

        if (!subTitle) continue;

        sanitizedSubtasks.push({
          id: String(sub.id ?? `sub-${pIdx}-${tIdx}-${sIdx}`),
          title: subTitle,
          completed: Boolean(sub.completed),
        });
      }

      sanitizedTasks.push({
        id: String(task.id ?? `task-${pIdx}-${tIdx}`),
        title: taskTitle,
        description:
          typeof task.description === "string" ? task.description.trim() : null,
        deadline:
          typeof task.deadline === "string" ? task.deadline.trim() : null,
        completed: Boolean(task.completed),
        subtasks: sanitizedSubtasks,
      });
    }

    sanitized.push({
      id: String(phase.id ?? `phase-${pIdx + 1}`),
      title,
      description,
      target_date: targetDate,
      tasks: sanitizedTasks,
    });
  }

  return JSON.stringify(sanitized);
}

function validateSteps(value, fields) {
  if (value === undefined || value === null || value === "") return "[]";

  let rawList = value;

  if (typeof rawList === "string") {
    try {
      rawList = JSON.parse(rawList);
    } catch {
      fields.steps = "Steps must be a valid JSON array";
      return "[]";
    }
  }

  if (!Array.isArray(rawList)) {
    fields.steps = "Steps must be an array";
    return "[]";
  }

  if (rawList.length > PLAN_LIMITS.maxSteps) {
    fields.steps = `A plan cannot have more than ${PLAN_LIMITS.maxSteps} steps`;
    return "[]";
  }

  const sanitized = [];

  for (let index = 0; index < rawList.length; index += 1) {
    const item = rawList[index];

    if (!item || typeof item !== "object") {
      fields.steps = `Step at index ${index} must be an object`;
      return "[]";
    }

    const stepText =
      typeof item.text === "string"
        ? item.text.trim()
        : typeof item.title === "string"
          ? item.title.trim()
          : "";

    if (!stepText) {
      fields.steps = `Step at index ${index} must have non-empty text`;
      return "[]";
    }

    if (stepText.length > PLAN_LIMITS.stepText) {
      fields.steps = `Step text cannot exceed ${PLAN_LIMITS.stepText} characters`;
      return "[]";
    }

    const stepDesc =
      typeof item.description === "string" ? item.description.trim() : null;

    sanitized.push({
      id: String(item.id ?? index + 1),
      text: stepText,
      title: stepText,
      description: stepDesc,
      completed: Boolean(item.completed),
    });
  }

  return JSON.stringify(sanitized);
}

export function validateCreatePlan(body) {
  const fields = {};
  const unexpectedFields = findUnexpectedFields(body, CREATE_PLAN_FIELDS);

  if (unexpectedFields.length > 0) {
    fields.request = `Unsupported fields: ${unexpectedFields.join(", ")}`;
  }

  const data = {
    title: validateTitle(body.title, fields),
    description: validatePlanDescription(body.description, fields),
    category: validateCategory(body.category ?? "general", fields),
    status: validatePlanStatus(body.status ?? "not_started", fields),
    priority: validatePriority(body.priority ?? "medium", fields),
    target_date: validateTargetDate(body.target_date, fields),
    estimated_duration: validateEstimatedDuration(
      body.estimated_duration,
      fields,
    ),
    phases: validatePhases(body.phases ?? [], fields),
    steps: validateSteps(body.steps ?? [], fields),
  };

  return { data, fields };
}

export function validateUpdatePlan(body) {
  const fields = {};
  const data = {};
  const unexpectedFields = findUnexpectedFields(body, UPDATE_PLAN_FIELDS);

  if (unexpectedFields.length > 0) {
    fields.request = `Unsupported fields: ${unexpectedFields.join(", ")}`;
  }

  if (Object.hasOwn(body, "title")) {
    data.title = validateTitle(body.title, fields);
  }

  if (Object.hasOwn(body, "description")) {
    data.description = validatePlanDescription(body.description, fields);
  }

  if (Object.hasOwn(body, "category")) {
    data.category = validateCategory(body.category, fields);
  }

  if (Object.hasOwn(body, "status")) {
    data.status = validatePlanStatus(body.status, fields);
  }

  if (Object.hasOwn(body, "priority")) {
    data.priority = validatePriority(body.priority, fields);
  }

  if (Object.hasOwn(body, "target_date")) {
    data.target_date = validateTargetDate(body.target_date, fields);
  }

  if (Object.hasOwn(body, "estimated_duration")) {
    data.estimated_duration = validateEstimatedDuration(
      body.estimated_duration,
      fields,
    );
  }

  if (Object.hasOwn(body, "phases")) {
    data.phases = validatePhases(body.phases, fields);
  }

  if (Object.hasOwn(body, "steps")) {
    data.steps = validateSteps(body.steps, fields);
  }

  const suppliedFields = Object.keys(body).filter((field) =>
    UPDATE_PLAN_FIELDS.has(field),
  );

  if (suppliedFields.length === 0) {
    fields.request = "At least one supported field must be updated";
  }

  return { data, fields };
}
