import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  modelenceQuery,
  modelenceMutation,
  createQueryKey,
} from '@/client/lib/cloudflare/modelenceReactQuery';
import { Smartphone, Tablet, Cpu, Plus, MapPin, Activity, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Page from '@/client/components/Page';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/Card';
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
  registeredAt: string;
  lastReadingAt?: string;
};

type School = {
  _id: string;
  name: string;
  city: string;
  totalCredits: number;
};

function getDeviceIcon(type: string) {
  switch (type) {
    case 'tablet':
      return <Tablet className="w-5 h-5" />;
    case 'phone':
      return <Smartphone className="w-5 h-5" />;
    default:
      return <Cpu className="w-5 h-5" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-[#418228]/20 text-[#caefbf]';
    case 'inactive':
      return 'bg-[#343941] text-[#c2cad4]';
    case 'maintenance':
      return 'bg-[#69503b]/25 text-[#e3d2c1]';
    default:
      return 'bg-[#343941] text-[#c2cad4]';
  }
}

export default function DevicesPage() {
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showAddSchool, setShowAddSchool] = useState(false);
  const queryClient = useQueryClient();

  const { data: devices, isLoading: devicesLoading } = useQuery({
    ...modelenceQuery<Device[]>('regenerate.getDevices'),
  });

  const { data: schools, isLoading: schoolsLoading } = useQuery({
    ...modelenceQuery<School[]>('regenerate.getSchools'),
  });

  const { mutate: registerDevice, isPending: isRegistering } = useMutation({
    ...modelenceMutation('regenerate.registerDevice'),
    onSuccess: () => {
      toast.success('Device registered successfully! +10 credits earned');
      queryClient.invalidateQueries({ queryKey: createQueryKey('regenerate.getDevices') });
      queryClient.invalidateQueries({ queryKey: createQueryKey('regenerate.getSchools') });
      queryClient.invalidateQueries({ queryKey: createQueryKey('regenerate.getDashboardStats') });
      setShowAddDevice(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to register device');
    },
  });

  const { mutate: createSchool, isPending: isCreatingSchool } = useMutation({
    ...modelenceMutation('regenerate.createSchool'),
    onSuccess: () => {
      toast.success('School registered successfully!');
      queryClient.invalidateQueries({ queryKey: createQueryKey('regenerate.getSchools') });
      queryClient.invalidateQueries({ queryKey: createQueryKey('regenerate.getDashboardStats') });
      setShowAddSchool(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to register school');
    },
  });

  const { mutate: removeDevice, isPending: isRemovingDevice } = useMutation({
    ...modelenceMutation('regenerate.removeDevice'),
    onSuccess: () => {
      toast.success('Device removed successfully');
      queryClient.invalidateQueries({ queryKey: createQueryKey('regenerate.getDevices') });
      queryClient.invalidateQueries({ queryKey: createQueryKey('regenerate.getDashboardStats') });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to remove device');
    },
  });

  const { mutate: removeSchool, isPending: isRemovingSchool } = useMutation({
    ...modelenceMutation('regenerate.removeSchool'),
    onSuccess: () => {
      toast.success('School removed successfully');
      queryClient.invalidateQueries({ queryKey: createQueryKey('regenerate.getSchools') });
      queryClient.invalidateQueries({ queryKey: createQueryKey('regenerate.getDashboardStats') });
      queryClient.invalidateQueries({ queryKey: createQueryKey('regenerate.getImpactHistory') });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to remove school');
    },
  });

  const handleAddDevice = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const sensorTypesStr = formData.get('sensorTypes') as string;

      registerDevice({
        name: formData.get('name') as string,
        deviceType: formData.get('deviceType') as string,
        location: formData.get('location') as string,
        sensorTypes: sensorTypesStr
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        schoolId: formData.get('schoolId') as string,
      });
    },
    [registerDevice]
  );

  const handleAddSchool = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      createSchool({
        name: formData.get('name') as string,
        city: formData.get('city') as string,
      });
    },
    [createSchool]
  );

  const handleRemoveDevice = useCallback(
    (deviceId: string) => {
      if (!window.confirm('Are you sure you want to remove this device?')) {
        return;
      }

      removeDevice({ deviceId });
    },
    [removeDevice]
  );

  const handleRemoveSchool = useCallback(
    (schoolId: string) => {
      if (!window.confirm('Are you sure you want to remove this school?')) {
        return;
      }

      removeSchool({ schoolId });
    },
    [removeSchool]
  );

  const isLoading = devicesLoading || schoolsLoading;

  return (
    <Page>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div
          className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-8 rise-in"
          style={{ animationDelay: '40ms' }}
        >
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900">Device Management</h1>
            <p className="text-gray-600 mt-2">
              Register and manage repurposed devices as environmental sensors
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              className="w-full sm:w-auto"
              variant="outline"
              onClick={() => setShowAddSchool(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add School
            </Button>
            <Button className="w-full sm:w-auto" onClick={() => setShowAddDevice(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Register Device
            </Button>
          </div>
        </div>

        {/* Add School Modal */}
        {showAddSchool && (
          <Card
            className="mb-6 border-blue-200 bg-blue-50 rise-in"
            style={{ animationDelay: '90ms' }}
          >
            <CardHeader>
              <CardTitle>Register New School</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSchool} className="space-y-4">
                <div>
                  <Label htmlFor="schoolName">School Name</Label>
                  <Input
                    id="schoolName"
                    name="name"
                    placeholder="e.g., Green Valley Elementary"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" placeholder="e.g., Portland" required />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button className="w-full sm:w-auto" type="submit" disabled={isCreatingSchool}>
                    {isCreatingSchool ? 'Registering...' : 'Register School'}
                  </Button>
                  <Button
                    className="w-full sm:w-auto"
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddSchool(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Add Device Modal */}
        {showAddDevice && (
          <Card
            className="mb-6 border-emerald-200 bg-emerald-50 rise-in"
            style={{ animationDelay: '130ms' }}
          >
            <CardHeader>
              <CardTitle>Register Repurposed Device</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddDevice} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deviceName">Device Name</Label>
                    <Input
                      id="deviceName"
                      name="name"
                      placeholder="e.g., Garden Sensor 1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="deviceType">Device Type</Label>
                    <select
                      id="deviceType"
                      name="deviceType"
                      className="w-full px-3 py-2 border border-[#4f5661] rounded-lg bg-[#2c3138] text-[#edf1f5]"
                      required
                    >
                      <option value="tablet">Tablet</option>
                      <option value="phone">Phone</option>
                      <option value="sensor">Dedicated Sensor</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="e.g., School Garden, Classroom A"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="schoolId">School</Label>
                    <select
                      id="schoolId"
                      name="schoolId"
                      className="w-full px-3 py-2 border border-[#4f5661] rounded-lg bg-[#2c3138] text-[#edf1f5]"
                      required
                    >
                      <option value="">Select a school</option>
                      {schools?.map((school) => (
                        <option key={school._id} value={school._id}>
                          {school.name} ({school.city})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="sensorTypes">Sensor Types (comma-separated)</Label>
                  <Input
                    id="sensorTypes"
                    name="sensorTypes"
                    placeholder="e.g., air_quality, temperature, soil_moisture"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Options: air_quality, temperature, soil_moisture, water_ph
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button className="w-full sm:w-auto" type="submit" disabled={isRegistering}>
                    {isRegistering ? 'Registering...' : 'Register Device (+10 credits)'}
                  </Button>
                  <Button
                    className="w-full sm:w-auto"
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDevice(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div
            className="text-center py-12 text-gray-500 rise-in"
            style={{ animationDelay: '180ms' }}
          >
            Loading...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Devices List */}
            <div className="lg:col-span-2">
              <Card className="rise-in" style={{ animationDelay: '220ms' }}>
                <CardHeader>
                  <CardTitle>Registered Devices</CardTitle>
                </CardHeader>
                <CardContent>
                  {!devices || devices.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No devices registered yet. Click &quot;Register Device&quot; to add your first
                      sensor.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {devices.map((device, index) => (
                        <div
                          key={device._id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover:bg-gray-50 rise-in"
                          style={{ animationDelay: `${260 + index * 45}ms` }}
                        >
                          <div className="flex items-start sm:items-center gap-4 min-w-0">
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                              {getDeviceIcon(device.deviceType)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-900">{device.name}</h3>
                              <div className="flex items-start gap-2 text-sm text-gray-500 break-words">
                                <MapPin className="w-3 h-3" />
                                {device.location}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {device.sensorTypes.map((type) => (
                                  <span
                                    key={type}
                                    className="text-xs bg-gray-100 px-2 py-0.5 rounded"
                                  >
                                    {type}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}
                            >
                              {device.status}
                            </span>
                            {device.lastReadingAt && (
                              <p className="text-xs text-gray-400 mt-1">
                                <Activity className="w-3 h-3 inline mr-1" />
                                {new Date(device.lastReadingAt).toLocaleDateString()}
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveDevice(device._id)}
                              disabled={isRemovingDevice}
                              className="mt-2 inline-flex items-center text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                              aria-label={`Remove ${device.name}`}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Schools List */}
            <div>
              <Card className="rise-in" style={{ animationDelay: '280ms' }}>
                <CardHeader>
                  <CardTitle>Participating Schools</CardTitle>
                </CardHeader>
                <CardContent>
                  {!schools || schools.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No schools registered yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {schools.map((school, index) => (
                        <div
                          key={school._id}
                          className="p-3 border rounded-lg rise-in"
                          style={{ animationDelay: `${320 + index * 50}ms` }}
                        >
                          <h4 className="font-medium text-gray-900">{school.name}</h4>
                          <p className="text-sm text-gray-500">{school.city}</p>
                          <p className="text-sm font-semibold text-amber-600 mt-1">
                            {school.totalCredits} credits
                          </p>
                          <button
                            type="button"
                            onClick={() => handleRemoveSchool(school._id)}
                            disabled={isRemovingSchool}
                            className="mt-2 inline-flex items-center text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                            aria-label={`Remove ${school.name}`}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
