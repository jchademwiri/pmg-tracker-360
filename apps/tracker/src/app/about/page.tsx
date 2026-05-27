import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  robots: {
    index: false,
  },
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
        About Us
      </h1>
      <p className="mt-6 text-lg leading-8 text-muted-foreground">
        Coming Soon
      </p>
    </div>
  );
}
