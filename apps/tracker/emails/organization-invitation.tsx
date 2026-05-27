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

interface OrganizationInvitationProps {
  email: string;
  invitedByUsername: string;
  invitedByEmail: string;
  teamName: string;
  inviteLink: string;
}

const OrganizationInvitation = (props: OrganizationInvitationProps) => {
  const { email, invitedByUsername, invitedByEmail, teamName, inviteLink } =
    props;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        You&#x27;ve been invited to join {teamName} - Accept your invitation
      </Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto p-[40px]">
            {/* Header */}
            <Section className="text-center mb-[32px]">
              <Heading className="text-[28px] font-bold text-gray-900 m-0 mb-[8px]">
                You&#x27;re Invited! 🎉
              </Heading>
              <Text className="text-[18px] text-gray-600 m-0">
                Join <strong>{teamName}</strong> and start collaborating
              </Text>
            </Section>

            {/* Main Content */}
            <Section className="mb-[32px]">
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                Hi there,
              </Text>
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                <strong>{invitedByUsername}</strong> has invited you to join{' '}
                <strong>{teamName}</strong>. You&#x27;ll be able to collaborate
                with the team and access all the tools and resources you need to
                get started right away.
              </Text>

              {/* Invitation Details Box */}
              <Section className="bg-gray-50 rounded-[8px] p-[24px] mb-[24px]">
                <Text className="text-[14px] text-gray-600 m-0 mb-[8px]">
                  <strong>Invitation Details:</strong>
                </Text>
                <Text className="text-[14px] text-gray-700 m-0 mb-[4px]">
                  <strong>Organization:</strong> {teamName}
                </Text>
                <Text className="text-[14px] text-gray-700 m-0 mb-[4px]">
                  <strong>Invited by:</strong> {invitedByUsername}
                </Text>
                <Text className="text-[14px] text-gray-700 m-0 mb-[4px]">
                  <strong>Your email:</strong> {email}
                </Text>
                <Text className="text-[14px] text-gray-700 m-0">
                  <strong>Inviter contact:</strong> {invitedByEmail}
                </Text>
              </Section>

              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[24px]">
                Click the button below to accept your invitation and create your
                account. If you already have an account, you&#x27;ll be added to
                the organization automatically.
              </Text>
            </Section>

            {/* Accept Invitation Button */}
            <Section className="text-center mb-[32px]">
              <Button
                href={inviteLink}
                className="bg-green-600 text-white px-[32px] py-[14px] rounded-[6px] text-[16px] font-medium no-underline box-border inline-block"
              >
                Accept Invitation
              </Button>
            </Section>

            {/* Alternative Link */}
            <Section className="mb-[32px]">
              <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[8px]">
                If the button doesn&#x27;t work, you can copy and paste this
                link into your browser:
              </Text>
              <Link
                href={inviteLink}
                className="text-blue-600 text-[14px] break-all"
              >
                {inviteLink}
              </Link>
            </Section>

            {/* What happens next */}
            <Section className="bg-blue-50 rounded-[8px] p-[24px] mb-[32px]">
              <Text className="text-[14px] text-gray-700 m-0 mb-[12px]">
                <strong>What happens next?</strong>
              </Text>
              <Text className="text-[14px] text-gray-600 m-0 mb-[8px]">
                ✓ Click the invitation link above
              </Text>
              <Text className="text-[14px] text-gray-600 m-0 mb-[8px]">
                ✓ Create your account or sign in if you already have one
              </Text>
              <Text className="text-[14px] text-gray-600 m-0 mb-[8px]">
                ✓ Start collaborating with your new team
              </Text>
              <Text className="text-[14px] text-gray-600 m-0">
                ✓ Access all organization resources and tools
              </Text>
            </Section>

            {/* Important Notice */}
            <Section className="border-l-[4px] border-orange-400 pl-[16px] mb-[32px]">
              <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[8px]">
                <strong>Important:</strong>
              </Text>
              <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[8px]">
                • This invitation will expire in 7 days
              </Text>
              <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[8px]">
                • If you have questions, contact {invitedByUsername} at{' '}
                {invitedByEmail}
              </Text>
              <Text className="text-[14px] text-gray-600 leading-[20px] m-0">
                • If you didn&#x27;t expect this invitation, you can safely
                ignore this email
              </Text>
            </Section>

            {/* Footer */}
            <Section className="border-t border-gray-200 pt-[24px]">
              <Text className="text-[12px] text-gray-500 leading-[16px] m-0 mb-[8px]">
                This invitation was sent by {invitedByUsername} on behalf of{' '}
                {teamName}.
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
                © {new Date().getFullYear()} Your Organisation. All rights
                reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

OrganizationInvitation.PreviewProps = {
  email: 'hello@jacobc.co.za',
  invitedByUsername: 'John Smith',
  invitedByEmail: 'john.smith@organization.com',
  teamName: 'Acme Corporation',
  inviteLink: 'https://yourapp.com/invite/accept?token=abc123xyz789',
};

export default OrganizationInvitation;
