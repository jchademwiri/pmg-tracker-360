"use client";

import React from "react";
import Link from "next/link";
import {
  Building,
  User,
  Mail,
  Phone,
  ExternalLink,
  Copy,
  UserCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatClientName, formatPhoneNumber } from "@/lib/format";
import { toast } from "sonner";

interface TenderStakeholdersCardProps {
  client: {
    id: string;
    name: string;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
  } | null;
  tenderContact: {
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
  };
}

export function TenderStakeholdersCard({
  client,
  tenderContact,
}: TenderStakeholdersCardProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const hasTenderContact = Boolean(
    tenderContact.contactName ||
    tenderContact.contactEmail ||
    tenderContact.contactPhone,
  );

  return (
    <Card className="rounded-xl border-border/60 shadow-xs overflow-hidden">
      <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/40 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Building className="h-4 w-4 text-blue-600" />
          Stakeholders & Contacts
        </CardTitle>
        {client && (
          <Link href={`/clients/${client.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-blue-600 hover:text-blue-700 px-2 cursor-pointer"
            >
              Client Hub
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Section 1: Client Account */}
        {client ? (
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Client Organization
              </span>
              <p className="text-sm font-bold text-foreground">
                {formatClientName(client.name)}
              </p>
            </div>

            {(client.contactName ||
              client.contactEmail ||
              client.contactPhone) && (
              <div className="rounded-lg border border-border/50 bg-background/50 p-2.5 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
                  <User className="h-3.5 w-3.5 text-blue-500" />
                  <span>Account Manager / Rep</span>
                </div>

                {client.contactName && (
                  <p className="font-semibold text-foreground pl-5">
                    {client.contactName}
                  </p>
                )}

                {client.contactEmail && (
                  <div className="flex items-center justify-between pl-5">
                    <a
                      href={`mailto:${client.contactEmail}`}
                      className="text-blue-600 hover:underline truncate mr-2"
                    >
                      {client.contactEmail}
                    </a>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                            onClick={() =>
                              copyToClipboard(client.contactEmail!, "Email")
                            }
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy Email</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}

                {client.contactPhone && (
                  <div className="flex items-center justify-between pl-5">
                    <a
                      href={`tel:${client.contactPhone}`}
                      className="text-foreground hover:text-blue-600 truncate mr-2"
                    >
                      {formatPhoneNumber(client.contactPhone)}
                    </a>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                            onClick={() =>
                              copyToClipboard(
                                client.contactPhone!,
                                "Phone number",
                              )
                            }
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy Phone</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/60 p-3 text-center text-xs text-muted-foreground">
            <Building className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/40" />
            <p className="font-medium">No client linked to this tender</p>
          </div>
        )}

        {/* Section 2: Tender Specific Contact */}
        <div className="border-t border-border/40 pt-3 space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-amber-500" />
            Tender Follow-up Contact
          </span>

          {hasTenderContact ? (
            <div className="rounded-lg border border-border/50 bg-background/50 p-2.5 space-y-2 text-xs">
              {tenderContact.contactName && (
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-semibold text-foreground">
                    {tenderContact.contactName}
                  </span>
                </div>
              )}

              {tenderContact.contactEmail && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 mr-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <a
                      href={`mailto:${tenderContact.contactEmail}`}
                      className="text-blue-600 hover:underline truncate"
                    >
                      {tenderContact.contactEmail}
                    </a>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                          onClick={() =>
                            copyToClipboard(
                              tenderContact.contactEmail!,
                              "Email",
                            )
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy Email</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}

              {tenderContact.contactPhone && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 mr-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <a
                      href={`tel:${tenderContact.contactPhone}`}
                      className="text-foreground hover:text-blue-600 truncate"
                    >
                      {formatPhoneNumber(tenderContact.contactPhone)}
                    </a>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                          onClick={() =>
                            copyToClipboard(
                              tenderContact.contactPhone!,
                              "Phone number",
                            )
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy Phone</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic pl-1">
              No tender-specific contact logged.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
