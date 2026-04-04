import { Store, schema } from 'modelence/server';

// Repurposed devices serving as environmental sensors
export const dbDevices = new Store('regenerateDevices', {
  schema: {
    name: schema.string(),
    deviceType: schema.string(), // tablet, phone, sensor
    location: schema.string(), // e.g., "School Garden", "Classroom A", "River Bank"
    sensorTypes: schema.array(schema.string()), // air, soil, water
    status: schema.string(), // active, inactive, maintenance
    schoolId: schema.objectId(),
    registeredAt: schema.date(),
    lastReadingAt: schema.date().optional(),
  },
  indexes: [
    { key: { schoolId: 1 } },
    { key: { status: 1 } },
  ],
});

// Sensor readings from repurposed devices
export const dbSensorReadings = new Store('regenerateSensorReadings', {
  schema: {
    deviceId: schema.objectId(),
    sensorType: schema.string(), // air_quality, soil_moisture, water_ph, temperature
    value: schema.number(),
    unit: schema.string(),
    recordedAt: schema.date(),
  },
  indexes: [
    { key: { deviceId: 1, recordedAt: -1 } },
    { key: { sensorType: 1 } },
  ],
});

// Schools participating in the program
export const dbSchools = new Store('regenerateSchools', {
  schema: {
    name: schema.string(),
    city: schema.string(),
    createdAt: schema.date(),
    totalCredits: schema.number(), // regenerative credits earned
  },
  indexes: [
    { key: { name: 1 } },
  ],
});

// Regenerative credits earned by schools
export const dbCredits = new Store('regenerateCredits', {
  schema: {
    schoolId: schema.objectId(),
    amount: schema.number(),
    reason: schema.string(), // device_repurposed, carbon_offset, material_recovery
    earnedAt: schema.date(),
  },
  indexes: [
    { key: { schoolId: 1 } },
    { key: { earnedAt: -1 } },
  ],
});
