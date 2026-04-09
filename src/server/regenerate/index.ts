import z from 'zod';
import { time } from 'modelence';
import { Module, ObjectId } from 'modelence/server';
import { dbDevices, dbSensorReadings, dbSchools, dbCredits } from './db';

type DeviceDoc = {
  _id: ObjectId;
  name: string;
  deviceType: string;
  location: string;
  sensorTypes: string[];
  status: string;
  schoolId: ObjectId;
  registeredAt: Date | string | number;
  lastReadingAt?: Date | string | number;
};

type SensorReadingDoc = {
  _id: ObjectId;
  deviceId: ObjectId;
  sensorType: string;
  value: number;
  unit: string;
  recordedAt: Date | string | number;
};

type SchoolDoc = {
  _id: ObjectId;
  name: string;
  city: string;
  totalCredits: number;
  createdAt: Date | string | number;
};

type CreditDoc = {
  _id: ObjectId;
  schoolId: ObjectId;
  amount: number;
  reason: string;
  earnedAt: Date | string | number;
};

export default new Module('regenerate', {
  stores: [dbDevices, dbSensorReadings, dbSchools, dbCredits],

  queries: {
    // Get dashboard stats
    getDashboardStats: async (_args: unknown) => {
      const [devices, schools, credits, readings] = (await Promise.all([
        dbDevices.fetch({}),
        dbSchools.fetch({}),
        dbCredits.fetch({}),
        dbSensorReadings.fetch({}, { limit: 100, sort: { recordedAt: -1 } }),
      ])) as [DeviceDoc[], SchoolDoc[], CreditDoc[], SensorReadingDoc[]];

      const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0);
      const activeDevices = devices.filter((d) => d.status === 'active').length;

      // Calculate CO2 offset estimate (simplified: 5kg per active device per month)
      const co2Offset = activeDevices * 5;

      return {
        totalDevices: devices.length,
        activeDevices,
        totalSchools: schools.length,
        totalCredits,
        co2OffsetKg: co2Offset,
        recentReadings: readings.slice(0, 10).map((r) => ({
          _id: r._id.toString(),
          deviceId: r.deviceId.toString(),
          sensorType: r.sensorType,
          value: r.value,
          unit: r.unit,
          recordedAt: r.recordedAt,
        })),
      };
    },

    // Get all devices
    getDevices: async (_args: unknown) => {
      const devices = (await dbDevices.fetch({}, { sort: { registeredAt: -1 } })) as DeviceDoc[];
      return devices.map((d) => ({
        _id: d._id.toString(),
        name: d.name,
        deviceType: d.deviceType,
        location: d.location,
        sensorTypes: d.sensorTypes,
        status: d.status,
        schoolId: d.schoolId.toString(),
        registeredAt: d.registeredAt,
        lastReadingAt: d.lastReadingAt,
      }));
    },

    // Get schools
    getSchools: async (_args: unknown) => {
      const schools = (await dbSchools.fetch({}, { sort: { createdAt: -1 } })) as SchoolDoc[];
      return schools.map((s) => ({
        _id: s._id.toString(),
        name: s.name,
        city: s.city,
        totalCredits: s.totalCredits,
        createdAt: s.createdAt,
      }));
    },

    // Get sensor readings for a device
    getDeviceReadings: async (args: unknown) => {
      const { deviceId } = z.object({ deviceId: z.string() }).parse(args);
      const readings = (await dbSensorReadings.fetch(
        { deviceId: new ObjectId(deviceId) },
        { limit: 50, sort: { recordedAt: -1 } }
      )) as SensorReadingDoc[];

      return readings.map((r) => ({
        _id: r._id.toString(),
        sensorType: r.sensorType,
        value: r.value,
        unit: r.unit,
        recordedAt: r.recordedAt,
      }));
    },

    // Get impact data for charts (historical trend)
    getImpactHistory: async (_args: unknown) => {
      // Get data for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [devices, credits, schools] = (await Promise.all([
        dbDevices.fetch({}),
        dbCredits.fetch({ earnedAt: { $gte: thirtyDaysAgo } }, { sort: { earnedAt: 1 } }),
        dbSchools.fetch({}),
      ])) as [DeviceDoc[], CreditDoc[], SchoolDoc[]];

      // Group data by day
      const dailyData = new Map<
        string,
        { devices: number; co2Offset: number; credits: number; schools: number }
      >();

      // Initialize all days in the last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        dailyData.set(dateKey, {
          devices: 0,
          co2Offset: 0,
          credits: 0,
          schools: schools.length,
        });
      }

      // Count devices registered up to each day
      const sortedDevices = devices.sort(
        (a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime()
      );

      dailyData.forEach((value, dateKey) => {
        const dayEnd = new Date(dateKey);
        dayEnd.setHours(23, 59, 59, 999);

        const activeDevices = sortedDevices.filter(
          (d) => new Date(d.registeredAt) <= dayEnd && d.status === 'active'
        ).length;

        value.devices = activeDevices;
        value.co2Offset = activeDevices * 5; // 5kg per device estimate
      });

      // Sum credits by day
      credits.forEach((credit) => {
        const dateKey = new Date(credit.earnedAt).toISOString().split('T')[0];
        if (dailyData.has(dateKey)) {
          dailyData.get(dateKey)!.credits += credit.amount;
        }
      });

      // Convert to array and make credits cumulative
      let cumulativeCredits = 0;
      const result = Array.from(dailyData.entries()).map(([date, data]) => {
        cumulativeCredits += data.credits;
        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          devices: data.devices,
          co2Offset: data.co2Offset,
          credits: cumulativeCredits,
          schools: data.schools,
        };
      });

      return result;
    },
  },

  mutations: {
    // Register a new school
    createSchool: async (args: unknown) => {
      const { name, city } = z
        .object({
          name: z.string().min(1),
          city: z.string().min(1),
        })
        .parse(args);

      const result = await dbSchools.insertOne({
        name,
        city,
        createdAt: new Date(),
        totalCredits: 0,
      });

      return { _id: result.insertedId.toString() };
    },

    // Register a repurposed device
    registerDevice: async (args: unknown) => {
      const { name, deviceType, location, sensorTypes, schoolId } = z
        .object({
          name: z.string().min(1),
          deviceType: z.enum(['tablet', 'phone', 'sensor']),
          location: z.string().min(1),
          sensorTypes: z.array(z.string()),
          schoolId: z.string(),
        })
        .parse(args);

      const result = await dbDevices.insertOne({
        name,
        deviceType,
        location,
        sensorTypes,
        status: 'active',
        schoolId: new ObjectId(schoolId),
        registeredAt: new Date(),
      });

      // Award credits for device repurposing (10 credits per device)
      await dbCredits.insertOne({
        schoolId: new ObjectId(schoolId),
        amount: 10,
        reason: 'device_repurposed',
        earnedAt: new Date(),
      });

      // Update school's total credits
      await dbSchools.updateOne({ _id: new ObjectId(schoolId) }, { $inc: { totalCredits: 10 } });

      return { _id: result.insertedId.toString() };
    },

    // Record sensor reading (simulates IoT data)
    recordReading: async (args: unknown) => {
      const { deviceId, sensorType, value, unit } = z
        .object({
          deviceId: z.string(),
          sensorType: z.string(),
          value: z.number(),
          unit: z.string(),
        })
        .parse(args);

      await dbSensorReadings.insertOne({
        deviceId: new ObjectId(deviceId),
        sensorType,
        value,
        unit,
        recordedAt: new Date(),
      });

      // Update device last reading timestamp
      await dbDevices.updateOne(
        { _id: new ObjectId(deviceId) },
        { $set: { lastReadingAt: new Date() } }
      );
    },

    // Update device status
    updateDeviceStatus: async (args: unknown) => {
      const { deviceId, status } = z
        .object({
          deviceId: z.string(),
          status: z.enum(['active', 'inactive', 'maintenance']),
        })
        .parse(args);

      await dbDevices.updateOne({ _id: new ObjectId(deviceId) }, { $set: { status } });
    },

    // Remove a device and related sensor readings
    removeDevice: async (args: unknown) => {
      const { deviceId } = z
        .object({
          deviceId: z.string(),
        })
        .parse(args);

      const objectId = new ObjectId(deviceId);
      await dbDevices.requireOne({ _id: objectId });

      await dbDevices.deleteOne({ _id: objectId });

      const readings = await dbSensorReadings.fetch({ deviceId: objectId }, { limit: 5000 });
      await Promise.all(
        readings.map((reading) => dbSensorReadings.deleteOne({ _id: reading._id }))
      );

      return { success: true };
    },

    // Remove a school if it has no registered devices
    removeSchool: async (args: unknown) => {
      const { schoolId } = z
        .object({
          schoolId: z.string(),
        })
        .parse(args);

      const objectId = new ObjectId(schoolId);
      await dbSchools.requireOne({ _id: objectId });

      const linkedDevices = await dbDevices.fetch({ schoolId: objectId }, { limit: 1 });
      if (linkedDevices.length > 0) {
        throw new Error('Cannot delete school with registered devices. Remove devices first.');
      }

      await dbSchools.deleteOne({ _id: objectId });

      const credits = await dbCredits.fetch({ schoolId: objectId }, { limit: 5000 });
      await Promise.all(credits.map((credit) => dbCredits.deleteOne({ _id: credit._id })));

      return { success: true };
    },
  },

  cronJobs: {
    // Daily job to award carbon offset credits
    dailyCarbonCredits: {
      description: 'Award daily carbon offset credits based on active devices',
      interval: time.days(1),
      handler: async () => {
        const schools = await dbSchools.fetch({});

        for (const school of schools) {
          const activeDevices = await dbDevices.fetch({
            schoolId: school._id,
            status: 'active',
          });

          if (activeDevices.length > 0) {
            // Award 1 credit per active device per day
            const creditsToAward = activeDevices.length;

            await dbCredits.insertOne({
              schoolId: school._id,
              amount: creditsToAward,
              reason: 'carbon_offset',
              earnedAt: new Date(),
            });

            await dbSchools.updateOne(
              { _id: school._id },
              { $inc: { totalCredits: creditsToAward } }
            );
          }
        }
      },
    },
  },
});
