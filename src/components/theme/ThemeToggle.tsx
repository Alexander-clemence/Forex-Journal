'use client';

import { useMemo, memo, useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useAuth } from '@/lib/hooks/useAuth';
import { SettingsService } from '@/lib/services/settingsService';
import { toast } from 'sonner';

const THEMES = [
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
  { value: 'system' as const, label: 'System', icon: Monitor }
] as const;
type ThemeChoice = (typeof THEMES)[number]['value'];

const ThemeMenuItem = memo(({ 
  value, 
  label, 
  icon: Icon, 
  isActive, 
  onClick 
}: { 
  value: string;
  label: string;
  icon: any;
  isActive: boolean;
  onClick: () => void;
}) => (
  <DropdownMenuItem
    onClick={onClick}
    className="flex items-center justify-between"
  >
    <div className="flex items-center space-x-2">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
    {isActive && <Check className="h-4 w-4" />}
  </DropdownMenuItem>
));

ThemeMenuItem.displayName = 'ThemeMenuItem';

export const ThemeToggle = memo(function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const handleThemeChange = useCallback(
    async (value: ThemeChoice) => {
      if (isSaving) return;
      
      // Update theme immediately for instant feedback
      setTheme(value);

      // If user is logged in, save to database
      if (user?.id) {
        setIsSaving(true);
        try {
          // Update only the theme field in the database
          await SettingsService.updateTheme(user.id, value);
        } catch (err) {
          console.error('Failed to update theme preference', err);
          toast.error('Could not update theme preference. Please try again.');
        } finally {
          setIsSaving(false);
        }
      }
      // If no user, theme is still saved to localStorage by ThemeProvider
    },
    [isSaving, setTheme, user?.id]
  );

  const CurrentIcon = useMemo(() => {
    const currentTheme = THEMES.find(t => t.value === theme);
    return currentTheme?.icon || Monitor;
  }, [theme]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-9 px-0">
          <CurrentIcon className="h-[1.2rem] w-[1.2rem] transition-all" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEMES.map(({ value, label, icon }) => (
          <ThemeMenuItem
            key={value}
            value={value}
            label={label}
            icon={icon}
            isActive={theme === value}
            onClick={() => handleThemeChange(value)}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});