import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getConfig, loginWithPassword } from '@/client/lib/cloudflare/modelenceClient';
import { Button } from '@/client/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/client/components/ui/Card';
import { Input } from '@/client/components/ui/Input';
import { FormField } from '@/client/components/ui/FormField';
import { Link } from 'react-router-dom';
import Page from '@/client/components/Page';
import { toast } from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Page>
      <div className="flex items-center justify-center min-h-full">
        <LoginForm />
      </div>
    </Page>
  );
}

function LoginForm() {
  const isSandboxEnv = getConfig('_system.env.type') === 'sandbox';
  const defaultDemoEmail = isSandboxEnv
    ? (getConfig('example.modelenceDemoUsername') as string | undefined)
    : undefined;
  const defaultDemoPassword = isSandboxEnv
    ? (getConfig('example.modelenceDemoPassword') as string | undefined)
    : undefined;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: defaultDemoEmail || '',
      password: defaultDemoPassword || '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginWithPassword({ email: data.email, password: data.password });
    } catch (error) {
      toast.error((error as Error).message || 'Login failed');
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto bg-white">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Sign in to your account</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input type="email" id="email" {...register('email')} />
          </FormField>

          <FormField label="Password" htmlFor="password" error={errors.password?.message}>
            <Input type="password" id="password" {...register('password')} />
          </FormField>

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-gray-900 underline hover:no-underline font-medium">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
