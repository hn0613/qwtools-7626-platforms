'use client';

import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Smile } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerSearch,
  EmojiPickerFooter
} from '@/components/ui/emoji-picker';
import { createSubdomainAction, type CreateState } from '@/app/actions';
import { rootDomain } from '@/lib/utils';

function SubdomainInput({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="subdomain">Subdomain</Label>
      <div className="flex items-center">
        <div className="relative flex-1">
          <Input
            id="subdomain"
            name="subdomain"
            placeholder="your-subdomain"
            value={value}
            onChange={(e) => onChange(e.target.value.toLowerCase())}
            className="w-full rounded-r-none focus:z-10"
            required
          />
        </div>
        <span className="bg-gray-100 px-3 border border-l-0 border-input rounded-r-md text-gray-500 min-h-[36px] flex items-center">
          .{rootDomain}
        </span>
      </div>
    </div>
  );
}

function IconPicker({
  icon,
  setIcon
}: {
  icon: string;
  setIcon: (icon: string) => void;
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleEmojiSelect = ({ emoji }: { emoji: string }) => {
    setIcon(emoji);
    setIsPickerOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="icon">Icon</Label>
      <div className="flex flex-col gap-2">
        <input type="hidden" name="icon" value={icon} />
        <div className="flex items-center gap-2">
          <Card className="flex-1 flex flex-row items-center justify-between p-2 border border-input rounded-md">
            <div className="min-w-[40px] min-h-[40px] flex items-center pl-[14px] select-none">
              {icon ? (
                <span className="text-3xl">{icon}</span>
              ) : (
                <span className="text-gray-400 text-sm font-normal">
                  No icon selected
                </span>
              )}
            </div>
            <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-auto rounded-sm"
                  onClick={() => setIsPickerOpen(!isPickerOpen)}
                >
                  <Smile className="h-4 w-4 mr-2" />
                  Select Emoji
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0 w-[256px]"
                align="end"
                sideOffset={5}
              >
                <EmojiPicker
                  className="h-[300px] w-[256px]"
                  onEmojiSelect={handleEmojiSelect}
                >
                  <EmojiPickerSearch />
                  <EmojiPickerContent />
                  <EmojiPickerFooter />
                </EmojiPicker>
              </PopoverContent>
            </Popover>
          </Card>
        </div>
        <p className="text-xs text-gray-500">
          Select an emoji to represent your subdomain
        </p>
      </div>
    </div>
  );
}

export function SubdomainForm() {
  const [icon, setIcon] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [errorDismissed, setErrorDismissed] = useState(false);

  const [state, action, isPending] = useActionState<CreateState, FormData>(
    createSubdomainAction,
    {}
  );

  // Restore form values from server action response after failed submission
  useEffect(() => {
    if (state?.error) {
      if (state.subdomain !== undefined) setSubdomain(state.subdomain);
      if (state.icon) setIcon(state.icon);
    }
    setErrorDismissed(false);
  }, [state]);

  const handleSubdomainChange = (value: string) => {
    setSubdomain(value);
    setErrorDismissed(true);
  };

  const handleIconChange = (value: string) => {
    setIcon(value);
    setErrorDismissed(true);
  };

  return (
    <form action={action} className="space-y-4">
      <SubdomainInput value={subdomain} onChange={handleSubdomainChange} />

      <IconPicker icon={icon} setIcon={handleIconChange} />

      {state?.error && !errorDismissed && (
        <div className="text-sm text-red-500">{state.error}</div>
      )}

      <Button type="submit" className="w-full" disabled={isPending || !icon}>
        {isPending ? 'Creating...' : 'Create Subdomain'}
      </Button>
    </form>
  );
}
