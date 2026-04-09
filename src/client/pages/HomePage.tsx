import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Leaf,
  Smartphone,
  Recycle,
  BarChart3,
  CheckSquare,
  TrendingUp,
  School,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Page from '@/client/components/Page';
import { Card, CardContent } from '@/client/components/ui/Card';
import { modelenceQuery } from '@/client/lib/cloudflare/modelenceReactQuery';

type DashboardStats = {
  totalDevices: number;
  activeDevices: number;
  totalSchools: number;
  totalCredits: number;
  co2OffsetKg: number;
};

type ImpactHistoryPoint = {
  date: string;
  devices: number;
  co2Offset: number;
  credits: number;
  schools: number;
};

function formatDelta(delta: number) {
  if (delta > 0) {
    return `+${delta}`;
  }

  if (delta < 0) {
    return `${delta}`;
  }

  return '0';
}

export default function HomePage() {
  const { data: stats } = useQuery({
    ...modelenceQuery<DashboardStats>('regenerate.getDashboardStats'),
  });

  const { data: impactHistory } = useQuery({
    ...modelenceQuery<ImpactHistoryPoint[]>('regenerate.getImpactHistory'),
  });

  const trend = useMemo(() => {
    if (!impactHistory || impactHistory.length < 2) {
      return { devices: 0, co2Offset: 0, credits: 0, schools: 0 };
    }

    const latest = impactHistory[impactHistory.length - 1];
    const comparison = impactHistory[Math.max(impactHistory.length - 8, 0)];

    return {
      devices: latest.devices - comparison.devices,
      co2Offset: latest.co2Offset - comparison.co2Offset,
      credits: latest.credits - comparison.credits,
      schools: latest.schools - comparison.schools,
    };
  }, [impactHistory]);

  const storyCards = [
    {
      title: 'Recovered Devices',
      value: stats?.totalDevices ?? 0,
      delta: formatDelta(trend.devices),
      description: 'Repurposed from potential e-waste into field-ready sensors.',
      icon: Smartphone,
      tone: 'from-cyan-500 to-blue-500',
    },
    {
      title: 'CO2 Offset',
      value: `${stats?.co2OffsetKg ?? 0} kg`,
      delta: formatDelta(trend.co2Offset),
      description: 'Estimated monthly carbon reduction from active deployments.',
      icon: Leaf,
      tone: 'from-emerald-500 to-green-500',
    },
    {
      title: 'Regenerative Credits',
      value: stats?.totalCredits ?? 0,
      delta: formatDelta(trend.credits),
      description: 'Credits returned to participating schools and local programs.',
      icon: Recycle,
      tone: 'from-amber-500 to-orange-500',
    },
    {
      title: 'School Network',
      value: stats?.totalSchools ?? 0,
      delta: formatDelta(trend.schools),
      description: 'Learning communities now tracking real environmental change.',
      icon: School,
      tone: 'from-indigo-500 to-sky-500',
    },
  ];

  return (
    <Page>
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-6 md:p-10 shadow-sm rise-in">
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="absolute -bottom-20 left-12 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
            <div className="lg:col-span-2">
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-[#edf1f5] mb-4">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Dynamic entry point for your sustainability mission
              </p>

              <h1 className="text-3xl md:text-5xl font-bold leading-tight text-slate-900 max-w-3xl">
                From retired devices to measurable climate action.
              </h1>

              <p className="mt-4 text-[#d5dde7] text-base md:text-lg max-w-2xl">
                Follow the story in real time: devices are repurposed, schools activate sensors, and
                impact compounds through credits and carbon reductions.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-700 transition-colors"
                >
                  Open Interactive Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/impact"
                  className="inline-flex items-center gap-2 rounded-xl bg-white text-[#edf1f5] border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-100 transition-colors"
                >
                  View Impact Story
                  <TrendingUp className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 md:p-5 backdrop-blur">
              <p className="text-sm font-semibold text-[#edf1f5] mb-3">Impact This Week</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[#d5dde7]">Devices Activated</span>
                  <span className="font-semibold text-[#edf1f5]">{formatDelta(trend.devices)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#d5dde7]">CO2 Offset</span>
                  <span className="font-semibold text-[#edf1f5]">
                    {formatDelta(trend.co2Offset)} kg
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#d5dde7]">Credits Earned</span>
                  <span className="font-semibold text-[#edf1f5]">{formatDelta(trend.credits)}</span>
                </div>
                <div className="h-px bg-slate-200" />
                <p className="text-xs text-[#d5dde7]">
                  Weekly movement based on your rolling 30-day impact history.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {storyCards.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="border-slate-200 bg-white/90 overflow-hidden rise-in"
                style={{ animationDelay: `${120 * index}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-sm font-medium text-[#d5dde7]">{item.title}</div>
                    <div
                      className={`h-10 w-10 rounded-xl bg-gradient-to-br ${item.tone} flex items-center justify-center impact-glow`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-slate-900">{item.value}</div>
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    {item.delta} this week
                  </p>
                  <p className="mt-3 text-sm text-[#d5dde7] leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 max-w-6xl mx-auto">
          <Link to="/dashboard" className="group">
            <Card className="border-2 border-slate-900/10 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-slate-900/10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-slate-900/20 transition-colors">
                  <BarChart3 className="w-6 h-6 text-slate-800" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">Dashboard</h3>
                <p className="text-xs text-[#d5dde7]">Explore analytics</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/impact" className="group">
            <Card className="border-2 border-sky-300 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-sky-200 transition-colors">
                  <TrendingUp className="w-6 h-6 text-sky-700" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">Impact</h3>
                <p className="text-xs text-[#d5dde7]">Read the journey</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/devices" className="group">
            <Card className="border-2 border-cyan-300 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-cyan-200 transition-colors">
                  <Smartphone className="w-6 h-6 text-cyan-700" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">Devices</h3>
                <p className="text-xs text-[#d5dde7]">Manage assets</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/simulator" className="group">
            <Card className="border-2 border-emerald-300 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-emerald-200 transition-colors">
                  <Leaf className="w-6 h-6 text-emerald-700" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">Simulator</h3>
                <p className="text-xs text-[#d5dde7]">Generate signals</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/todos" className="group">
            <Card className="border-2 border-amber-300 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-amber-200 transition-colors">
                  <CheckSquare className="w-6 h-6 text-amber-700" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">Todos</h3>
                <p className="text-xs text-[#d5dde7]">Coordinate actions</p>
              </CardContent>
            </Card>
          </Link>
        </section>

        <p className="text-center text-sm text-[#d5dde7] max-w-2xl mx-auto">
          Start in Dashboard for a full contribution view, then dive into Impact for trend
          storytelling and progress over time.
        </p>
      </div>
    </Page>
  );
}
