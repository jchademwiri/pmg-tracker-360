# Installation Guide

This guide will walk you through setting up Tender Track 360 in both development and production environments.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or later) - [Download here](https://nodejs.org/)
- **npm** (v9.0.0 or later) or **pnpm** (recommended) - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)
- **PostgreSQL** (for local development) - [Download here](https://postgresql.org/)

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/jchademwiri/tender-track-360.git
cd tender-track-360
```

### 2. Install Dependencies

We recommend using pnpm for faster installs and better dependency management:

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install project dependencies
pnpm install
```

Alternatively, you can use npm:

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Update the `.env.local` file with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tender-track-360

# Better Auth Configuration
BETTER_AUTH_SECRET=your_generated_secret_here
BETTER_AUTH_URL=http://localhost:3000

# UploadThing Configuration (for file uploads)
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id

# Optional: Email Service (for notifications)
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=user
EMAIL_SERVER_PASSWORD=password
EMAIL_FROM=noreply@tendertrack360.com
```

### 4. Database Setup

**Local PostgreSQL Setup:**

1. Install PostgreSQL locally
2. Create a database:
   ```sql
   CREATE DATABASE "tender-track-360";
   ```
3. Initialize the database schema:
   ```bash
   pnpm db:push
   ```

**Alternative: Using Neon (Cloud PostgreSQL):**

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new database
3. Copy the connection string to your `.env.local` file
4. Run the schema setup:
   ```bash
   pnpm db:push
   ```

### 5. Generate Better Auth Secret

Generate a secure secret for Better Auth:

```bash
# Generate a random secret
openssl rand -base64 32
```

Copy the output to your `BETTER_AUTH_SECRET` environment variable.

### 6. UploadThing Setup (File Uploads)

1. Create an account at [uploadthing.com](https://uploadthing.com)
2. Create a new app
3. Copy your App ID and Secret to the environment variables
4. Configure file upload settings in your UploadThing dashboard

### 7. Start Development Server

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Production Setup

### 1. Database (Neon)

1. Create a production database at [neon.tech](https://neon.tech)
2. Note the connection string for deployment

### 2. File Storage (UploadThing)

1. Create a production app in UploadThing
2. Configure production file upload settings
3. Note the production API keys

### 3. Deployment (Vercel)

1. Fork the repository to your GitHub account
2. Create a new project in [Vercel](https://vercel.com)
3. Connect your GitHub repository
4. Configure environment variables in Vercel:
   - `DATABASE_URL` - Your Neon production database URL
   - `BETTER_AUTH_SECRET` - A secure random string
   - `BETTER_AUTH_URL` - Your production domain (e.g., https://yourapp.vercel.app)
   - `UPLOADTHING_SECRET` - Your production UploadThing secret
   - `UPLOADTHING_APP_ID` - Your production UploadThing app ID
5. Deploy!

### 4. Post-Deployment Setup

1. Run database migrations in production:
   ```bash
   # This is typically handled automatically by Vercel
   pnpm db:push
   ```
2. Create your first admin user through the application interface
3. Configure your organization settings

## Verification

After installation, verify everything is working:

1. **✅ Application loads** - Visit your local/production URL
2. **✅ Database connection** - Check that the app doesn't show database errors
3. **✅ Authentication** - Try registering a new user
4. **✅ File uploads** - Test uploading a document
5. **✅ Basic functionality** - Create a test tender

## Troubleshooting

### Common Issues

**Database Connection Failed:**

- Verify your `DATABASE_URL` is correct
- Ensure PostgreSQL is running (local setup)
- Check firewall settings

**Authentication Not Working:**

- Verify `BETTER_AUTH_SECRET` is set
- Check that `BETTER_AUTH_URL` matches your domain
- Clear browser cookies and try again

**File Uploads Failing:**

- Verify UploadThing API keys are correct
- Check UploadThing dashboard for error logs
- Ensure file size limits are appropriate

**Build Errors:**

- Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`
- Check Node.js version compatibility
- Verify all environment variables are set

### Getting Help

If you encounter issues:

1. Check the [Troubleshooting Guide](./troubleshooting.md)
2. Search [GitHub Issues](https://github.com/jchademwiri/tender-track-360/issues)
3. Create a new issue with detailed error information

---

**Next Step:** [Configuration Guide](./configuration.md)
