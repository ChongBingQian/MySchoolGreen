type QueryParams = Record<string, unknown> | undefined;

type Todo = {
  _id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
};

type ExampleItem = {
  _id: string;
  title: string;
  createdAt: string;
};

type School = {
  _id: string;
  name: string;
  city: string;
  totalCredits: number;
  createdAt: string;
};

type Device = {
  _id: string;
  name: string;
  deviceType: string;
  location: string;
  sensorTypes: string[];
  status: string;
  schoolId: string;
  registeredAt: string;
  lastReadingAt?: string;
};

type Reading = {
  _id: string;
  deviceId: string;
  sensorType: string;
  value: number;
  unit: string;
  recordedAt: string;
};

type DbState = {
  todos: Todo[];
  examples: Record<string, ExampleItem>;
  schools: School[];
  devices: Device[];
  readings: Reading[];
};

const DB_KEY = 'cloudflare:db';

function createSeedState(): DbState {
  const now = new Date().toISOString();
  const schoolId = crypto.randomUUID();
  const deviceId = crypto.randomUUID();

  return {
    todos: [
      {
        _id: crypto.randomUUID(),
        title: 'Register first sensor',
        description: 'Set up one repurposed device and record baseline data.',
        completed: false,
        createdAt: now,
      },
    ],
    examples: {
      default: {
        _id: 'default',
        title: 'Cloudflare Example Item',
        createdAt: now,
      },
    },
    schools: [
      {
        _id: schoolId,
        name: 'Green Valley School',
        city: 'Kuala Lumpur',
        totalCredits: 20,
        createdAt: now,
      },
    ],
    devices: [
      {
        _id: deviceId,
        name: 'Garden Sensor 1',
        deviceType: 'tablet',
        location: 'School Garden',
        sensorTypes: ['temperature', 'soil_moisture'],
        status: 'active',
        schoolId,
        registeredAt: now,
      },
    ],
    readings: [
      {
        _id: crypto.randomUUID(),
        deviceId,
        sensorType: 'temperature',
        value: 27.3,
        unit: '°C',
        recordedAt: now,
      },
    ],
  };
}

function readDb(): DbState {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const seeded = createSeedState();
    localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    return JSON.parse(raw) as DbState;
  } catch {
    localStorage.removeItem(DB_KEY);
    return readDb();
  }
}

function writeDb(next: DbState) {
  localStorage.setItem(DB_KEY, JSON.stringify(next));
}

export function createQueryKey(name: string, params?: QueryParams) {
  return params ? [name, params] : [name];
}

export function modelenceQuery<T>(name: string, params?: QueryParams) {
  return {
    queryKey: createQueryKey(name, params),
    queryFn: async (): Promise<T> => {
      return runQuery<T>(name, params);
    },
  };
}

export function modelenceMutation<TInput = Record<string, unknown>>(name: string) {
  return {
    mutationFn: async (input: TInput) => {
      return runMutation(name, input as Record<string, unknown>);
    },
  };
}

async function runQuery<T>(name: string, params?: QueryParams): Promise<T> {
  const db = readDb();

  switch (name) {
    case 'todo.getTodos':
      return [...db.todos].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as T;

    case 'example.getItem': {
      const itemId = String(params?.itemId ?? 'default');
      const existing = db.examples[itemId] ?? {
        _id: itemId,
        title: `Example Item ${itemId}`,
        createdAt: new Date().toISOString(),
      };
      db.examples[itemId] = existing;
      writeDb(db);
      return existing as T;
    }

    case 'regenerate.getDevices':
      return [...db.devices].sort((a, b) => b.registeredAt.localeCompare(a.registeredAt)) as T;

    case 'regenerate.getSchools':
      return [...db.schools].sort((a, b) => a.name.localeCompare(b.name)) as T;

    case 'regenerate.getDeviceReadings': {
      const deviceId = String(params?.deviceId ?? '');
      return db.readings
        .filter((reading) => reading.deviceId === deviceId)
        .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)) as T;
    }

    case 'regenerate.getDashboardStats':
      return buildDashboardStats(db) as T;

    case 'regenerate.getImpactHistory':
      return buildImpactHistory(db) as T;

    default:
      throw new Error(`Unsupported query: ${name}`);
  }
}

async function runMutation(name: string, input: Record<string, unknown>) {
  const db = readDb();

  switch (name) {
    case 'todo.createTodo': {
      const next: Todo = {
        _id: crypto.randomUUID(),
        title: String(input.title ?? ''),
        description: String(input.description ?? ''),
        completed: false,
        createdAt: new Date().toISOString(),
      };
      db.todos.unshift(next);
      writeDb(db);
      return next;
    }

    case 'todo.toggleTodo': {
      const todoId = String(input.todoId ?? '');
      const todo = db.todos.find((item) => item._id === todoId);
      if (!todo) {
        throw new Error('Todo not found');
      }
      todo.completed = !todo.completed;
      writeDb(db);
      return todo;
    }

    case 'todo.deleteTodo': {
      const todoId = String(input.todoId ?? '');
      db.todos = db.todos.filter((item) => item._id !== todoId);
      writeDb(db);
      return { ok: true };
    }

    case 'example.createItem': {
      const id = crypto.randomUUID();
      const item: ExampleItem = {
        _id: id,
        title: String(input.title ?? 'New Item'),
        createdAt: new Date().toISOString(),
      };
      db.examples[id] = item;
      writeDb(db);
      return item;
    }

    case 'regenerate.createSchool': {
      const school: School = {
        _id: crypto.randomUUID(),
        name: String(input.name ?? ''),
        city: String(input.city ?? ''),
        totalCredits: 0,
        createdAt: new Date().toISOString(),
      };
      db.schools.push(school);
      writeDb(db);
      return school;
    }

    case 'regenerate.registerDevice': {
      const schoolId = String(input.schoolId ?? '');
      const school = db.schools.find((row) => row._id === schoolId);
      if (!school) {
        throw new Error('School not found');
      }

      const device: Device = {
        _id: crypto.randomUUID(),
        name: String(input.name ?? ''),
        deviceType: String(input.deviceType ?? 'sensor'),
        location: String(input.location ?? ''),
        sensorTypes: Array.isArray(input.sensorTypes)
          ? input.sensorTypes.map((value) => String(value))
          : [],
        status: 'active',
        schoolId,
        registeredAt: new Date().toISOString(),
      };

      db.devices.push(device);
      school.totalCredits += 10;
      writeDb(db);
      return device;
    }

    case 'regenerate.removeDevice': {
      const deviceId = String(input.deviceId ?? '');
      db.devices = db.devices.filter((device) => device._id !== deviceId);
      db.readings = db.readings.filter((reading) => reading.deviceId !== deviceId);
      writeDb(db);
      return { ok: true };
    }

    case 'regenerate.removeSchool': {
      const schoolId = String(input.schoolId ?? '');
      const removedDevices = db.devices.filter((device) => device.schoolId === schoolId).map((d) => d._id);
      db.schools = db.schools.filter((school) => school._id !== schoolId);
      db.devices = db.devices.filter((device) => device.schoolId !== schoolId);
      db.readings = db.readings.filter((reading) => !removedDevices.includes(reading.deviceId));
      writeDb(db);
      return { ok: true };
    }

    case 'regenerate.recordReading': {
      const deviceId = String(input.deviceId ?? '');
      const device = db.devices.find((row) => row._id === deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      const reading: Reading = {
        _id: crypto.randomUUID(),
        deviceId,
        sensorType: String(input.sensorType ?? 'sensor'),
        value: Number(input.value ?? 0),
        unit: String(input.unit ?? ''),
        recordedAt: new Date().toISOString(),
      };

      db.readings.unshift(reading);
      device.lastReadingAt = reading.recordedAt;
      const school = db.schools.find((row) => row._id === device.schoolId);
      if (school) {
        school.totalCredits += 1;
      }

      writeDb(db);
      return reading;
    }

    default:
      throw new Error(`Unsupported mutation: ${name}`);
  }
}

function buildDashboardStats(db: DbState) {
  const totalDevices = db.devices.length;
  const activeDevices = db.devices.filter((device) => device.status === 'active').length;
  const totalSchools = db.schools.length;
  const totalCredits = db.schools.reduce((sum, school) => sum + school.totalCredits, 0);
  const co2OffsetKg = Math.round((totalDevices * 2.5 + db.readings.length * 0.2) * 10) / 10;

  return {
    totalDevices,
    activeDevices,
    totalSchools,
    totalCredits,
    co2OffsetKg,
    recentReadings: db.readings.slice(0, 10),
  };
}

function buildImpactHistory(db: DbState) {
  const stats = buildDashboardStats(db);
  const history: Array<{
    date: string;
    devices: number;
    co2Offset: number;
    credits: number;
    schools: number;
  }> = [];

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i * 5);
    const progress = (7 - i) / 7;

    history.push({
      date: date.toLocaleDateString(),
      devices: Math.max(0, Math.round(stats.totalDevices * progress)),
      co2Offset: Math.max(0, Math.round(stats.co2OffsetKg * progress * 10) / 10),
      credits: Math.max(0, Math.round(stats.totalCredits * progress)),
      schools: Math.max(0, Math.round(stats.totalSchools * progress)),
    });
  }

  return history;
}
