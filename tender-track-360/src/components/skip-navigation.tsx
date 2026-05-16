'use client';

import { useSkipNavigation } from '@/hooks/use-focus-management';
import { Button } from '@/components/ui/button';

interface SkipNavigationProps {
  sections?: Array<{
    id: string;
    label: string;
  }>;
}

export function SkipNavigation({ sections = [] }: SkipNavigationProps) {
  const { skipToContent, skipToSection } = useSkipNavigation();

  return (
    <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-4 focus-within:left-4 focus-within:z-50">
      <nav aria-label="Skip navigation links" className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={skipToContent}
          className="bg-background border-2 border-primary"
          onFocus={(e) => e.currentTarget.classList.remove('sr-only')}
          onBlur={(e) => e.currentTarget.classList.add('sr-only')}
        >
          Skip to main content
        </Button>

        {sections.map((section) => (
          <Button
            key={section.id}
            variant="outline"
            size="sm"
            onClick={() => skipToSection(section.id)}
            className="bg-background border-2 border-primary"
            onFocus={(e) => e.currentTarget.classList.remove('sr-only')}
            onBlur={(e) => e.currentTarget.classList.add('sr-only')}
          >
            Skip to {section.label}
          </Button>
        ))}
      </nav>
    </div>
  );
}
