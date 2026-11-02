/**
 * 用户侧请求是否为 HTTPS，用来决定登录 cookie 的 Secure 属性。
 *
 * Route Handler 里的 req.url 是 Next.js 内部转发地址，不能用来判断协议。
 * COOKIE_SECURE 显式覆盖优先；否则依次看：
 * - x-forwarded-proto（Docker / 反向代理）
 * - OPEN_NEXT_ORIGIN（OpenNext 从 Worker 收到的真实请求 URL 写入）
 * - CF-Visitor（Cloudflare 边缘协议；本地 wrangler 会丢掉客户端伪造的该头）
 */

function headerScheme(req: Request, name: string): string | undefined {
  const raw = req.headers.get(name)?.split(',')[0]?.trim().toLowerCase();
  return raw || undefined;
}

function openNextOriginProtocol(): string | undefined {
  const raw = process.env.OPEN_NEXT_ORIGIN;
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as { default?: { protocol?: string } };
    const protocol = parsed.default?.protocol?.toLowerCase();
    return protocol || undefined;
  } catch {
    return undefined;
  }
}

function cfVisitorScheme(req: Request): string | undefined {
  const visitor = req.headers.get('cf-visitor');
  if (!visitor) return undefined;
  try {
    const parsed = JSON.parse(visitor) as { scheme?: string };
    return parsed.scheme?.toLowerCase() || undefined;
  } catch {
    return undefined;
  }
}

export function requestIsHttps(req: Request): boolean {
  if (process.env.COOKIE_SECURE === 'true') return true;
  if (process.env.COOKIE_SECURE === 'false') return false;
  const forwarded = headerScheme(req, 'x-forwarded-proto');
  if (forwarded === 'https' || forwarded === 'http') return forwarded === 'https';
  const origin = openNextOriginProtocol();
  if (origin === 'https' || origin === 'http') return origin === 'https';
  const visitor = cfVisitorScheme(req);
  if (visitor === 'https' || visitor === 'http') return visitor === 'https';
  return false;
}
