'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { PrimaryButton } from '@/components/ui/buttons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';

type ProfileModalType = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSubmit?: (type?: string) => void;
};

export const ProfileModal = ({ open, setOpen }: ProfileModalType) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const initials = user?.name
    ? `${user.name.charAt(0)}${user.name.split(' ').length > 1 ? user.name.split(' ')[user.name.split(' ').length - 1].charAt(0) : ''}`.toUpperCase()
    : '?';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
          <span className="text-[32px] font-bold text-secondary-foreground">{initials}</span>
        </div>
        <div className="mt-3 space-y-4 text-center sm:mt-5">
          <div className="flex justify-between gap-4">
            <div className="flex flex-1 flex-col items-center">
              <span className="mb-1 text-sm text-muted-foreground">Name</span>
              <p className="w-full text-lg font-bold text-foreground">{user?.name}</p>
            </div>
            <div className="flex flex-1 flex-col items-center">
              <span className="mb-1 text-sm text-muted-foreground">Email</span>
              <p className="w-full text-lg font-bold text-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="mb-1 text-sm text-muted-foreground">Role</span>
            <p className="w-full text-lg font-bold capitalize text-foreground">
              {user?.role?.display_name || user?.role?.name}
            </p>
          </div>
        </div>
        <PrimaryButton type="button" onClick={() => setOpen(false)} fullWidth>
          Close
        </PrimaryButton>
      </DialogContent>
    </Dialog>
  );
};
