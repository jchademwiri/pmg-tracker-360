'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface RecordNotFoundStateProps {
  className?: string;
  title?: string;
  description?: string;
  backLink: string;
  backLinkLabel: string;
}

export function RecordNotFoundState({
  className = '',
  title = 'Record Not Found',
  description = "The record you are looking for does not exist, has been deleted, or belongs to a different organization.",
  backLink,
  backLinkLabel,
}: RecordNotFoundStateProps) {
  return (
    <div className={`w-full max-w-lg mx-auto py-12 px-4 ${className}`}>
      <Card className="border-dashed border-2 border-muted-foreground/25 bg-muted/10">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <FileQuestion className="size-8 text-muted-foreground" />
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2">
            {title}
          </h2>

          <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
            {description}
          </p>

          <Button asChild className="w-full sm:w-auto cursor-pointer px-6">
            <Link href={backLink}>
              <ArrowLeft className="size-4 mr-2" />
              {backLinkLabel}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
