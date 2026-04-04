import { dbUsers } from 'modelence/server';
import { dbExampleItems } from '@/server/example/db';
import { dbTodoItems } from '@/server/todo/db';
import { dbDevices, dbSensorReadings, dbSchools, dbCredits } from '@/server/regenerate/db';

const BATCH_SIZE = 500;

async function clearStore(
  store: {
    fetch: (filter: Record<string, never>, options?: { limit?: number }) => Promise<Array<{ _id: unknown }>>;
    deleteOne: (filter: { _id: unknown }) => Promise<unknown>;
  }
) {
  while (true) {
    const docs = await store.fetch({}, { limit: BATCH_SIZE });

    if (docs.length === 0) {
      break;
    }

    await Promise.all(docs.map((doc) => store.deleteOne({ _id: doc._id })));

    if (docs.length < BATCH_SIZE) {
      break;
    }
  }
}

export async function clearAppData() {
  const stores = [dbUsers, dbExampleItems, dbTodoItems, dbDevices, dbSensorReadings, dbSchools, dbCredits];

  for (const store of stores) {
    await clearStore(store);
  }
}
