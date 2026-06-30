'use client';

import { Bell, ChevronDown, Menu as MenuIcon, Search } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { logout } from '@/store/features/authSlice';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useState } from 'react';
import { ProfileModal } from './modals/ProfileModal';
import { CommandPalette } from './CommandPalette';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';

const userNavigation = [
  { name: 'Your profile', href: '#' },
  { name: 'Sign out', href: '#' },
];

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const initials = user?.name
    ? `${user.name.charAt(0)}${user.name.split(' ').length > 1 ? user.name.split(' ')[user.name.split(' ').length - 1].charAt(0) : ''}`.toUpperCase()
    : '?';

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

      queryClient.clear();
      dispatch(logout());
      toast.success('Logged out successfully');
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
      queryClient.clear();
      dispatch(logout());
      router.push('/auth/login');
    }
  };

  const handleNavigation = (href: string, name: string) => {
    if (href === '#') {
      if (name === 'Sign out') {
        handleSignOut();
      } else if (name === 'Your profile') {
        setIsProfileModalOpen(true);
      }
    } else {
      router.push(href);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 shadow-xs sm:gap-x-6 sm:px-6 lg:px-8">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="-m-2.5 lg:hidden"
        >
          <span className="sr-only">Open sidebar</span>
          <MenuIcon className="size-6" />
        </Button>

        <div aria-hidden="true" className="h-6 w-px bg-border lg:hidden" />

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex flex-1 items-center gap-x-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search aria-hidden="true" className="size-5" />
            <span className="hidden sm:block">Search...</span>
            <kbd className="hidden h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
              {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}K
            </kbd>
          </button>
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <Button type="button" variant="ghost" size="icon" className="-m-2.5">
              <span className="sr-only">View notifications</span>
              <Bell aria-hidden="true" className="size-6" />
            </Button>

            <div aria-hidden="true" className="hidden h-6 w-px bg-border lg:block" />

            <DropdownMenu>
              <DropdownMenuTrigger className="-m-1.5 flex items-center p-1.5 outline-none">
                <span className="sr-only">Open user menu</span>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                  <span className="text-[16px] font-bold text-secondary-foreground">{initials}</span>
                </div>
                <span className="hidden lg:flex lg:items-center">
                  <span aria-hidden="true" className="ml-4 text-sm/6 font-semibold text-foreground">
                    {user?.name ? user.name : <Skeleton width={96} height={16} />}
                  </span>
                  <ChevronDown aria-hidden="true" className="ml-2 size-5 text-muted-foreground" />
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {userNavigation.map((item) => (
                  <DropdownMenuItem
                    key={item.name}
                    onClick={() => handleNavigation(item.href, item.name)}
                  >
                    {item.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <ProfileModal open={isProfileModalOpen} setOpen={setIsProfileModalOpen} />
      <CommandPalette open={isCommandPaletteOpen} setOpen={setIsCommandPaletteOpen} />
    </>
  );
}
