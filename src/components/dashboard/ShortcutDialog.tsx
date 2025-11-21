'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useShortcutStore } from '@/lib/stores/shortcutStore';

const shortcuts = [
  { keys: 'Shift + N', action: 'Add new trade' },
  { keys: 'Shift + A', action: 'Open analytics' },
  { keys: 'Shift + D', action: 'Go to dashboard' },
  { keys: 'Shift + F', action: 'Toggle trade filters' },
  { keys: 'Shift + S', action: 'Focus trade search' },
  { keys: 'Shift + /', action: 'Open shortcuts help' },
];

export function ShortcutDialog() {
  const { isOpen, close } = useShortcutStore();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? close() : null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with these global commands.
          </DialogDescription>
        </DialogHeader>
        <div className="divide-y divide-border px-4 sm:px-6 py-3 sm:py-4">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.keys} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 py-2.5 sm:py-3">
              <span className="text-xs sm:text-sm text-muted-foreground">{shortcut.action}</span>
              <span className="font-mono text-xs sm:text-sm bg-muted px-2 py-1 rounded self-start sm:self-auto">
                {shortcut.keys}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

