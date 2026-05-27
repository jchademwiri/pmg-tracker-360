'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook for managing focus in modal dialogs and interactive components
 * Provides focus trapping and restoration for better accessibility
 */
export function useFocusManagement(isOpen: boolean) {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus the container or first focusable element
      const container = containerRef.current;
      if (container) {
        const firstFocusable = container.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;

        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          container.focus();
        }
      }
    } else {
      // Restore focus to the previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Handle keyboard navigation within the container
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift + Tab: move to previous element
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: move to next element
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      // Let the parent component handle the escape key
      return false;
    }
  };

  return {
    containerRef,
    handleKeyDown,
  };
}

/**
 * Hook for managing focus on form elements with validation errors
 */
export function useFormFocusManagement() {
  const focusFirstError = (errors: Record<string, unknown>) => {
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const element = document.querySelector(
        `[name="${firstErrorField}"], #${firstErrorField}`
      ) as HTMLElement;

      if (element) {
        element.focus();
        // Scroll into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const announceError = (message: string) => {
    // Create a temporary element to announce the error to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return {
    focusFirstError,
    announceError,
  };
}

/**
 * Hook for managing skip links and keyboard navigation
 */
export function useSkipNavigation() {
  const skipToContent = () => {
    const mainContent = document.querySelector(
      'main, [role="main"]'
    ) as HTMLElement;
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const skipToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId) as HTMLElement;
    if (section) {
      section.focus();
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return {
    skipToContent,
    skipToSection,
  };
}
