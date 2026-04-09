import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  modelenceQuery,
  modelenceMutation,
  createQueryKey,
} from '@/client/lib/cloudflare/modelenceReactQuery';
import { Activity, Zap, Thermometer, Droplets, Wind, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import Page from '@/client/components/Page';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/client/components/ui/Card';
import { Button } from '@/client/components/ui/Button';
import { Input } from '@/client/components/ui/Input';
import { Label } from '@/client/components/ui/Label';

type Device = {
  _id: string;
  name: string;
  deviceType: string;
  location: string;
  sensorTypes: string[];
  status: string;
};

type Reading = {
  _id: string;
  sensorType: string;
  value: number;
  unit: string;
  recordedAt: string;
};

const sensorPresets = [
  { type: 'air_quality', label: 'Air Quality Index', unit: 'AQI', min: 0, max: 150, icon: Wind },
  { type: 'temperature', label: 'Temperature', unit: '°C', min: 15, max: 35, icon: Thermometer },
  { type: 'soil_moisture', label: 'Soil Moisture', unit: '%', min: 20, max: 80, icon: Leaf },
  { type: 'water_ph', label: 'Water pH', unit: 'pH', min: 6, max: 8.5, icon: Droplets },
];

export default function SensorSimulatorPage() {
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: devices, isLoading: devicesLoading } = useQuery({
    ...modelenceQuery<Device[]>('regenerate.getDevices'),
  });

  const { data: readings, isLoading: readingsLoading } = useQuery({
    ...modelenceQuery<Reading[]>('regenerate.getDeviceReadings', { deviceId: selectedDevice }),
    enabled: !!selectedDevice,
  });

  const { mutate: recordReading, isPending: isRecording } = useMutation({
    ...modelenceMutation('regenerate.recordReading'),
    onSuccess: () => {
      toast.success('Reading recorded!');
      queryClient.invalidateQueries({
        queryKey: createQueryKey('regenerate.getDeviceReadings', { deviceId: selectedDevice }),
      });
      queryClient.invalidateQueries({ queryKey: createQueryKey('regenerate.getDashboardStats') });
      queryClient.invalidateQueries({ queryKey: createQueryKey('regenerate.getDevices') });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to record reading');
    },
  });

  const handleRecordReading = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      recordReading({
        deviceId: selectedDevice,
        sensorType: formData.get('sensorType') as string,
        value: parseFloat(formData.get('value') as string),
        unit: formData.get('unit') as string,
      });
    },
    [selectedDevice, recordReading]
  );

  const handleSimulateRandom = useCallback(
    (preset: (typeof sensorPresets)[0]) => {
      const value = Math.round((preset.min + Math.random() * (preset.max - preset.min)) * 10) / 10;
      recordReading({
        deviceId: selectedDevice,
        sensorType: preset.type,
        value,
        unit: preset.unit,
      });
    },
    [selectedDevice, recordReading]
  );

  const activeDevices = devices?.filter((d) => d.status === 'active') || [];

  return (
    <Page>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sensor Simulator</h1>
          <p className="text-gray-600 mt-2">Simulate IoT sensor readings from repurposed devices</p>
        </div>

        {devicesLoading ? (
          <div className="text-center py-12 text-gray-500">Loading devices...</div>
        ) : activeDevices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No Active Devices</h3>
              <p className="text-gray-500 mt-2">
                Register and activate devices first to simulate sensor readings.
              </p>
              <Button className="mt-4" onClick={() => (window.location.href = '/devices')}>
                Go to Device Management
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Selection & Simulation */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Device</CardTitle>
                  <CardDescription>Choose an active device to simulate readings</CardDescription>
                </CardHeader>
                <CardContent>
                  <select
                    className="w-full px-3 py-2 border border-[#4f5661] rounded-lg bg-[#2c3138] text-[#edf1f5]"
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                  >
                    <option value="">Select a device...</option>
                    {activeDevices.map((device) => (
                      <option key={device._id} value={device._id}>
                        {device.name} - {device.location}
                      </option>
                    ))}
                  </select>
                </CardContent>
              </Card>

              {selectedDevice && (
                <>
                  {/* Quick Simulation */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Simulate</CardTitle>
                      <CardDescription>Generate random realistic readings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {sensorPresets.map((preset) => {
                          const Icon = preset.icon;
                          return (
                            <Button
                              key={preset.type}
                              variant="outline"
                              className="h-auto py-3 flex flex-col items-center gap-1"
                              onClick={() => handleSimulateRandom(preset)}
                              disabled={isRecording}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="text-xs">{preset.label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Manual Entry */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Manual Entry</CardTitle>
                      <CardDescription>Enter specific sensor values</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleRecordReading} className="space-y-4">
                        <div>
                          <Label htmlFor="sensorType">Sensor Type</Label>
                          <select
                            id="sensorType"
                            name="sensorType"
                            className="w-full px-3 py-2 border border-[#4f5661] rounded-lg bg-[#2c3138] text-[#edf1f5]"
                            required
                          >
                            {sensorPresets.map((preset) => (
                              <option key={preset.type} value={preset.type}>
                                {preset.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="value">Value</Label>
                            <Input
                              id="value"
                              name="value"
                              type="number"
                              step="0.1"
                              placeholder="e.g., 25.5"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="unit">Unit</Label>
                            <Input id="unit" name="unit" placeholder="e.g., °C, %, AQI" required />
                          </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isRecording}>
                          <Zap className="w-4 h-4 mr-2" />
                          {isRecording ? 'Recording...' : 'Record Reading'}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Readings History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Readings</CardTitle>
                <CardDescription>
                  {selectedDevice
                    ? 'Latest readings from selected device'
                    : 'Select a device to view readings'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedDevice ? (
                  <p className="text-gray-500 text-center py-8">
                    Select a device to view its readings
                  </p>
                ) : readingsLoading ? (
                  <p className="text-gray-500 text-center py-8">Loading readings...</p>
                ) : !readings || readings.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No readings yet. Use the simulator to generate data.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {readings.map((reading) => {
                      const preset = sensorPresets.find((p) => p.type === reading.sensorType);
                      const Icon = preset?.icon || Activity;
                      return (
                        <div
                          key={reading._id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-gray-600" />
                            <div>
                              <p className="font-medium text-sm">
                                {preset?.label || reading.sensorType}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(reading.recordedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold">
                            {reading.value} {reading.unit}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Page>
  );
}
