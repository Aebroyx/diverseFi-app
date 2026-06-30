'use client';

import { useState } from 'react';
import { LogOut, Lock, Moon, Sun } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { useTheme } from '@/components/ThemeProvider';
import Input from '@/components/ui/Input';
import { useResetPassword } from '@/hooks/useUser';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import toast from 'react-hot-toast';
import { validatePassword, PASSWORD_REQUIREMENTS } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { cn } from '@/lib/utils';

type SettingsModalType = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onLogout: () => void;
};

export const SettingsModal = ({ open, setOpen, onLogout }: SettingsModalType) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const activeTheme = theme === 'system' ? resolvedTheme : theme;
  const isDark = activeTheme === 'dark';
  const { user } = useSelector((state: RootState) => state.auth);
  const resetPassword = useResetPassword();
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogout = () => {
    setOpen(false);
    onLogout();
  };

  const handleResetPassword = () => {
    setShowResetPasswordForm(true);
  };

  const handleCancelResetPassword = () => {
    setShowResetPasswordForm(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSubmitResetPassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.errors.join('. '));
      return;
    }

    if (!user?.id) {
      toast.error('User not found');
      return;
    }

    try {
      await resetPassword.mutateAsync({
        id: user.id,
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      handleCancelResetPassword();
    } catch (error) {
      console.error('Reset password failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          <div className="space-y-4">
            <div>
              <h4 className="mb-1 text-lg font-semibold text-foreground">Appearance</h4>
              <p className="text-sm text-muted-foreground">
                Customize the look and feel of your application
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <button
                type="button"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="group flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                      !isDark
                        ? 'bg-orange-500/15 text-orange-500'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Sun className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className={cn(!isDark ? 'text-foreground' : 'text-muted-foreground')}>
                      Light
                    </span>
                    <span className="text-muted-foreground">/</span>
                    <span className={cn(isDark ? 'text-foreground' : 'text-muted-foreground')}>
                      Dark
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                    isDark ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Moon className="h-5 w-5" />
                </div>
              </button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {isDark ? 'Click to switch to light mode' : 'Click to switch to dark mode'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="mb-1 text-lg font-semibold text-foreground">Account</h4>
              <p className="text-sm text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              {!showResetPasswordForm ? (
                <>
                  <SecondaryButton
                    type="button"
                    onClick={handleResetPassword}
                    fullWidth
                    className="justify-center"
                  >
                    <Lock className="h-5 w-5" />
                    <span>Reset Password</span>
                  </SecondaryButton>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Reset your password
                  </p>
                </>
              ) : (
                <div className="space-y-4">
                  <h5 className="text-sm font-semibold text-foreground">Reset Password</h5>
                  <div className="space-y-4">
                    <Input
                      id="current-password"
                      type="password"
                      label="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="Enter your current password"
                    />
                    <Input
                      id="new-password"
                      type="password"
                      label="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Enter your new password"
                      helperText={PASSWORD_REQUIREMENTS}
                    />
                    <Input
                      id="confirm-password"
                      type="password"
                      label="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirm your new password"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <SecondaryButton
                      type="button"
                      onClick={handleCancelResetPassword}
                      className="flex-1 justify-center"
                    >
                      Cancel
                    </SecondaryButton>
                    <PrimaryButton
                      type="button"
                      onClick={handleSubmitResetPassword}
                      className="flex-1 justify-center"
                      loading={resetPassword.isPending}
                    >
                      {resetPassword.isPending ? 'Updating...' : 'Update Password'}
                    </PrimaryButton>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <SecondaryButton
                type="button"
                onClick={handleLogout}
                fullWidth
                variant="danger"
                className="justify-center"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </SecondaryButton>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Sign out of your account
              </p>
            </div>
          </div>
        </div>

        <PrimaryButton type="button" onClick={() => setOpen(false)} fullWidth>
          Close
        </PrimaryButton>
      </DialogContent>
    </Dialog>
  );
};
