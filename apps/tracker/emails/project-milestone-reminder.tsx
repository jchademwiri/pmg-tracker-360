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

interface ProjectMilestoneReminderProps {
  recipientName: string;
  projectNumber: string;
  clientName: string;
  milestoneLabel: 'Contract End' | 'Close-Out';
  milestoneDate: string;
  stageLabel: string;
  projectLink: string;
}

const ProjectMilestoneReminder = (props: ProjectMilestoneReminderProps) => {
  const {
    recipientName,
    projectNumber,
    clientName,
    milestoneLabel,
    milestoneDate,
    stageLabel,
    projectLink,
  } = props;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {stageLabel}: {milestoneLabel} for project {projectNumber}
      </Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto p-[40px]">
            <Section className="text-center mb-[32px]">
              <Heading className="text-[24px] font-bold text-gray-900 m-0 mb-[8px]">
                {stageLabel}
              </Heading>
              <Text className="text-[16px] text-gray-600 m-0">
                {milestoneLabel} for project {projectNumber}
              </Text>
            </Section>

            <Section className="mb-[32px]">
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                Hi {recipientName},
              </Text>
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                The <strong>{milestoneLabel.toLowerCase()}</strong> date for
                project <strong>{projectNumber}</strong> ({clientName}) is{' '}
                <strong>{milestoneDate}</strong>.
              </Text>

              <Section className="bg-gray-50 rounded-[8px] p-[24px] mb-[24px]">
                <Text className="text-[14px] text-gray-700 m-0 mb-[4px]">
                  <strong>Project:</strong> {projectNumber}
                </Text>
                <Text className="text-[14px] text-gray-700 m-0 mb-[4px]">
                  <strong>Client:</strong> {clientName}
                </Text>
                <Text className="text-[14px] text-gray-700 m-0">
                  <strong>{milestoneLabel} date:</strong> {milestoneDate}
                </Text>
              </Section>
            </Section>

            <Section className="text-center mb-[32px]">
              <Button
                href={projectLink}
                className="bg-green-600 text-white px-[32px] py-[14px] rounded-[6px] text-[16px] font-medium no-underline box-border inline-block"
              >
                View Project
              </Button>
            </Section>

            <Section className="mb-[8px]">
              <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[8px]">
                If the button doesn&#x27;t work, copy and paste this link into
                your browser:
              </Text>
              <Link href={projectLink} className="text-blue-600 text-[14px] break-all">
                {projectLink}
              </Link>
            </Section>

            <Section className="border-t border-gray-200 pt-[24px] mt-[24px]">
              <Text className="text-[12px] text-gray-500 leading-[16px] m-0">
                You&#x27;re receiving this because project update reminders are
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

ProjectMilestoneReminder.PreviewProps = {
  recipientName: 'Jane Doe',
  projectNumber: 'PRJ-2026-009',
  clientName: 'Acme Corporation',
  milestoneLabel: 'Contract End',
  milestoneDate: '28 August 2026',
  stageLabel: 'Due in 7 days',
  projectLink: 'https://tendertrack360.co.za/projects/abc123',
};

export default ProjectMilestoneReminder;
