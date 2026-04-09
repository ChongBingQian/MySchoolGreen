export interface Env {
  // Static asset binding configured in wrangler.worker.toml.
  ASSETS?: {
    fetch(request: Request): Promise<Response>;
  };
  TodoAI?: {
    run(
      model: string,
      inputs: {
        messages: Array<{ role: 'system' | 'user'; content: string }>;
        temperature?: number;
        max_tokens?: number;
      }
    ): Promise<unknown>;
  };
}

type SuggestionPriority = 'high' | 'medium' | 'low';

type TodoSuggestion = {
  title: string;
  description: string;
  reason: string;
  priority: SuggestionPriority;
};

type SuggestionRequestBody = {
  todos?: Array<{
    title?: string;
    description?: string;
    completed?: boolean;
    createdAt?: string;
  }>;
  schools?: Array<{ name?: string; city?: string; totalCredits?: number }>;
  devices?: Array<{
    name?: string;
    status?: string;
    sensorTypes?: string[];
    location?: string;
    lastReadingAt?: string;
  }>;
  activeDevices?: Array<{
    name?: string;
    status?: string;
    sensorTypes?: string[];
    location?: string;
    lastReadingAt?: string;
  }>;
  environmentReadings?: Array<{
    deviceId?: string;
    sensorType?: string;
    value?: number;
    unit?: string;
    recordedAt?: string;
  }>;
  dashboard?: {
    totalDevices?: number;
    activeDevices?: number;
    totalSchools?: number;
    totalCredits?: number;
    co2OffsetKg?: number;
    recentReadings?: Array<{
      deviceId?: string;
      sensorType?: string;
      value?: number;
      unit?: string;
      recordedAt?: string;
    }>;
  };
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function normalizeSuggestion(raw: unknown): TodoSuggestion | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const row = raw as Record<string, unknown>;
  const title = String(row.title ?? '').trim();
  if (!title) {
    return null;
  }

  const description = String(row.description ?? '').trim();
  const reason = String(row.reason ?? '').trim();
  const priorityValue = String(row.priority ?? 'medium').toLowerCase();
  const priority: SuggestionPriority =
    priorityValue === 'high' || priorityValue === 'medium' || priorityValue === 'low'
      ? priorityValue
      : 'medium';

  return {
    title: title.slice(0, 200),
    description: description.slice(0, 500),
    reason: reason.slice(0, 240),
    priority,
  };
}

function extractAiText(result: unknown): string {
  if (!result || typeof result !== 'object') {
    return '';
  }

  const payload = result as Record<string, unknown>;
  if (typeof payload.response === 'string') {
    return payload.response;
  }

  if (typeof payload.result === 'string') {
    return payload.result;
  }

  return '';
}

function parseSuggestionsFromAi(text: string): TodoSuggestion[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  const jsonBlockMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonBlockMatch) {
    return [];
  }

  try {
    const parsed = JSON.parse(jsonBlockMatch[0]) as { suggestions?: unknown[] };
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
    return suggestions
      .map((item) => normalizeSuggestion(item))
      .filter((item): item is TodoSuggestion => Boolean(item))
      .slice(0, 6);
  } catch {
    return [];
  }
}

function normalizeSensorType(sensorType: string): string {
  return sensorType.replace(/[_-]+/g, ' ').trim().toLowerCase();
}

function summarizeEnvironmentReadings(body: SuggestionRequestBody): string {
  const dashboardReadings = Array.isArray(body.dashboard?.recentReadings)
    ? body.dashboard?.recentReadings
    : [];
  const rawReadings = Array.isArray(body.environmentReadings)
    ? body.environmentReadings
    : dashboardReadings;

  const readings = rawReadings
    .map((reading) => {
      const sensorType = normalizeSensorType(String(reading.sensorType ?? ''));
      const value = Number(reading.value);
      const unit = String(reading.unit ?? '').trim();

      if (!sensorType || Number.isNaN(value)) {
        return null;
      }

      return {
        sensorType,
        value,
        unit,
      };
    })
    .filter((item): item is { sensorType: string; value: number; unit: string } => Boolean(item));

  if (readings.length === 0) {
    return 'No recent environment readings available.';
  }

  const grouped = new Map<string, Array<{ value: number; unit: string }>>();
  readings.forEach((reading) => {
    const bucket = grouped.get(reading.sensorType) ?? [];
    bucket.push({ value: reading.value, unit: reading.unit });
    grouped.set(reading.sensorType, bucket);
  });

  return Array.from(grouped.entries())
    .slice(0, 8)
    .map(([sensorType, values]) => {
      const average = values.reduce((sum, row) => sum + row.value, 0) / values.length;
      const latest = values[0];
      return `${sensorType}: latest ${latest.value.toFixed(2)}${latest.unit ? ` ${latest.unit}` : ''}, avg ${average.toFixed(2)}`;
    })
    .join(' | ');
}

function summarizeActiveDevices(body: SuggestionRequestBody): string {
  const activeDeviceList = Array.isArray(body.activeDevices)
    ? body.activeDevices
    : Array.isArray(body.devices)
      ? body.devices.filter((device) => String(device.status ?? '').toLowerCase() === 'active')
      : [];

  if (activeDeviceList.length === 0) {
    return 'No active devices tracked.';
  }

  return activeDeviceList
    .slice(0, 10)
    .map((device) => {
      const name = String(device.name ?? 'Unnamed device').trim();
      const location = String(device.location ?? 'unknown location').trim();
      const sensorTypes = Array.isArray(device.sensorTypes)
        ? device.sensorTypes.join(', ')
        : 'unknown sensors';
      const lastReadingAt = String(device.lastReadingAt ?? '').trim();
      return `${name} @ ${location}; sensors: ${sensorTypes}; last reading: ${lastReadingAt || 'not yet recorded'}`;
    })
    .join(' | ');
}

function ensureSchoolRepairSuggestion(
  suggestions: TodoSuggestion[],
  body: SuggestionRequestBody
): TodoSuggestion[] {
  const hasSchoolRepairSuggestion = suggestions.some((suggestion) => {
    const text = `${suggestion.title} ${suggestion.description} ${suggestion.reason}`.toLowerCase();
    return /(school|campus)/.test(text) && /(repair|maintain|maintenance|service)/.test(text);
  });

  if (hasSchoolRepairSuggestion) {
    return suggestions;
  }

  const activeDevice = (
    Array.isArray(body.activeDevices) ? body.activeDevices : body.devices || []
  ).find((device) => String(device.status ?? '').toLowerCase() === 'active');

  const deviceName = String(activeDevice?.name ?? 'an active monitoring device').trim();
  const location = String(activeDevice?.location ?? 'the school site').trim();

  return [
    {
      title: 'Coordinate school repair check for active device',
      description: `Ask a participating school team to inspect and repair ${deviceName} at ${location} to keep environmental monitoring reliable.`,
      reason:
        'Active devices need regular school-supported maintenance to avoid data gaps and downtime.',
      priority: 'high' as SuggestionPriority,
    },
    ...suggestions,
  ].slice(0, 6);
}

function summarizeContext(body: SuggestionRequestBody): string {
  const todos = Array.isArray(body.todos) ? body.todos : [];
  const openTodos = todos.filter((todo) => !todo.completed);
  const completedTodos = todos.length - openTodos.length;
  const recentOpenTitles = openTodos
    .slice(0, 8)
    .map((todo) => String(todo.title ?? '').trim())
    .filter(Boolean);

  const schools = Array.isArray(body.schools) ? body.schools : [];
  const devices = Array.isArray(body.devices) ? body.devices : [];
  const activeDevicesCount = devices.filter(
    (device) => String(device.status ?? '').toLowerCase() === 'active'
  ).length;

  const dashboard = body.dashboard ?? {};

  return [
    `Total todos: ${todos.length}`,
    `Open todos: ${openTodos.length}`,
    `Completed todos: ${completedTodos}`,
    `Open todo titles: ${recentOpenTitles.join(' | ') || 'none'}`,
    `Schools tracked: ${schools.length}`,
    `Devices tracked: ${devices.length}`,
    `Active devices count: ${activeDevicesCount}`,
    `Active device details: ${summarizeActiveDevices(body)}`,
    `Environment snapshot: ${summarizeEnvironmentReadings(body)}`,
    `Dashboard total devices: ${Number(dashboard.totalDevices ?? devices.length)}`,
    `Dashboard total schools: ${Number(dashboard.totalSchools ?? schools.length)}`,
    `Dashboard total credits: ${Number(dashboard.totalCredits ?? 0)}`,
    `Dashboard CO2 offset kg: ${Number(dashboard.co2OffsetKg ?? 0)}`,
  ].join('\n');
}

async function handleTodoSuggestionRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ ok: false, message: 'Method not allowed' }, 405);
  }

  if (!env.TodoAI) {
    return json(
      {
        ok: false,
        message: 'Cloudflare AI binding is not configured',
      },
      503
    );
  }

  let body: SuggestionRequestBody;
  try {
    body = (await request.json()) as SuggestionRequestBody;
  } catch {
    return json({ ok: false, message: 'Invalid JSON body' }, 400);
  }

  const contextSummary = summarizeContext(body);

  const aiResult = await env.TodoAI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      {
        role: 'system',
        content:
          'You are a sustainability operations assistant for schools. Respond only with JSON in this exact shape: {"suggestions":[{"title":"string","description":"string","reason":"string","priority":"high|medium|low"}]}. Every suggestion must be practical, short, and grounded in the provided active-device and environment-reading data. Include at least one suggestion that asks a school to participate in repairing or maintaining an active device.',
      },
      {
        role: 'user',
        content:
          `Generate 4 to 6 actionable todo suggestions based on this app data:\n${contextSummary}\n` +
          'Rules: prioritize active devices first; reference environment readings where possible; avoid generic suggestions that are not tied to the data; include one school-participation repair task.',
      },
    ],
    temperature: 0.35,
    max_tokens: 700,
  });

  const aiSuggestions = parseSuggestionsFromAi(extractAiText(aiResult));
  const suggestions = ensureSchoolRepairSuggestion(aiSuggestions, body);

  if (suggestions.length === 0) {
    return json(
      {
        ok: false,
        message: 'AI did not return valid suggestions',
      },
      502
    );
  }

  return json({ ok: true, suggestions });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return json({ ok: true, service: 'myschoolgreen-api' });
    }

    if (url.pathname === '/api/time') {
      return json({ now: new Date().toISOString() });
    }

    if (url.pathname === '/api/ai/todo-suggestions') {
      return handleTodoSuggestionRequest(request, env);
    }

    // Keep API paths strict: unknown API routes should still return 404 JSON.
    if (url.pathname.startsWith('/api/')) {
      return json(
        {
          ok: false,
          message: 'Not found',
        },
        404
      );
    }

    // Serve frontend SPA from Worker static assets for all non-API routes.
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Frontend assets are not configured. Run build and redeploy worker.', {
      status: 503,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  },
};
