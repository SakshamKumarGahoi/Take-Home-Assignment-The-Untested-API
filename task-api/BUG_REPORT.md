Bug Report
Bug 1: Pagination Uses an Incorrect Offset
Location

src/services/taskService.js

Endpoint

GET /tasks?page=1&limit=2

Expected Behaviour

For a request such as:

GET /tasks?page=1&limit=2

the API should return the first two tasks.

For page 2 with the same limit, it should return the next two tasks.

Actual Behaviour

The original implementation calculated the pagination offset as:

const offset = page * limit;

Because the API uses 1-based page numbers while JavaScript arrays use 0-based indexes, page 1 incorrectly started at index 2 instead of index 0.

For example, with four tasks and limit=2:

Page 1 incorrectly returned tasks 3 and 4.
Page 2 incorrectly returned an empty array.
How It Was Discovered

A unit test was written for getPaginated() to verify that page 1 returns the first two tasks and page 2 returns the next two tasks.

The tests failed against the original implementation.

Root Cause

The offset calculation did not account for the fact that page numbers start at 1.

Fix

Changed:

const offset = page * limit;

to:

const offset = (page - 1) * limit;
Regression Test

Added unit tests covering:

First page
Second page

Both tests now pass.

Bug 2: Completing a Task Unexpectedly Changes Its Priority
Location

src/services/taskService.js

Endpoint

PATCH /tasks/:id/complete

Expected Behaviour

Completing a task should:

Change status to done
Set completedAt
Preserve the task's existing priority and other properties
Actual Behaviour

The original implementation explicitly changed the task's priority to medium whenever a task was completed.

For example:

Before:

priority = high
status = todo

After:

priority = medium
status = done

This caused an unrelated task property to be modified.

How It Was Discovered

A unit test was added that created a task with:

{
  title: 'Important task',
  priority: 'high'
}

The task was then completed and the test verified that its priority remained high.

The test failed because the original implementation returned medium.

Root Cause

The completeTask() function explicitly contained:

priority: 'medium',

which overwrote the task's existing priority.

Fix

Removed the explicit priority modification.

The updated implementation is:

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
Regression Test

Added a unit test verifying that a task with priority: 'high' remains high after completion.

The regression test now passes.

Summary

Two bugs were identified through automated testing:

Pagination offset calculation caused the first page to skip tasks.
Task completion incorrectly changed the existing priority to medium.

Both bugs were fixed and regression tests were added to ensure the issues do not reappear.