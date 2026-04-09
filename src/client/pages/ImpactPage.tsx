import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { modelenceQuery } from '@/client/lib/cloudflare/modelenceReactQuery';
import Page from '@/client/components/Page';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/Card';
import LoadingSpinner from '@/client/components/LoadingSpinner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Smartphone, Leaf, Award, School } from 'lucide-react';

type ImpactHistoryData = {
  date: string;
  devices: number;
  co2Offset: number;
  credits: number;
  schools: number;
};

export default function ImpactPage() {
  const {
    data: impactHistory,
    isLoading,
    error,
  } = useQuery({
    ...modelenceQuery<ImpactHistoryData[]>('regenerate.getImpactHistory'),
  });

  const currentStats = useMemo(() => {
    if (!impactHistory || impactHistory.length === 0) {
      return { devices: 0, co2Offset: 0, credits: 0, schools: 0 };
    }
    const latest = impactHistory[impactHistory.length - 1];
    return {
      devices: latest.devices,
      co2Offset: latest.co2Offset,
      credits: latest.credits,
      schools: latest.schools,
    };
  }, [impactHistory]);

  if (isLoading) {
    return (
      <Page>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-500">Error loading impact data: {(error as Error).message}</p>
          </div>
        </div>
      </Page>
    );
  }

  const hasData = impactHistory && impactHistory.length > 0;

  return (
    <Page>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-[#547599]" />
            Impact Summary
          </h1>
          <p className="text-gray-600">Track your environmental impact over time</p>
        </div>

        {!hasData ? (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-8 text-center">
              <TrendingUp className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Impact Data Yet</h3>
              <p className="text-gray-600 mb-4">
                Start by registering devices and schools to track your environmental impact over
                time.
              </p>
              <p className="text-sm text-gray-500">
                Visit the Dashboard, Devices, or Simulator sections to begin making an impact.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Current Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="border-indigo-200 bg-indigo-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-[#547599]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-indigo-900">{currentStats.devices}</p>
                      <p className="text-xs text-indigo-700">Active Devices</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-[#418228]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-900">
                        {currentStats.co2Offset}kg
                      </p>
                      <p className="text-xs text-green-700">CO₂ Offset</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-[#69503b]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-900">{currentStats.credits}</p>
                      <p className="text-xs text-amber-700">Credits Earned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <School className="w-5 h-5 text-[#547599]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-900">{currentStats.schools}</p>
                      <p className="text-xs text-blue-700">Schools</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Devices & CO2 Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Devices & CO₂ Offset Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={impactHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4f5661" />
                      <XAxis dataKey="date" stroke="#c2cad4" fontSize={12} tickMargin={10} />
                      <YAxis stroke="#c2cad4" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#2c3138',
                          border: '1px solid #4f5661',
                          borderRadius: '8px',
                          color: '#edf1f5',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="devices"
                        stroke="#547599"
                        strokeWidth={2}
                        dot={{ fill: '#547599', r: 3 }}
                        name="Active Devices"
                      />
                      <Line
                        type="monotone"
                        dataKey="co2Offset"
                        stroke="#418228"
                        strokeWidth={2}
                        dot={{ fill: '#418228', r: 3 }}
                        name="CO₂ Offset (kg)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Credits & Schools Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Credits & Schools Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={impactHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4f5661" />
                      <XAxis dataKey="date" stroke="#c2cad4" fontSize={12} tickMargin={10} />
                      <YAxis stroke="#c2cad4" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#2c3138',
                          border: '1px solid #4f5661',
                          borderRadius: '8px',
                          color: '#edf1f5',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="credits"
                        stroke="#69503b"
                        strokeWidth={2}
                        dot={{ fill: '#69503b', r: 3 }}
                        name="Credits Earned"
                      />
                      <Line
                        type="monotone"
                        dataKey="schools"
                        stroke="#547599"
                        strokeWidth={2}
                        dot={{ fill: '#547599', r: 3 }}
                        name="Schools Participating"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Summary Text */}
            <Card className="mt-6 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Impact Journey</h3>
                <p className="text-[#f2f6fb] leading-relaxed">
                  Over the past 30 days, your contributions have grown steadily. With{' '}
                  <strong>{currentStats.devices} active devices</strong>, you&apos;ve offset{' '}
                  <strong>{currentStats.co2Offset}kg of CO₂</strong> and earned{' '}
                  <strong>{currentStats.credits} regenerative credits</strong>. This positive impact
                  spans <strong>{currentStats.schools} schools</strong>, creating a ripple effect of
                  environmental awareness and action.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Page>
  );
}
