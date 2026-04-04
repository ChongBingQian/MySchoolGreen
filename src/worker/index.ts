export interface Env {
  // Add bindings here (KV, D1, R2, etc.) as your API grows.
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return json({ ok: true, service: 'myschoolgreen-api' });
    }

    if (url.pathname === '/api/time') {
      return json({ now: new Date().toISOString() });
    }

    return json(
      {
        ok: false,
        message: 'Not found',
      },
      404
    );
  },
};
