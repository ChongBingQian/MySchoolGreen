import z from 'zod';
import { AuthError } from 'modelence';
import { Module, ObjectId, UserInfo, getConfig } from 'modelence/server';
import { dbTodoItems } from './db';
import { dailyCleanupCron } from './cron';

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

// Helper to ensure user is authenticated
function requireAuth(user: UserInfo | null): asserts user is UserInfo {
  if (!user) {
    throw new AuthError('Not authenticated');
  }
}

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
    getTodo: async (args: unknown, { user }: { user: UserInfo | null }) => {
      requireAuth(user);

      const { todoId } = getTodoSchema.parse(args);
      const todo = await dbTodoItems.requireOne({ _id: new ObjectId(todoId) });

      if (todo.userId.toString() !== user.id) {
        throw new AuthError('Not authorized');
      }

      return {
        _id: todo._id.toString(),
        title: todo.title,
        description: todo.description,
        completed: todo.completed,
        createdAt: todo.createdAt,
      };
    },

    getTodos: async (_args: unknown, { user }: { user: UserInfo | null }) => {
      requireAuth(user);

      const itemsPerPage = getConfig('todo.itemsPerPage') as number;
      const todos = await dbTodoItems.fetch(
        { userId: new ObjectId(user.id) },
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
    createTodo: async (args: unknown, { user }: { user: UserInfo | null }) => {
      requireAuth(user);

      const { title, description } = createTodoSchema.parse(args);

      const result = await dbTodoItems.insertOne({
        title,
        description: description || '',
        completed: false,
        createdAt: new Date(),
        userId: new ObjectId(user.id),
      });

      return { _id: result.insertedId.toString() };
    },

    updateTodo: async (args: unknown, { user }: { user: UserInfo | null }) => {
      requireAuth(user);

      const { todoId, title, description, completed } = updateTodoSchema.parse(args);

      const todo = await dbTodoItems.requireOne({ _id: new ObjectId(todoId) });
      if (todo.userId.toString() !== user.id) {
        throw new AuthError('Not authorized');
      }

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

    deleteTodo: async (args: unknown, { user }: { user: UserInfo | null }) => {
      requireAuth(user);

      const { todoId } = deleteTodoSchema.parse(args);

      const todo = await dbTodoItems.requireOne({ _id: new ObjectId(todoId) });
      if (todo.userId.toString() !== user.id) {
        throw new AuthError('Not authorized');
      }

      await dbTodoItems.deleteOne({ _id: new ObjectId(todoId) });

      return { success: true };
    },

    toggleTodo: async (args: unknown, { user }: { user: UserInfo | null }) => {
      requireAuth(user);

      const { todoId } = getTodoSchema.parse(args);

      const todo = await dbTodoItems.requireOne({ _id: new ObjectId(todoId) });
      if (todo.userId.toString() !== user.id) {
        throw new AuthError('Not authorized');
      }

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
