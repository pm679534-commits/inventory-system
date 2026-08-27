'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { t } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginInput>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setMessage(null);

    const validation = loginSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof LoginInput, string>> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as keyof LoginInput] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      setMessage({ type: 'error', text: t.auth.unexpectedError });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Package className="w-7 h-7 text-blue-600" />
              <span className="text-xl font-semibold tracking-tight text-gray-900">
                {t.landing.warehouse}
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
                {t.auth.welcomeBack}
              </h1>
              <p className="text-gray-600">{t.auth.signInToContinue}</p>
            </div>

            {message && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  message.type === 'error'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-green-50 text-green-800 border border-green-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.auth.emailAddress}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all`}
                  placeholder={t.auth.emailPlaceholder}
                />
                {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.auth.password}
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all`}
                  placeholder={t.auth.passwordPlaceholder}
                />
                {errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-end">
                <Link
                  href="/auth/reset-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {t.auth.forgotPassword}
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? t.auth.signingIn : t.auth.signIn}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {t.auth.dontHaveAccount}{' '}
                <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-700">
                  {t.auth.signUp}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
