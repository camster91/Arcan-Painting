/**
 * OpenClaw client for Arcan Painting AI agents
 * Spawns subagents via Gerardo's local OpenClaw instance
 */

const OPENCLAW_URL = process.env.OPENCLAW_URL || 'http://localhost:18789';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || process.env.BOT_SECRET || '';

/**
 * Spawn an OpenClaw subagent with a task and context
 * @param {Object} options
 * @param {string} options.task - The task prompt to send to the agent
 * @param {string} options.contextFile - Path to the agent context .md file (e.g. 'agents/arcan-lead-qualifier.md')
 * @param {string} [options.model] - Optional model override
 * @param {number} [options.timeoutMs] - Timeout in ms (default: 30000)
 * @returns {Promise<{success: boolean, result: string, error?: string}>}
 */
export async function spawnAgent({ task, contextFile, model, timeoutMs = 30000 }) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (OPENCLAW_TOKEN) {
    headers['Authorization'] = `Bearer ${OPENCLAW_TOKEN}`;
  }

  const body = {
    message: task,
    context_file: contextFile,
  };

  if (model) {
    body.model = model;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${OPENCLAW_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenClaw agent error [${response.status}]:`, errorText);
      return {
        success: false,
        result: null,
        error: `OpenClaw returned ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    const result = data.reply || data.message || data.response || JSON.stringify(data);

    return { success: true, result };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { success: false, result: null, error: `Agent timed out after ${timeoutMs}ms` };
    }
    console.error('OpenClaw fetch error:', err.message);
    return { success: false, result: null, error: err.message };
  }
}

/**
 * Parse JSON from agent response, with fallback
 * Agents are instructed to return JSON, but may include markdown fences
 */
export function parseAgentJSON(text) {
  if (!text) return null;
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract JSON object from mixed text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Check if OpenClaw is available
 */
export async function pingOpenClaw() {
  try {
    const res = await fetch(`${OPENCLAW_URL}/api/health`, { 
      method: 'GET',
      headers: OPENCLAW_TOKEN ? { 'Authorization': `Bearer ${OPENCLAW_TOKEN}` } : {},
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
