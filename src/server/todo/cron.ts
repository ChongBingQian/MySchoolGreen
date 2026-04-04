import { time } from 'modelence';

export const dailyCleanupCron = {
  description: 'Daily cleanup of old completed todos',
  interval: time.days(1),
  handler: async () => {
    // This is a placeholder for cleanup logic
    // You could implement automatic deletion of old completed todos here
  },
};
