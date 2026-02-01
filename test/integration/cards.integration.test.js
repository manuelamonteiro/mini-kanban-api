import { jest } from '@jest/globals';
import { buildTestApp, cardServiceMock } from '../helpers/integrationApp.js';
import { startTestServer, stopTestServer } from '../helpers/testServer.js';
import { TEST_USER } from '../helpers/testUser.js';

let server;
let agent;

const validColumnId = '22222222-2222-2222-2222-222222222222';
const validCardId = '33333333-3333-3333-3333-333333333333';

describe('Cards endpoints', () => {
  beforeAll(async () => {
    const app = await buildTestApp();
    const started = await startTestServer(app);
    server = started.server;
    agent = started.agent;
  });

  afterAll(async () => {
    await stopTestServer(server);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/columns/:columnId/cards creates a card', async () => {
    cardServiceMock.createCard.mockResolvedValue({ id: validCardId, title: 'Task', description: '', position: 1 });

    const res = await agent
      .post(`/api/columns/${validColumnId}/cards`)
      .send({ title: 'Task', description: '' })
      .expect(201);

    expect(res.body.data.title).toBe('Task');
    expect(cardServiceMock.createCard).toHaveBeenCalledWith(
      TEST_USER.id,
      validColumnId,
      { title: 'Task', description: '' }
    );
  });

  it('PUT /api/cards/:id updates card fields', async () => {
    cardServiceMock.updateCard.mockResolvedValue({ id: validCardId, title: 'New title', description: 'desc', position: 1 });

    const res = await agent
      .put(`/api/cards/${validCardId}`)
      .send({ title: 'New title', description: 'desc' })
      .expect(200);

    expect(res.body.data.title).toBe('New title');
    expect(cardServiceMock.updateCard).toHaveBeenCalledWith(
      TEST_USER.id,
      validCardId,
      { title: 'New title', description: 'desc' }
    );
  });

  it('DELETE /api/cards/:id deletes a card', async () => {
    cardServiceMock.deleteCard.mockResolvedValue(true);

    const res = await agent.delete(`/api/cards/${validCardId}`).expect(200);

    expect(res.body.success).toBe(true);
    expect(cardServiceMock.deleteCard).toHaveBeenCalledWith(TEST_USER.id, validCardId);
  });

  it('PATCH /api/cards/:id/move moves a card', async () => {
    cardServiceMock.moveCard.mockResolvedValue({
      id: validCardId,
      column_id: validColumnId,
      position: 2,
    });

    const res = await agent
      .patch(`/api/cards/${validCardId}/move`)
      .send({ newColumnId: validColumnId, newPosition: 2 })
      .expect(200);

    expect(res.body.data.position).toBe(2);
    expect(cardServiceMock.moveCard).toHaveBeenCalledWith(
      TEST_USER.id,
      validCardId,
      { newColumnId: validColumnId, newPosition: 2 }
    );
  });

  it('PATCH /api/cards/:id/move validates invalid UUID before service', async () => {
    const res = await agent
      .patch('/api/cards/not-a-uuid/move')
      .send({ newColumnId: validColumnId, newPosition: 1 })
      .expect(422);

    expect(res.body.error.type).toBe('validation');
    expect(cardServiceMock.moveCard).not.toHaveBeenCalled();
  });
});
