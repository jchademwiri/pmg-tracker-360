/**
 * Better Auth access control — custom roles and permissions.
 *
 * Defines owner / admin / manager / member with resource-level permissions.
 * Passed to the organization plugin on both server (auth.ts) and client.
 *
 * Based on the original tender-track-360 permissions model.
 */

import { createAccessControl } from 'better-auth/plugins/access';
import {
  adminAc,
  defaultStatements,
} from 'better-auth/plugins/organization/access';

export const statement = {
  ...defaultStatements,
  project: ['create', 'read', 'update', 'delete', 'share'],
  tender: ['create', 'read', 'update', 'delete'],
  task: ['create', 'read', 'update', 'delete'],
  document: ['create', 'read', 'update', 'delete'],
  user: ['create', 'read', 'update', 'delete', 'manage'],
  organization: ['update', 'delete', 'transfer'],
  purchase_order: ['create', 'read', 'update', 'delete'],
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
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

export const admin = ac.newRole({
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
  project: ['create', 'read', 'update', 'delete', 'share'],
  tender: ['create', 'read', 'update', 'delete'],
  task: ['create', 'read', 'update', 'delete'],
  document: ['create', 'read', 'update', 'delete'],
  user: ['create', 'read', 'update', 'delete', 'manage'],
  organization: ['update'], // no delete or transfer
  purchase_order: ['create', 'read', 'update', 'delete'],
} as any);

export const manager = ac.newRole({
  member: ['create', 'update'],
  invitation: ['create', 'cancel'],
  project: ['create', 'read', 'update'],
  tender: ['create', 'read', 'update', 'delete'],
  task: ['create', 'read', 'update', 'delete'],
  document: ['create', 'read', 'update', 'delete'],
  user: ['create', 'read', 'update'],
  purchase_order: ['create', 'read', 'update'],
} as any);

export const member = ac.newRole({
  project: ['read'],
  tender: ['create', 'read', 'update', 'delete'],
  task: ['create', 'read', 'update', 'delete'],
  document: ['create', 'read', 'update', 'delete'],
} as any);
