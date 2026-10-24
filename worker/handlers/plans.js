import { errorResponse, readJsonObject } from "../utils/http.js";
import { validateCreatePlan, validateUpdatePlan } from "../utils/validation.js";

const UPDATE_COLUMNS = {
  title: "title",
  description: "description",
  category: "category",
  status: "status",
  priority: "priority",
  target_date: "target_date",
  steps: "steps",
};

function validationError(fields) {
  return errorResponse(
    "Please correct the invalid fields",
    422,
    "VALIDATION_ERROR",
    fields,
  );
}

function normalizePlanRow(row) {
  if (!row) return row;

  let steps = [];

  if (typeof row.steps === "string") {
    try {
      steps = JSON.parse(row.steps);
    } catch {
      steps = [];
    }
  } else if (Array.isArray(row.steps)) {
    steps = row.steps;
  }

  return {
    ...row,
    steps,
  };
}

export async function getPlans(env) {
  const result = await env.bucketlist_db
    .prepare(
      `
      SELECT *
      FROM plans
      ORDER BY created_at DESC
      `,
    )
    .all();

  const plans = (result.results ?? []).map(normalizePlanRow);
  return Response.json(plans);
}

export async function getPlan(env, planId) {
  const plan = await env.bucketlist_db
    .prepare(
      `
      SELECT *
      FROM plans
      WHERE id = ?
      `,
    )
    .bind(planId)
    .first();

  if (!plan) {
    return errorResponse("Plan not found", 404, "PLAN_NOT_FOUND");
  }

  return Response.json(normalizePlanRow(plan));
}

export async function createPlan(request, env) {
  const parsed = await readJsonObject(request);

  if (parsed.response) return parsed.response;

  const { data, fields } = validateCreatePlan(parsed.body);

  if (Object.keys(fields).length > 0) return validationError(fields);

  const newPlan = await env.bucketlist_db
    .prepare(
      `
      INSERT INTO plans (
        title,
        description,
        category,
        status,
        priority,
        target_date,
        steps
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
      `,
    )
    .bind(
      data.title,
      data.description,
      data.category,
      data.status,
      data.priority,
      data.target_date,
      data.steps,
    )
    .first();

  return Response.json(normalizePlanRow(newPlan), { status: 201 });
}

export async function deletePlan(env, planId) {
  const result = await env.bucketlist_db
    .prepare(
      `
      DELETE FROM plans
      WHERE id = ?
      `,
    )
    .bind(planId)
    .run();

  if (result.meta.changes === 0) {
    return errorResponse("Plan not found", 404, "PLAN_NOT_FOUND");
  }

  return new Response(null, { status: 204 });
}

export async function updatePlan(request, env, planId) {
  const parsed = await readJsonObject(request);

  if (parsed.response) return parsed.response;

  const { data, fields } = validateUpdatePlan(parsed.body);

  if (Object.keys(fields).length > 0) return validationError(fields);

  const assignments = [];
  const values = [];

  for (const [field, value] of Object.entries(data)) {
    assignments.push(`${UPDATE_COLUMNS[field]} = ?`);
    values.push(value);
  }

  const updatedPlan = await env.bucketlist_db
    .prepare(
      `
      UPDATE plans
      SET
        ${assignments.join(", ")},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING *
      `,
    )
    .bind(...values, planId)
    .first();

  if (!updatedPlan) {
    return errorResponse("Plan not found", 404, "PLAN_NOT_FOUND");
  }

  return Response.json(normalizePlanRow(updatedPlan));
}
