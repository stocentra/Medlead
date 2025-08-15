import { useAuthStore } from '@/store/useAuthStore'
import { useNavigate, Link } from 'react-router-dom'
import RodOfAsclepius from '@/assets/svgs/RodOfAsclepius'
import { Button } from '../ui/Button'
import { Icon } from '@iconify/react'
import { useUIStore } from '@/store/useUIStore'
import NotificationBell from '../features/notifications/NotificationBell'

const Header = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 shadow-sm sm:px-6">
      <div className="flex items-center gap-2">
        <Button onClick={toggleSidebar} variant="ghost" size="icon" className="md:hidden">
          <Icon icon="lucide:menu" className="h-6 w-6" />
        </Button>
        <Link to="/" className="flex items-center gap-2">
          <RodOfAsclepius className="h-8 w-8 text-primary" />
          <span className="hidden text-xl font-semibold text-text-primary sm:inline">MedLead</span>
        </Link>
      </div>

      <div className="flex items-center gap-1">
        {user && (
          <Link to="/profile" className="hidden rounded-md p-2 text-right hover:bg-gray-100 sm:block">
            <p className="text-sm font-medium text-text-primary">{user.full_name}</p>
            <p className="text-xs text-text-secondary">{user.professional_level.replace(/_/g, ' ')}</p>
          </Link>
        )}
        <NotificationBell />
        <Button onClick={handleLogout} variant="outline" size="sm">
          <Icon icon="lucide:log-out" className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  )
}

export default Header