import { http, HttpResponse, delay } from 'msw';
import { server } from '../mocks/server';
import client, { normalizeError } from '@/api/client';

describe('API Client', () => {
  test('includes credentials for cookie transport', async () => {
    expect(client.defaults.withCredentials).toBe(true);
  });

  test('retries on 5xx with exponential backoff', async () => {
    let attemptCount = 0;

    server.use(
      http.get('/api/v1/test-retry', () => {
        attemptCount++;
        if (attemptCount < 3) {
          return HttpResponse.json({ error: 'server error' }, { status: 500 });
        }
        return HttpResponse.json({ data: 'success' });
      }),
    );

    const res = await client.get('/api/v1/test-retry');
    expect(res.data).toEqual({ data: 'success' });
    expect(attemptCount).toBe(3);
  });

  test('does not retry on 4xx', async () => {
    let attemptCount = 0;

    server.use(
      http.get('/api/v1/test-no-retry', () => {
        attemptCount++;
        return HttpResponse.json(
          { title: 'Not Found', status: 404 },
          { status: 404 },
        );
      }),
    );

    await expect(client.get('/api/v1/test-no-retry')).rejects.toThrow();
    expect(attemptCount).toBe(1);
  });

  test('aborts duplicate in-flight GET requests', async () => {
    let callCount = 0;

    server.use(
      http.get('/api/v1/test-dedup', async () => {
        callCount++;
        if (callCount === 1) {
          // Simulate a slow first request
          await delay(2000);
          return HttpResponse.json({ data: 'first' });
        }
        return HttpResponse.json({ data: 'second' });
      }),
    );

    // Fire first request (will be slow), then immediately fire a second
    const first = client.get('/api/v1/test-dedup').catch((err: Error) => err);
    // Small tick to ensure first request is registered
    await new Promise((r) => setTimeout(r, 10));
    const second = client.get('/api/v1/test-dedup');

    // The first request should be cancelled
    const firstResult = await first;
    expect(firstResult).toBeInstanceOf(Error);

    const res = await second;
    expect(res.data).toEqual({ data: 'second' });
  });

  test('POST requests include X-XSRF-TOKEN header from cookie', async () => {
    // Set the XSRF-TOKEN cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'XSRF-TOKEN=test-csrf-token-123; other=value',
    });

    let capturedHeaders: Record<string, string> = {};

    server.use(
      http.post('/api/v1/test-csrf', ({ request }) => {
        capturedHeaders = Object.fromEntries(request.headers.entries());
        return HttpResponse.json({ ok: true });
      }),
    );

    await client.post('/api/v1/test-csrf', { data: 'test' });

    expect(capturedHeaders['x-xsrf-token']).toBe('test-csrf-token-123');

    // Cleanup
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  test('normalizeError extracts ProblemDetail from response', () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 422,
        data: {
          title: 'Validation Failed',
          detail: 'Input invalid',
          violations: [{ field: 'title', message: 'must not be blank' }],
        },
      },
      message: 'Request failed',
    };

    // Manually mark as axios error for isAxiosError check
    Object.defineProperty(axiosError, 'isAxiosError', { value: true });

    const result = normalizeError(axiosError);
    expect(result.status).toBe(422);
    expect(result.title).toBe('Validation Failed');
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].field).toBe('title');
  });

  test('normalizeError handles network errors', () => {
    const error = new Error('Network Error');
    const result = normalizeError(error);
    expect(result.status).toBe(0);
    expect(result.title).toBe('Network Error');
    expect(result.detail).toBe('Network Error');
  });
});
