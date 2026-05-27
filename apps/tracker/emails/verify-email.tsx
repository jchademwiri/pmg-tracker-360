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

const VerifyEmail = (props: VerifyEmailProps) => {
  const { username, verificationUrl } = props;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Verify your email address to complete your account setup
      </Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto p-[40px]">
            {/* Header */}
            <Section className="text-center mb-[32px]">
              <Heading className="text-[24px] font-bold text-gray-900 m-0 mb-[8px]">
                Verify Your Email Address
              </Heading>
              <Text className="text-[16px] text-gray-600 m-0">
                Welcome! Please verify your email to complete your account
                setup.
              </Text>
            </Section>

            {/* Main Content */}
            <Section className="mb-[32px]">
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                Hi {username},
              </Text>
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                Thanks for signing up! To complete your account setup and start
                using our platform, please verify your email address by clicking
                the button below.
              </Text>
            </Section>

            {/* Verification Button */}
            <Section className="text-center mb-[32px]">
              <Button
                href={verificationUrl}
                className="bg-blue-600 text-white px-[32px] py-[12px] rounded-[6px] text-[16px] font-medium no-underline box-border inline-block"
              >
                Verify Email Address
              </Button>
            </Section>

            {/* Alternative Link */}
            <Section className="mb-[32px]">
              <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[8px]">
                If the button doesn&amb;t work, you can copy and paste this link
                into your browser:
              </Text>
              <Link
                href={verificationUrl}
                className="text-blue-600 text-[14px] break-all"
              >
                {verificationUrl}
              </Link>
            </Section>

            {/* Security Notice */}
            <Section className="border-t border-gray-200 pt-[24px] mb-[32px]">
              <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[8px]">
                <strong>Security Notice:</strong>
              </Text>
              <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[8px]">
                • This verification link will expire in 24 hours
              </Text>
              <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[8px]">
                • If you didn&#x27;t create an account, you can safely ignore
                this email
              </Text>
              <Text className="text-[14px] text-gray-600 leading-[20px] m-0">
                • Never share this link with anyone else
              </Text>
            </Section>

            {/* Footer */}
            <Section className="border-t border-gray-200 pt-[24px]">
              <Text className="text-[12px] text-gray-500 leading-[16px] m-0 mb-[8px]">
                Best regards,
                <br />
                The Team
              </Text>
              <Text className="text-[12px] text-gray-400 leading-[16px] m-0 mb-[4px]">
                123 Business Street, Suite 100
              </Text>
              <Text className="text-[12px] text-gray-400 leading-[16px] m-0 mb-[8px]">
                City, State 12345
              </Text>
              <Link
                href="#"
                className="text-[12px] text-gray-400 underline mr-[16px]"
              >
                Unsubscribe
              </Link>
              <Text className="text-[12px] text-gray-400 leading-[16px] m-0 inline">
                © {new Date().getFullYear()} Tender Track 360. All rights
                reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

VerifyEmail.PreviewProps = {
  username: 'Jacob Chademwiri',
  verificationUrl: 'https://yourapp.com/verify-email?token=abc123xyz789',
};

export default VerifyEmail;
