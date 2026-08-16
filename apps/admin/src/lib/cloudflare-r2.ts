import 'server-only';

export type BucketUsage = {
  name: string;
  isCurrentApp: boolean;
  objectCount: number;
  sizeBytes: number;
  sizeMB: number;
  sizeGB: number;
  percentage: number;
};

export type CloudflareStorageOverview = {
  connectedLiveApi: boolean;
  totalCapacityGB: number;
  totalCapacityMB: number;
  totalUsedBytes: number;
  totalUsedMB: number;
  totalUsedGB: number;
  availableStorageGB: number;
  availableStorageMB: number;
  utilizationPct: number;
  warningStatus: 'healthy' | 'warning' | 'critical';
  buckets: BucketUsage[];
  pmgDocumentCount: number;
  pmgStorageBytes: number;
  pmgStorageMB: number;
  pmgStorageGB: number;
  otherAppsStorageMB: number;
  otherAppsStorageGB: number;
};

/**
 * Default tier is Cloudflare's 10 GB free tier.
 * Can be overridden via PLATFORM_STORAGE_LIMIT_GB or CLOUDFLARE_R2_STORAGE_LIMIT_GB.
 */
export function getStorageCapacityLimitGB(): number {
  const envLimit =
    process.env.PLATFORM_STORAGE_LIMIT_GB ||
    process.env.CLOUDFLARE_R2_STORAGE_LIMIT_GB ||
    process.env.S3_STORAGE_LIMIT_GB;

  if (envLimit && !isNaN(Number(envLimit)) && Number(envLimit) > 0) {
    return Number(envLimit);
  }
  return 10; // Default 10 GB Cloudflare Free Tier
}

/**
 * Dynamically queries Cloudflare R2 API across all buckets in the account.
 * Falls back to DB-tracked storage if CLOUDFLARE_API_TOKEN is not set or if network fails.
 */
export async function getCloudflareR2StorageStats(
  pmgDbBytes: number,
  pmgDocCount: number
): Promise<CloudflareStorageOverview> {
  const totalCapacityGB = getStorageCapacityLimitGB();
  const totalCapacityMB = totalCapacityGB * 1024;

  const accountId = process.env.R2_ACCOUNT_ID;
  const currentBucketName = process.env.R2_BUCKET_NAME || 'pmg-tracker-360';
  const apiToken =
    process.env.CLOUDFLARE_API_TOKEN || process.env.R2_API_TOKEN;

  const pmgStorageMB = Number((pmgDbBytes / (1024 * 1024)).toFixed(2));
  const pmgStorageGB = Number((pmgDbBytes / (1024 * 1024 * 1024)).toFixed(3));

  // If no Cloudflare API token is configured, return DB-tracked usage with single configured bucket
  if (!accountId || !apiToken) {
    const totalUsedBytes = pmgDbBytes;
    const totalUsedMB = pmgStorageMB;
    const totalUsedGB = pmgStorageGB;
    const availableStorageMB = Math.max(0, Number((totalCapacityMB - totalUsedMB).toFixed(2)));
    const availableStorageGB = Math.max(0, Number((availableStorageMB / 1024).toFixed(3)));
    const utilizationPct = Math.min(100, Number(((totalUsedMB / totalCapacityMB) * 100).toFixed(1)));

    let warningStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (utilizationPct >= 90) warningStatus = 'critical';
    else if (utilizationPct >= 75) warningStatus = 'warning';

    return {
      connectedLiveApi: false,
      totalCapacityGB,
      totalCapacityMB,
      totalUsedBytes,
      totalUsedMB,
      totalUsedGB,
      availableStorageGB,
      availableStorageMB,
      utilizationPct,
      warningStatus,
      buckets: [
        {
          name: currentBucketName,
          isCurrentApp: true,
          objectCount: pmgDocCount,
          sizeBytes: pmgDbBytes,
          sizeMB: pmgStorageMB,
          sizeGB: pmgStorageGB,
          percentage: 100,
        },
      ],
      pmgDocumentCount: pmgDocCount,
      pmgStorageBytes: pmgDbBytes,
      pmgStorageMB,
      pmgStorageGB,
      otherAppsStorageMB: 0,
      otherAppsStorageGB: 0,
    };
  }

  try {
    // 1. Enumerate all buckets in the Cloudflare Account
    const bucketsRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 300 }, // cache for 5 minutes
      }
    );

    if (!bucketsRes.ok) {
      throw new Error(`Cloudflare R2 Buckets API returned HTTP ${bucketsRes.status}`);
    }

    const bucketsData = await bucketsRes.json();
    const rawBuckets: Array<{ name: string; creation_date?: string }> =
      bucketsData.result?.buckets || [];

    if (rawBuckets.length === 0) {
      throw new Error('No buckets found in Cloudflare account');
    }

    // 2. Query usage for each bucket in parallel
    const bucketPromises = rawBuckets.map(async (b) => {
      const isCurrent = b.name.toLowerCase() === currentBucketName.toLowerCase();
      try {
        const usageRes = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${encodeURIComponent(b.name)}/usage`,
          {
            headers: {
              Authorization: `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
            next: { revalidate: 300 },
          }
        );

        if (usageRes.ok) {
          const usageJson = await usageRes.json();
          const payload = usageJson.result || {};
          const sizeBytes = Number(payload.payloadSize || payload.storage || 0);
          const objectCount = Number(payload.objectCount || payload.objects || 0);

          return {
            name: b.name,
            isCurrentApp: isCurrent,
            objectCount: isCurrent ? Math.max(objectCount, pmgDocCount) : objectCount,
            sizeBytes: isCurrent ? Math.max(sizeBytes, pmgDbBytes) : sizeBytes,
            sizeMB: Number(((isCurrent ? Math.max(sizeBytes, pmgDbBytes) : sizeBytes) / (1024 * 1024)).toFixed(2)),
            sizeGB: Number(((isCurrent ? Math.max(sizeBytes, pmgDbBytes) : sizeBytes) / (1024 * 1024 * 1024)).toFixed(3)),
            percentage: 0,
          };
        }
      } catch (err) {
        console.warn(`Could not fetch usage for bucket ${b.name}:`, err);
      }

      // Fallback per-bucket if usage endpoint is unavailable
      const fallbackBytes = isCurrent ? pmgDbBytes : 0;
      return {
        name: b.name,
        isCurrentApp: isCurrent,
        objectCount: isCurrent ? pmgDocCount : 0,
        sizeBytes: fallbackBytes,
        sizeMB: Number((fallbackBytes / (1024 * 1024)).toFixed(2)),
        sizeGB: Number((fallbackBytes / (1024 * 1024 * 1024)).toFixed(3)),
        percentage: 0,
      };
    });

    const bucketResults = await Promise.all(bucketPromises);

    // Sum across all buckets
    const totalUsedBytes = bucketResults.reduce((acc, b) => acc + b.sizeBytes, 0);
    const totalUsedMB = Number((totalUsedBytes / (1024 * 1024)).toFixed(2));
    const totalUsedGB = Number((totalUsedBytes / (1024 * 1024 * 1024)).toFixed(3));

    // Calculate percentage per bucket
    const safeTotalBytes = totalUsedBytes || 1;
    bucketResults.forEach((b) => {
      b.percentage = Math.round((b.sizeBytes / safeTotalBytes) * 100);
    });

    // Sort buckets: current app first, then largest to smallest
    bucketResults.sort((a, b) => {
      if (a.isCurrentApp) return -1;
      if (b.isCurrentApp) return 1;
      return b.sizeBytes - a.sizeBytes;
    });

    const otherAppsStorageMB = Math.max(0, Number((totalUsedMB - pmgStorageMB).toFixed(2)));
    const otherAppsStorageGB = Math.max(0, Number((totalUsedGB - pmgStorageGB).toFixed(3)));

    const availableStorageMB = Math.max(0, Number((totalCapacityMB - totalUsedMB).toFixed(2)));
    const availableStorageGB = Math.max(0, Number((availableStorageMB / 1024).toFixed(3)));
    const utilizationPct = Math.min(100, Number(((totalUsedMB / totalCapacityMB) * 100).toFixed(1)));

    let warningStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (utilizationPct >= 90) warningStatus = 'critical';
    else if (utilizationPct >= 75) warningStatus = 'warning';

    return {
      connectedLiveApi: true,
      totalCapacityGB,
      totalCapacityMB,
      totalUsedBytes,
      totalUsedMB,
      totalUsedGB,
      availableStorageGB,
      availableStorageMB,
      utilizationPct,
      warningStatus,
      buckets: bucketResults,
      pmgDocumentCount: pmgDocCount,
      pmgStorageBytes: pmgDbBytes,
      pmgStorageMB,
      pmgStorageGB,
      otherAppsStorageMB,
      otherAppsStorageGB,
    };
  } catch (error) {
    console.error('Error fetching live Cloudflare R2 storage metrics:', error);

    // Graceful fallback to DB-tracked PMG storage
    const totalUsedBytes = pmgDbBytes;
    const totalUsedMB = pmgStorageMB;
    const totalUsedGB = pmgStorageGB;
    const availableStorageMB = Math.max(0, Number((totalCapacityMB - totalUsedMB).toFixed(2)));
    const availableStorageGB = Math.max(0, Number((availableStorageMB / 1024).toFixed(3)));
    const utilizationPct = Math.min(100, Number(((totalUsedMB / totalCapacityMB) * 100).toFixed(1)));

    let warningStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (utilizationPct >= 90) warningStatus = 'critical';
    else if (utilizationPct >= 75) warningStatus = 'warning';

    return {
      connectedLiveApi: false,
      totalCapacityGB,
      totalCapacityMB,
      totalUsedBytes,
      totalUsedMB,
      totalUsedGB,
      availableStorageGB,
      availableStorageMB,
      utilizationPct,
      warningStatus,
      buckets: [
        {
          name: currentBucketName,
          isCurrentApp: true,
          objectCount: pmgDocCount,
          sizeBytes: pmgDbBytes,
          sizeMB: pmgStorageMB,
          sizeGB: pmgStorageGB,
          percentage: 100,
        },
      ],
      pmgDocumentCount: pmgDocCount,
      pmgStorageBytes: pmgDbBytes,
      pmgStorageMB,
      pmgStorageGB,
      otherAppsStorageMB: 0,
      otherAppsStorageGB: 0,
    };
  }
}
