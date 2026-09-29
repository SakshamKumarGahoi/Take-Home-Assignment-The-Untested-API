# Bug Report

## Bug 1: Pagination uses an incorrect offset

### Location:Task Service File in services 

`src/services/taskService.js`

### Expected Behaviour 

For a request such as GET /tasks?page=1&limit=2

the api should return first two tasks but whats happening is

The current implementation calculates the pagination offset as:

```js
const offset = page * limit;

This causes page 1 to start at index 2 instead of index 0.

Proposed Fix:
changing offset calculation from page * limit to 

const offset = (page - 1) * limit; 

## Bug 2: Completing a task unexpectedly changes its priority

### Location

`src/services/taskService.js`

### Expected behavior

The `PATCH /tasks/:id/complete` endpoint should mark the task
as completed by:

- changing `status` to `done`
- setting `completedAt`

The task's existing priority should remain unchanged.

### Actual behavior

Completing a task always changes its priority to `medium`.

For example:

```text
Before:
priority = high
status = todo

After:
priority = medium
status = done


---

# Now make the fix

Change `completeTask()` to:

```js
const completeTask = (id) => {
  const task = findById(id);
  if (!task) return null;

  const updated = {
    ...task,
    status: 'done',
    completedAt: new Date().toISOString(),
  };

  const index = tasks.findIndex((t) => t.id === id);
  tasks[index] = updated;
  return updated;
};