'use client';

import { Fragment, useState } from "react";
import { Dialog, Transition, DialogTitle } from "@headlessui/react";
import { XMarkIcon, SunIcon, MoonIcon, ArrowRightOnRectangleIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { PrimaryButton, SecondaryButton } from "@/components/ui/buttons";
import { useTheme } from "@/components/ThemeProvider";
import Input from "@/components/ui/Input";
import { useResetPassword } from "@/hooks/useUser";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import toast from "react-hot-toast";
import { validatePassword, PASSWORD_REQUIREMENTS } from "@/lib/utils";

type SettingsModalType = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onLogout: () => void;
};

export const SettingsModal = ({
  open,
  setOpen,
  onLogout,
}: SettingsModalType) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const resetPassword = useResetPassword();
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogout = () => {
    setOpen(false);
    onLogout();
  };

  const handleResetPassword = () => {
    setShowResetPasswordForm(true);
  };

  const handleCancelResetPassword = () => {
    setShowResetPasswordForm(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSubmitResetPassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    // Enhanced password validation
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.errors.join('. '));
      return;
    }

    if (!user?.id) {
      toast.error("User not found");
      return;
    }

    try {
      await resetPassword.mutateAsync({
        id: user.id,
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      // Reset form after successful submission
      handleCancelResetPassword();
    } catch (error) {
      console.error("Reset password failed:", error);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-card-bg px-6 pb-6 pt-6 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Settings
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-1.5 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-hover-bg dark:hover:text-gray-300 transition-colors"
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Appearance Section */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        Appearance
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Customize the look and feel of your application
                      </p>
                    </div>
                    
                    <div className="rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-background p-4">
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between p-4 bg-white dark:bg-card-bg rounded-lg border border-gray-200 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-hover-bg transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                            theme === 'light'
                              ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-500'
                              : 'bg-gray-100 dark:bg-background text-gray-400'
                          }`}>
                            <SunIcon className="w-5 h-5" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium transition-colors ${
                              theme === 'light'
                                ? 'text-gray-900 dark:text-gray-100'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              Light
                            </span>
                            <span className="text-gray-400 dark:text-gray-500">/</span>
                            <span className={`text-sm font-medium transition-colors ${
                              theme === 'dark'
                                ? 'text-gray-900 dark:text-gray-100'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              Dark
                            </span>
                          </div>
                        </div>
                        <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                          theme === 'dark'
                            ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-500'
                            : 'bg-gray-100 dark:bg-background text-gray-400'
                        }`}>
                          <MoonIcon className="w-5 h-5" />
                        </div>
                      </button>
                      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                        {theme === 'dark'
                          ? 'Click to switch to light mode'
                          : 'Click to switch to dark mode'}
                      </p>
                    </div>
                  </div>

                  {/* Account Section */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        Account
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage your account settings and preferences
                      </p>
                    </div>

                    {/* Reset Password Section */}
                    <div className="rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-background p-4">
                      {!showResetPasswordForm ? (
                        <>
                          <SecondaryButton
                            type="button"
                            onClick={handleResetPassword}
                            fullWidth
                            variant="default"
                            className="justify-center"
                          >
                            <LockClosedIcon className="w-5 h-5" />
                            <span>Reset Password</span>
                          </SecondaryButton>
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                            Reset your password
                          </p>
                        </>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                              Reset Password
                            </h5>
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
                          </div>
                          <div className="flex gap-3 pt-2">
                            <SecondaryButton
                              type="button"
                              onClick={handleCancelResetPassword}
                              variant="default"
                              className="flex-1 justify-center"
                            >
                              Cancel
                            </SecondaryButton>
                            <PrimaryButton
                              type="button"
                              onClick={handleSubmitResetPassword}
                              className="flex-1 justify-center"
                              disabled={resetPassword.isPending}
                            >
                              {resetPassword.isPending ? 'Updating...' : 'Update Password'}
                            </PrimaryButton>
                          </div>
                        </div>
                      )}
                    </div>

                    
                    
                    {/* Logout Button */}
                    <div className="rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-background p-4">
                      <SecondaryButton
                        type="button"
                        onClick={handleLogout}
                        fullWidth
                        variant="danger"
                        className="justify-center"
                      >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        <span>Logout</span>
                      </SecondaryButton>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                        Sign out of your account
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-border-dark">
                  <PrimaryButton
                    type="button"
                    onClick={() => setOpen(false)}
                    fullWidth
                  >
                    Close
                  </PrimaryButton>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
