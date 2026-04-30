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

const OrganizationInvitation = ({
  email,
  invitedByUsername,
  invitedByEmail,
  teamName,
  inviteLink,
}: OrganizationInvitationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You&apos;ve been invited to join {teamName} — Accept your invitation</Preview>
    <Tailwind>
      <Body className="bg-gray-100 font-sans py-[40px]">
        <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto p-[40px]">
          <Section className="text-center mb-[32px]">
            <Heading className="text-[28px] font-bold text-gray-900 m-0 mb-[8px]">
              You&apos;re Invited! 🎉
            </Heading>
            <Text className="text-[18px] text-gray-600 m-0">
              Join <strong>{teamName}</strong> and start collaborating
            </Text>
          </Section>

          <Section className="mb-[32px]">
            <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
              Hi there,
            </Text>
            <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
              <strong>{invitedByUsername}</strong> has invited you to join{' '}
              <strong>{teamName}</strong> on Tender Track 360.
            </Text>

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
          </Section>

          <Section className="text-center mb-[32px]">
            <Button
              href={inviteLink}
              className="bg-green-600 text-white px-[32px] py-[14px] rounded-[6px] text-[16px] font-medium no-underline box-border inline-block"
            >
              Accept Invitation
            </Button>
          </Section>

          <Section className="mb-[32px]">
            <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[8px]">
              If the button doesn&apos;t work, copy and paste this link into your browser:
            </Text>
            <Link href={inviteLink} className="text-blue-600 text-[14px] break-all">
              {inviteLink}
            </Link>
          </Section>

          <Section className="bg-blue-50 rounded-[8px] p-[24px] mb-[32px]">
            <Text className="text-[14px] text-gray-700 m-0 mb-[12px]">
              <strong>What happens next?</strong>
            </Text>
            <Text className="text-[14px] text-gray-600 m-0 mb-[4px]">✓ Click the invitation link above</Text>
            <Text className="text-[14px] text-gray-600 m-0 mb-[4px]">✓ Create your account or sign in if you already have one</Text>
            <Text className="text-[14px] text-gray-600 m-0">✓ Start collaborating with your new team</Text>
          </Section>

          <Section className="border-l-[4px] border-orange-400 pl-[16px] mb-[32px]">
            <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[4px]">
              • This invitation expires in 7 days
            </Text>
            <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[4px]">
              • If you have questions, contact {invitedByUsername} at {invitedByEmail}
            </Text>
            <Text className="text-[14px] text-gray-600 leading-[20px] m-0">
              • If you didn&apos;t expect this invitation, you can safely ignore this email
            </Text>
          </Section>

          <Section className="border-t border-gray-200 pt-[24px]">
            <Text className="text-[12px] text-gray-500 leading-[16px] m-0 mb-[4px]">
              This invitation was sent by {invitedByUsername} on behalf of {teamName}.
            </Text>
            <Text className="text-[12px] text-gray-500 leading-[16px] m-0">
              © {new Date().getFullYear()} Tender Track 360. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

OrganizationInvitation.PreviewProps = {
  email: 'invitee@example.com',
  invitedByUsername: 'Jacob Chademwiri',
  invitedByEmail: 'jacob@tendertrack360.co.za',
  teamName: 'Acme Corporation',
  inviteLink: 'https://tendertrack360.co.za/invite/accept/abc123',
};

export default OrganizationInvitation;
