// Force dynamic rendering since parent layout uses headers() in server functions
export const dynamic = 'force-dynamic';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
