export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return Response.json(
        {
          ok: true,
          service: 'pinkcare-digital-compass',
          runtime: 'cloudflare-workers',
          phase: 1,
          timestamp: new Date().toISOString(),
        },
        { status: 200 },
      );
    }

    if (url.pathname.startsWith('/api/')) {
      return Response.json(
        {
          error: 'API route not yet migrated to Cloudflare Worker (Phase 2 pending)',
          path: url.pathname,
        },
        { status: 501 },
      );
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
