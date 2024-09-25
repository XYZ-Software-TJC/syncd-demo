import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

interface EnumOption {
  title: string;
  description: string;
}

export function SearchSingleSelectDropdown({
  data,
  defaultValue,
  field,
}: {
  data: EnumOption[] | undefined;
  field: ControllerRenderProps<FieldValues, string>;
  defaultValue: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<EnumOption | null>(
    defaultValue ? { title: defaultValue, description: defaultValue } : null,
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select option"
          className="w-full justify-between bg-white dark:bg-secondary dark:hover:bg-slate-700"
        >
          {selectedOption ? selectedOption.title : "Select an option"}
          <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0" align="start">
        <Command>
          <CommandList>
            <CommandInput placeholder="Search options..." />
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {data?.map((option) => (
                <CommandItem
                  label={option.title}
                  value={option.title}
                  key={option.title}
                  onSelect={() => {
                    setSelectedOption(option);
                    field.onChange([option.title]);
                    setOpen(false);
                  }}
                  className="text-sm"
                >
                  {option.title}
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedOption?.title === option.title
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
