import { Flame, RotateCw, Clock, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface HeaderProps {
  onRefresh: () => void;
  lastUpdated: Date | null;
  isLoading: boolean;
}

const Header = ({ onRefresh, lastUpdated, isLoading }: HeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeAgo = (date: Date | null): string => {
    if (!date) return 'never';
    const seconds = Math.floor((currentTime.getTime() - date.getTime()) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  const getNextRefreshCountdown = (): string => {
    if (!lastUpdated) return 'Next refresh: on first load';
    const nextRefresh = new Date(lastUpdated.getTime() + 30 * 60 * 1000); // 30 minutes from last update
    const timeUntilRefresh = Math.max(0, Math.floor((nextRefresh.getTime() - currentTime.getTime()) / 1000));
    
    if (timeUntilRefresh === 0) return 'Refreshing...';
    
    const minutes = Math.floor(timeUntilRefresh / 60);
    const seconds = timeUntilRefresh % 60;
    return `Next refresh: ${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <header className="flex items-center justify-between p-4 bg-card border-b shadow-sm">
      <div className="flex items-center gap-2">
        <Flame className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          ERCS Intel Dashboard
        </h1>
      </div>
      <nav className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <Link href="/archive">
            <Button variant="outline" size="sm" className="h-8">
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onRefresh} 
            disabled={isLoading}
            aria-label="Refresh data"
            className="h-8 w-8"
          >
            <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground flex flex-col items-end">
          <div>Last updated: {formatTimeAgo(lastUpdated)}</div>
          <div className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            {getNextRefreshCountdown()}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
