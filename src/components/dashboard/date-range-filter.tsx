'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

export type DateFilterPreset = 'last7' | 'last30' | 'thisMonth' | 'allTime';

interface DateRangeFilterProps {
  onDateRangeChange: (startDate: Date | null, endDate: Date | null, preset?: DateFilterPreset) => void;
  className?: string;
}

export function DateRangeFilter({ onDateRangeChange, className }: DateRangeFilterProps) {
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

  const handleClearFilter = () => {
    setDateRange(undefined);
    setActivePreset('allTime');
    onDateRangeChange(null, null, 'allTime');
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activePreset === 'last7' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick('last7')}
        >
          Last 7 days
        </Button>
        <Button
          variant={activePreset === 'last30' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick('last30')}
        >
          Last 30 days
        </Button>
        <Button
          variant={activePreset === 'thisMonth' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick('thisMonth')}
        >
          This Month
        </Button>
        <Button
          variant={activePreset === 'allTime' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick('allTime')}
        >
          All Time
        </Button>
      </div>

      {/* Date Range Picker */}
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-left font-normal',
                !dateRange && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
                  </>
                ) : (
                  format(dateRange.from, 'MMM d, yyyy')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
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

        {dateRange && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilter}
            className="h-9"
          >
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filter Badge */}
      {dateRange && dateRange.from && dateRange.to && (
        <Badge variant="secondary" className="text-xs">
          Showing incidents from {format(dateRange.from, 'MMM d')} to {format(dateRange.to, 'MMM d, yyyy')}
        </Badge>
      )}
      {dateRange && dateRange.from && !dateRange.to && (
        <Badge variant="secondary" className="text-xs">
          Select an end date to apply filter
        </Badge>
      )}
      {!dateRange && activePreset === 'allTime' && (
        <Badge variant="secondary" className="text-xs">
          Showing all incidents
        </Badge>
      )}
    </div>
  );
}
