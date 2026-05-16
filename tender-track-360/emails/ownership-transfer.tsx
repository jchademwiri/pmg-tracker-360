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

interface OwnershipTransferEmailProps {
  toEmail: string;
  fromUserName: string;
  organizationName: string;
  acceptLink: string;
  expiresInHours: number;
}

const OwnershipTransferEmail = (props: OwnershipTransferEmailProps) => {
  const {
    toEmail,
    fromUserName,
    organizationName,
    acceptLink,
    expiresInHours,
  } = props;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Action Required: Accept ownership transfer for {organizationName}
      </Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto p-[40px]">
            {/* Header */}
            <Section className="text-center mb-[32px]">
              <Heading className="text-[28px] font-bold text-gray-900 m-0 mb-[8px]">
                Ownership Transfer Request
              </Heading>
              <Text className="text-[18px] text-gray-600 m-0">
                for <strong>{organizationName}</strong>
              </Text>
            </Section>

            {/* Main Content */}
            <Section className="mb-[32px]">
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                Hi {toEmail},
              </Text>
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                <strong>{fromUserName}</strong> has initiated a request to
                transfer ownership of <strong>{organizationName}</strong> to
                you.
              </Text>
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                As the new owner, you will have ample control over the
                organization's settings, billing, and members.
              </Text>

              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[24px]">
                Click the button below to accept this transfer. This link will
                expire in {expiresInHours} hours.
              </Text>
            </Section>

            {/* Accept Button */}
            <Section className="text-center mb-[32px]">
              <Button
                href={acceptLink}
                className="bg-blue-600 text-white px-[32px] py-[14px] rounded-[6px] text-[16px] font-medium no-underline box-border inline-block"
              >
                Accept Ownership
              </Button>
            </Section>

            {/* Alternative Link */}
            <Section className="mb-[32px]">
              <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[8px]">
                If the button doesn't work, you can copy and paste this link
                into your browser:
              </Text>
              <Link
                href={acceptLink}
                className="text-blue-600 text-[14px] break-all"
              >
                {acceptLink}
              </Link>
            </Section>

            {/* Footer */}
            <Section className="border-t border-gray-200 pt-[24px]">
              <Text className="text-[12px] text-gray-500 leading-[16px] m-0 mb-[8px]">
                This email was sent to {toEmail} regarding {organizationName}.
              </Text>
              <Text className="text-[12px] text-gray-400 leading-[16px] m-0">
                © {new Date().getFullYear()} TenderTrack 360. All rights
                reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

OwnershipTransferEmail.PreviewProps = {
  toEmail: 'newowner@example.com',
  fromUserName: 'Current Owner',
  organizationName: 'Acme Corp',
  acceptLink: 'https://www.tendertrack360.co.za/accept-transfer?token=123',
  expiresInHours: 72,
};

export default OwnershipTransferEmail;
