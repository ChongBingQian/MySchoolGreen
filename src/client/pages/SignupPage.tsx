import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signupWithPassword } from '@/client/lib/cloudflare/modelenceClient';
import { Button } from '@/client/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/client/components/ui/Card';
import { Input } from '@/client/components/ui/Input';
import { FormField } from '@/client/components/ui/FormField';
import { Label } from '@/client/components/ui/Label';
import { Link } from 'react-router-dom';
import Page from '@/client/components/Page';
import { toast } from 'react-hot-toast';

const signupSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the Terms and Conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  return (
    <Page>
      <div className="flex items-center justify-center min-h-full">
        <SignupForm />
      </div>
    </Page>
  );
}

function SignupForm() {
  const [isSignupSuccess, setIsSignupSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signupWithPassword({ email: data.email, password: data.password });
      setIsSignupSuccess(true);
    } catch (error) {
      toast.error((error as Error).message || 'Signup failed');
    }
  };

  if (isSignupSuccess) {
    return (
      <Card className="w-full max-w-sm mx-auto bg-white text-gray-900">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Account created</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-gray-600">Your account has been created successfully.</p>
          <Link to="/login" className="w-full">
            <Button className="w-full">Sign in</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm mx-auto bg-white text-gray-900">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Create an account</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input type="email" id="email" {...register('email')} />
          </FormField>

          <FormField label="Password" htmlFor="password" error={errors.password?.message}>
            <Input type="password" id="password" {...register('password')} />
          </FormField>

          <FormField
            label="Confirm password"
            htmlFor="confirm-password"
            error={errors.confirmPassword?.message}
          >
            <Input type="password" id="confirm-password" {...register('confirmPassword')} />
          </FormField>

          <div className="space-y-2">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="consent-terms"
                  type="checkbox"
                  className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
                  {...register('acceptTerms')}
                />
              </div>
              <div className="ml-3 text-sm">
                <Label htmlFor="consent-terms" className="text-gray-600">
                  I accept the{' '}
                  <a
                    className="font-medium text-blue-600 hover:underline"
                    href="/terms"
                    target="_blank"
                  >
                    Terms and Conditions
                  </a>
                </Label>
              </div>
            </div>
            {errors.acceptTerms && (
              <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
            )}
          </div>

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-gray-900 underline hover:no-underline font-medium">
            Sign in here
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
