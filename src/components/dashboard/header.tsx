import { Flame } from 'lucide-react';

const Header = () => {
  return (
    <header className="flex items-center justify-between p-4 bg-card border-b shadow-sm">
      <div className="flex items-center gap-2">
        <Flame className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          ERCS EOC Dashboard
        </h1>
      </div>
    </header>
  );
};

export default Header;
