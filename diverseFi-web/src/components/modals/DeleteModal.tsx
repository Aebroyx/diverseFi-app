'use client';

import { TriangleAlert } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/shadcn/alert-dialog';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

export default function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete User',
  description = 'Are you sure you want to delete this user? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
}: DeleteModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <TriangleAlert className="size-5" />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <SecondaryButton type="button" onClick={onClose} className="w-full sm:w-auto">
            {cancelText}
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={onConfirm}
            variant="danger"
            className="w-full sm:w-auto"
          >
            {confirmText}
          </PrimaryButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
