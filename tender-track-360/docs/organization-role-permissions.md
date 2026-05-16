# Organization Role Permissions Matrix

| Permission/Action               | Owner                    | Admin                     | Member               |
| ------------------------------- | ------------------------ | ------------------------- | -------------------- |
| **General Settings**            |
| View organization info          | ✅                       | ✅                        | ✅                   |
| Edit organization name          | ✅                       | ✅                        | ❌                   |
| Edit organization description   | ✅                       | ✅                        | ❌                   |
| Upload/change organization logo | ✅                       | ✅                        | ❌                   |
| Change organization slug        | ✅                       | ❌                        | ❌                   |
| Set organization visibility     | ✅                       | ✅                        | ❌                   |
| **Member Management**           |
| View member list                | ✅                       | ✅                        | ✅ (limited info)    |
| Invite new members              | ✅ (any role)            | ✅ (member/admin only)    | ❌                   |
| Remove members                  | ✅ (anyone)              | ✅ (except owner)         | ❌                   |
| Change member roles             | ✅ (to any role)         | ✅ (member ↔ admin only) | ❌                   |
| View member details             | ✅ (full access)         | ✅ (full access)          | ✅ (basic info only) |
| Manage pending invitations      | ✅                       | ✅                        | ❌                   |
| **Organization Preferences**    |
| Configure feature toggles       | ✅                       | ✅ (most features)        | ❌                   |
| Set notification preferences    | ✅                       | ✅                        | ❌                   |
| Configure integrations          | ✅                       | ✅                        | ❌                   |
| Set default member role         | ✅                       | ❌                        | ❌                   |
| **Security Settings**           |
| View security settings          | ✅                       | ✅                        | ❌                   |
| Configure 2FA requirements      | ✅                       | ✅                        | ❌                   |
| Set session timeout             | ✅                       | ✅                        | ❌                   |
| Manage IP whitelist             | ✅                       | ❌                        | ❌                   |
| View audit logs                 | ✅                       | ✅                        | ❌                   |
| Access advanced security        | ✅                       | ❌                        | ❌                   |
| **Billing & Subscription**      |
| View billing information        | ✅                       | ❌                        | ❌                   |
| Manage payment methods          | ✅                       | ❌                        | ❌                   |
| Change subscription plans       | ✅                       | ❌                        | ❌                   |
| View billing history            | ✅                       | ❌                        | ❌                   |
| Download invoices               | ✅                       | ❌                        | ❌                   |
| **Danger Zone**                 |
| Transfer ownership              | ✅                       | ❌                        | ❌                   |
| Delete organization             | ✅                       | ❌                        | ❌                   |
| Export organization data        | ✅                       | ❌                        | ❌                   |
| **Personal Actions**            |
| Leave organization              | ❌ (must transfer first) | ✅                        | ✅                   |
| View own role/permissions       | ✅                       | ✅                        | ✅                   |
| **Special Protections**         |
| Can be removed by others        | ❌                       | ✅ (by owner)             | ✅ (by owner/admin)  |
| Can be demoted                  | ❌ (only via transfer)   | ✅ (by owner)             | ✅ (by owner/admin)  |
| Role can be changed             | ❌ (only via transfer)   | ✅ (by owner)             | ✅ (by owner/admin)  |

## Legend

- ✅ = Full access/permission
- ❌ = No access/permission
- ✅ (condition) = Conditional access with specified limitations

## Key Notes

- **Owner** has ultimate authority and cannot be restricted by anyone
- **Admin** can manage day-to-day operations but has specific limitations
- **Member** has read-only access with ability to leave organization
- Only **Owner** can access billing and perform organization lifecycle operations
- **Owner** must transfer ownership before leaving the organization

## Role Hierarchy

```
Owner (Ultimate Authority)
  ↓
Admin (Day-to-day Management)
  ↓
Member (Read-only Access)
```

## Common Use Cases

### Owner Responsibilities

- Strategic organization decisions
- Financial management and billing
- Organization lifecycle (creation, deletion, transfer)
- Ultimate security and access control
- Appointing and managing administrators

### Admin Responsibilities

- Daily organization management
- Member onboarding and basic role management
- Content and project oversight
- Basic security configuration
- Reporting to owner on organization status

### Member Responsibilities

- Participate in organization activities
- Follow organization policies and guidelines
- Report issues to admins or owners
- Maintain their own profile and preferences
