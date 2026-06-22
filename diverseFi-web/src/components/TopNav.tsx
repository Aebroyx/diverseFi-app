'use client';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { logout } from '@/store/features/authSlice';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useState } from 'react';
import { ProfileModal } from './modals/ProfileModal';
import toast from 'react-hot-toast';

const userNavigation = [
  { name: 'Your profile', href: '#' },
  { name: 'Sign out', href: '#' },
];

function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      // Call the logout API endpoint to clear HTTP-only cookies
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Important for cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

      // After cookies are cleared, update Redux state
      dispatch(logout());
      // Toast success message
      toast.success('Logged out successfully');
      
      // Redirect to login page
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if the API call fails, we should still clear the local state
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
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-background px-4 shadow-xs sm:gap-x-6 sm:px-6 lg:px-8">
        <button type="button" onClick={onMenuClick} className="-m-2.5 p-2.5 text-foreground lg:hidden">
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon aria-hidden="true" className="size-6" />
        </button>

        {/* Separator */}
        <div aria-hidden="true" className="h-6 w-px bg-foreground lg:hidden" />

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <form action="#" method="GET" className="grid flex-1 grid-cols-1">
            <input
              name="search"
              type="search"
              placeholder="Search"
              aria-label="Search"
              className="col-start-1 row-start-1 block size-full bg-background pl-8 text-base text-foreground outline-none focus:outline-none focus:ring-0 placeholder:text-foreground sm:text-sm/6"
            />
            <MagnifyingGlassIcon
              aria-hidden="true"
              className="pointer-events-none col-start-1 row-start-1 size-5 self-center text-foreground"
            />
          </form>
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <button type="button" className="-m-2.5 p-2.5 text-foreground hover:text-foreground">
              <span className="sr-only">View notifications</span>
              <BellIcon aria-hidden="true" className="size-6" />
            </button>

            {/* Separator */}
            <div aria-hidden="true" className="hidden lg:block lg:h-6 lg:w-px lg:bg-foreground" />

            {/* Profile dropdown */}
            <Menu as="div" className="relative">
              <MenuButton className="-m-1.5 flex items-center p-1.5 focus:outline-none">
                <span className="sr-only">Open user menu</span>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                    <span className="text-[16px] font-bold text-foreground">
                      {user?.name ? `${user.name.charAt(0)}${user.name.split(' ').length > 1 ? user.name.split(' ')[user.name.split(' ').length - 1].charAt(0) : ''}`.toUpperCase() : '?'}
                    </span>
                </div>
                <span className="hidden lg:flex lg:items-center">
                  <span aria-hidden="true" className="ml-4 text-sm/6 font-semibold text-foreground">
                    {user?.name ? (
                      user.name
                    ) : (
                      <Skeleton 
                        width={96} 
                        height={16} 
                        baseColor="#e5e7eb"
                        highlightColor="#d1d5db"
                      />
                    )}
                  </span>
                  <ChevronDownIcon aria-hidden="true" className="ml-2 size-5 text-foreground" />
                </span>
              </MenuButton>
              <MenuItems
                transition
                className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-background py-2 shadow-lg ring-1 ring-primary transition focus:outline-none data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
              >
                {userNavigation.map((item) => (
                  <MenuItem key={item.name}>
                    <button
                      onClick={() => handleNavigation(item.href, item.name)}
                      className="block w-full px-3 py-1 text-left text-sm/6 text-foreground hover:bg-background hover:text-primary focus:outline-none"
                    >
                      {item.name}
                    </button>
                  </MenuItem>
                ))}
              </MenuItems>
            </Menu>
          </div>
        </div>
      </div>
      <ProfileModal
        open={isProfileModalOpen}
        setOpen={setIsProfileModalOpen}
      />
    </>
  );
} 