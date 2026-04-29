import { Badge } from '@pmg/ui/components/ui/badge';

export function BetaLabel() {
  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 pt-2 pointer-events-none">
      <Badge className="bg-blue-600/90 hover:bg-blue-600 text-white shadow-lg backdrop-blur-sm pointer-events-auto cursor-default">
        Free during Beta
      </Badge>
    </div>
  );
}
