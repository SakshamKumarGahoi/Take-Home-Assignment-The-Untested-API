const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Task API', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('POST /tasks', () => {
    test('creates a task', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          title: 'Build API',
          description: 'Write tests',
          priority: 'high',
        });

      expect(response.status).toBe(201);

      expect(response.body).toMatchObject({
        title: 'Build API',
        description: 'Write tests',
        priority: 'high',
        status: 'todo',
        completedAt: null,
        dueDate: null,
      });

      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    test('rejects a missing title', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          description: 'Task without title',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('rejects an invalid priority', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          title: 'Test task',
          priority: 'urgent',
        });

      expect(response.status).toBe(400);
    });

    test('rejects an invalid due date', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          title: 'Test task',
          dueDate: 'not-a-date',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /tasks', () => {
    test('returns all tasks', async () => {
      await request(app)
        .post('/tasks')
        .send({ title: 'Task 1' });

      await request(app)
        .post('/tasks')
        .send({ title: 'Task 2' });

      const response = await request(app)
        .get('/tasks');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe('Task 1');
      expect(response.body[1].title).toBe('Task 2');
    });

    test('returns an empty array when there are no tasks', async () => {
      const response = await request(app)
        .get('/tasks');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('filters tasks by status', async () => {
      await request(app)
        .post('/tasks')
        .send({
          title: 'Todo task',
          status: 'todo',
        });

      await request(app)
        .post('/tasks')
        .send({
          title: 'Done task',
          status: 'done',
        });

      const response = await request(app)
        .get('/tasks')
        .query({ status: 'todo' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Todo task');
    });

    test('supports pagination', async () => {
      await request(app)
        .post('/tasks')
        .send({ title: 'Task 1' });

      await request(app)
        .post('/tasks')
        .send({ title: 'Task 2' });

      await request(app)
        .post('/tasks')
        .send({ title: 'Task 3' });

      const response = await request(app)
        .get('/tasks')
        .query({
          page: 1,
          limit: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe('Task 1');
      expect(response.body[1].title).toBe('Task 2');
    });
  });

  describe('PUT /tasks/:id', () => {
    test('updates an existing task', async () => {
      const createResponse = await request(app)
        .post('/tasks')
        .send({
          title: 'Old title',
        });

      const id = createResponse.body.id;

      const response = await request(app)
        .put(`/tasks/${id}`)
        .send({
          title: 'New title',
          priority: 'high',
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('New title');
      expect(response.body.priority).toBe('high');
      expect(response.body.id).toBe(id);
    });

    test('returns 404 when task does not exist', async () => {
      const response = await request(app)
        .put('/tasks/missing-id')
        .send({
          title: 'Updated title',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    test('rejects invalid update data', async () => {
      const createResponse = await request(app)
        .post('/tasks')
        .send({
          title: 'Task',
        });

      const response = await request(app)
        .put(`/tasks/${createResponse.body.id}`)
        .send({
          priority: 'urgent',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /tasks/:id', () => {
    test('deletes an existing task', async () => {
      const createResponse = await request(app)
        .post('/tasks')
        .send({
          title: 'Delete me',
        });

      const id = createResponse.body.id;

      const response = await request(app)
        .delete(`/tasks/${id}`);

      expect(response.status).toBe(204);

      const getResponse = await request(app)
        .get('/tasks');

      expect(getResponse.body).toHaveLength(0);
    });

    test('returns 404 when task does not exist', async () => {
      const response = await request(app)
        .delete('/tasks/missing-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    test('marks a task as complete', async () => {
      const createResponse = await request(app)
        .post('/tasks')
        .send({
          title: 'Complete me',
          priority: 'high',
        });

      const id = createResponse.body.id;

      const response = await request(app)
        .patch(`/tasks/${id}/complete`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(id);
      expect(response.body.status).toBe('done');
      expect(response.body.completedAt).toBeDefined();
    });

    test('returns 404 when task does not exist', async () => {
      const response = await request(app)
        .patch('/tasks/missing-id/complete');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('GET /tasks/stats', () => {
    test('returns task statistics', async () => {
      await request(app)
        .post('/tasks')
        .send({
          title: 'Todo task',
          status: 'todo',
        });

      await request(app)
        .post('/tasks')
        .send({
          title: 'Progress task',
          status: 'in_progress',
        });

      await request(app)
        .post('/tasks')
        .send({
          title: 'Done task',
          status: 'done',
        });

      const response = await request(app)
        .get('/tasks/stats');

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        todo: 1,
        in_progress: 1,
        done: 1,
        overdue: 0,
      });
    });
  });
});