'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallback?: React.ReactNode;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  fallback,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  objectFit = 'cover',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      fallback || (
        <div
          className={cn(
            'flex items-center justify-center bg-muted rounded',
            className
          )}
        >
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      )
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        sizes={sizes}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          fill && `object-${objectFit}`
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

// Avatar-specific optimized image
interface OptimizedAvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: React.ReactNode;
  className?: string;
}

export function OptimizedAvatar({
  src,
  alt,
  size = 'md',
  fallback,
  className,
}: OptimizedAvatarProps) {
  const sizeMap = {
    sm: { width: 32, height: 32, className: 'h-8 w-8' },
    md: { width: 40, height: 40, className: 'h-10 w-10' },
    lg: { width: 64, height: 64, className: 'h-16 w-16' },
    xl: { width: 96, height: 96, className: 'h-24 w-24' },
  };

  const sizeConfig = sizeMap[size];

  if (!src) {
    return (
      fallback || (
        <div
          className={cn(
            'flex items-center justify-center bg-muted rounded-full',
            sizeConfig.className,
            className
          )}
        >
          <ImageIcon className="h-1/2 w-1/2 text-muted-foreground" />
        </div>
      )
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={sizeConfig.width}
      height={sizeConfig.height}
      className={cn('rounded-full', sizeConfig.className, className)}
      objectFit="cover"
      quality={85}
      fallback={fallback}
    />
  );
}
