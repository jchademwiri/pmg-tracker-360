'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Lock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (paymentMethod: any) => void;
}

export function AddPaymentMethodDialog({
  open,
  onOpenChange,
  onAdd,
}: AddPaymentMethodDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      // Remove non-digits and limit to 16
      formattedValue = value.replace(/\D/g, '').slice(0, 16);
      // Add spaces every 4 digits
      formattedValue = formattedValue.replace(/(\d{4})(?=\d)/g, '$1 ');
    } else if (name === 'expiryDate') {
      // Remove non-digits and limit to 4
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
      // Add slash after 2 digits
      if (formattedValue.length >= 2) {
        formattedValue = `${formattedValue.slice(0, 2)}/${formattedValue.slice(2)}`;
      }
    } else if (name === 'cvv') {
      // Remove non-digits and limit to 3 or 4
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.cardholderName.trim()) return 'Cardholder name is required';
    if (formData.cardNumber.replace(/\s/g, '').length < 16)
      return 'Invalid card number';
    if (formData.expiryDate.length < 5) return 'Invalid expiry date (MM/YY)';
    if (formData.cvv.length < 3) return 'Invalid CVV';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call to Paystack/Gateway
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const last4 = formData.cardNumber.slice(-4);
      const [expMonth, expYear] = formData.expiryDate.split('/');

      onAdd({
        id: `pm_${Date.now()}`,
        type: 'card',
        last4,
        brand: 'Visa', // Mock detection
        expiry_month: parseInt(expMonth),
        expiry_year: parseInt('20' + expYear),
        is_default: false,
      });

      onOpenChange(false);
      setFormData({
        cardholderName: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
      });
    } catch (err) {
      setError('Failed to add payment method. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogDescription>
                Add a credit or debit card securely
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="cardholderName">Cardholder Name</Label>
            <Input
              id="cardholderName"
              name="cardholderName"
              placeholder="John Doe"
              value={formData.cardholderName}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                name="cardNumber"
                placeholder="0000 0000 0000 0000"
                value={formData.cardNumber}
                onChange={handleInputChange}
                disabled={isLoading}
                className="pl-10"
              />
              <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                name="expiryDate"
                placeholder="MM/YY"
                value={formData.expiryDate}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <div className="relative">
                <Input
                  id="cvv"
                  name="cvv"
                  placeholder="123"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  maxLength={4}
                />
                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Lock className="h-3 w-3" />
            <span>
              Your payment information is encrypted and processed securely.
            </span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Card'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
