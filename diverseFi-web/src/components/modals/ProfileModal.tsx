import { Fragment } from "react";
import { Dialog, Transition, DialogTitle } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

type ProfileModalType = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSubmit?: (type?: string) => void;
};

export const ProfileModal = ({
  open,
  setOpen,
}: ProfileModalType) => {
    const { user } = useSelector((state: RootState) => state.auth);
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setOpen(true)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                        <DialogTitle as="h3" className="text-base font-semibold text-gray-900">
                            Profile
                        </DialogTitle>
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
                        <span className="text-[32px] font-bold text-foreground">
                        {user?.name ? `${user.name.charAt(0)}${user.name.split(' ').length > 1 ? user.name.split(' ')[user.name.split(' ').length - 1].charAt(0) : ''}`.toUpperCase() : '?'}
                        </span>
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                        <div className="mt-2 space-y-4">
                        <div className="flex justify-between gap-4">
                            <div className="flex flex-col items-center flex-1">
                            <label htmlFor="name" className="text-sm text-gray-600 mb-1">Name</label>
                            <h1 id="name" className="w-full text-lg font-bold">{user?.name}</h1>
                            </div>
                            <div className="flex flex-col items-center flex-1">
                            <label htmlFor="email" className="text-sm text-gray-600 mb-1">Email</label>
                            <h1 id="email" className="w-full text-lg font-bold">{user?.email}</h1>
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <label htmlFor="role" className="text-sm text-gray-600 mb-1">Role</label>
                            <h1 id="role" className="w-full text-lg font-bold capitalize">{user?.role}</h1>
                        </div>
                        </div>
                    </div>
                    </div>
                    <div className="mt-5 sm:mt-6">
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                        Close
                    </button>
                    </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

 