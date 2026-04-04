import { startApp } from 'modelence/server';
import exampleModule from '@/server/example';
import todoModule from '@/server/todo';
import regenerateModule from '@/server/regenerate';
import { createDemoUser } from '@/server/migrations/createDemoUser';
import { clearAppData } from '@/server/migrations/clearAppData';

startApp({
  modules: [exampleModule, todoModule, regenerateModule],

  security: {
    frameAncestors: ['https://modelence.com', 'https://*.modelence.com', 'http://localhost:*'],
  },

  migrations: [
    {
      version: 1,
      description: 'Create demo user',
      handler: createDemoUser,
    },
    {
      version: 2,
      description: 'Clear all existing app data',
      handler: clearAppData,
    },
    {
      version: 3,
      description: 'Recreate demo user after reset',
      handler: createDemoUser,
    },
  ],
});
