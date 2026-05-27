'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HomeIcon, ArrowLeftIcon, SearchIcon } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4">
      {/* Main Card */}
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-white/10 shadow-2xl">
        <CardContent className="pt-12 pb-10 px-6">
          <div className="text-center space-y-8">
            {/* 404 Visual Element */}
            <div className="relative flex items-center justify-center font-bold text-muted-foreground/20 select-none leading-none">
              <span className="text-[8rem]">4</span>
              <div className="relative mx-2">
                <SearchIcon
                  className="h-24 w-24 text-muted-foreground opacity-50"
                  strokeWidth={1.5}
                />
              </div>
              <span className="text-[8rem]">4</span>
            </div>

            {/* Error Message */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-foreground">
                Page Not Found
              </h1>
              <p className="text-muted-foreground text-sm max-w-[85%] mx-auto leading-relaxed">
                The page you&#x27;re looking for doesn&#x27;t exist or has been
                moved to a different location.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
              <Button
                asChild
                className="bg-[oklch(0.646_0.222_41.116)] hover:bg-[oklch(0.646_0.222_41.116)]/90 text-white w-[140px] h-10 px-4"
              >
                <Link href="/">
                  <HomeIcon className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-[140px] h-10 px-4 border-white/10 hover:bg-white/5 hover:text-foreground"
                onClick={() => window.history.back()}
              >
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>

            {/* Additional Help */}
            <div className="pt-6 border-t border-white/5">
              <p className="text-xs text-muted-foreground/60">
                Need help? Try checking the URL or{' '}
                <Link
                  href="/contact"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  contact support
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-[10px] text-muted-foreground/40 font-mono tracking-wider uppercase">
          Error Code: 404 • Page Not Found
        </p>
      </div>
    </div>
  );
}
