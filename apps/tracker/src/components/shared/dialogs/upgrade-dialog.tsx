'use client';

import { useRouter } from 'next/navigation';
import {
  Crown,
  ArrowLeft,
  Zap,
  Check,
  Star,
  Users,
  Shield,
  Clock,
  Building2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@pmg/ui/components/ui/dialog';
import { Button } from '@pmg/ui/components/ui/button';
import { Badge } from '@pmg/ui/components/ui/badge';
import { Separator } from '@pmg/ui/components/ui/separator';
import { formatCurrency } from '@/lib/format';

// Enhanced TypeScript interfaces
interface PricingTier {
  name: string;
  price: number | string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  enterprise?: boolean;
}

interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
}

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCount: number;
  maxCount: number;
  userName?: string;
  organizationName?: string;
  usageContext?: 'organizations' | 'tenders' | 'members' | 'storage';
}

export function UpgradeDialog({
  open,
  onOpenChange,
  currentCount,
  maxCount,
  usageContext = 'organizations',
}: UpgradeDialogProps) {
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isContactingSales, setIsContactingSales] = useState(false);
  const [showTestimonials, setShowTestimonials] = useState(false);

  // Animation state for staggered animations
  const [animateItems, setAnimateItems] = useState(false);

  useEffect(() => {
    if (open) {
      // Trigger animations after a short delay
      const timer = setTimeout(() => setAnimateItems(true), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimateItems(false);
    }
  }, [open]);

  const pricingTiers: PricingTier[] = [
    {
      name: 'Free',
      price: 0,
      period: '/month',
      description: 'Perfect for getting started',
      features: [
        '1 organization',
        'Basic tender management',
        '0 Active Projects',
        'Community support',
      ],
    },
    {
      name: 'Starter',
      price: 249,
      period: '/month',
      description: 'For freelancers & consultants',
      features: [
        '1 organization',
        'Unlimited tenders',
        '2 Active Projects',
        'Email support',
      ],
      popular: true,
    },
    {
      name: 'Pro',
      price: 499,
      period: '/month',
      description: 'For growing teams',
      features: [
        '2 organizations',
        'Unlimited tenders',
        '5 Active Projects',
        'Priority support',
      ],
    },
  ];

  const testimonials: Testimonial[] = [
    {
      name: 'Sarah Johnson',
      role: 'Procurement Director',
      company: 'TechCorp',
      content:
        "The upgrade to Pro has transformed our tender management process. We've seen a 40% increase in efficiency.",
      rating: 5,
    },
    {
      name: 'Michael Chen',
      role: 'Operations Manager',
      company: 'Global Industries',
      content:
        'The advanced analytics and unlimited organizations feature is exactly what our growing team needed.',
      rating: 5,
    },
  ];

  const getContextualMessage = () => {
    const usagePercentage = (currentCount / maxCount) * 100;

    if (usageContext === 'organizations') {
      if (usagePercentage >= 100) {
        return {
          title: 'Organization Limit Reached',
          description: `You've reached the maximum of ${maxCount} organizations on your current plan. Upgrade to create unlimited organizations and unlock powerful features.`,
        };
      } else if (usagePercentage >= 80) {
        return {
          title: 'Approaching Organization Limit',
          description: `You're using ${currentCount} of ${maxCount} organizations. Consider upgrading to Pro for unlimited organizations and advanced features.`,
        };
      }
    }

    return {
      title: 'Unlock More Potential',
      description:
        'Upgrade to access advanced features and remove limitations on your account.',
    };
  };

  const handleGoToDashboard = () => {
    onOpenChange(false);
    router.push('/dashboard');
  };

  const handleUpgradeToPro = async () => {
    setIsUpgrading(true);
    try {
      // TODO: Implement actual upgrade flow with payment provider
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Redirect to the full upgrade page with the selected plan
      onOpenChange(false);
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Upgrade failed:', error);
      // Show error toast or alert
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleContactSales = async () => {
    setIsContactingSales(true);
    try {
      // TODO: Implement contact sales flow
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Open email client or redirect to contact form
      window.location.href =
        'mailto:sales@tendertrack360.co.za?subject=Enterprise%20Plan%20Inquiry';
      onOpenChange(false);
    } catch (error) {
      console.error('Contact sales failed:', error);
    } finally {
      setIsContactingSales(false);
    }
  };

  const contextualMessage = getContextualMessage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-4">
          {/* Animated Icon */}
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-100 dark:from-amber-900/30 dark:via-orange-900/30 dark:to-yellow-900/30 transition-all duration-500 ${animateItems ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`}
          >
            <Crown className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>

          <div className="space-y-2">
            <DialogTitle
              className={`text-2xl font-bold transition-all duration-500 delay-100 ${animateItems ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            >
              {contextualMessage.title}
            </DialogTitle>
            <DialogDescription
              className={`text-center text-base transition-all duration-500 delay-200 ${animateItems ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            >
              {contextualMessage.description}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Enhanced Usage Badge with Animation */}
        <div
          className={`flex items-center justify-center gap-3 transition-all duration-500 delay-300 ${animateItems ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        >
          <Badge
            variant="secondary"
            className="font-mono text-sm px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30"
          >
            {currentCount}/{maxCount}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {usageContext} used
          </span>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 ml-4 max-w-32">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.min((currentCount / maxCount) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        <div
          className={`space-y-6 pt-6 transition-all duration-500 delay-400 ${animateItems ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        >
          {/* Pricing Tiers */}
          <div className="grid gap-4 md:grid-cols-3">
            {pricingTiers.map((tier, index) => (
              <div
                key={tier.name}
                className={`relative rounded-xl border-2 p-6 transition-all duration-500 hover:shadow-lg ${tier.popular ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30' : 'border-gray-200 dark:border-gray-700'} ${animateItems ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                style={{ transitionDelay: `${500 + index * 100}ms` }}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600">
                    Most Popular
                  </Badge>
                )}

                <div className="text-center space-y-4">
                  <div>
                    <h3 className="text-xl font-bold">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tier.description}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold">
                        {typeof tier.price === 'number'
                          ? formatCurrency(tier.price)
                          : tier.price}
                      </span>
                      <span className="text-muted-foreground">
                        {tier.period}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {tier.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Social Proof Section */}
          <div
            className={`space-y-4 transition-all duration-500 delay-700 ${animateItems ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
          >
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTestimonials(!showTestimonials)}
                className="text-sm"
              >
                <Users className="h-4 w-4 mr-2" />
                {showTestimonials ? 'Hide' : 'Show'} Success Stories
              </Button>
            </div>

            {showTestimonials && (
              <div className="grid gap-4 md:grid-cols-2 animate-in slide-in-from-bottom-4 duration-500">
                {testimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-sm italic">"{testimonial.content}"</p>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">{testimonial.name}</span>
                      <span>
                        {' '}
                        • {testimonial.role} at {testimonial.company}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Enhanced Action Buttons */}
          <div
            className={`space-y-3 transition-all duration-500 delay-800 ${animateItems ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                onClick={handleUpgradeToPro}
                disabled={isUpgrading}
                className="h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-base font-medium cursor-pointer"
              >
                {isUpgrading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="h-5 w-5 mr-2" />
                    Upgrade to Pro
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  window.location.href = '/dashboard';
                }}
                className="h-12 cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Downgrade to Free
              </Button>
            </div>

            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  variant="outline"
                  onClick={handleGoToDashboard}
                  className="cursor-pointer col-span-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>

              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    window.location.href = '/dashboard';
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  View All Plans & Features
                </Button>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div
            className={`flex items-center justify-center gap-6 text-xs text-muted-foreground transition-all duration-500 delay-900 ${animateItems ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
          >
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
