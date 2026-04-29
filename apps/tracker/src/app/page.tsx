import { redirect } from 'next/navigation';

// Root redirects straight to dashboard while auth is stubbed
export default function Home() {
  redirect('/dashboard');
}
