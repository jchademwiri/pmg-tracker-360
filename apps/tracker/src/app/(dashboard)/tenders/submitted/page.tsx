import { redirect } from 'next/navigation';

export default function SubmittedTendersPage() {
  redirect('/tenders/overview?status=evaluation');
}
