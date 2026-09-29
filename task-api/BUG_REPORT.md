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

