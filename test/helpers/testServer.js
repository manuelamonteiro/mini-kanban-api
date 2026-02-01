import http from 'http';
import request from 'supertest';

async function startTestServer(app) {
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const agent = request(server);

  return { server, agent };
}

function stopTestServer(server) {
  return new Promise((resolve) => {
    if (!server) return resolve();
    server.close(() => resolve());
  });
}

export { startTestServer, stopTestServer };
