const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const isValid = require("date-fns/isValid");
const format = require("date-fns/format");

app = express();
app.use(express.json());

let db = null;
const initializeDatabaseAndServer = async () => {
  try {
    db = await open({
      filename: path.join(__dirname, "todoApplication.db"),
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (err) {
    console.log("DB Error: " + err.message);
  }
};
initializeDatabaseAndServer();

queryParamsValidator = (request, response, next) => {
  const statusValues = ["TO DO", "IN PROGRESS", "DONE"];
  const priorityValues = ["HIGH", "MEDIUM", "LOW"];
  const categoryValues = ["WORK", "HOME", "LEARNING"];
  const { status, priority, category, date } = request.query;

  console.log(request.query);

  if (status !== undefined && statusValues.includes(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    priority !== undefined &&
    priorityValues.includes(priority) === false
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    category !== undefined &&
    categoryValues.includes(category) === false
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (date !== undefined && !isValid(new Date(date))) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    next();
  }
};

validateValuesFromBody = (request, response, next) => {
  const statusValues = ["TO DO", "IN PROGRESS", "DONE"];
  const priorityValues = ["HIGH", "MEDIUM", "LOW"];
  const categoryValues = ["WORK", "HOME", "LEARNING"];
  const { status, priority, category, dueDate } = request.body;

  if (status !== undefined && statusValues.includes(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    priority !== undefined &&
    priorityValues.includes(priority) === false
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    category !== undefined &&
    categoryValues.includes(category) === false
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (dueDate !== undefined && !isValid(new Date(dueDate))) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    next();
  }
};

//API-1

app.get("/todos/", queryParamsValidator, async (request, response) => {
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
  } = request.query;

  const getAllTodosQuery = `
    SELECT
    *
    FROM
    todo
    WHERE 
    status like "%${status}%" and
    priority like "%${priority}%"
    and todo like "%${search_q}%"
    and category like "%${category}%"
    order by id;`;
  const allTodos = await db.all(getAllTodosQuery);

  const allTodosResponse = allTodos.map((item) => ({
    id: item.id,
    todo: item.todo,
    priority: item.priority,
    status: item.status,
    category: item.category,
    dueDate: item.due_date,
  }));

  response.send(allTodosResponse);
});

//API-2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
    *
    FROM
    todo
    WHERE id = ${todoId};
    `;
  const getTodo = await db.get(getTodoQuery);
  const getTodoResponse = {
    id: getTodo.id,
    todo: getTodo.todo,
    priority: getTodo.priority,
    status: getTodo.status,
    category: getTodo.category,
    dueDate: getTodo.due_date,
  };
  response.send(getTodoResponse);
});

//API-3
app.get("/agenda/", queryParamsValidator, async (request, response) => {
  const dateString = request.query.date;

  const formattedDate = format(Date.parse(dateString), "yyyy-MM-dd");

  const agendaQuery = `
         SELECT * FROM todo WHERE due_date like "${formattedDate}"
      `;
  const agendaQueryData = await db.all(agendaQuery);
  console.log(agendaQueryData);
  const agendaResponseData = agendaQueryData.map((item) => ({
    id: item.id,
    todo: item.todo,
    priority: item.priority,
    status: item.status,
    category: item.category,
    dueDate: item.due_date,
  }));
  response.send(agendaResponseData);
});

//API-4

app.post("/todos/", validateValuesFromBody, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const formattedDate = format(Date.parse(dueDate), "yyyy-MM-dd");

  await db.run(`
    Insert into
    todo
    (id, todo, priority, status, category, due_date)
    values
    (${id}, "${todo}", "${priority}", "${status}", "${category}", "${formattedDate}")
    `);
  response.send("Todo Successfully Added");
});

//API-5
app.put(
  "/todos/:todoId/",
  validateValuesFromBody,
  async (request, response) => {
    const { todoId } = request.params;

    const oldTodo = await db.get(`
    SELECT
    *
    FROM
    todo
    WHERE id = ${todoId};
    `);

    const {
      todo = oldTodo.todo,
      priority = oldTodo.priority,
      status = oldTodo.status,
      category = oldTodo.category,
      dueDate = oldTodo.due_date,
    } = request.body;

    const formattedDate = format(Date.parse(dueDate), "yyyy-MM-dd");

    await db.run(`
      UPDATE
      todo
      SET
      todo = "${todo}",
      priority = "${priority}",
      status = "${status}",
      category="${category}",
      due_date="${formattedDate}"
      WHERE id = ${todoId};
      `);

    if (request.body.status !== undefined) {
      response.send("Status Updated");
    }
    if (request.body.priority !== undefined) {
      response.send("Priority Updated");
    }
    if (request.body.todo !== undefined) {
      response.send("Todo Updated");
    }
    if (request.body.category !== undefined) {
      response.send("Category Updated");
    }
    if (request.body.dueDate !== undefined) {
      response.send("Due Date Updated");
    }
  }
);

//API-6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  await db.run(`
    DELETE FROM todo
    WHERE id = ${todoId};
    `);
  response.send("Todo Deleted");
});

module.exports = app;
