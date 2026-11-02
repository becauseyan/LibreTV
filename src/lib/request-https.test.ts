import { afterEach, describe, expect, it } from 'vitest';
import { requestIsHttps } from './request-https';

const ORIGINAL_SECURE = process.env.COOKIE_SECURE;
const ORIGINAL_ORIGIN = process.env.OPEN_NEXT_ORIGIN;

afterEach(() => {
  if (ORIGINAL_SECURE === undefined) delete process.env.COOKIE_SECURE;
  else process.env.COOKIE_SECURE = ORIGINAL_SECURE;
  if (ORIGINAL_ORIGIN === undefined) delete process.env.OPEN_NEXT_ORIGIN;
  else process.env.OPEN_NEXT_ORIGIN = ORIGINAL_ORIGIN;
});

function req(headers: Record<string, string> = {}): Request {
  return new Request('http://internal.local/api/auth', { headers });
}

describe('requestIsHttps', () => {
  it('COOKIE_SECURE 覆盖转发头', () => {
    process.env.COOKIE_SECURE = 'true';
    expect(requestIsHttps(req({ 'x-forwarded-proto': 'http' }))).toBe(true);
    process.env.COOKIE_SECURE = 'false';
    expect(requestIsHttps(req({ 'x-forwarded-proto': 'https' }))).toBe(false);
  });

  it('优先使用 x-forwarded-proto', () => {
    delete process.env.COOKIE_SECURE;
    process.env.OPEN_NEXT_ORIGIN = JSON.stringify({ default: { protocol: 'http' } });
    expect(requestIsHttps(req({ 'x-forwarded-proto': 'https' }))).toBe(true);
    expect(requestIsHttps(req({ 'x-forwarded-proto': 'http, https' }))).toBe(false);
  });

  it('没有转发头时读取 OpenNext 记录的真实协议', () => {
    delete process.env.COOKIE_SECURE;
    process.env.OPEN_NEXT_ORIGIN = JSON.stringify({ default: { protocol: 'https', host: 'libretv-next.example.workers.dev' } });
    expect(requestIsHttps(req())).toBe(true);
    process.env.OPEN_NEXT_ORIGIN = JSON.stringify({ default: { protocol: 'http' } });
    expect(requestIsHttps(req())).toBe(false);
  });

  it('再退回 CF-Visitor，畸形 JSON 按 HTTP 处理', () => {
    delete process.env.COOKIE_SECURE;
    delete process.env.OPEN_NEXT_ORIGIN;
    expect(requestIsHttps(req({ 'cf-visitor': '{"scheme":"https"}' }))).toBe(true);
    expect(requestIsHttps(req({ 'cf-visitor': 'not-json' }))).toBe(false);
    expect(requestIsHttps(req())).toBe(false);
  });
});
