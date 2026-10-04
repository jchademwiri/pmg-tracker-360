"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { OrgWithCounts, AdminInvitationItem } from "@/lib/admin-queries";
import OrgListClient from "./OrgListClient";
import InvitationsListClient from "./components/InvitationsListClient";
import { Building2, Mail, Clock, AlertTriangle } from "lucide-react";

type OrganizationsManagementClientProps = {
  orgs: OrgWithCounts[];
  invitations: AdminInvitationItem[];
  initialTab?: "organizations" | "invitations";
  initialFilter?: string;
};

export default function OrganizationsManagementClient({
  orgs,
  invitations,
  initialTab = "organizations",
  initialFilter = "all",
}: OrganizationsManagementClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<"organizations" | "invitations">(
    urlTab === "invitations" || initialTab === "invitations"
      ? "invitations"
      : "organizations",
  );

  const pendingInvitationsCount = invitations.filter(
    (i) => i.status === "pending",
  ).length;
  const expiringSoonCount = invitations.filter((i) => i.isExpiringSoon).length;
  const expiredCount = invitations.filter((i) => i.isExpired).length;

  function handleTabChange(tab: "organizations" | "invitations") {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "invitations") {
      params.set("tab", "invitations");
    } else {
      params.delete("tab");
      params.delete("filter");
    }
    router.replace(`/organizations?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      {/* Top Level Section Tabs */}
      <div className="flex border-b border-zinc-800 gap-6 text-sm font-semibold">
        <button
          type="button"
          onClick={() => handleTabChange("organizations")}
          className={`pb-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === "organizations"
              ? "border-indigo-500 text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Workspaces & Organizations</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300">
            {orgs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("invitations")}
          className={`pb-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === "invitations"
              ? "border-indigo-500 text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Mail className="h-4 w-4" />
          <span>Organization Invitations</span>
          {pendingInvitationsCount > 0 && (
            <span
              className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                expiredCount > 0
                  ? "bg-red-950 text-red-400 border border-red-800"
                  : expiringSoonCount > 0
                    ? "bg-amber-950 text-amber-300 border border-amber-800"
                    : "bg-zinc-800 text-zinc-300"
              }`}
            >
              {pendingInvitationsCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "organizations" ? (
        <OrgListClient orgs={orgs} />
      ) : (
        <InvitationsListClient
          invitations={invitations}
          initialFilter={initialFilter}
        />
      )}
    </div>
  );
}
