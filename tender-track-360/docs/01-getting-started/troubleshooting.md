# Troubleshooting Guide

This guide helps you resolve common issues you might encounter while setting up or using Tender Track 360.

## 🚨 Common Installation Issues

### Database Connection Problems

**Issue**: `Error: Connection to database failed`

**Possible Causes:**

- PostgreSQL not running
- Incorrect DATABASE_URL
- Network connectivity issues
- Database doesn't exist

**Solutions:**

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # macOS

# Verify database exists
psql -h localhost -U postgres -l

# Test connection string
psql "postgresql://postgres:postgres@localhost:5432/tender-track-360"

# Create database if missing
createdb tender-track-360
```

### Environment Variables Not Loading

**Issue**: Application can't find environment variables

**Possible Causes:**

- `.env.local` file missing
- Incorrect file location
- Typos in variable names
- Server not restarted after changes

**Solutions:**

```bash
# Verify .env.local exists in root directory
ls -la .env.local

# Check file contents (without exposing secrets)
grep -v "SECRET\|PASSWORD" .env.local

# Restart development server
pnpm dev
```

### File Upload Failures

**Issue**: Files won't upload or upload fails silently

**Possible Causes:**

- UploadThing API keys incorrect
- File size too large
- Unsupported file type
- Network connectivity issues

**Solutions:**

```bash
# Verify UploadThing configuration
echo $UPLOADTHING_SECRET | head -c 10  # Should show first 10 chars
echo $UPLOADTHING_APP_ID

# Check file size (max 10MB by default)
ls -lh your-file.pdf

# Test with smaller file
# Try different file type (PDF, DOC, etc.)
```

### Build Errors

**Issue**: `pnpm build` fails with TypeScript errors

**Possible Causes:**

- Type errors in code
- Missing dependencies
- Outdated packages
- Configuration issues

**Solutions:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules .next
pnpm install

# Check TypeScript errors
pnpm type-check

# Update dependencies
pnpm update

# Check for peer dependency issues
pnpm install --shamefully-hoist
```

## 🔐 Authentication Issues

### Login Not Working

**Issue**: Users can't log in or registration fails

**Possible Causes:**

- Better Auth configuration incorrect
- Database connection issues
- Session storage problems
- CORS issues

**Solutions:**

```bash
# Verify Better Auth configuration
echo $BETTER_AUTH_SECRET | wc -c  # Should be 32+ characters
echo $BETTER_AUTH_URL

# Check database tables exist
pnpm db:studio  # Open database studio

# Clear browser cookies and try again
# Try incognito/private browsing mode
```

### Permission Denied Errors

**Issue**: Users can't access certain features

**Possible Causes:**

- Incorrect role assignment
- Permission system not working
- Database role data incorrect
- Session expired

**Solutions:**

```bash
# Check user role in database
# Navigate to database studio and check users table

# Verify role-based access in code
# Check middleware and permission checks

# Clear session and re-login
# Contact admin to verify role assignment
```

## 📁 File Management Issues

### Documents Not Displaying

**Issue**: Uploaded documents don't appear in the interface

**Possible Causes:**

- File upload incomplete
- Database record not created
- Permission issues
- File storage problems

**Solutions:**

```bash
# Check UploadThing dashboard for uploaded files
# Verify database has document records
# Check file permissions and access

# Try re-uploading the file
# Check browser console for errors
```

### File Download Problems

**Issue**: Files won't download or download corrupted

**Possible Causes:**

- File storage URL expired
- File deleted from storage
- Network connectivity issues
- Browser security restrictions

**Solutions:**

```bash
# Check file exists in UploadThing dashboard
# Verify file URL is accessible
# Try different browser
# Check browser download settings
```

## 🌐 Network and Performance Issues

### Slow Page Loading

**Issue**: Pages take too long to load

**Possible Causes:**

- Database query performance
- Large file sizes
- Network connectivity
- Server resource constraints

**Solutions:**

```bash
# Check network connectivity
ping google.com

# Monitor database performance
# Check browser developer tools Network tab
# Optimize images and file sizes

# Clear browser cache
# Try different network connection
```

### API Timeouts

**Issue**: API requests timeout or fail

**Possible Causes:**

- Server overload
- Database connection pool exhausted
- Network issues
- Large data processing

**Solutions:**

```bash
# Check server logs for errors
# Monitor database connections
# Reduce request payload size
# Implement request retry logic
```

## 🔧 Development Environment Issues

### Hot Reload Not Working

**Issue**: Changes don't reflect automatically in development

**Possible Causes:**

- File watcher issues
- Port conflicts
- File system permissions
- IDE configuration

**Solutions:**

```bash
# Restart development server
pnpm dev

# Check for port conflicts
lsof -i :3000

# Clear Next.js cache
rm -rf .next

# Check file permissions
ls -la src/
```

### TypeScript Errors

**Issue**: TypeScript compilation errors

**Possible Causes:**

- Type definition issues
- Import/export problems
- Configuration errors
- Version conflicts

**Solutions:**

```bash
# Check TypeScript configuration
cat tsconfig.json

# Verify type definitions
pnpm add -D @types/node @types/react

# Clear TypeScript cache
rm -rf .next/types

# Restart TypeScript server in IDE
```

## 📊 Database Issues

### Migration Failures

**Issue**: Database migrations fail to run

**Possible Causes:**

- Schema conflicts
- Data integrity issues
- Permission problems
- Connection issues

**Solutions:**

```bash
# Check migration status
pnpm db:studio

# Reset database (development only)
pnpm db:push --force

# Check for schema conflicts
# Verify database permissions

# Manual migration if needed
psql -d tender-track-360 -f migration.sql
```

### Data Not Persisting

**Issue**: Data saves but doesn't persist

**Possible Causes:**

- Transaction rollbacks
- Validation errors
- Connection issues
- Cache problems

**Solutions:**

```bash
# Check server logs for errors
# Verify database transactions
# Clear application cache
# Check validation schemas

# Test with database studio
pnpm db:studio
```

## 🚀 Production Issues

### Deployment Failures

**Issue**: Vercel deployment fails

**Possible Causes:**

- Build errors
- Environment variable issues
- Resource limits
- Configuration problems

**Solutions:**

```bash
# Check Vercel build logs
# Verify all environment variables set
# Test build locally
pnpm build

# Check resource usage
# Verify configuration files
```

### Production Performance Issues

**Issue**: Application slow in production

**Possible Causes:**

- Database performance
- CDN configuration
- Resource constraints
- Inefficient queries

**Solutions:**

```bash
# Monitor application metrics
# Check database performance
# Optimize queries and indexes
# Configure CDN properly

# Scale resources if needed
# Implement caching strategies
```

## 🆘 Getting Additional Help

### Self-Help Resources

1. **Check Browser Console** - Look for JavaScript errors
2. **Review Server Logs** - Check application logs for errors
3. **Test in Incognito Mode** - Rule out browser cache issues
4. **Try Different Browser** - Check for browser-specific issues
5. **Check Network Tab** - Monitor API requests and responses

### Documentation Resources

- **[Installation Guide](./installation.md)** - Detailed setup instructions
- **[Configuration Guide](./configuration.md)** - Environment configuration
- **[User Guide](../03-user-guide/README.md)** - Feature documentation
- **[Development Guide](../04-development/README.md)** - Development information

### Community Support

- **GitHub Issues** - Report bugs and get help
- **GitHub Discussions** - Community Q&A and discussions
- **Documentation** - Search this documentation for answers

### Creating a Bug Report

When reporting issues, please include:

1. **Environment Information**

   - Operating system
   - Node.js version
   - Browser version
   - Package manager version

2. **Steps to Reproduce**

   - Detailed steps to recreate the issue
   - Expected behavior
   - Actual behavior

3. **Error Messages**

   - Complete error messages
   - Browser console errors
   - Server log errors

4. **Configuration**
   - Environment variables (without secrets)
   - Package.json dependencies
   - Configuration files

### Emergency Contacts

For critical production issues:

- **GitHub Issues** - Tag as "critical" or "production"
- **Email Support** - For enterprise customers
- **Community Discord** - Real-time community help

---

**Still having issues?** Create a detailed bug report on [GitHub Issues](https://github.com/jchademwiri/tender-track-360/issues) with the information above.
