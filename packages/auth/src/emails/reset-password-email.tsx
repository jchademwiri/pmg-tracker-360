import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Tailwind,
} from '@react-email/components';

interface ResetPasswordEmailProps {
  username: string;
  resetUrl: string;
  userEmail: string;
}

const ResetPasswordEmail = ({ username, resetUrl, userEmail }: ResetPasswordEmailProps) => (
  <Html lang="en" dir="ltr">
    <Tailwind>
      <Head />
      <Preview>Reset your Tender Track 360 password</Preview>
      <Body className="bg-gray-100 font-sans py-[40px]">
        <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto p-[40px]">
          <Section className="text-center mb-[32px]">
            <Text className="text-[28px] font-bold text-gray-900 m-0 mb-[8px]">
              Tender Track 360
            </Text>
            <Text className="text-[16px] text-gray-600 m-0">
              Password Reset Request
            </Text>
          </Section>

          <Section className="mb-[32px]">
            <Text className="text-[18px] font-semibold text-gray-900 mb-[16px]">
              Hello, {username}
            </Text>
            <Text className="text-[16px] text-gray-700 leading-[24px] mb-[16px]">
              We received a request to reset the password for your Tender Track 360
              account: <strong>{userEmail}</strong>
            </Text>
            <Text className="text-[16px] text-gray-700 leading-[24px] mb-[24px]">
              Click the button below to reset your password. This link is secure and
              will expire in 1 hour.
            </Text>
          </Section>

          <Section className="text-center mb-[32px]">
            <Button
              href={resetUrl}
              className="bg-blue-600 text-white font-semibold py-[12px] px-[24px] rounded-[6px] text-[16px] no-underline box-border inline-block"
            >
              Reset Password
            </Button>
          </Section>

          <Section className="mb-[32px]">
            <Text className="text-[14px] text-gray-600 leading-[20px] mb-[8px]">
              If the button doesn&apos;t work, copy and paste this link into your browser:
            </Text>
            <Text className="text-[14px] text-blue-600 break-all">{resetUrl}</Text>
          </Section>

          <Hr className="border-gray-200 my-[24px]" />

          <Section className="mb-[24px]">
            <Text className="text-[14px] font-semibold text-gray-900 mb-[8px]">
              Security Information:
            </Text>
            <Text className="text-[14px] text-gray-600 leading-[20px] mb-[4px]">
              • If you didn&apos;t request this reset, you can safely ignore this email
            </Text>
            <Text className="text-[14px] text-gray-600 leading-[20px] mb-[4px]">
              • This link is single-use and expires in 1 hour
            </Text>
            <Text className="text-[14px] text-gray-600 leading-[20px]">
              • Your current password remains unchanged until you complete the reset
            </Text>
          </Section>

          <Hr className="border-gray-200 my-[24px]" />

          <Section>
            <Text className="text-[12px] text-gray-500 leading-[16px] m-0">
              © {new Date().getFullYear()} Tender Track 360. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

ResetPasswordEmail.PreviewProps = {
  username: 'Jacob Chademwiri',
  resetUrl: 'https://tendertrack360.co.za/reset-password?token=abc123',
  userEmail: 'jacob@example.com',
};

export default ResetPasswordEmail;
