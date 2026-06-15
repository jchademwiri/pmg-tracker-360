'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getTenderBreadcrumbLabel } from '@/server/tenders';
import { getPurchaseOrderBreadcrumbLabel } from '@/server/purchase-orders';

const STATIC_SEGMENT_LABELS: Record<string, string> = {
  tenders: 'Tenders',
  overview: 'Overview',
  create: 'Add Tender',
  edit: 'Edit',
};

const TENDER_STATIC_ROUTES = new Set(['overview', 'create']);
const PURCHASE_ORDER_STATIC_ROUTES = new Set(['create', 'edit', 'deliveries', 'new']);

function formatSegmentName(segment: string) {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const [tenderLabels, setTenderLabels] = useState<Record<string, string>>({});
  const [purchaseOrderLabels, setPurchaseOrderLabels] = useState<Record<string, string>>({});

  const pathSegments = useMemo(
    () => pathname.split('/').filter(Boolean),
    [pathname]
  );

  useEffect(() => {
    const tenderId = pathSegments.find((segment, index) => {
      return (
        pathSegments[index - 1] === 'tenders' &&
        !TENDER_STATIC_ROUTES.has(segment)
      );
    });

    if (!tenderId || tenderLabels[tenderId]) {
      return;
    }

    let isMounted = true;

    getTenderBreadcrumbLabel(tenderId).then((label) => {
      if (!isMounted || !label) {
        return;
      }

      setTenderLabels((current) => ({
        ...current,
        [tenderId]: label,
      }));
    });

    return () => {
      isMounted = false;
    };
  }, [pathSegments, tenderLabels]);

  useEffect(() => {
    const purchaseOrderId = pathSegments.find((segment, index) => {
      return (
        pathSegments[index - 1] === 'purchase-orders' &&
        !PURCHASE_ORDER_STATIC_ROUTES.has(segment)
      );
    });

    if (!purchaseOrderId || purchaseOrderLabels[purchaseOrderId]) {
      return;
    }

    let isMounted = true;

    getPurchaseOrderBreadcrumbLabel(purchaseOrderId).then((label) => {
      if (!isMounted || !label) {
        return;
      }

      setPurchaseOrderLabels((current) => ({
        ...current,
        [purchaseOrderId]: label,
      }));
    });

    return () => {
      isMounted = false;
    };
  }, [pathSegments, purchaseOrderLabels]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>

        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1;
          const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
          const isTenderId =
            pathSegments[index - 1] === 'tenders' &&
            !TENDER_STATIC_ROUTES.has(segment);
          const isPurchaseOrderId =
            pathSegments[index - 1] === 'purchase-orders' &&
            !PURCHASE_ORDER_STATIC_ROUTES.has(segment);
          const displayName =
            (isTenderId ? tenderLabels[segment] : undefined) ||
            (isPurchaseOrderId ? purchaseOrderLabels[segment] : undefined) ||
            STATIC_SEGMENT_LABELS[segment] ||
            formatSegmentName(segment);

          return (
            <div key={`${href}-${segment}`} className="flex items-center">
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{displayName}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{displayName}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
