import { apiRequest } from "./bucketApi.js";

export function getPlans() {
  return apiRequest(
    "/api/plans",
    { method: "GET", cache: "no-store" },
    "Failed to load plans",
  );
}

export function getPlan(id) {
  return apiRequest(
    `/api/plans/${encodeURIComponent(id)}`,
    { method: "GET", cache: "no-store" },
    "Failed to load plan",
  );
}

export function createPlan(plan) {
  return apiRequest(
    "/api/plans",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plan),
    },
    "Failed to create plan",
  );
}

export function updatePlan(id, updates) {
  return apiRequest(
    `/api/plans/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    },
    "Failed to update plan",
  );
}

export function deletePlan(id) {
  return apiRequest(
    `/api/plans/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    "Failed to delete plan",
  );
}
