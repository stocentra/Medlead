import { useState } from 'react';
import LoginForm from '@/components/features/auth/LoginForm';
import SignupForm from '@/components/features/auth/SignupForm';
import { cn } from '@/lib/utils';
import RodOfAsclepius from '@/assets/svgs/RodOfAsclepius';

type AuthView = 'login' | 'signup';

const AuthPage = () => {
  const [view, setView] = useState<AuthView>('login');

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background-light p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center mb-8">
          <RodOfAsclepius className="h-12 w-12 text-primary" />
          <h1 className="mt-4 text-2xl font-semibold text-text-primary">
            {view === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h1>
          <p className="text-sm text-text-secondary">
            {view === 'login'
              ? 'Sign in to access your MedLead assistant'
              : 'Join MedLead and enhance your clinical skills.'}
          </p>
        </div>
        <div className="mb-6 flex justify-center rounded-lg bg-gray-200 p-1">
          <button
            onClick={() => setView('login')}
            className={cn(
              'w-full rounded-md px-4 py-2 text-sm font-medium transition-all',
              view === 'login'
                ? 'bg-white text-primary shadow'
                : 'text-gray-600 hover:bg-gray-300',
            )}
          >
            Login
          </button>
          <button
            onClick={() => setView('signup')}
            className={cn(
              'w-full rounded-md px-4 py-2 text-sm font-medium transition-all',
              view === 'signup'
                ? 'bg-white text-primary shadow'
                : 'text-gray-600 hover:bg-gray-300',
            )}
          >
            Sign Up
          </button>
        </div>
        {view === 'login' ? (
          <LoginForm onToggleView={() => setView('signup')} />
        ) : (
          <SignupForm onToggleView={() => setView('login')} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;