import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { modelenceQuery } from '@/client/lib/cloudflare/modelenceReactQuery';
import {
  Leaf,
  Smartphone,
  School,
  Award,
  Wind,
  Droplets,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import Page from '@/client/components/Page';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/Card';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Button } from '@/client/components/ui/Button';

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

type ImpactHistoryData = {
  date: string;
  devices: number;
  co2Offset: number;
  credits: number;
  schools: number;
};

type MetricKey = 'devices' | 'co2Offset' | 'credits' | 'schools';

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
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

function calculateDelta(values: number[]) {
  if (values.length < 2) {
    return { delta: 0, direction: 'neutral' as const };
  }

  const latest = values[values.length - 1];
  const baseline = values[Math.max(values.length - 8, 0)];
  const delta = latest - baseline;

  if (delta > 0) {
    return { delta, direction: 'up' as const };
  }

  if (delta < 0) {
    return { delta, direction: 'down' as const };
  }

  return { delta: 0, direction: 'neutral' as const };
}

export default function DashboardPage() {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('co2Offset');

  const { data, isLoading } = useQuery({
    ...modelenceQuery<DashboardStats>('regenerate.getDashboardStats'),
  });

  const { data: impactHistory = [] } = useQuery({
    ...modelenceQuery<ImpactHistoryData[]>('regenerate.getImpactHistory'),
  });

  const metricOptions: Array<{
    key: MetricKey;
    label: string;
    color: string;
    unit?: string;
    description: string;
  }> = [
    {
      key: 'co2Offset',
      label: 'CO2 Offset',
      color: '#418228',
      unit: 'kg',
      description: 'Estimated monthly reduction from active devices.',
    },
    {
      key: 'devices',
      label: 'Active Devices',
      color: '#547599',
      description: 'Repurposed devices currently reporting data.',
    },
    {
      key: 'credits',
      label: 'Credits',
      color: '#69503b',
      description: 'Cumulative regenerative credits over 30 days.',
    },
    {
      key: 'schools',
      label: 'Schools',
      color: '#547599',
      description: 'Participating school communities in your network.',
    },
  ];

  const selected =
    metricOptions.find((metric) => metric.key === selectedMetric) ?? metricOptions[0];

  const selectedMetricData = impactHistory.map((point) => ({
    date: point.date,
    value: point[selected.key],
  }));

  const metricDelta = useMemo(
    () => calculateDelta(selectedMetricData.map((item) => item.value)),
    [selectedMetricData]
  );

  const sensorBreakdown = useMemo(() => {
    if (!data?.recentReadings || data.recentReadings.length === 0) {
      return [];
    }

    const totals = new Map<string, number>();

    data.recentReadings.forEach((reading) => {
      totals.set(reading.sensorType, (totals.get(reading.sensorType) ?? 0) + 1);
    });

    return Array.from(totals.entries())
      .map(([sensorType, count]) => ({
        sensorType,
        label: getSensorLabel(sensorType),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [data?.recentReadings]);

  return (
    <Page>
      <div className="max-w-7xl mx-auto py-6 px-4 md:py-8 space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
            Interactive Impact Dashboard
          </h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            A living view of environmental contribution across devices, schools, carbon savings, and
            credits earned.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading dashboard...</div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Active Sensors"
                value={data.activeDevices}
                subtitle={`${data.totalDevices} total devices`}
                icon={Smartphone}
                color="bg-cyan-600"
              />
              <StatCard
                title="Schools"
                value={data.totalSchools}
                subtitle="Participating"
                icon={School}
                color="bg-indigo-600"
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
                color="bg-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card className="xl:col-span-2 border-slate-200">
                <CardHeader>
                  <CardTitle className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <span>30-Day Trend Explorer</span>
                    <span className="text-sm font-normal text-slate-500">
                      Tap a metric to focus the story.
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {metricOptions.map((metric) => (
                      <Button
                        key={metric.key}
                        variant={selectedMetric === metric.key ? 'default' : 'outline'}
                        className="text-xs"
                        onClick={() => setSelectedMetric(metric.key)}
                      >
                        {metric.label}
                      </Button>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm text-slate-500">{selected.label}</p>
                        <p className="text-lg font-semibold text-slate-900">
                          {selected.description}
                        </p>
                      </div>
                      <div
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          metricDelta.direction === 'up'
                            ? 'bg-[#418228]/20 text-[#c9f1bb]'
                            : metricDelta.direction === 'down'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-[#343941] text-[#c2cad4]'
                        }`}
                      >
                        {metricDelta.direction === 'up' ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : metricDelta.direction === 'down' ? (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        ) : null}
                        {metricDelta.delta > 0 ? '+' : ''}
                        {metricDelta.delta}
                        {selected.unit ? ` ${selected.unit}` : ''} in 7 days
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={selectedMetricData}>
                        <defs>
                          <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={selected.color} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={selected.color} stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="#4f5661" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: '#c2cad4', fontSize: 12 }}
                          tickMargin={10}
                        />
                        <YAxis tick={{ fill: '#c2cad4', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '10px',
                            border: '1px solid #4f5661',
                            background: '#2c3138',
                            color: '#edf1f5',
                          }}
                          formatter={(value: ValueType | undefined) => {
                            if (value === undefined || value === null) {
                              return '-';
                            }

                            return `${value}${selected.unit ? ` ${selected.unit}` : ''}`;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={selected.color}
                          strokeWidth={3}
                          fill="url(#metricGradient)"
                          dot={{ fill: selected.color, r: 3 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-100/70">
                <CardHeader>
                  <CardTitle>Impact Storyline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <p className="text-xs text-slate-500 mb-1">Stage 1</p>
                    <p className="font-semibold text-slate-900">Recover & Activate</p>
                    <p className="text-sm text-slate-600 mt-1">
                      {data.totalDevices} devices recovered, with {data.activeDevices} currently
                      transmitting.
                    </p>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <p className="text-xs text-slate-500 mb-1">Stage 2</p>
                    <p className="font-semibold text-slate-900">Measure & Learn</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Students across {data.totalSchools} schools read live environmental signals.
                    </p>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <p className="text-xs text-slate-500 mb-1">Stage 3</p>
                    <p className="font-semibold text-slate-900">Regenerate & Reinvest</p>
                    <p className="text-sm text-slate-600 mt-1">
                      {data.totalCredits} credits generated and {data.co2OffsetKg}kg CO2 offset
                      estimated.
                    </p>
                  </div>

                  <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 flex gap-3 items-start">
                    <Activity className="w-4 h-4 text-cyan-700 mt-0.5" />
                    <p className="text-sm text-cyan-900">
                      Storyline updates automatically as new devices, readings, and credits are
                      added.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Combined Growth View</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={impactHistory}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#4f5661" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#c2cad4', fontSize: 12 }}
                      tickMargin={10}
                    />
                    <YAxis tick={{ fill: '#c2cad4', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid #4f5661',
                        background: '#2c3138',
                        color: '#edf1f5',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="devices"
                      stroke="#547599"
                      strokeWidth={2.5}
                      dot={false}
                      name="Active Devices"
                    />
                    <Line
                      type="monotone"
                      dataKey="co2Offset"
                      stroke="#418228"
                      strokeWidth={2.5}
                      dot={false}
                      name="CO2 Offset (kg)"
                    />
                    <Line
                      type="monotone"
                      dataKey="credits"
                      stroke="#69503b"
                      strokeWidth={2.5}
                      dot={false}
                      name="Credits"
                    />
                    <Line
                      type="monotone"
                      dataKey="schools"
                      stroke="#547599"
                      strokeWidth={2.5}
                      dot={false}
                      name="Schools"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-slate-200">
                <CardHeader>
                  <CardTitle>Recent Sensor Readings</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.recentReadings.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">
                      No sensor readings yet. Register devices to start collecting data.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                      {data.recentReadings.map((reading) => (
                        <div
                          key={reading._id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <div className="flex items-center gap-3">
                            {getSensorIcon(reading.sensorType)}
                            <div>
                              <p className="font-medium text-slate-900">
                                {getSensorLabel(reading.sensorType)}
                              </p>
                              <p className="text-sm text-slate-500">
                                {new Date(reading.recordedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg text-slate-900">
                              {reading.value} {reading.unit}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Reading Mix</CardTitle>
                </CardHeader>
                <CardContent>
                  {sensorBreakdown.length === 0 ? (
                    <p className="text-sm text-slate-500">No recent reading mix to display yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {sensorBreakdown.map((entry) => (
                        <div key={entry.sensorType}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-700">{entry.label}</span>
                            <span className="font-semibold text-slate-900">{entry.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                              style={{
                                width: `${Math.max(
                                  10,
                                  (entry.count / data.recentReadings.length) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-0 border-slate-200 bg-gradient-to-r from-emerald-50 to-cyan-50">
              <CardHeader>
                <CardTitle>Narrative Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-800 leading-relaxed">
                  Your network currently sustains{' '}
                  <strong>{data.activeDevices} active sensors</strong> across{' '}
                  <strong>{data.totalSchools} schools</strong>. That translates to an estimated{' '}
                  <strong>{data.co2OffsetKg}kg CO2 offset</strong> and{' '}
                  <strong>{data.totalCredits} credits</strong> that can be reinvested in circular
                  education. The charts above reveal where momentum is accelerating and where to
                  focus next.
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </Page>
  );
}
