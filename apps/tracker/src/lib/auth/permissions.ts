import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements } from 'better-auth/plugins/organization/access';

const statement = {
  ...defaultStatements,
  project: ['create', 'read', 'update', 'delete', 'share'],
  tender: ['create', 'read', 'update', 'delete'],
  task: ['create', 'read', 'update', 'delete'],
  document: ['create', 'read', 'update', 'delete'],
  user: ['create', 'read', 'update', 'delete', 'manage'],
  organization: ['update', 'delete', 'transfer'],
  purchase_order: ['create', 'read', 'update', 'delete'],
} as const;

const ac = createAccessControl(statement);

const owner = ac.newRole({
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
  project: ['create', 'read', 'update', 'delete', 'share'],
  tender: ['create', 'read', 'update', 'delete'],
  task: ['create', 'read', 'update', 'delete'],
  document: ['create', 'read', 'update', 'delete'],
  user: ['create', 'read', 'update', 'delete', 'manage'],
  organization: ['update', 'delete', 'transfer'],
  purchase_order: ['create', 'read', 'update', 'delete'],
} as any);

const admin = ac.newRole({
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
  project: ['create', 'read', 'update', 'delete', 'share'],
  tender: ['create', 'read', 'update', 'delete'],
  task: ['create', 'read', 'update', 'delete'],
  document: ['create', 'read', 'update', 'delete'],
  user: ['create', 'read', 'update', 'delete', 'manage'],
  organization: ['update'],
  purchase_order: ['create', 'read', 'update', 'delete'],
} as any);

const manager = ac.newRole({
  member: ['create', 'update'],
  invitation: ['create', 'cancel'],
  project: ['create', 'read', 'update'],
  tender: ['create', 'read', 'update'],
  task: ['create', 'read', 'update', 'delete'],
  document: ['create', 'read', 'update', 'delete'],
  user: ['create', 'read', 'update'],
  purchase_order: ['create', 'read', 'update'],
} as any);

const member = ac.newRole({
  project: ['read'],
  tender: ['create', 'read', 'update'],
  task: ['create', 'read', 'update', 'delete'],
  document: ['create', 'read', 'update', 'delete'],
} as any);

export { owner, admin, manager, member, ac, statement };
