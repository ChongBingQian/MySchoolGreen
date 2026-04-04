import { Link } from 'react-router-dom';
import { useSession } from '@/client/lib/cloudflare/modelenceClient';
import {
  Leaf,
  Smartphone,
  ArrowRight,
  Recycle,
  BarChart3,
  CheckSquare,
  TrendingUp,
} from 'lucide-react';
import Page from '@/client/components/Page';
import { Button } from '@/client/components/ui/Button';
import { Card, CardContent } from '@/client/components/ui/Card';

export default function HomePage() {
  const { user } = useSession();

  return (
    <Page className="bg-gradient-to-b from-emerald-50 to-white">
      <div className="h-full flex items-center justify-center">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Hero Section - Compact */}
          <section className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium mb-4">
              <Recycle className="w-3 h-3" />
              Creating positive environmental & social impact
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              Ready to Make an Impact?
            </h1>

            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              Transform e-waste into environmental monitoring tools
            </p>
          </section>

          {/* Action Cards */}
          {user ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 max-w-5xl mx-auto">
              <Link to="/dashboard" className="group">
                <Card className="border-2 border-emerald-600 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-emerald-200 transition-colors">
                      <BarChart3 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Dashboard</h3>
                    <p className="text-xs text-gray-600">View metrics</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/impact" className="group">
                <Card className="border-2 border-indigo-600 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-indigo-200 transition-colors">
                      <TrendingUp className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Impact</h3>
                    <p className="text-xs text-gray-600">View trends</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/devices" className="group">
                <Card className="border-2 border-blue-600 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-200 transition-colors">
                      <Smartphone className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Devices</h3>
                    <p className="text-xs text-gray-600">Manage sensors</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/simulator" className="group">
                <Card className="border-2 border-green-600 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-green-200 transition-colors">
                      <Leaf className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Simulator</h3>
                    <p className="text-xs text-gray-600">Test data</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/todos" className="group">
                <Card className="border-2 border-purple-600 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-200 transition-colors">
                      <CheckSquare className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Todos</h3>
                    <p className="text-xs text-gray-600">Track tasks</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          )}

          {/* Quick Info */}
          {user && (
            <p className="text-center text-sm text-gray-600 mt-6 max-w-2xl mx-auto">
              Click any section to explore features and start making a difference
            </p>
          )}
        </div>
      </div>
    </Page>
  );
}
