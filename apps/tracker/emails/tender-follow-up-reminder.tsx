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

interface TenderFollowUpReminderProps {
  recipientName: string;
  tenderNumber: string;
  tenderDescription?: string | null;
  clientName: string;
  followUpDate: string;
  stageLabel: string;
  notes?: string;
  tenderLink: string;
}

const TenderFollowUpReminder = (props: TenderFollowUpReminderProps) => {
  const {
    recipientName,
    tenderNumber,
    tenderDescription,
    clientName,
    followUpDate,
    stageLabel,
    notes,
    tenderLink,
  } = props;

  const upperTenderNumber = tenderNumber ? tenderNumber.toUpperCase() : '';
  const upperClientName = clientName ? clientName.toUpperCase() : '';
  const upperTenderDescription = tenderDescription ? tenderDescription.toUpperCase() : undefined;
  const tenderDisplay = upperTenderDescription
    ? `${upperTenderNumber} - ${upperTenderDescription}`
    : upperTenderNumber;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {stageLabel}: follow-up for tender {tenderDisplay}
      </Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto p-[40px]">
            <Section className="text-center mb-[32px]">
              <Heading className="text-[24px] font-bold text-gray-900 m-0 mb-[8px]">
                {stageLabel}
              </Heading>
              <Text className="text-[16px] text-gray-600 m-0">
                Follow-up for tender {tenderDisplay}
              </Text>
            </Section>

            <Section className="mb-[32px]">
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                Hi {recipientName},
              </Text>
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                A follow-up is scheduled for tender <strong>{tenderDisplay}</strong>{' '}
                ({upperClientName}) on <strong>{followUpDate}</strong>.
              </Text>

              <Section className="bg-gray-50 rounded-[8px] p-[24px] mb-[24px]">
                <Text className="text-[14px] text-gray-700 m-0 mb-[4px]">
                  <strong>Tender:</strong> {tenderDisplay}
                </Text>
                {upperTenderDescription ? (
                  <Text className="text-[14px] text-gray-700 m-0 mb-[4px]">
                    <strong>Description:</strong> {upperTenderDescription}
                  </Text>
                ) : null}
                <Text className="text-[14px] text-gray-700 m-0 mb-[4px]">
                  <strong>Client:</strong> {upperClientName}
                </Text>
                <Text className="text-[14px] text-gray-700 m-0 mb-[4px]">
                  <strong>Follow-up date:</strong> {followUpDate}
                </Text>
                {notes ? (
                  <Text className="text-[14px] text-gray-700 m-0">
                    <strong>Notes:</strong> {notes}
                  </Text>
                ) : null}
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

TenderFollowUpReminder.PreviewProps = {
  recipientName: 'Jane Doe',
  tenderNumber: 'TND-2026-014',
  tenderDescription: 'SUPPLY AND DELIVERY OF SPARE PARTS',
  clientName: 'ACME CORPORATION',
  followUpDate: '28 August 2026',
  stageLabel: 'Due tomorrow',
  notes: 'Confirm receipt of revised BOQ.',
  tenderLink: 'https://tendertrack360.co.za/tenders/abc123',
};

export default TenderFollowUpReminder;
