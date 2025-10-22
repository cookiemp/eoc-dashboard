'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

export type DateFilterPreset = 'last7' | 'last30' | 'thisMonth' | 'allTime';

interface DateRangeFilterCompactProps {
  onDateRangeChange: (startDate: Date | null, endDate: Date | null, preset?: DateFilterPreset) => void;
  className?: string;
}

export function DateRangeFilterCompact({ onDateRangeChange, className }: DateRangeFilterCompactProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    // Default to last 30 days
    const end = new Date();
    const start = subDays(end, 30);
    return { from: start, to: end };
  });
  const [activePreset, setActivePreset] = useState<DateFilterPreset>('last30');

  const handlePresetClick = (preset: DateFilterPreset) => {
    const today = new Date();
    let newRange: DateRange | undefined;

    switch (preset) {
      case 'last7':
        newRange = { from: subDays(today, 7), to: today };
        break;
      case 'last30':
        newRange = { from: subDays(today, 30), to: today };
        break;
      case 'thisMonth':
        newRange = { from: startOfMonth(today), to: endOfMonth(today) };
        break;
      case 'allTime':
        newRange = undefined;
        break;
    }

    setDateRange(newRange);
    setActivePreset(preset);
    onDateRangeChange(newRange?.from || null, newRange?.to || null, preset);
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    // Only apply filter when both dates are selected
    if (range?.from && range?.to) {
      setActivePreset('last30'); // Reset preset when manually selecting dates
      onDateRangeChange(range.from, range.to);
    } else if (!range) {
      // If range is cleared, reset to all time
      setActivePreset('allTime');
      onDateRangeChange(null, null, 'allTime');
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Quick Filter Buttons - Compact */}
      <div className="flex gap-1">
        <Button
          variant={activePreset === 'last7' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick('last7')}
          className="h-8 text-xs"
        >
          7d
        </Button>
        <Button
          variant={activePreset === 'last30' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick('last30')}
          className="h-8 text-xs"
        >
          30d
        </Button>
        <Button
          variant={activePreset === 'thisMonth' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick('thisMonth')}
          className="h-8 text-xs"
        >
          Month
        </Button>
        <Button
          variant={activePreset === 'allTime' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick('allTime')}
          className="h-8 text-xs"
        >
          All
        </Button>
      </div>

      {/* Date Range Picker - Compact */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-8 text-xs justify-start text-left font-normal',
              !dateRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-3 w-3" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                </>
              ) : (
                format(dateRange.from, 'MMM d')
              )
            ) : (
              <span>Pick dates</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            disabled={(date) => date > new Date()} // Disable future dates
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
