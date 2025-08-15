import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import TokenRefresher from '../features/auth/TokenRefresher'
import React, { useEffect } from 'react'; // Import useEffect
import { useNotificationStore } from '@/store/useNotificationStore'; // Import notification store

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);

  // Fetch notifications once when the layout mounts
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="flex h-screen flex-col bg-background-light font-sans text-text-primary dark:bg-dark-background">
      <TokenRefresher />
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  )
}

export default MainLayout