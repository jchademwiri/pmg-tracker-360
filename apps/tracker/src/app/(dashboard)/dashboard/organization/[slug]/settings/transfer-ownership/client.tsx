'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { acceptOwnershipTransferByToken } from '@/server/organization-advanced-actions';
import { toast } from 'sonner';

interface TransferOwnershipClientProps {
  slug: string;
  organizationName: string;
  token: string;
}

export function TransferOwnershipClient({
  slug,
  organizationName,
  token,
}: TransferOwnershipClientProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);
  const router = useRouter();

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const response = await acceptOwnershipTransferByToken(token);

      if (response.success) {
        setResult({ success: true });
        toast.success(`You are now the owner of ${organizationName}`);
      } else {
        setResult({ success: false, error: response.error?.message });
        toast.error(
          response.error?.message || 'Failed to accept ownership transfer'
        );
      }
    } catch (error) {
      console.error('Acceptance error:', error);
      setResult({ success: false, error: 'An unexpected error occurred' });
      toast.error('An unexpected error occurred');
    } finally {
      setIsAccepting(false);
    }
  };

  if (result) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            {result.success ||
            result.error?.toLowerCase().includes('accepted') ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </div>
          <CardTitle>
            {result.success
              ? 'Ownership Transfer Complete'
              : result.error?.toLowerCase().includes('accepted')
                ? 'Transfer Already Accepted'
                : 'Transfer Failed'}
          </CardTitle>
          <CardDescription>
            {result.success
              ? `You are now the owner of ${organizationName}.`
              : result.error?.toLowerCase().includes('accepted')
                ? `You have already accepted this ownership transfer.`
                : result.error ||
                  'An error occurred while processing your request.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <a href={`/dashboard/organization/${slug}`}>
              Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Accept Ownership Transfer</CardTitle>
        <CardDescription>
          You have been invited to become the owner of{' '}
          <strong>{organizationName}</strong>.
          <br />
          This action will grant you full control over the organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Cancel
        </Button>
        <Button onClick={handleAccept} disabled={isAccepting}>
          {isAccepting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Accepting...
            </>
          ) : (
            'Accept Ownership'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
