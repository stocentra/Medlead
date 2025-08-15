import { useNotificationStore } from '@/store/useNotificationStore';
import { Button } from '@/components/ui/Button';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead } = useNotificationStore();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle notifications" className="relative">
          <Icon icon="lucide:bell" className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content 
          className="min-w-[300px] max-h-[400px] overflow-y-auto bg-white dark:bg-dark-background-light p-2 shadow-md rounded-md border border-gray-200 dark:border-gray-700" 
          sideOffset={5}
        >
          <div className="p-2 font-semibold border-b dark:border-gray-700">Notifications</div>
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-text-secondary">No new notifications.</div>
          ) : (
            notifications.map(notif => (
              <DropdownMenu.Item 
                key={notif.id}
                className={cn(
                  "flex flex-col items-start p-2 text-sm rounded-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-background outline-none",
                  !notif.is_read && "bg-blue-50 dark:bg-blue-900/20"
                )}
                onSelect={() => !notif.is_read && markAsRead(notif.id)}
              >
                <p className="font-semibold text-text-primary dark:text-dark-text-primary">{notif.title}</p>
                <p className="text-text-secondary dark:text-dark-text-secondary">{notif.message}</p>
                <time className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</time>
              </DropdownMenu.Item>
            ))
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default NotificationBell;