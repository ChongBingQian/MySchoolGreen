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
    _id?: string;
    name?: string;
    status?: string;
    sensorTypes?: string[];
    location?: string;
    schoolId?: string;
    lastReadingAt?: string;
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

type SensorIssue = {
  severity: SuggestionPriority;
  message: string;
};

type DeviceInsight = {
  deviceId: string;
  name: string;
  location: string;
  school: string;
  stale: boolean;
  latestReadings: string[];
  issues: SensorIssue[];
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

function evaluateSensorIssue(
  sensorTypeRaw: string,
  valueRaw: number,
  unitRaw: string
): SensorIssue | null {
  const sensorType = sensorTypeRaw.toLowerCase();
  const value = Number(valueRaw);
  const unit = unitRaw.trim();

  if (sensorType === 'air_quality') {
    if (value > 100) {
      return {
        severity: 'high',
        message: `air quality is unhealthy (${value} ${unit || 'AQI'})`,
      };
    }
    if (value > 70) {
      return {
        severity: 'medium',
        message: `air quality needs attention (${value} ${unit || 'AQI'})`,
      };
    }
  }

  if (sensorType === 'temperature') {
    if (value > 32) {
      return {
        severity: 'high',
        message: `temperature is too high (${value} ${unit || 'C'})`,
      };
    }
    if (value < 16) {
      return {
        severity: 'medium',
        message: `temperature is too low (${value} ${unit || 'C'})`,
      };
    }
  }

  if (sensorType === 'soil_moisture') {
    if (value < 30) {
      return {
        severity: 'high',
        message: `soil moisture is low (${value}${unit || '%'})`,
      };
    }
    if (value > 80) {
      return {
        severity: 'medium',
        message: `soil moisture may be too high (${value}${unit || '%'})`,
      };
    }
  }

  if (sensorType === 'water_ph') {
    if (value < 6.5 || value > 8.5) {
      return {
        severity: 'high',
        message: `water pH is out of safe range (${value}${unit})`,
      };
    }
  }

  return null;
}

function buildDeviceInsights(body: SuggestionRequestBody): DeviceInsight[] {
  const devices = Array.isArray(body.devices) ? body.devices : [];
  const schools = Array.isArray(body.schools) ? body.schools : [];
  const readings = Array.isArray(body.dashboard?.recentReadings)
    ? body.dashboard?.recentReadings
    : [];

  const schoolNameById = new Map<string, string>();
  schools.forEach((school) => {
    const id = String((school as Record<string, unknown>)._id ?? '').trim();
    if (id) {
      schoolNameById.set(id, String(school.name ?? 'Unknown school').trim() || 'Unknown school');
    }
  });

  const latestByDeviceAndSensor = new Map<
    string,
    Record<string, { value: number; unit: string; recordedAt: number }>
  >();

  readings.forEach((reading) => {
    const deviceId = String(reading?.deviceId ?? '').trim();
    const sensorType = String(reading?.sensorType ?? '').trim();
    const value = Number(reading?.value);
    const unit = String(reading?.unit ?? '').trim();
    const recordedAt = Date.parse(String(reading?.recordedAt ?? ''));

    if (!deviceId || !sensorType || Number.isNaN(value) || Number.isNaN(recordedAt)) {
      return;
    }

    const bySensor = latestByDeviceAndSensor.get(deviceId) ?? {};
    const existing = bySensor[sensorType];
    if (!existing || recordedAt > existing.recordedAt) {
      bySensor[sensorType] = { value, unit, recordedAt };
      latestByDeviceAndSensor.set(deviceId, bySensor);
    }
  });

  const now = Date.now();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  return devices
    .filter((device) => String(device.status ?? '').toLowerCase() === 'active')
    .map((device) => {
      const deviceId = String(device._id ?? '').trim() || String(device.name ?? '').trim();
      const name = String(device.name ?? 'Unnamed device').trim() || 'Unnamed device';
      const location = String(device.location ?? 'unknown location').trim() || 'unknown location';
      const school = schoolNameById.get(String(device.schoolId ?? '').trim()) ?? 'Unknown school';

      const lastReadingAtRaw = String(device.lastReadingAt ?? '').trim();
      const lastReadingAtMs = Date.parse(lastReadingAtRaw);
      const stale =
        !lastReadingAtRaw || Number.isNaN(lastReadingAtMs) || now - lastReadingAtMs > threeDaysMs;

      const latestBySensor = latestByDeviceAndSensor.get(deviceId) ?? {};
      const latestReadings: string[] = [];
      const issues: SensorIssue[] = [];

      Object.entries(latestBySensor).forEach(([sensorType, reading]) => {
        latestReadings.push(
          `${sensorType}: ${reading.value}${reading.unit ? ` ${reading.unit}` : ''}`
        );
        const issue = evaluateSensorIssue(sensorType, reading.value, reading.unit);
        if (issue) {
          issues.push(issue);
        }
      });

      if (stale) {
        issues.push({
          severity: 'medium',
          message: 'device has no recent readings in the last 3 days',
        });
      }

      return {
        deviceId,
        name,
        location,
        school,
        stale,
        latestReadings,
        issues,
      };
    });
}

function buildFallbackSuggestions(insights: DeviceInsight[]): TodoSuggestion[] {
  const suggestions: TodoSuggestion[] = [];

  const critical = insights
    .flatMap((insight) =>
      insight.issues
        .filter((issue) => issue.severity === 'high')
        .map((issue) => ({ insight, issue }))
    )
    .slice(0, 3);

  critical.forEach(({ insight, issue }) => {
    suggestions.push({
      title: `Repair and calibrate ${insight.name}`,
      description: `Coordinate with ${insight.school} to inspect ${insight.name} at ${insight.location}, verify sensor calibration, and retest today.`,
      reason: `Detected issue: ${issue.message}.`,
      priority: 'high',
    });
  });

  const staleDevices = insights.filter((insight) => insight.stale).slice(0, 2);
  staleDevices.forEach((insight) => {
    suggestions.push({
      title: `Schedule maintenance for ${insight.name}`,
      description: `Ask ${insight.school} team to check power, connectivity, and sensor health for ${insight.name} at ${insight.location}.`,
      reason: 'The device has not reported fresh data recently.',
      priority: 'medium',
    });
  });

  if (suggestions.length === 0 && insights.length > 0) {
    const first = insights[0];
    suggestions.push({
      title: `Plan preventive check for ${first.school}`,
      description: `Run a weekly preventive inspection of active devices, starting with ${first.name} in ${first.location}.`,
      reason: 'Routine checks keep school devices reliable and avoid data gaps.',
      priority: 'low',
    });
  }

  return suggestions.slice(0, 6);
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
  const activeDevices = devices.filter(
    (device) => String(device.status ?? '').toLowerCase() === 'active'
  ).length;
  const insights = buildDeviceInsights(body);
  const issueCount = insights.reduce((sum, insight) => sum + insight.issues.length, 0);

  const dashboard = body.dashboard ?? {};

  const activeDeviceSnapshots = insights
    .slice(0, 10)
    .map((insight) => {
      const readings =
        insight.latestReadings.length > 0
          ? insight.latestReadings.join(', ')
          : 'no recent readings';
      const issues =
        insight.issues.length > 0
          ? insight.issues.map((issue) => issue.message).join('; ')
          : 'no issues detected';
      return `${insight.school} | ${insight.name} @ ${insight.location} | readings: ${readings} | issues: ${issues}`;
    })
    .join('\n');

  return [
    `Total todos: ${todos.length}`,
    `Open todos: ${openTodos.length}`,
    `Completed todos: ${completedTodos}`,
    `Open todo titles: ${recentOpenTitles.join(' | ') || 'none'}`,
    `Schools tracked: ${schools.length}`,
    `Devices tracked: ${devices.length}`,
    `Active devices: ${activeDevices}`,
    `Dashboard total devices: ${Number(dashboard.totalDevices ?? devices.length)}`,
    `Dashboard total schools: ${Number(dashboard.totalSchools ?? schools.length)}`,
    `Dashboard total credits: ${Number(dashboard.totalCredits ?? 0)}`,
    `Dashboard CO2 offset kg: ${Number(dashboard.co2OffsetKg ?? 0)}`,
    `Detected device issues: ${issueCount}`,
    `Active device environment snapshots:\n${activeDeviceSnapshots || 'none'}`,
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
  const insights = buildDeviceInsights(body);

  const aiResult = await env.TodoAI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      {
        role: 'system',
        content:
          'You are a sustainability operations assistant for schools. Respond only with JSON in this shape: {"suggestions":[{"title":"string","description":"string","reason":"string","priority":"high|medium|low"}]}. Build suggestions from active devices and detected environment signals. Include at least one school-device repair or maintenance action when any issue is detected. Keep suggestions practical and concise.',
      },
      {
        role: 'user',
        content: `Generate 4 to 6 actionable todo suggestions based on this app data:\n${contextSummary}`,
      },
    ],
    temperature: 0.35,
    max_tokens: 700,
  });

  const suggestions = parseSuggestionsFromAi(extractAiText(aiResult));
  const fallbackSuggestions = buildFallbackSuggestions(insights);

  if (suggestions.length === 0 && fallbackSuggestions.length === 0) {
    return json({ ok: false, message: 'AI did not return valid suggestions' }, 502);
  }

  return json({
    ok: true,
    suggestions: suggestions.length > 0 ? suggestions : fallbackSuggestions,
  });
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
