'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { cn } from '@/lib/utils';

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn('rounded-full', className)}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-muted-foreground" />
      )}
    </Button>
  );
}
