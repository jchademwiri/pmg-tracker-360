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

interface TenderDeadlineReminderProps {
  recipientName: string;
  tenderNumber: string;
  clientName: string;
  deadlineLabel: 'Submission' | 'Evaluation' | 'Briefing';
  deadlineDate: string;
  stageLabel: string;
  tenderLink: string;
}

const TenderDeadlineReminder = (props: TenderDeadlineReminderProps) => {
  const {
    recipientName,
    tenderNumber,
    clientName,
    deadlineLabel,
    deadlineDate,
    stageLabel,
    tenderLink,
  } = props;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {stageLabel}: {deadlineLabel} deadline for tender {tenderNumber}
      </Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto p-[40px]">
            <Section className="text-center mb-[32px]">
              <Heading className="text-[24px] font-bold text-gray-900 m-0 mb-[8px]">
                {stageLabel}
              </Heading>
              <Text className="text-[16px] text-gray-600 m-0">
                {deadlineLabel} deadline for tender {tenderNumber}
              </Text>
            </Section>

            <Section className="mb-[32px]">
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                Hi {recipientName},
              </Text>
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                The <strong>{deadlineLabel.toLowerCase()}</strong> deadline for tender{' '}
                <strong>{tenderNumber}</strong> ({clientName}) is{' '}
                <strong>{deadlineDate}</strong>.
              </Text>

              <Section className="bg-gray-50 rounded-[8px] p-[24px] mb-[24px]">
                <Text className="text-[14px] text-gray-700 m-0 mb-[4px]">
                  <strong>Tender:</strong> {tenderNumber}
                </Text>
                <Text className="text-[14px] text-gray-700 m-0 mb-[4px]">
                  <strong>Client:</strong> {clientName}
                </Text>
                <Text className="text-[14px] text-gray-700 m-0">
                  <strong>{deadlineLabel} date:</strong> {deadlineDate}
                </Text>
              </Section>
            </Section>

            <Section className="text-center mb-[32px]">
              <Button
                href={tenderLink}
                className="bg-green-600 text-white px-[32px] py-[14px] rounded-[6px] text-[16px] font-medium no-underline box-border inline-block"
              >
                View Tender
              </Button>
            </Section>

            <Section className="mb-[8px]">
              <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[8px]">
                If the button doesn&#x27;t work, copy and paste this link into
                your browser:
              </Text>
              <Link href={tenderLink} className="text-blue-600 text-[14px] break-all">
                {tenderLink}
              </Link>
            </Section>

            <Section className="border-t border-gray-200 pt-[24px] mt-[24px]">
              <Text className="text-[12px] text-gray-500 leading-[16px] m-0">
                You&#x27;re receiving this because tender reminders are enabled
                for your account. You can change this in Settings &gt;
                Notifications.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

TenderDeadlineReminder.PreviewProps = {
  recipientName: 'Jane Doe',
  tenderNumber: 'TND-2026-014',
  clientName: 'Acme Corporation',
  deadlineLabel: 'Submission',
  deadlineDate: '28 August 2026',
  stageLabel: 'Due in 7 days',
  tenderLink: 'https://tendertrack360.co.za/tenders/abc123',
};

export default TenderDeadlineReminder;
