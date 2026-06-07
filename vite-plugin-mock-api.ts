import { Plugin } from 'vite';

// Mock users database
const mockUsers: Record<string, { password: string; name: string }> = {
  'admin@example.com': { password: '123456', name: '管理员' },
  'user@example.com': { password: '123456', name: '张三' },
};

/**
 * Vite plugin that injects mock API routes into the dev server.
 * Handles meeting join / guest-join endpoints so the frontend
 * can make real fetch() calls visible in the Network panel.
 */
export function viteMockApiPlugin(): Plugin {
  return {
    name: 'vite-mock-api',
    configureServer(server) {
      // ── POST /api/auth/login ────────────────────────────────
      server.middlewares.use('/api/auth/login', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 404;
          res.end();
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });

        req.on('end', () => {
          setTimeout(() => {
            try {
              const parsed = JSON.parse(body);
              const { email, password } = parsed;

              if (!mockUsers[email] || mockUsers[email].password !== password) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ message: '邮箱或密码错误' }));
                return;
              }

              const user = {
                id: 'user-' + Math.random().toString(36).slice(2, 10),
                email,
                name: mockUsers[email].name,
              };

              const token = `jwt-token-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ token, user }));
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ message: '请求参数错误' }));
            }
          }, 500);
        });
      });

      // ── POST /api/auth/register ─────────────────────────────
      server.middlewares.use('/api/auth/register', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 404;
          res.end();
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });

        req.on('end', () => {
          setTimeout(() => {
            try {
              const parsed = JSON.parse(body);
              const { email, password, name } = parsed;

              if (!email || !password || !name) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ message: '请填写完整信息' }));
                return;
              }

              if (mockUsers[email]) {
                res.statusCode = 409;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ message: '该邮箱已被注册' }));
                return;
              }

              mockUsers[email] = { password, name };

              res.statusCode = 201;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ message: '注册成功' }));
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ message: '请求参数错误' }));
            }
          }, 500);
        });
      });

      // ── GET /api/meetings/:id/join ──────────────────────────
      server.middlewares.use('/api/meetings/', (req, res, next) => {
        const match = req.url?.match(/^\/([^/]+)\/join$/);
        if (!match || req.method !== 'GET') {
          return next();
        }

        const meetingId = match[1];
        const authHeader = req.headers['authorization'] || '';

        // Simulate 100ms network latency
        setTimeout(() => {
          // 未登录 → 401 (requireGuest)
          if (!authHeader) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ requireGuest: true }));
            return;
          }

          // 已登录 → 200 (canJoin)
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              canJoin: true,
              meeting: {
                id: meetingId,
                title: '产品评审会',
                status: 'ongoing',
                isHost: true,
              },
            }),
          );
        }, 200);
      });

      // ── POST /api/meetings/:id/join-as-guest ────────────────
      server.middlewares.use('/api/meetings/', (req, res, next) => {
        const match = req.url?.match(/^\/([^/]+)\/join-as-guest$/);
        if (!match || req.method !== 'POST') {
          return next();
        }

        const meetingId = match[1];
        let body = '';

        req.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });

        req.on('end', () => {
          let displayName = '访客';
          try {
            const parsed = JSON.parse(body);
            if (parsed.displayName) displayName = parsed.displayName;
          } catch {
            /* ignore */
          }

          const token = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

          setTimeout(() => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                token,
                guestName: displayName,
                meetingId,
              }),
            );
          }, 300);
        });
      });
    },
  };
}
