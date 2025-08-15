import { useChatStore } from '@/store/useChatStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useUIStore } from '@/store/useUIStore';

// This is a sub-component to keep the main component cleaner
const SidebarContent = () => {
  const { 
    conversations, 
    currentConversationId, 
    startNewConversation, 
    selectConversation,
    searchQuery,
    setSearchQuery,
    renameConversation,
    deleteConversation
  } = useChatStore();
  
  const { closeSidebar } = useUIStore();
  const location = useLocation();

  const filteredConversations = useMemo(() => 
    conversations.filter(convo => 
      convo.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [conversations, searchQuery]
  );

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    closeSidebar();
  }

  const handleRename = (id: string, currentTitle: string) => {
    const newTitle = prompt("Enter new conversation name:", currentTitle);
    if (newTitle && newTitle.trim() !== "") {
      renameConversation(id, newTitle.trim());
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      deleteConversation(id);
    }
  };

  return (
    <>
      <Button onClick={() => { startNewConversation(); closeSidebar(); }} className="w-full">
        <Icon icon="lucide:plus" className="mr-2 h-5 w-5" />
        New Chat
      </Button>
      <h2 className="mt-6 mb-2 text-lg font-semibold text-primary">History</h2>
      <div className="relative mb-4">
        <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input 
          placeholder="Search history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto">
        {filteredConversations.map((convo) => (
          <div key={convo.id} className="group flex items-center rounded-md hover:bg-foreground/20">
            <button
              onClick={() => handleSelectConversation(convo.id)}
              className={cn(
                'flex-1 truncate p-2 text-left text-sm',
                convo.id === currentConversationId ? 'text-accent' : 'text-secondary',
              )}
            >
              {convo.title}
            </button>
            
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button 
                  className="p-2 text-secondary opacity-0 group-hover:opacity-100 focus:opacity-100" 
                  aria-label={`Conversation options for ${convo.title}`}
                >
                  <Icon icon="lucide:more-horizontal" className="h-4 w-4" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="min-w-[120px] bg-card p-1 shadow-md rounded-md border border-border z-30" sideOffset={5}>
                  <DropdownMenu.Item 
                    className="flex items-center p-2 text-sm rounded-sm cursor-pointer text-primary hover:bg-foreground/20"
                    onSelect={() => handleRename(convo.id, convo.title)}>
                    <Icon icon="lucide:pencil" className="mr-2 h-4 w-4"/> Rename
                  </DropdownMenu.Item>
                  <DropdownMenu.Item 
                    className="flex items-center p-2 text-sm rounded-sm cursor-pointer text-status-error hover:bg-red-500/10"
                    onSelect={() => handleDelete(convo.id)}>
                    <Icon icon="lucide:trash-2" className="mr-2 h-4 w-4"/> Delete
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        ))}
      </div>
      <div className="mt-auto">
        <Link to="/subscription" onClick={closeSidebar}>
          <Button 
            variant={location.pathname === '/subscription' ? 'primary' : 'outline'} 
            className="w-full"
          >
            <Icon icon="lucide:gem" className="mr-2 h-5 w-5" />
            Manage Subscription
          </Button>
        </Link>
      </div>
    </>
  );
};


const Sidebar = () => {
  const { isSidebarOpen, closeSidebar } = useUIStore();

  return (
    <>
      {/* --- Mobile Overlay --- */}
      <div
        onClick={closeSidebar}
        className={cn(
          'fixed inset-0 z-10 bg-black bg-opacity-50 transition-opacity md:hidden',
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />
      
      {/* --- Sidebar for both Mobile (sliding) and Desktop (static) --- */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-20 h-full w-64 flex flex-col border-r border-border bg-card p-4 transition-transform duration-300 ease-in-out md:static md:z-auto md:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;