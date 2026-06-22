'use client';

import { Button } from '@/components/ui/button';

export interface StepConfig {
  step: number;
  label: string;
}

/**
 * Renders step indicator — full horizontal stepper on desktop,
 * compact "Step X of Y" with progress bar on mobile.
 */
function StepIndicator({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: StepConfig[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}) {
  const currentLabel = steps.find((s) => s.step === currentStep)?.label || '';

  return (
    <div className="mb-8">
      {/* ── Mobile: compact Step X of Y + progress bar ── */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">{currentLabel}</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Desktop: full horizontal dot stepper ── */}
      <div className="hidden md:flex items-center justify-between max-w-xl mx-auto">
        {steps.map((item, index) => (
          <div key={item.step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => onStepClick?.(item.step)}
                disabled={!onStepClick}
                className={`size-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-all ${
                  onStepClick ? 'cursor-pointer' : 'cursor-default'
                } ${
                  currentStep === item.step
                    ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 scale-105'
                    : currentStep > item.step
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-muted-foreground/30 bg-muted/20 text-muted-foreground'
                }`}
              >
                {currentStep > item.step ? '✓' : item.step}
              </button>
              <span
                className={`text-xs mt-2 font-medium whitespace-nowrap ${
                  currentStep === item.step
                    ? 'text-primary'
                    : currentStep > item.step
                      ? 'text-emerald-500'
                      : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-[2px] flex-1 mx-4 -mt-6 transition-all ${
                  currentStep > item.step ? 'bg-emerald-500' : 'bg-muted-foreground/20'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Navigation bar with Cancel / Previous / Next|Submit buttons.
 */
interface StepActionsProps {
  onCancel: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  currentStep: number;
  totalSteps: number;
  isPending?: boolean;
  submitLabel?: string;
  loadingLabel?: string;
}

function StepActions({
  onCancel,
  onPrevious,
  onNext,
  currentStep,
  totalSteps,
  isPending = false,
  submitLabel = 'Save',
  loadingLabel = 'Saving...',
}: StepActionsProps) {
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex items-center rounded-lg justify-between space-x-4 pt-8 border-t bg-card px-6 py-6">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isPending}
        className="cursor-pointer"
      >
        Cancel
      </Button>
      <div className="flex gap-2">
        {currentStep > 1 && onPrevious && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isPending}
            className="cursor-pointer"
          >
            Previous
          </Button>
        )}

        {isLastStep ? (
          <Button
            type="submit"
            disabled={isPending}
            className="min-w-[120px] cursor-pointer"
          >
            {isPending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {loadingLabel}
              </div>
            ) : (
              submitLabel
            )}
          </Button>
        ) : (
          onNext && (
            <Button
              type="button"
              onClick={onNext}
              disabled={isPending}
              className="min-w-[100px] cursor-pointer"
            >
              Next
            </Button>
          )
        )}
      </div>
    </div>
  );
}

export { StepIndicator, StepActions };
