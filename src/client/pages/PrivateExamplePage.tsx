import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/Card';
import Page from '@/client/components/Page';

export default function PrivateExamplePage() {
  return (
    <Page>
      <div className="max-w-3xl mx-auto py-8">
        <Card className="bg-white text-gray-900 rise-in" style={{ animationDelay: '50ms' }}>
          <CardHeader>
            <CardTitle className="text-2xl">Private Example</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-gray-600">
            <p className="rise-in" style={{ animationDelay: '120ms' }}>
              Welcome to the example page.
            </p>
            <p className="rise-in" style={{ animationDelay: '180ms' }}>
              Authentication has been removed, so this page is now public.
            </p>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
