"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getTenderBreadcrumbLabel } from "@/server/tenders";
import {
  getProjectLineItemBreadcrumbLabel,
  getPurchaseOrderBreadcrumbLabel,
} from "@/server/purchase-orders";
import { getProjectBreadcrumbLabel } from "@/server/projects";
import { getClientBreadcrumbLabel } from "@/server/clients";

const STATIC_SEGMENT_LABELS: Record<string, string> = {
  tenders: "Tenders",
  overview: "Overview",
  edit: "Edit",
  projects: "Projects",
  clients: "Clients",
  items: "Items",
  new: "New",
  deliveries: "Deliveries",
  contracts: "Contracts",
  "purchase-orders": "Purchase Orders",
};

/**
 * Context-aware labels for the "create" segment.
 * Determines the correct label based on the parent segment in the URL.
 */
function getCreateLabel(pathSegments: string[], index: number): string {
  const parentSegment = pathSegments[index - 1];
  switch (parentSegment) {
    case "tenders":
      return "Add Tender";
    case "projects":
      return "Create Project";
    case "purchase-orders":
      return "Create PO";
    case "items":
      return "New Item";
    case "deliveries":
      return "New Delivery";
    default:
      return "Create";
  }
}

const TENDER_STATIC_ROUTES = new Set(["overview", "create"]);
const PROJECT_STATIC_ROUTES = new Set([
  "overview",
  "create",
  "purchase-orders",
  "contracts",
]);
const PURCHASE_ORDER_STATIC_ROUTES = new Set([
  "create",
  "edit",
  "deliveries",
  "new",
]);

function formatSegmentName(segment: string) {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const [tenderLabels, setTenderLabels] = useState<Record<string, string>>({});
  const [projectLabels, setProjectLabels] = useState<Record<string, string>>(
    {},
  );
  const [purchaseOrderLabels, setPurchaseOrderLabels] = useState<
    Record<string, string>
  >({});
  const [projectLineItemLabels, setProjectLineItemLabels] = useState<
    Record<string, string>
  >({});
  const [clientLabels, setClientLabels] = useState<Record<string, string>>({});

  const pathSegments = useMemo(
    () => pathname.split("/").filter(Boolean),
    [pathname],
  );

  useEffect(() => {
    const tenderId = pathSegments.find((segment, index) => {
      return (
        pathSegments[index - 1] === "tenders" &&
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
    const projectId = pathSegments.find((segment, index) => {
      return (
        pathSegments[index - 1] === "projects" &&
        !PROJECT_STATIC_ROUTES.has(segment)
      );
    });

    if (!projectId || projectLabels[projectId]) {
      return;
    }

    let isMounted = true;

    getProjectBreadcrumbLabel(projectId).then((label) => {
      if (!isMounted || !label) {
        return;
      }

      setProjectLabels((current) => ({
        ...current,
        [projectId]: label,
      }));
    });

    return () => {
      isMounted = false;
    };
  }, [pathSegments, projectLabels]);

  useEffect(() => {
    const purchaseOrderId = pathSegments.find((segment, index) => {
      return (
        pathSegments[index - 1] === "purchase-orders" &&
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

  useEffect(() => {
    const projectLineItemId = pathSegments.find((segment, index) => {
      return pathSegments[index - 1] === "items" && !["new"].includes(segment);
    });

    if (!projectLineItemId || projectLineItemLabels[projectLineItemId]) {
      return;
    }

    let isMounted = true;

    getProjectLineItemBreadcrumbLabel(projectLineItemId).then((label) => {
      if (!isMounted || !label) {
        return;
      }

      setProjectLineItemLabels((current) => ({
        ...current,
        [projectLineItemId]: label,
      }));
    });

    return () => {
      isMounted = false;
    };
  }, [pathSegments, projectLineItemLabels]);

  useEffect(() => {
    const clientId = pathSegments.find((segment, index) => {
      return pathSegments[index - 1] === "clients" && segment !== "create";
    });

    if (!clientId || clientLabels[clientId]) {
      return;
    }

    let isMounted = true;

    getClientBreadcrumbLabel(clientId).then((label) => {
      if (!isMounted || !label) {
        return;
      }

      setClientLabels((current) => ({
        ...current,
        [clientId]: label,
      }));
    });

    return () => {
      isMounted = false;
    };
  }, [pathSegments, clientLabels]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>

        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1;
          const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
          const isTenderId =
            pathSegments[index - 1] === "tenders" &&
            !TENDER_STATIC_ROUTES.has(segment);
          const isPurchaseOrderId =
            pathSegments[index - 1] === "purchase-orders" &&
            !PURCHASE_ORDER_STATIC_ROUTES.has(segment);
          const isProjectId =
            pathSegments[index - 1] === "projects" &&
            !PROJECT_STATIC_ROUTES.has(segment);
          const isProjectLineItemId =
            pathSegments[index - 1] === "items" && segment !== "new";
          const isClientId =
            pathSegments[index - 1] === "clients" && segment !== "create";
          const isCreateSegment = segment === "create";
          const displayName =
            (isTenderId ? tenderLabels[segment] : undefined) ||
            (isProjectId ? projectLabels[segment] : undefined) ||
            (isPurchaseOrderId ? purchaseOrderLabels[segment] : undefined) ||
            (isProjectLineItemId
              ? projectLineItemLabels[segment]
              : undefined) ||
            (isClientId ? clientLabels[segment] : undefined) ||
            (isCreateSegment
              ? getCreateLabel(pathSegments, index)
              : undefined) ||
            STATIC_SEGMENT_LABELS[segment] ||
            formatSegmentName(segment);

          return (
            <Fragment key={`${href}-${segment}`}>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="min-w-0">
                {isLast ? (
                  <BreadcrumbPage className="max-w-[110px] sm:max-w-none truncate inline-block">
                    {displayName}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href={href}
                    className="max-w-[90px] sm:max-w-none truncate inline-block"
                  >
                    {displayName}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
