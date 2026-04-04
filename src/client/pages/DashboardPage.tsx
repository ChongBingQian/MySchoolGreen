import { useQuery } from '@tanstack/react-query';
import { modelenceQuery } from '@/client/lib/cloudflare/modelenceReactQuery';
import { Leaf, Smartphone, School, Award, Wind, Droplets } from 'lucide-react';
import Page from '@/client/components/Page';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/Card';

type DashboardStats = {
  totalDevices: number;
  activeDevices: number;
  totalSchools: number;
  totalCredits: number;
  co2OffsetKg: number;
  recentReadings: Array<{
    _id: string;
    deviceId: string;
    sensorType: string;
    value: number;
    unit: string;
    recordedAt: string;
  }>;
};

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof Leaf;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getSensorIcon(sensorType: string) {
  switch (sensorType) {
    case 'air_quality':
      return <Wind className="w-4 h-4 text-blue-500" />;
    case 'water_ph':
      return <Droplets className="w-4 h-4 text-cyan-500" />;
    default:
      return <Leaf className="w-4 h-4 text-green-500" />;
  }
}

function getSensorLabel(sensorType: string) {
  switch (sensorType) {
    case 'air_quality':
      return 'Air Quality';
    case 'water_ph':
      return 'Water pH';
    case 'soil_moisture':
      return 'Soil Moisture';
    case 'temperature':
      return 'Temperature';
    default:
      return sensorType;
  }
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    ...modelenceQuery<DashboardStats>('regenerate.getDashboardStats'),
  });

  return (
    <Page className="bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Regenerate Value</h1>
          <p className="text-gray-600 mt-2">
            Environmental impact through repurposed technology
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading dashboard...</div>
        ) : data ? (
          <>
            {/* Impact Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Active Sensors"
                value={data.activeDevices}
                subtitle={`${data.totalDevices} total devices`}
                icon={Smartphone}
                color="bg-emerald-500"
              />
              <StatCard
                title="Schools"
                value={data.totalSchools}
                subtitle="Participating"
                icon={School}
                color="bg-blue-500"
              />
              <StatCard
                title="Regenerative Credits"
                value={data.totalCredits}
                subtitle="Earned total"
                icon={Award}
                color="bg-amber-500"
              />
              <StatCard
                title="CO2 Offset"
                value={`${data.co2OffsetKg} kg`}
                subtitle="Monthly estimate"
                icon={Leaf}
                color="bg-green-600"
              />
            </div>

            {/* Recent Readings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Sensor Readings</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentReadings.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No sensor readings yet. Register devices to start collecting data.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.recentReadings.map((reading) => (
                      <div
                        key={reading._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getSensorIcon(reading.sensorType)}
                          <div>
                            <p className="font-medium text-gray-900">
                              {getSensorLabel(reading.sensorType)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(reading.recordedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">
                            {reading.value} {reading.unit}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Impact Summary */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Impact Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <Smartphone className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                    <h3 className="font-semibold text-gray-900">Device Repurposing</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {data.totalDevices} devices saved from landfill
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <School className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                    <h3 className="font-semibold text-gray-900">Circular Tech Education</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Students learning repair & sustainability
                    </p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <Award className="w-8 h-8 mx-auto text-amber-600 mb-2" />
                    <h3 className="font-semibold text-gray-900">Regenerative Credits</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Funding community programs
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </Page>
  );
}
