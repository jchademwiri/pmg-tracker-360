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

interface PoDeliveryReminderProps {
  recipientName: string;
  poNumber: string;
  supplierName: string;
  expectedDeliveryDate: string;
  stageLabel: string;
  poLink: string;
}

const PoDeliveryReminder = (props: PoDeliveryReminderProps) => {
  const {
    recipientName,
    poNumber,
    supplierName,
    expectedDeliveryDate,
    stageLabel,
    poLink,
  } = props;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {stageLabel}: delivery for PO {poNumber}
      </Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto p-[40px]">
            <Section className="text-center mb-[32px]">
              <Heading className="text-[24px] font-bold text-gray-900 m-0 mb-[8px]">
                {stageLabel}
              </Heading>
              <Text className="text-[16px] text-gray-600 m-0">
                Expected delivery for purchase order {poNumber}
              </Text>
            </Section>

            <Section className="mb-[32px]">
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                Hi {recipientName},
              </Text>
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                The expected delivery date for purchase order{' '}
                <strong>{poNumber}</strong>
                {supplierName ? (
                  <>
                    {' '}
                    from <strong>{supplierName}</strong>
                  </>
                ) : null}{' '}
                is <strong>{expectedDeliveryDate}</strong>.
              </Text>

              <Section className="bg-gray-50 rounded-[8px] p-[24px] mb-[24px]">
                <Text className="text-[14px] text-gray-700 m-0 mb-[4px]">
                  <strong>PO Number:</strong> {poNumber}
                </Text>
                {supplierName ? (
                  <Text className="text-[14px] text-gray-700 m-0 mb-[4px]">
                    <strong>Supplier:</strong> {supplierName}
                  </Text>
                ) : null}
                <Text className="text-[14px] text-gray-700 m-0">
                  <strong>Expected delivery:</strong> {expectedDeliveryDate}
                </Text>
              </Section>
            </Section>

            <Section className="text-center mb-[32px]">
              <Button
                href={poLink}
                className="bg-green-600 text-white px-[32px] py-[14px] rounded-[6px] text-[16px] font-medium no-underline box-border inline-block"
              >
                View Purchase Order
              </Button>
            </Section>

            <Section className="mb-[8px]">
              <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[8px]">
                If the button doesn&#x27;t work, copy and paste this link into
                your browser:
              </Text>
              <Link href={poLink} className="text-blue-600 text-[14px] break-all">
                {poLink}
              </Link>
            </Section>

            <Section className="border-t border-gray-200 pt-[24px] mt-[24px]">
              <Text className="text-[12px] text-gray-500 leading-[16px] m-0">
                You&#x27;re receiving this because calendar reminders are
                enabled for your account. You can change this in Settings &gt;
                Notifications.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

PoDeliveryReminder.PreviewProps = {
  recipientName: 'Jane Doe',
  poNumber: 'PO-2026-102',
  supplierName: 'Steel Supplies Ltd',
  expectedDeliveryDate: '28 August 2026',
  stageLabel: 'Due tomorrow',
  poLink: 'https://tendertrack360.co.za/projects/purchase-orders/abc123',
};

export default PoDeliveryReminder;
