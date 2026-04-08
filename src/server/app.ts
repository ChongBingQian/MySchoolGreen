import { startApp } from 'modelence/server';
import exampleModule from '@/server/example';
import todoModule from '@/server/todo';
import regenerateModule from '@/server/regenerate';
import { clearAppData } from '@/server/migrations/clearAppData';

startApp({
  modules: [exampleModule, todoModule, regenerateModule],

  security: {
    frameAncestors: ['https://modelence.com', 'https://*.modelence.com', 'http://localhost:*'],
  },

  migrations: [
    {
      version: 1,
      description: 'Clear all existing app data',
      handler: clearAppData,
    },
  ],
});
