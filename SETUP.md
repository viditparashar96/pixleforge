# PixelForge Nexus - Setup Guide

A secure game development project management system built with Next.js 14, PostgreSQL, and NextAuth.js.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd pixelforge
npm install
```

### 2. Database Setup

1. Create a PostgreSQL database named `pixelforge_nexus`
2. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
3. Update `.env.local` with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/pixelforge_nexus"
   NEXTAUTH_SECRET="your-secret-key-32-characters-minimum"
   NEXTAUTH_URL="http://localhost:3000"
   ```

### 3. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with test data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 🔐 Test Accounts

After running the seed script, you can use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pixelforge.com | Admin123! |
| Project Lead | lead@pixelforge.com | Lead123! |
| Developer | dev1@pixelforge.com | Dev123! |
| Developer | dev2@pixelforge.com | Dev123! |
| Developer | dev3@pixelforge.com | Dev123! |

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **Backend**: Next.js Server Actions, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with bcrypt password hashing
- **File Upload**: Custom secure file handling system
- **Validation**: Zod schemas

### Security Features

- ✅ bcrypt password hashing (salt rounds ≥12)
- ✅ Role-based access control (ADMIN, PROJECT_LEAD, DEVELOPER)
- ✅ Server-side input validation with Zod
- ✅ Secure file upload with type and size validation
- ✅ SQL injection prevention via Prisma
- ✅ CSRF protection with NextAuth.js
- ✅ Middleware-based route protection

### Database Schema

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  firstName    String
  lastName     String
  role         Role     // ADMIN, PROJECT_LEAD, DEVELOPER
  mfaEnabled   Boolean  @default(false)
  // ... relations
}

model Project {
  id          String        @id @default(cuid())
  name        String
  description String
  deadline    DateTime
  status      ProjectStatus @default(ACTIVE)
  // ... relations
}

model ProjectAssignment {
  id          String   @id @default(cuid())
  projectId   String
  userId      String
  assignedById String
  // ... relations
}

model Document {
  id               String   @id @default(cuid())
  projectId        String
  filename         String
  originalFilename String
  filePath         String
  fileSize         Int
  mimeType         String
  // ... relations
}
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── dashboard/         # Protected dashboard pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── dashboard/        # Dashboard-specific components
├── lib/                  # Utilities and configurations
│   ├── actions/          # Server Actions
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts            # Prisma client
│   ├── validations.ts    # Zod schemas
│   └── utils.ts         # Utility functions
└── types/               # TypeScript definitions

prisma/
├── schema.prisma        # Database schema
└── seed.ts             # Test data seeding

uploads/                # File storage directory
```

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema changes
npm run db:seed         # Seed test data
npm run db:studio       # Open Prisma Studio
```

## 🎯 Features

### Role-Based Access Control

- **Admin**: Full system access, user management, all projects
- **Project Lead**: Create/manage projects, assign team members
- **Developer**: View assigned projects, upload documents

### Project Management

- Create and manage game development projects
- Set deadlines and track progress
- Assign developers to projects
- Upload and manage project documents

### User Management (Admin Only)

- Create new users with role assignment
- View user profiles and project assignments
- Manage user permissions

### File Management

- Secure file upload with validation
- Support for PDF, DOC, DOCX, TXT, PNG, JPG, JPEG
- File size limit: 10MB
- Role-based download permissions

## 🛡️ Security Considerations

1. **Password Security**: All passwords are hashed with bcrypt (salt rounds ≥12)
2. **Input Validation**: All inputs validated server-side with Zod schemas
3. **File Upload Security**: File type and size validation, secure storage
4. **Access Control**: Middleware-based route protection and role verification
5. **SQL Injection Prevention**: All database queries use Prisma's type-safe approach

## 🚀 Deployment

### Environment Variables for Production

```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
NEXTAUTH_SECRET="your-production-secret-32-chars-min"
NEXTAUTH_URL="https://your-domain.com"
NODE_ENV="production"
BCRYPT_SALT_ROUNDS=12
MAX_FILE_SIZE=10485760
UPLOAD_DIR="./uploads"
```

### Deployment Steps

1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations: `npm run db:push`
4. Build the application: `npm run build`
5. Start the application: `npm run start`

## 📝 API Documentation

### Authentication Endpoints

- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signout` - User sign out

### File Upload Endpoints

- `POST /api/upload` - Upload file to project
- `GET /api/download/[id]` - Download file by ID

### Server Actions

All CRUD operations are handled through Next.js Server Actions:

- User management: `src/lib/actions/users.ts`
- Project management: `src/lib/actions/projects.ts`
- Document management: `src/lib/actions/documents.ts`
- Authentication: `src/lib/actions/auth.ts`

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env.local
   - Ensure database exists

2. **Authentication Issues**
   - Verify NEXTAUTH_SECRET is set
   - Check NEXTAUTH_URL matches your domain
   - Clear browser cookies and try again

3. **File Upload Errors**
   - Ensure uploads directory exists and is writable
   - Check file size and type restrictions
   - Verify user has project access

4. **Permission Errors**
   - Check user role in database
   - Verify middleware configuration
   - Review server action permissions

## 📞 Support

For issues and questions, please refer to the project documentation or create an issue in the repository.

---

**PixelForge Nexus** - Secure Game Development Project Management © 2024