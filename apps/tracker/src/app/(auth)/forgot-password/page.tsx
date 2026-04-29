import { ForgotPasswordForm } from '@/components/forms';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset your Password',
};

export default function ForgotPassword() {
  return (
    <div>
      <ForgotPasswordForm />
    </div>
  );
}
