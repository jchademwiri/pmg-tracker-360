/**
 * seed.ts — Development seed data for Tracker 360
 *
 * Uses the same IDs as the auth stub so the app works immediately.
 * Run with: bun run seed
 *
 * ⚠️  This will DELETE all existing data for the stub org before re-seeding.
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/schema';
import { eq } from 'drizzle-orm';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required');

const sql = neon(url);
const db = drizzle(sql, { schema });

// ─── Fixed IDs (must match auth stub) ────────────────────────────────────────
const ORG_ID = 'stub-org-id';
const USER_ID = 'stub-user-id';

// ─── Helper ──────────────────────────────────────────────────────────────────
const id = () => crypto.randomUUID();
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Seeding Tracker 360 development data...\n');

  // ── 1. Clean existing stub data ──────────────────────────────────────────
  console.log('🧹 Cleaning existing stub data...');
  // Delete in dependency order
  await db.delete(schema.purchaseOrder).where(eq(schema.purchaseOrder.organizationId, ORG_ID));
  await db.delete(schema.tenderExtension).where(eq(schema.tenderExtension.organizationId, ORG_ID));
  await db.delete(schema.project).where(eq(schema.project.organizationId, ORG_ID));
  await db.delete(schema.tender).where(eq(schema.tender.organizationId, ORG_ID));
  await db.delete(schema.client).where(eq(schema.client.organizationId, ORG_ID));
  await db.delete(schema.notification).where(eq(schema.notification.organizationId, ORG_ID));
  await db.delete(schema.member).where(eq(schema.member.organizationId, ORG_ID));
  await db.delete(schema.organization).where(eq(schema.organization.id, ORG_ID));
  // Delete all seed users by email (handles re-runs cleanly)
  for (const email of [
    'dev@tendertrack360.co.za',
    'sarah@tendertrack360.co.za',
    'thabo@tendertrack360.co.za',
    'zanele@tendertrack360.co.za',
  ]) {
    await db.delete(schema.user).where(eq(schema.user.email, email));
  }
  console.log('   ✓ Cleaned\n');

  // ── 2. Users ─────────────────────────────────────────────────────────────
  console.log('👤 Creating users...');
  const USER_ADMIN = id();
  const USER_MANAGER = id();
  const USER_MEMBER = id();

  await db.insert(schema.user).values([
    {
      id: USER_ID,
      name: 'Dev User',
      email: 'dev@tendertrack360.co.za',
      emailVerified: true,
      role: 'owner',
      plan: 'free',
      createdAt: daysAgo(90),
      updatedAt: new Date(),
    },
    { id: USER_ADMIN,   name: 'Sarah Mokoena',  email: 'sarah@tendertrack360.co.za',  emailVerified: true, role: 'user', plan: 'free', createdAt: daysAgo(60), updatedAt: new Date() },
    { id: USER_MANAGER, name: 'Thabo Nkosi',    email: 'thabo@tendertrack360.co.za',  emailVerified: true, role: 'user', plan: 'free', createdAt: daysAgo(45), updatedAt: new Date() },
    { id: USER_MEMBER,  name: 'Zanele Dlamini', email: 'zanele@tendertrack360.co.za', emailVerified: true, role: 'user', plan: 'free', createdAt: daysAgo(30), updatedAt: new Date() },
  ]);
  console.log('   ✓ 4 users created\n');

  // ── 3. Organisation ──────────────────────────────────────────────────────
  console.log('🏢 Creating organisation...');
  await db.insert(schema.organization).values({
    id: ORG_ID,
    name: 'PMG Construction (Pty) Ltd',
    slug: 'pmg-construction',
    createdAt: daysAgo(90),
  });

  // Members
  await db.insert(schema.member).values([
    { id: id(), organizationId: ORG_ID, userId: USER_ID,      role: 'owner',   createdAt: daysAgo(90) },
    { id: id(), organizationId: ORG_ID, userId: USER_ADMIN,   role: 'admin',   createdAt: daysAgo(60) },
    { id: id(), organizationId: ORG_ID, userId: USER_MANAGER, role: 'manager', createdAt: daysAgo(45) },
    { id: id(), organizationId: ORG_ID, userId: USER_MEMBER,  role: 'member',  createdAt: daysAgo(30) },
  ]);
  console.log('   ✓ Organisation + 4 members created\n');

  // ── 4. Clients ───────────────────────────────────────────────────────────
  console.log('👥 Creating clients...');
  const CLIENT_EKURHULENI = id();
  const CLIENT_JOBURG = id();
  const CLIENT_TSHWANE = id();
  const CLIENT_ESKOM = id();
  const CLIENT_TRANSNET = id();

  await db.insert(schema.client).values([
    {
      id: CLIENT_EKURHULENI,
      organizationId: ORG_ID,
      name: 'Ekurhuleni Metropolitan Municipality',
      notes: 'Primary municipal client. Procurement office on 3rd floor, Civic Centre.',
      contactName: 'Mr. Sipho Mahlangu',
      contactEmail: 'procurement@ekurhuleni.gov.za',
      contactPhone: '+27 11 999 0000',
      createdAt: daysAgo(80),
      updatedAt: daysAgo(10),
    },
    {
      id: CLIENT_JOBURG,
      organizationId: ORG_ID,
      name: 'City of Johannesburg',
      notes: 'Large infrastructure projects. Slow payment cycles — follow up at 45 days.',
      contactName: 'Ms. Nomsa Khumalo',
      contactEmail: 'tenders@joburg.org.za',
      contactPhone: '+27 11 407 6000',
      createdAt: daysAgo(75),
      updatedAt: daysAgo(5),
    },
    {
      id: CLIENT_TSHWANE,
      organizationId: ORG_ID,
      name: 'City of Tshwane',
      notes: 'Good payment record. Prefers detailed BOQ submissions.',
      contactName: 'Mr. Pieter van der Merwe',
      contactEmail: 'scm@tshwane.gov.za',
      contactPhone: '+27 12 358 9999',
      createdAt: daysAgo(70),
      updatedAt: daysAgo(20),
    },
    {
      id: CLIENT_ESKOM,
      organizationId: ORG_ID,
      name: 'Eskom Holdings SOC Ltd',
      notes: 'State-owned entity. Strict BBBEE requirements. 30-day payment terms.',
      contactName: 'Ms. Lerato Sithole',
      contactEmail: 'procurement@eskom.co.za',
      contactPhone: '+27 11 800 8111',
      createdAt: daysAgo(65),
      updatedAt: daysAgo(15),
    },
    {
      id: CLIENT_TRANSNET,
      organizationId: ORG_ID,
      name: 'Transnet SOC Ltd',
      notes: 'Rail and port infrastructure. High-value contracts.',
      contactName: 'Mr. Andile Mthembu',
      contactEmail: 'scm@transnet.net',
      contactPhone: '+27 11 308 3000',
      createdAt: daysAgo(60),
      updatedAt: daysAgo(8),
    },
  ]);
  console.log('   ✓ 5 clients created\n');

  // ── 5. Tenders ───────────────────────────────────────────────────────────
  console.log('📋 Creating tenders...');

  // Won tenders (will become projects)
  const TENDER_WON_1 = id();
  const TENDER_WON_2 = id();
  const TENDER_WON_3 = id();

  // Active tenders
  const TENDER_SUBMITTED_1 = id();
  const TENDER_SUBMITTED_2 = id();
  const TENDER_PENDING_1 = id();

  // Draft tenders
  const TENDER_DRAFT_1 = id();
  const TENDER_DRAFT_2 = id();

  // Lost tender
  const TENDER_LOST_1 = id();

  // Upcoming deadline tenders (for deadline widget)
  const TENDER_DUE_SOON_1 = id();
  const TENDER_DUE_SOON_2 = id();

  await db.insert(schema.tender).values([
    // ── Won ──
    {
      id: TENDER_WON_1,
      organizationId: ORG_ID,
      tenderNumber: 'EKU/2024/001',
      description: 'Supply and installation of street lighting — Tembisa Phase 3',
      clientId: CLIENT_EKURHULENI,
      submissionDate: daysAgo(120),
      evaluationDate: daysAgo(90),
      value: '4500000',
      status: 'won',
      createdAt: daysAgo(150),
      updatedAt: daysAgo(90),
    },
    {
      id: TENDER_WON_2,
      organizationId: ORG_ID,
      tenderNumber: 'JHB/2024/047',
      description: 'Rehabilitation of stormwater infrastructure — Soweto Zone 4',
      clientId: CLIENT_JOBURG,
      submissionDate: daysAgo(100),
      evaluationDate: daysAgo(70),
      value: '8200000',
      status: 'won',
      createdAt: daysAgo(130),
      updatedAt: daysAgo(70),
    },
    {
      id: TENDER_WON_3,
      organizationId: ORG_ID,
      tenderNumber: 'ESK/2024/012',
      description: 'Substation civil works — Lethabo Power Station',
      clientId: CLIENT_ESKOM,
      submissionDate: daysAgo(80),
      evaluationDate: daysAgo(50),
      value: '12750000',
      status: 'won',
      createdAt: daysAgo(110),
      updatedAt: daysAgo(50),
    },

    // ── Submitted ──
    {
      id: TENDER_SUBMITTED_1,
      organizationId: ORG_ID,
      tenderNumber: 'TSH/2025/003',
      description: 'Construction of community hall — Mamelodi East',
      clientId: CLIENT_TSHWANE,
      submissionDate: daysAgo(14),
      evaluationDate: daysFromNow(30),
      value: '6800000',
      status: 'submitted',
      createdAt: daysAgo(45),
      updatedAt: daysAgo(14),
    },
    {
      id: TENDER_SUBMITTED_2,
      organizationId: ORG_ID,
      tenderNumber: 'TRN/2025/008',
      description: 'Fencing and security upgrades — Germiston Rail Yard',
      clientId: CLIENT_TRANSNET,
      submissionDate: daysAgo(7),
      evaluationDate: daysFromNow(45),
      value: '3100000',
      status: 'submitted',
      createdAt: daysAgo(35),
      updatedAt: daysAgo(7),
    },

    // ── Pending evaluation ──
    {
      id: TENDER_PENDING_1,
      organizationId: ORG_ID,
      tenderNumber: 'EKU/2025/019',
      description: 'Upgrade of water reticulation network — Katlehong',
      clientId: CLIENT_EKURHULENI,
      submissionDate: daysAgo(30),
      evaluationDate: daysFromNow(15),
      value: '9400000',
      status: 'pending',
      createdAt: daysAgo(60),
      updatedAt: daysAgo(30),
    },

    // ── Drafts ──
    {
      id: TENDER_DRAFT_1,
      organizationId: ORG_ID,
      tenderNumber: 'JHB/2025/031',
      description: 'Road resurfacing — Alexandra Township main roads',
      clientId: CLIENT_JOBURG,
      submissionDate: daysFromNow(21),
      value: '5600000',
      status: 'draft',
      createdAt: daysAgo(10),
      updatedAt: daysAgo(2),
    },
    {
      id: TENDER_DRAFT_2,
      organizationId: ORG_ID,
      tenderNumber: 'ESK/2025/007',
      description: 'Electrical reticulation — Kusile Power Station Phase 2',
      clientId: CLIENT_ESKOM,
      submissionDate: daysFromNow(35),
      value: '18000000',
      status: 'draft',
      createdAt: daysAgo(5),
      updatedAt: daysAgo(1),
    },

    // ── Lost ──
    {
      id: TENDER_LOST_1,
      organizationId: ORG_ID,
      tenderNumber: 'TSH/2024/088',
      description: 'Supply of portable ablution facilities — Soshanguve',
      clientId: CLIENT_TSHWANE,
      submissionDate: daysAgo(60),
      evaluationDate: daysAgo(30),
      value: '1200000',
      status: 'lost',
      createdAt: daysAgo(90),
      updatedAt: daysAgo(30),
    },

    // ── Due soon (for deadline widget) ──
    {
      id: TENDER_DUE_SOON_1,
      organizationId: ORG_ID,
      tenderNumber: 'TRN/2025/015',
      description: 'Painting and waterproofing — Durban Container Terminal',
      clientId: CLIENT_TRANSNET,
      submissionDate: daysFromNow(3),
      value: '2800000',
      status: 'draft',
      createdAt: daysAgo(20),
      updatedAt: daysAgo(1),
    },
    {
      id: TENDER_DUE_SOON_2,
      organizationId: ORG_ID,
      tenderNumber: 'EKU/2025/022',
      description: 'Paving of informal settlement roads — Vosloorus',
      clientId: CLIENT_EKURHULENI,
      submissionDate: daysFromNow(7),
      value: '3900000',
      status: 'submitted',
      createdAt: daysAgo(25),
      updatedAt: daysAgo(3),
    },
  ]);
  console.log('   ✓ 11 tenders created\n');

  // ── 6. Tender Extensions ─────────────────────────────────────────────────
  console.log('📅 Creating tender extensions...');
  await db.insert(schema.tenderExtension).values([
    {
      id: id(),
      organizationId: ORG_ID,
      tenderId: TENDER_PENDING_1,
      extensionDate: daysAgo(10),
      newEvaluationDate: daysFromNow(15),
      contactName: 'Mr. Sipho Mahlangu',
      contactEmail: 'procurement@ekurhuleni.gov.za',
      contactPhone: '+27 11 999 0000',
      notes: 'Extension granted due to additional queries from evaluation committee.',
      createdBy: USER_ID,
      createdAt: daysAgo(10),
      updatedAt: daysAgo(10),
    },
    {
      id: id(),
      organizationId: ORG_ID,
      tenderId: TENDER_SUBMITTED_1,
      extensionDate: daysAgo(5),
      newEvaluationDate: daysFromNow(30),
      contactName: 'Ms. Nomsa Khumalo',
      contactEmail: 'tenders@joburg.org.za',
      contactPhone: '+27 11 407 6000',
      notes: 'Second extension — evaluation panel requested additional compliance documents.',
      createdBy: USER_ID,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    },
  ]);
  console.log('   ✓ 2 tender extensions created\n');

  // ── 7. Projects ──────────────────────────────────────────────────────────
  console.log('📁 Creating projects...');
  const PROJECT_1 = id();
  const PROJECT_2 = id();
  const PROJECT_3 = id();
  const PROJECT_4 = id(); // standalone (no tender)

  await db.insert(schema.project).values([
    {
      id: PROJECT_1,
      organizationId: ORG_ID,
      projectNumber: 'PRJ-2024-001',
      description: 'Supply and installation of street lighting — Tembisa Phase 3',
      tenderId: TENDER_WON_1,
      clientId: CLIENT_EKURHULENI,
      status: 'active',
      createdAt: daysAgo(85),
      updatedAt: daysAgo(5),
    },
    {
      id: PROJECT_2,
      organizationId: ORG_ID,
      projectNumber: 'PRJ-2024-002',
      description: 'Rehabilitation of stormwater infrastructure — Soweto Zone 4',
      tenderId: TENDER_WON_2,
      clientId: CLIENT_JOBURG,
      status: 'active',
      createdAt: daysAgo(65),
      updatedAt: daysAgo(3),
    },
    {
      id: PROJECT_3,
      organizationId: ORG_ID,
      projectNumber: 'PRJ-2024-003',
      description: 'Substation civil works — Lethabo Power Station',
      tenderId: TENDER_WON_3,
      clientId: CLIENT_ESKOM,
      status: 'active',
      createdAt: daysAgo(45),
      updatedAt: daysAgo(1),
    },
    {
      id: PROJECT_4,
      organizationId: ORG_ID,
      projectNumber: 'PRJ-2024-004',
      description: 'Emergency repairs — Ekurhuleni pump station',
      tenderId: null,
      clientId: CLIENT_EKURHULENI,
      status: 'completed',
      createdAt: daysAgo(120),
      updatedAt: daysAgo(30),
    },
  ]);
  console.log('   ✓ 4 projects created\n');

  // ── 8. Purchase Orders ───────────────────────────────────────────────────
  console.log('🛒 Creating purchase orders...');
  await db.insert(schema.purchaseOrder).values([
    // Project 1 — Street lighting
    {
      id: id(),
      organizationId: ORG_ID,
      projectId: PROJECT_1,
      poNumber: 'PO-2024-0001',
      supplierName: 'Osram South Africa (Pty) Ltd',
      description: 'Supply of LED street light fittings — 500 units',
      totalAmount: '1250000',
      status: 'delivered',
      poDate: daysAgo(75),
      expectedDeliveryDate: daysAgo(45),
      deliveredAt: daysAgo(43),
      deliveryAddress: '14 Industrial Road, Tembisa, 1632',
      createdAt: daysAgo(75),
      updatedAt: daysAgo(43),
    },
    {
      id: id(),
      organizationId: ORG_ID,
      projectId: PROJECT_1,
      poNumber: 'PO-2024-0002',
      supplierName: 'Voltex Electrical Distributors',
      description: 'Supply of underground cabling and conduit',
      totalAmount: '680000',
      status: 'delivered',
      poDate: daysAgo(70),
      expectedDeliveryDate: daysAgo(40),
      deliveredAt: daysAgo(38),
      deliveryAddress: '14 Industrial Road, Tembisa, 1632',
      createdAt: daysAgo(70),
      updatedAt: daysAgo(38),
    },
    {
      id: id(),
      organizationId: ORG_ID,
      projectId: PROJECT_1,
      poNumber: 'PO-2024-0003',
      supplierName: 'Concrete Structures CC',
      description: 'Supply and installation of concrete pole foundations',
      totalAmount: '420000',
      status: 'sent',
      poDate: daysAgo(20),
      expectedDeliveryDate: daysFromNow(10),
      deliveryAddress: '14 Industrial Road, Tembisa, 1632',
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },

    // Project 2 — Stormwater
    {
      id: id(),
      organizationId: ORG_ID,
      projectId: PROJECT_2,
      poNumber: 'PO-2024-0004',
      supplierName: 'Rocla Concrete Pipes',
      description: 'Supply of 600mm diameter concrete stormwater pipes',
      totalAmount: '1850000',
      status: 'delivered',
      poDate: daysAgo(55),
      expectedDeliveryDate: daysAgo(25),
      deliveredAt: daysAgo(22),
      deliveryAddress: 'Zone 4 Depot, Soweto',
      createdAt: daysAgo(55),
      updatedAt: daysAgo(22),
    },
    {
      id: id(),
      organizationId: ORG_ID,
      projectId: PROJECT_2,
      poNumber: 'PO-2024-0005',
      supplierName: 'Aveng Trident Steel',
      description: 'Supply of steel reinforcement bars and mesh',
      totalAmount: '390000',
      status: 'sent',
      poDate: daysAgo(15),
      expectedDeliveryDate: daysFromNow(5),
      deliveryAddress: 'Zone 4 Depot, Soweto',
      createdAt: daysAgo(15),
      updatedAt: daysAgo(15),
    },

    // Project 3 — Eskom substation
    {
      id: id(),
      organizationId: ORG_ID,
      projectId: PROJECT_3,
      poNumber: 'PO-2024-0006',
      supplierName: 'Murray & Roberts Plant Hire',
      description: 'Crane hire and heavy lifting equipment — 3 months',
      totalAmount: '780000',
      status: 'sent',
      poDate: daysAgo(40),
      expectedDeliveryDate: daysFromNow(50),
      deliveryAddress: 'Lethabo Power Station, Free State',
      createdAt: daysAgo(40),
      updatedAt: daysAgo(40),
    },
    {
      id: id(),
      organizationId: ORG_ID,
      projectId: PROJECT_3,
      poNumber: 'PO-2024-0007',
      supplierName: 'Lafarge Cement SA',
      description: 'Supply of 50kg cement bags — 2000 units',
      totalAmount: '145000',
      status: 'draft',
      poDate: daysAgo(5),
      expectedDeliveryDate: daysFromNow(14),
      deliveryAddress: 'Lethabo Power Station, Free State',
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    },

    // Project 4 — Completed
    {
      id: id(),
      organizationId: ORG_ID,
      projectId: PROJECT_4,
      poNumber: 'PO-2024-0008',
      supplierName: 'Grundfos Pumps SA',
      description: 'Emergency pump replacement — 2x 15kW submersible pumps',
      totalAmount: '320000',
      status: 'delivered',
      poDate: daysAgo(115),
      expectedDeliveryDate: daysAgo(100),
      deliveredAt: daysAgo(98),
      deliveryAddress: 'Ekurhuleni Pump Station, Boksburg',
      createdAt: daysAgo(115),
      updatedAt: daysAgo(98),
    },
  ]);
  console.log('   ✓ 8 purchase orders created\n');

  // ── 9. Notifications ─────────────────────────────────────────────────────
  console.log('🔔 Creating notifications...');
  await db.insert(schema.notification).values([
    {
      id: id(),
      userId: USER_ID,
      organizationId: ORG_ID,
      title: 'Tender deadline in 3 days',
      message: 'TRN/2025/015 — Painting and waterproofing — Durban Container Terminal is due on ' + daysFromNow(3).toLocaleDateString('en-ZA'),
      type: 'warning',
      read: false,
      link: '/dashboard/tenders',
      createdAt: daysAgo(1),
    },
    {
      id: id(),
      userId: USER_ID,
      organizationId: ORG_ID,
      title: 'PO delivered',
      message: 'PO-2024-0004 from Rocla Concrete Pipes has been marked as delivered.',
      type: 'success',
      read: false,
      link: '/dashboard/purchase-orders',
      createdAt: daysAgo(2),
    },
    {
      id: id(),
      userId: USER_ID,
      organizationId: ORG_ID,
      title: 'Tender won — EKU/2024/001',
      message: 'Congratulations! Street lighting tender for Ekurhuleni has been awarded.',
      type: 'success',
      read: true,
      link: '/dashboard/tenders',
      createdAt: daysAgo(90),
    },
    {
      id: id(),
      userId: USER_ID,
      organizationId: ORG_ID,
      title: 'Extension received',
      message: 'EKU/2025/019 evaluation date extended to ' + daysFromNow(15).toLocaleDateString('en-ZA'),
      type: 'info',
      read: true,
      link: '/dashboard/tenders',
      createdAt: daysAgo(10),
    },
  ]);
  console.log('   ✓ 4 notifications created\n');

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('✅ Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary:');
  console.log('   Organisation : PMG Construction (Pty) Ltd  [stub-org-id]');
  console.log('   Dev user     : dev@tendertrack360.co.za    [stub-user-id]');
  console.log('   Team members : 3 (admin, manager, member)');
  console.log('   Clients      : 5');
  console.log('   Tenders      : 11 (3 won, 2 submitted, 1 pending, 2 draft, 1 lost, 2 due soon)');
  console.log('   Extensions   : 2');
  console.log('   Projects     : 4 (3 active, 1 completed)');
  console.log('   Purchase Orders: 8 (3 delivered, 3 sent, 1 draft)');
  console.log('   Notifications: 4 (2 unread)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🚀 Start the app: bun run dev');
  console.log('   Tracker: http://localhost:3000/dashboard\n');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
