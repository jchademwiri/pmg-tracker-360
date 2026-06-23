'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';

interface PermissionDeniedStateProps {
  className?: string;
  title?: string;
  description?: string;
}

export function PermissionDeniedState({
  className = '',
  title = 'Permission Denied',
  description = "You do not have the required permissions to view this section. If you believe this is an error, please contact your organization administrator to update your role permissions.",
}: PermissionDeniedStateProps) {
  return (
    <div className={`w-full max-w-lg mx-auto py-12 px-4 ${className}`}>
      <Card className="border-dashed border-2 border-red-500/20 bg-red-500/5">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div className="size-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mb-6">
            <ShieldAlert className="size-8 text-red-600 dark:text-red-400" />
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2">
            {title}
          </h2>

          <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
            {description}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex-1 cursor-pointer"
            >
              <ArrowLeft className="size-4 mr-2" />
              Go Back
            </Button>
            <Button asChild className="flex-1 cursor-pointer">
              <Link href="/dashboard">
                <Home className="size-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
