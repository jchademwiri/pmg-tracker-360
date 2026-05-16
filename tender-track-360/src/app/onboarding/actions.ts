import { db } from '@/db';
import { organization, member, session } from '@/db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';

const createOrganizationFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(50, 'Organization name must be less than 50 characters')
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      'Organization name can only contain letters, numbers, spaces, hyphens, and underscores'
    ),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(
      /^[a-z0-9\-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens'
    )
    .refine(
      (slug) => !slug.startsWith('-') && !slug.endsWith('-'),
      'Slug cannot start or end with a hyphen'
    ),
  logo: z.string().url('Logo must be a valid URL').optional().or(z.literal('')),
});

export async function createOrganization(
  form: z.infer<typeof createOrganizationFormSchema>
) {
  // Validate input
  const parsed = createOrganizationFormSchema.safeParse(form);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }
  const { name, slug, logo } = parsed.data;

  // Check slug uniqueness
  const existing = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });
  if (existing) {
    return {
      error:
        'This organization slug is already taken. Please choose a different one.',
    };
  }

  // Get current user from session cookie (Next.js 14+ cookies is async)
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) {
    return { error: 'Not authenticated.' };
  }
  const sessionRow = await db.query.session.findFirst({
    where: eq(session.token, sessionToken),
  });
  if (!sessionRow) {
    return { error: 'Session not found.' };
  }
  const userId = sessionRow.userId;

  // Create organization
  const orgId = nanoid();
  const now = new Date();
  const [org] = await db
    .insert(organization)
    .values({
      id: orgId,
      name,
      slug,
      logo: logo || undefined,
      createdAt: now,
    })
    .returning();

  // Add user as owner/admin member
  await db.insert(member).values({
    id: nanoid(),
    organizationId: orgId,
    userId,
    role: 'owner',
    createdAt: now,
  });

  // Update session to set active organization
  await db
    .update(session)
    .set({ activeOrganizationId: orgId })
    .where(eq(session.id, sessionRow.id));

  // Return org and redirect info
  return { data: org, redirect: '/dashboard' };
}
