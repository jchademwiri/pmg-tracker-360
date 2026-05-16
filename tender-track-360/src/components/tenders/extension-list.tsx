'use client';

import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Phone, Mail, FileText } from 'lucide-react';
import { ExtensionForm } from './extension-form';

export interface ExtendedTenderExtension {
  id: string;
  extensionDate: Date;
  newEvaluationDate: Date;
  contactName: string | null;
  contactEmail: string;
  contactPhone: string | null;
  notes: string | null;
  createdByUser: {
    name: string;
    image: string | null;
  } | null;
}

interface ExtensionListProps {
  extensions: ExtendedTenderExtension[];
  organizationId: string;
  tenderId: string;
}

export function ExtensionList({
  extensions,
  organizationId,
  tenderId,
}: ExtensionListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Extension History</h3>
        <ExtensionForm organizationId={organizationId} tenderId={tenderId} />
      </div>

      {extensions.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
            <Calendar className="h-10 w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="text-lg font-medium">No extensions recorded</p>
              <p className="text-sm text-muted-foreground">
                Add an extension to extend the evaluation period.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {extensions.map((ext) => (
            <Card key={ext.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    Extended on {format(new Date(ext.extensionDate), 'PPP')}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    New Deadline:{' '}
                    {format(new Date(ext.newEvaluationDate), 'PPP')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                {ext.notes && (
                  <div className="bg-muted/30 p-3 rounded-md italic text-muted-foreground">
                    "{ext.notes}"
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Contact Person
                    </p>
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      <span>{ext.contactName || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Contact Details
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        <a
                          href={`mailto:${ext.contactEmail}`}
                          className="hover:underline text-primary"
                        >
                          {ext.contactEmail}
                        </a>
                      </div>
                      {ext.contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" />
                          <a
                            href={`tel:${ext.contactPhone}`}
                            className="hover:underline"
                          >
                            {ext.contactPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    Recorded by{' '}
                    <span className="font-medium text-foreground">
                      {ext.createdByUser?.name || 'Unknown'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
