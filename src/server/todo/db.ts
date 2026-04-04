import { Store, schema } from 'modelence/server';

export const dbTodoItems = new Store('todoItems', {
  schema: {
    title: schema.string(),
    description: schema.string().optional(),
    completed: schema.boolean(),
    createdAt: schema.date(),
    userId: schema.userId(),
  },
  indexes: [{ key: { userId: 1 } }, { key: { userId: 1, completed: 1 } }],
});
