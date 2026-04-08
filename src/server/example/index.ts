import z from 'zod';
import { Module, ObjectId, getConfig } from 'modelence/server';
import { dbExampleItems } from './db';
import { dailyTestCron } from './cron';

const PUBLIC_SCOPE_USER_ID = new ObjectId('000000000000000000000001');

export default new Module('example', {
  configSchema: {
    modelenceDemoUsername: {
      type: 'string',
      default: 'demo@modelence.dev',
      isPublic: true,
    },
    modelenceDemoPassword: {
      type: 'string',
      default: '12345678',
      isPublic: true,
    },
    itemsPerPage: {
      type: 'number',
      default: 5,
      isPublic: false,
    },
  },

  stores: [dbExampleItems],
  
  queries: {
    getItem: async (args: unknown) => {
      const { itemId } = z.object({ itemId: z.string() }).parse(args);
      const exampleItem = await dbExampleItems.requireOne({ _id: new ObjectId(itemId) });

      return {
        title: exampleItem.title,
        createdAt: exampleItem.createdAt,
      };
    },

    getItems: async (_args: unknown) => {
      const itemsPerPage = getConfig('example.itemsPerPage') as number;
      const exampleItems = await dbExampleItems.fetch({
        userId: PUBLIC_SCOPE_USER_ID,
      }, { limit: itemsPerPage })
      return exampleItems.map((item) => ({
        _id: item._id.toString(),
        title: item.title,
        createdAt: item.createdAt,
      }));
    }
  },

  mutations: {
    createItem: async (args: unknown) => {
      const { title } = z.object({ title: z.string() }).parse(args);

      await dbExampleItems.insertOne({
        title,
        createdAt: new Date(),
        userId: PUBLIC_SCOPE_USER_ID,
      });
    },

    updateItem: async (args: unknown) => {
      const { itemId, title } = z.object({ itemId: z.string(), title: z.string() }).parse(args);

      await dbExampleItems.requireOne({ _id: new ObjectId(itemId) });

      const { modifiedCount } = await dbExampleItems.updateOne({ _id: new ObjectId(itemId) }, { $set: { title } });

      if (modifiedCount === 0) {
        throw new Error('Item not found');
      }
    },
  },

  cronJobs: {
    dailyTest: dailyTestCron
  }
});
