import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from '@react-email/components';

interface VerifyEmailProps {
  username: string;
  verificationUrl: string;
}

const VerifyEmail = ({ username, verificationUrl }: VerifyEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Verify your email address to complete your account setup</Preview>
    <Tailwind>
      <Body className="bg-gray-100 font-sans py-[40px]">
        <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto p-[40px]">
          <Section className="text-center mb-[32px]">
            <Heading className="text-[24px] font-bold text-gray-900 m-0 mb-[8px]">
              Verify Your Email Address
            </Heading>
            <Text className="text-[16px] text-gray-600 m-0">
              Welcome! Please verify your email to complete your account setup.
            </Text>
          </Section>

          <Section className="mb-[32px]">
            <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
              Hi {username},
            </Text>
            <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
              Thanks for signing up for Tender Track 360! Click the button below
              to verify your email address and activate your account.
            </Text>
          </Section>

          <Section className="text-center mb-[32px]">
            <Button
              href={verificationUrl}
              className="bg-blue-600 text-white px-[32px] py-[12px] rounded-[6px] text-[16px] font-medium no-underline box-border inline-block"
            >
              Verify Email Address
            </Button>
          </Section>

          <Section className="mb-[32px]">
            <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[8px]">
              If the button doesn&apos;t work, copy and paste this link into your browser:
            </Text>
            <Link href={verificationUrl} className="text-blue-600 text-[14px] break-all">
              {verificationUrl}
            </Link>
          </Section>

          <Section className="border-t border-gray-200 pt-[24px] mb-[32px]">
            <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[8px]">
              <strong>Security Notice:</strong>
            </Text>
            <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[4px]">
              • This verification link expires in 1 hour
            </Text>
            <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[4px]">
              • If you didn&apos;t create an account, you can safely ignore this email
            </Text>
            <Text className="text-[14px] text-gray-600 leading-[20px] m-0">
              • Never share this link with anyone else
            </Text>
          </Section>

          <Section className="border-t border-gray-200 pt-[24px]">
            <Text className="text-[12px] text-gray-500 leading-[16px] m-0">
              © {new Date().getFullYear()} Tender Track 360. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

VerifyEmail.PreviewProps = {
  username: 'Jacob Chademwiri',
  verificationUrl: 'https://tendertrack360.co.za/api/auth/verify-email?token=abc123',
};

export default VerifyEmail;
