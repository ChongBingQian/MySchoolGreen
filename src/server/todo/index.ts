import z from 'zod';
import { Module, ObjectId, getConfig } from 'modelence/server';
import { dbTodoItems } from './db';
import { dailyCleanupCron } from './cron';

const PUBLIC_SCOPE_USER_ID = new ObjectId('000000000000000000000001');

// Validation schemas
const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
});

const updateTodoSchema = z.object({
  todoId: z.string(),
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
  description: z.string().max(1000, 'Description is too long').optional(),
  completed: z.boolean().optional(),
});

const getTodoSchema = z.object({
  todoId: z.string(),
});

const deleteTodoSchema = z.object({
  todoId: z.string(),
});

export default new Module('todo', {
  configSchema: {
    itemsPerPage: {
      type: 'number',
      default: 20,
      isPublic: false,
    },
  },

  stores: [dbTodoItems],

  queries: {
    getTodo: async (args: unknown) => {
      const { todoId } = getTodoSchema.parse(args);
      const todo = await dbTodoItems.requireOne({ _id: new ObjectId(todoId) });

      return {
        _id: todo._id.toString(),
        title: todo.title,
        description: todo.description,
        completed: todo.completed,
        createdAt: todo.createdAt,
      };
    },

    getTodos: async (_args: unknown) => {
      const itemsPerPage = getConfig('todo.itemsPerPage') as number;
      const todos = await dbTodoItems.fetch(
        { userId: PUBLIC_SCOPE_USER_ID },
        { limit: itemsPerPage, sort: { createdAt: -1 } }
      );

      return todos.map((todo) => ({
        _id: todo._id.toString(),
        title: todo.title,
        description: todo.description,
        completed: todo.completed,
        createdAt: todo.createdAt,
      }));
    },
  },

  mutations: {
    createTodo: async (args: unknown) => {
      const { title, description } = createTodoSchema.parse(args);

      const result = await dbTodoItems.insertOne({
        title,
        description: description || '',
        completed: false,
        createdAt: new Date(),
        userId: PUBLIC_SCOPE_USER_ID,
      });

      return { _id: result.insertedId.toString() };
    },

    updateTodo: async (args: unknown) => {
      const { todoId, title, description, completed } = updateTodoSchema.parse(args);

      await dbTodoItems.requireOne({ _id: new ObjectId(todoId) });

      const updateFields: Record<string, unknown> = {};
      if (title !== undefined) updateFields.title = title;
      if (description !== undefined) updateFields.description = description;
      if (completed !== undefined) updateFields.completed = completed;

      if (Object.keys(updateFields).length === 0) {
        return { success: true };
      }

      const { modifiedCount } = await dbTodoItems.updateOne(
        { _id: new ObjectId(todoId) },
        { $set: updateFields }
      );

      if (modifiedCount === 0) {
        throw new Error('Todo not found or not modified');
      }

      return { success: true };
    },

    deleteTodo: async (args: unknown) => {
      const { todoId } = deleteTodoSchema.parse(args);

      await dbTodoItems.requireOne({ _id: new ObjectId(todoId) });

      await dbTodoItems.deleteOne({ _id: new ObjectId(todoId) });

      return { success: true };
    },

    toggleTodo: async (args: unknown) => {
      const { todoId } = getTodoSchema.parse(args);

      const todo = await dbTodoItems.requireOne({ _id: new ObjectId(todoId) });

      await dbTodoItems.updateOne(
        { _id: new ObjectId(todoId) },
        { $set: { completed: !todo.completed } }
      );

      return { completed: !todo.completed };
    },
  },

  cronJobs: {
    dailyCleanup: dailyCleanupCron,
  },
});
