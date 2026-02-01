import { jest } from '@jest/globals';
import { boardServiceMock, buildTestApp } from '../helpers/integrationApp.js';
import { startTestServer, stopTestServer } from '../helpers/testServer.js';
import { TEST_USER } from '../helpers/testUser.js';

let server;
let agent;

const validBoardId = '11111111-1111-1111-1111-111111111111';
const validColumnId = '22222222-2222-2222-2222-222222222222';

describe('Boards endpoints', () => {
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

  it('POST /api/boards creates a board', async () => {
    boardServiceMock.createBoard.mockResolvedValue({ id: validBoardId, name: 'Sprint' });

    const res = await agent
      .post('/api/boards')
      .send({ name: 'Sprint' })
      .expect(201);

    expect(res.body.data).toEqual({ id: validBoardId, name: 'Sprint' });
    expect(boardServiceMock.createBoard).toHaveBeenCalledWith(TEST_USER.id, 'Sprint');
  });

  it('POST /api/boards fails validation when name is empty', async () => {
    const res = await agent
      .post('/api/boards')
      .send({ name: '' })
      .expect(422);

    expect(res.body.error.type).toBe('validation');
    expect(boardServiceMock.createBoard).not.toHaveBeenCalled();
  });

  it('GET /api/boards lists user boards', async () => {
    boardServiceMock.listBoards.mockResolvedValue([
      { id: validBoardId, name: 'Sprint', created_at: '2024-01-01' },
    ]);

    const res = await agent.get('/api/boards').expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(boardServiceMock.listBoards).toHaveBeenCalledWith(TEST_USER.id);
  });

  it('GET /api/boards/:id returns a board with columns/cards', async () => {
    boardServiceMock.getBoardWithDetails.mockResolvedValue({
      id: validBoardId,
      name: 'Sprint',
      columns: [{ id: validColumnId, name: 'Backlog', position: 1, cards: [] }],
    });

    const res = await agent.get(`/api/boards/${validBoardId}`).expect(200);

    expect(res.body.data.columns[0].name).toBe('Backlog');
    expect(boardServiceMock.getBoardWithDetails).toHaveBeenCalledWith(TEST_USER.id, validBoardId);
  });

  it('POST /api/boards/:id/columns creates a column', async () => {
    boardServiceMock.createColumn.mockResolvedValue({ id: validColumnId, name: 'Review', position: 2 });

    const res = await agent
      .post(`/api/boards/${validBoardId}/columns`)
      .send({ name: 'Review', position: 2 })
      .expect(201);

    expect(res.body.data.position).toBe(2);
    expect(boardServiceMock.createColumn).toHaveBeenCalledWith(
      TEST_USER.id,
      validBoardId,
      { name: 'Review', position: 2 }
    );
  });

  it('DELETE /api/boards/:id removes a board', async () => {
    boardServiceMock.deleteBoard.mockResolvedValue(true);

    const res = await agent.delete(`/api/boards/${validBoardId}`).expect(200);

    expect(res.body.success).toBe(true);
    expect(boardServiceMock.deleteBoard).toHaveBeenCalledWith(TEST_USER.id, validBoardId);
  });
});
