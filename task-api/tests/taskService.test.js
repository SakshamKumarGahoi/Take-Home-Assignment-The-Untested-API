const taskService = require('../src/services/taskService');

describe('taskService', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create()', () => {
    test('creates a task with default values', () => {
      const task = taskService.create({
        title: 'Test task',
      });

      expect(task.title).toBe('Test task');
      expect(task.description).toBe('');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.dueDate).toBeNull();
      expect(task.completedAt).toBeNull();
      expect(task.id).toBeDefined();
      expect(task.createdAt).toBeDefined();
    });

    test('creates a task with supplied values', () => {
      const task = taskService.create({
        title: 'Important task',
        description: 'Something important',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2030-01-01T00:00:00.000Z',
      });

      expect(task).toMatchObject({
        title: 'Important task',
        description: 'Something important',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2030-01-01T00:00:00.000Z',
      });
    });
  });

  describe('getAll()', () => {
    test('returns all tasks', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });

      const tasks = taskService.getAll();

      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe('Task 1');
      expect(tasks[1].title).toBe('Task 2');
    });

    test('returns an empty array when there are no tasks', () => {
      expect(taskService.getAll()).toEqual([]);
    });
  });

  describe('findById()', () => {
    test('finds an existing task', () => {
      const task = taskService.create({
        title: 'Find me',
      });

      expect(taskService.findById(task.id)).toEqual(task);
    });

    test('returns undefined for a missing task', () => {
      expect(
        taskService.findById('does-not-exist')
      ).toBeUndefined();
    });
  });

  describe('getByStatus()', () => {
    test('returns tasks matching the requested status', () => {
      taskService.create({
        title: 'Todo task',
        status: 'todo',
      });

      taskService.create({
        title: 'Progress task',
        status: 'in_progress',
      });

      taskService.create({
        title: 'Done task',
        status: 'done',
      });

      const result = taskService.getByStatus('todo');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Todo task');
    });

    test('returns an empty array when no tasks match', () => {
      taskService.create({
        title: 'Todo task',
        status: 'todo',
      });

      expect(
        taskService.getByStatus('done')
      ).toEqual([]);
    });
  });

  describe('getPaginated()', () => {
    test('returns the first page correctly', () => {
      const task1 = taskService.create({ title: 'Task 1' });
      const task2 = taskService.create({ title: 'Task 2' });

      taskService.create({ title: 'Task 3' });

      const result = taskService.getPaginated(1, 2);

      expect(result).toEqual([task1, task2]);
    });

    test('returns the second page correctly', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });

      const task3 = taskService.create({ title: 'Task 3' });
      const task4 = taskService.create({ title: 'Task 4' });

      const result = taskService.getPaginated(2, 2);

      expect(result).toEqual([task3, task4]);
    });
  });

  describe('getStats()', () => {
    test('counts tasks by status', () => {
      taskService.create({
        title: 'Todo 1',
        status: 'todo',
      });

      taskService.create({
        title: 'Todo 2',
        status: 'todo',
      });

      taskService.create({
        title: 'Progress',
        status: 'in_progress',
      });

      taskService.create({
        title: 'Done',
        status: 'done',
      });

      expect(taskService.getStats()).toMatchObject({
        todo: 2,
        in_progress: 1,
        done: 1,
      });
    });

    test('counts overdue incomplete tasks', () => {
      taskService.create({
        title: 'Overdue',
        status: 'todo',
        dueDate: '2020-01-01T00:00:00.000Z',
      });

      taskService.create({
        title: 'Future',
        status: 'todo',
        dueDate: '2099-01-01T00:00:00.000Z',
      });

      taskService.create({
        title: 'Completed overdue',
        status: 'done',
        dueDate: '2020-01-01T00:00:00.000Z',
      });

      expect(taskService.getStats().overdue).toBe(1);
    });
  });

  describe('update()', () => {
    test('updates an existing task', () => {
      const task = taskService.create({
        title: 'Old title',
      });

      const updated = taskService.update(task.id, {
        title: 'New title',
        priority: 'high',
      });

      expect(updated.title).toBe('New title');
      expect(updated.priority).toBe('high');
      expect(updated.id).toBe(task.id);
    });

    test('returns null when task does not exist', () => {
      expect(
        taskService.update('missing-id', {
          title: 'Updated',
        })
      ).toBeNull();
    });
  });

  describe('remove()', () => {
    test('removes an existing task', () => {
      const task = taskService.create({
        title: 'Delete me',
      });

      expect(taskService.remove(task.id)).toBe(true);
      expect(taskService.findById(task.id)).toBeUndefined();
    });

    test('returns false when task does not exist', () => {
      expect(
        taskService.remove('missing-id')
      ).toBe(false);
    });
  });

  describe('completeTask()', () => {
    test('marks a task as done', () => {
      const task = taskService.create({
        title: 'Complete me',
        priority: 'high',
      });

      const completed = taskService.completeTask(task.id);

      expect(completed.status).toBe('done');
      expect(completed.completedAt).toBeDefined();

      expect(
        new Date(completed.completedAt).toString()
      ).not.toBe('Invalid Date');
    });

    test('returns null when task does not exist', () => {
      expect(
        taskService.completeTask('missing-id')
      ).toBeNull();
    });
  });
});