'use client';

import { useEffect, useState } from 'react';

interface AccessibilityAnnouncerProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number;
}

/**
 * Component for announcing dynamic content changes to screen readers
 * Uses aria-live regions to communicate updates
 */
export function AccessibilityAnnouncer({
  message,
  priority = 'polite',
  clearAfter = 3000,
}: AccessibilityAnnouncerProps) {
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);

      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          setCurrentMessage('');
        }, clearAfter);

        return () => clearTimeout(timer);
      }
    }
  }, [message, clearAfter]);

  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {currentMessage}
    </div>
  );
}

/**
 * Hook for creating accessibility announcements
 */
export function useAccessibilityAnnouncer() {
  const [announcement, setAnnouncement] = useState<{
    message: string;
    priority: 'polite' | 'assertive';
    id: number;
  } | null>(null);

  const announce = (
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    setAnnouncement({
      message,
      priority,
      id: Date.now(), // Use timestamp as unique ID
    });
  };

  const AnnouncerComponent = () =>
    announcement ? (
      <AccessibilityAnnouncer
        key={announcement.id}
        message={announcement.message}
        priority={announcement.priority}
      />
    ) : null;

  return {
    announce,
    AnnouncerComponent,
  };
}
