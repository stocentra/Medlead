import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/useAuthStore'

interface LoginFormProps {
  onToggleView: () => void;
}

const LoginForm = ({ onToggleView }: LoginFormProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const { login, status, message, token } = useAuthStore()
  const isLoading = status === 'loading'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await login({ email, password })
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  useEffect(() => {
    if (token && status === 'success') {
      navigate('/')
    }
  }, [token, status, navigate])

  return (
    <div className="w-full max-w-sm mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          type="email"
          placeholder="resident@medlead.ir"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
        {status === 'error' && message && (
          <div className="text-sm text-status-error text-center">{message}</div>
        )}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-text-secondary dark:text-dark-text-secondary">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onToggleView}
          className="font-medium text-primary hover:underline focus:outline-none dark:text-dark-primary"
        >
          Sign up
        </button>
      </p>
    </div>
  )
}

export default LoginForm