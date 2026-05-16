# First Steps Guide

Congratulations on successfully installing Tender Track 360! This guide will walk you through the initial setup and help you create your first tender to get familiar with the system.

## Initial System Setup

### 1. Create Your First Admin User

1. **Navigate to the application** - Open your browser and go to `http://localhost:3000` (or your production URL)
2. **Register as the first user** - Click "Sign Up" and create your account
3. **Automatic admin assignment** - The first user is automatically assigned admin privileges
4. **Verify access** - You should see the admin dashboard with full system access

### 2. Configure Your Organization

As an admin, set up your organization details:

1. **Go to Organization Settings** - Navigate to `/admin/organization`
2. **Enter organization details**:
   - Organization name
   - Contact information
   - Address
   - Primary contact person
3. **Save settings** - This information will be used throughout the system

### 3. Set Up User Roles and Permissions

Understanding the four user roles:

| Role           | Description                         | Typical Users                           |
| -------------- | ----------------------------------- | --------------------------------------- |
| **Admin**      | Full system access, user management | IT administrators, system owners        |
| **Manager**    | Portfolio oversight, strategic view | Department heads, senior managers       |
| **Specialist** | Day-to-day tender work              | Tender officers, analysts, coordinators |
| **Viewer**     | Read-only access                    | Stakeholders, external consultants      |

## Adding Team Members

### 1. Invite Users

1. **Navigate to User Management** - Go to `/admin/users`
2. **Click "Add User"** - Use the invite user form
3. **Enter user details**:
   - Full name
   - Email address
   - Role assignment
   - Department (optional)
4. **Send invitation** - User will receive setup instructions

### 2. Role Assignment Best Practices

- **Start with Viewer role** - Assign minimal permissions initially
- **Promote based on needs** - Upgrade roles as users demonstrate competency
- **Regular role reviews** - Periodically review and adjust user permissions
- **Document role decisions** - Keep notes on why specific roles were assigned

## Creating Your First Tender

### 1. Basic Tender Information

1. **Navigate to Tenders** - Go to `/tenders`
2. **Click "Create New Tender"** - Start the tender creation process
3. **Enter basic details**:
   - **Reference Number** - Use your organization's numbering system
   - **Title** - Clear, descriptive tender title
   - **Issuing Authority** - Government department or agency
   - **Category** - Select or create appropriate category
   - **Estimated Value** - If known, enter estimated contract value

### 2. Important Dates

Set up critical dates for your tender:

- **Publication Date** - When the tender was published
- **Closing Date** - Submission deadline
- **Evaluation Date** - When evaluation begins (auto-calculated as closing + 90 days)
- **Award Date** - Expected award announcement (if known)

### 3. Tender Status

Your tender will start in "Draft" status. The status workflow is:

```
Draft → Published → In Progress → Submitted → Evaluation → Awarded/Rejected/Cancelled
```

### 4. Add Description and Notes

- **Description** - Detailed tender description
- **Internal Notes** - Private notes for your team
- **Tags** - Keywords for easy searching and categorization

## Document Management Setup

### 1. Upload Your First Document

1. **Go to your tender** - Navigate to the tender you just created
2. **Click "Documents" tab** - Access document management
3. **Upload a file** - Drag and drop or click to upload
4. **Categorize the document**:
   - Tender Notice
   - Technical Specifications
   - Financial Proposal
   - Legal Documents
   - Correspondence

### 2. Document Organization Best Practices

- **Use clear file names** - Include version numbers and dates
- **Categorize consistently** - Use the same categories across tenders
- **Add descriptions** - Brief description of each document's purpose
- **Version control** - Upload new versions rather than replacing files

## Task Management

### 1. Create Your First Task

1. **Go to Tasks section** - Navigate to `/tasks` or use the tender's task tab
2. **Click "Create Task"** - Start task creation
3. **Enter task details**:
   - **Title** - Clear, actionable task name
   - **Description** - Detailed task requirements
   - **Assignee** - Team member responsible
   - **Due Date** - Task deadline
   - **Priority** - High, Medium, or Low

### 2. Task Types Examples

Common tender-related tasks:

- Review tender requirements
- Prepare technical response
- Obtain pricing from suppliers
- Legal review of contract terms
- Prepare financial proposal
- Submit tender response

## Setting Up Notifications

### 1. Deadline Reminders

Configure automatic reminders:

- **7 days before deadline** - Initial warning
- **3 days before deadline** - Urgent reminder
- **1 day before deadline** - Final alert

### 2. Status Change Notifications

Set up notifications for:

- Tender status changes
- Task assignments
- Document uploads
- Extension requests

## Testing Your Setup

### 1. Complete Workflow Test

Test the complete tender workflow:

1. **Create a test tender** - Use dummy data
2. **Upload test documents** - Try different file types
3. **Create and assign tasks** - Test task management
4. **Change tender status** - Move through status workflow
5. **Test notifications** - Verify reminders work
6. **Generate reports** - Check dashboard and analytics

### 2. User Role Testing

Test different user roles:

1. **Create test users** - One for each role type
2. **Login as different users** - Verify role-based access
3. **Test permissions** - Ensure proper access control
4. **Check dashboards** - Verify role-specific views

## Common First-Time Setup Issues

### 1. File Upload Problems

**Issue**: Files won't upload
**Solution**:

- Check UploadThing configuration
- Verify file size limits
- Ensure allowed file types are correct

### 2. Email Notifications Not Working

**Issue**: No email notifications received
**Solution**:

- Verify email configuration in `.env.local`
- Check spam/junk folders
- Test SMTP settings

### 3. User Permission Issues

**Issue**: Users can't access certain features
**Solution**:

- Verify role assignments
- Check organization membership
- Review permission settings

## Next Steps

Now that you have the basics set up:

1. **Explore the User Guide** - Read detailed feature documentation
2. **Import existing tenders** - Migrate your current tender data
3. **Train your team** - Share access and provide training
4. **Customize workflows** - Adapt the system to your processes
5. **Set up reporting** - Configure dashboards and analytics

## Getting Help

If you need assistance:

- **User Guide** - Comprehensive feature documentation at [User Guide](../03-user-guide/README.md)
- **Troubleshooting** - Common issues and solutions at [Troubleshooting](./troubleshooting.md)
- **Community Support** - GitHub discussions and issues
- **Documentation** - This documentation is continuously updated

## Quick Reference

### Essential URLs (Development)

- **Main Dashboard**: `http://localhost:3000`
- **Tenders**: `http://localhost:3000/tenders`
- **Admin Panel**: `http://localhost:3000/admin`
- **User Management**: `http://localhost:3000/admin/users`
- **Tasks**: `http://localhost:3000/tasks`

### Key Keyboard Shortcuts

- **Create New Tender**: `Ctrl/Cmd + N` (when on tenders page)
- **Search**: `Ctrl/Cmd + K`
- **Quick Navigation**: `Ctrl/Cmd + /`

---

**Congratulations!** You're now ready to use Tender Track 360 effectively. For detailed feature information, continue to the [User Guide](../03-user-guide/README.md).
