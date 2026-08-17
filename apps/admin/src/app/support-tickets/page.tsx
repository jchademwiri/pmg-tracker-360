import { Suspense } from "react";
import { requireAdminPage } from "@/lib/require-admin-page";
import { getOpenTickets } from "@/lib/admin-queries";
import TicketsListClient from "./TicketsListClient";

export default async function SupportTicketsPage() {
  // 1. Auth guard
  await requireAdminPage();

  // 2. Data fetching — getOpenTickets returns all tickets ordered by createdAt DESC
  const tickets = await getOpenTickets();

  return (
    <div className="w-full h-full animate-in fade-in duration-300 font-sans">
      <Suspense
        fallback={
          <div className="h-[calc(100vh-8.5rem)] flex items-center justify-center text-zinc-400 text-sm">
            Loading Operations Center...
          </div>
        }
      >
        <TicketsListClient tickets={tickets} />
      </Suspense>
    </div>
  );
}
