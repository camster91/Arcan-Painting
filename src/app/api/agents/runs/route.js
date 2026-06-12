/**
 * GET /api/agents/runs — list agent runs from the agent_runs table (admin only)
 * GET /api/agents/runs/:id — single run (admin only)
 *
 * Extracted from the parent src/app/api/agents/route.js so this path is
 * actually routable in React Router 7's file-based routing (the old version
 * inspected url.pathname inside /api/agents, which never matched).
 */
import { requireAdmin, unauthorizedResponse } from "../../utils/auth.js";
import { getAgentRun, getAgentRuns, getAgentStats } from "../store.js";

export async function GET(request) {
  const authorized = await requireAdmin(request);
  if (!authorized) return unauthorizedResponse();

  const url = new URL(request.url);

  // ?agent_id, ?status, ?since (ms epoch), ?limit
  const agentId = url.searchParams.get("agent_id") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const since = url.searchParams.get("since")
    ? parseInt(url.searchParams.get("since"))
    : undefined;
  const limit = url.searchParams.get("limit")
    ? parseInt(url.searchParams.get("limit"))
    : 100;

  const runs = await getAgentRuns({ agent_id: agentId, status, since, limit });
  const stats = await getAgentStats();

  return Response.json({ runs, stats });
}
