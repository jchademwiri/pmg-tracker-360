# Configuration Guide

This guide covers the configuration options available in Tender Track 360 and how to customize the system for your organization's needs.

## Environment Variables

### Required Variables

| Variable             | Description                   | Example                                                  |
| -------------------- | ----------------------------- | -------------------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string  | `postgresql://user:pass@localhost:5432/tender-track-360` |
| `BETTER_AUTH_SECRET` | Secret key for authentication | `your-32-character-secret-key`                           |
| `BETTER_AUTH_URL`    | Base URL of your application  | `http://localhost:3000`                                  |
| `UPLOADTHING_SECRET` | UploadThing API secret        | `sk_live_...`                                            |
| `UPLOADTHING_APP_ID` | UploadThing application ID    | `your-app-id`                                            |

### Optional Variables

| Variable                | Description          | Default                      |
| ----------------------- | -------------------- | ---------------------------- |
| `EMAIL_SERVER_HOST`     | SMTP server hostname | Not configured               |
| `EMAIL_SERVER_PORT`     | SMTP server port     | `587`                        |
| `EMAIL_SERVER_USER`     | SMTP username        | Not configured               |
| `EMAIL_SERVER_PASSWORD` | SMTP password        | Not configured               |
| `EMAIL_FROM`            | From email address   | `noreply@tendertrack360.com` |
| `NODE_ENV`              | Environment mode     | `development`                |

## Database Configuration

### Local Development

For local development, you can use PostgreSQL installed on your machine:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tender-track-360
```

### Production (Neon)

For production, we recommend using Neon for managed PostgreSQL:

```env
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
```

### Database Schema Management

The application uses Drizzle ORM for database management. Key commands:

```bash
# Push schema changes to database
pnpm db:push

# Generate migrations
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Open database studio
pnpm db:studio
```

## Authentication Configuration

### Better Auth Setup

Better Auth is configured automatically with your database. Key features:

- **Email/Password Authentication** - Standard login system
- **Organization-based Multi-tenancy** - Users belong to organizations
- **Role-based Access Control** - Admin, Manager, Specialist, Viewer roles
- **Session Management** - Secure session handling

### User Roles

| Role           | Permissions                           | Use Case                           |
| -------------- | ------------------------------------- | ---------------------------------- |
| **Admin**      | Full system access, user management   | System administrators              |
| **Manager**    | Portfolio oversight, team management  | Department heads, project managers |
| **Specialist** | Tender execution, document management | Tender officers, analysts          |
| **Viewer**     | Read-only access                      | Stakeholders, external consultants |

## File Storage Configuration

### UploadThing Setup

1. **Create Account**: Sign up at [uploadthing.com](https://uploadthing.com)
2. **Create App**: Set up a new application
3. **Configure Settings**:
   - Max file size: 10MB (recommended)
   - Allowed file types: PDF, DOC, DOCX, XLS, XLSX, images
   - Storage region: Choose closest to your users

### File Organization

Files are automatically organized in UploadThing using this structure:

```
/organization-name/
  ├── tender-{id}/
  │   ├── tender-notice/
  │   ├── technical-specs/
  │   ├── financial-proposal/
  │   ├── legal-documents/
  │   ├── correspondence/
  │   └── submissions/
```

## Email Configuration (Optional)

### SMTP Setup

Configure email for notifications and system communications:

```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourcompany.com
```

### Supported Email Providers

- **Gmail**: Use app passwords for authentication
- **Outlook/Office 365**: Standard SMTP configuration
- **SendGrid**: Use API key as password
- **AWS SES**: Configure with IAM credentials

### Email Features

When configured, the system will send:

- Welcome emails for new users
- Deadline reminder notifications
- Extension request notifications
- System alerts and updates

## Application Configuration

### Organization Settings

After initial setup, configure your organization:

1. **Organization Name** - Your company/department name
2. **Contact Information** - Primary contact details
3. **Branding** - Logo and color scheme (future feature)
4. **Default Settings** - Tender categories, reminder schedules

### System Defaults

Key system defaults you can customize:

```typescript
// Example configuration (future feature)
const systemConfig = {
  defaultReminderDays: [7, 3, 1], // Days before deadline
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
  defaultTenderCategories: [
    'Construction',
    'IT Services',
    'Professional Services',
    'Supplies',
  ],
};
```

## Security Configuration

### Authentication Security

- **Session Duration**: 30 days (configurable)
- **Password Requirements**: Minimum 8 characters
- **Rate Limiting**: Built-in protection against brute force
- **CSRF Protection**: Automatic CSRF token validation

### File Upload Security

- **File Type Validation**: Only allowed file types accepted
- **File Size Limits**: Configurable maximum file size
- **Virus Scanning**: Integrated with UploadThing security
- **Access Control**: Role-based file access permissions

### Database Security

- **Connection Encryption**: SSL/TLS required for production
- **Query Parameterization**: Protection against SQL injection
- **Audit Logging**: All database changes are logged
- **Backup Strategy**: Automated backups through Neon

## Performance Configuration

### Database Optimization

- **Connection Pooling**: Automatic connection management
- **Query Optimization**: Indexed queries for performance
- **Caching Strategy**: Built-in query result caching

### File Storage Optimization

- **CDN Integration**: UploadThing provides global CDN
- **Compression**: Automatic file compression
- **Lazy Loading**: Files loaded on demand

## Monitoring and Logging

### Application Monitoring

- **Error Tracking**: Built-in error logging
- **Performance Metrics**: Response time monitoring
- **User Activity**: Audit trail for all actions

### Health Checks

The application provides health check endpoints:

- `/api/health` - Basic application health
- `/api/health/db` - Database connectivity
- `/api/health/storage` - File storage connectivity

## Environment-Specific Configuration

### Development

```env
NODE_ENV=development
BETTER_AUTH_URL=http://localhost:3000
# Enable debug logging
DEBUG=true
```

### Staging

```env
NODE_ENV=staging
BETTER_AUTH_URL=https://staging.yourapp.com
# Reduced logging
DEBUG=false
```

### Production

```env
NODE_ENV=production
BETTER_AUTH_URL=https://yourapp.com
# Minimal logging, maximum security
DEBUG=false
```

## Troubleshooting Configuration

### Common Configuration Issues

**Environment Variables Not Loading:**

- Ensure `.env.local` is in the root directory
- Restart the development server after changes
- Check for typos in variable names

**Database Connection Issues:**

- Verify DATABASE_URL format
- Check network connectivity
- Ensure database exists and is accessible

**File Upload Problems:**

- Verify UploadThing API keys
- Check file size and type restrictions
- Review UploadThing dashboard for errors

### Configuration Validation

The application validates configuration on startup and will show helpful error messages for missing or invalid configuration.

---

**Next Step:** [First Steps Guide](./first-steps.md)
