# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Commands
- `npm run db:generate` - Generate Prisma client after schema changes
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with test data
- `npm run db:studio` - Open Prisma Studio for database management

## Project Architecture

PixelForge Nexus is a secure game development project management system built with Next.js 15, PostgreSQL, and NextAuth.js.

### Core Architecture
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode enabled
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider and bcrypt password hashing
- **Styling**: Tailwind CSS v4 with CSS variables
- **UI Components**: Shadcn/ui component library (New York style)
- **Validation**: Zod schemas for server-side input validation
- **File Handling**: ImageKit.io cloud storage for file uploads with Cloudinary legacy support

### Directory Structure
- `src/app/` - Next.js App Router pages and layouts
  - `src/app/api/` - API routes (auth, upload, download, preview)
  - `src/app/auth/` - Authentication pages (signin, forgot-password, reset-password, error)
  - `src/app/dashboard/` - Protected dashboard pages
    - `src/app/dashboard/projects/new/` - Project creation page
    - `src/app/dashboard/admin/users/new/` - User creation page
- `src/components/` - React components
  - `src/components/ui/` - Reusable UI components from Shadcn/ui
  - `src/components/dashboard/` - Dashboard-specific components (header, sidebar, forms, dialogs)
- `src/lib/` - Utility functions and configurations
  - `src/lib/actions/` - Server Actions for CRUD operations
    - `password-reset.ts` - Password reset functionality
    - `users-new.ts` - Enhanced user management
  - `src/lib/auth.ts` - NextAuth configuration and password utilities
  - `src/lib/db.ts` - Prisma client configuration
  - `src/lib/validations.ts` - Zod validation schemas
  - `src/lib/utils.ts` - Utility functions including `cn()` helper
- `src/types/` - TypeScript type definitions
- `src/middleware.ts` - Next.js middleware for route protection and role-based access control
- `prisma/` - Database schema and seed files

### Database Schema
The application uses a PostgreSQL database with the following key models:
- **User**: User accounts with role-based permissions (ADMIN, PROJECT_LEAD, DEVELOPER)
- **Project**: Game development projects with deadlines and status tracking
- **ProjectAssignment**: Many-to-many relationship between users and projects
- **Document**: File uploads associated with projects (supports both ImageKit and Cloudinary storage)
- **PasswordResetToken**: Secure password reset tokens with expiration

### Authentication & Security
- NextAuth.js with credentials provider for email/password authentication
- bcrypt password hashing with configurable salt rounds (default: 12)
- "Remember me" functionality with extended 30-day sessions
- Secure password reset flow with time-limited tokens
- Role-based access control enforced in middleware
- Server-side input validation with Zod schemas
- Secure file upload with type and size restrictions (max 10MB)
- Document preview system with access control
- CSRF protection and SQL injection prevention

### Key Technologies
- **UI Library**: Radix UI primitives with class-variance-authority for variants
- **Utility Functions**: 
  - `cn()` utility in `src/lib/utils.ts` combines clsx and tailwind-merge for conditional classes
- **Icons**: Lucide React icon library
- **Fonts**: Geist Sans and Geist Mono
- **Forms**: React Hook Form with Zod resolvers
- **Notifications**: Sonner for toast notifications
- **Theme**: next-themes for dark mode support

### Component Patterns
- UI components use the compound component pattern with variants
- Components support `asChild` prop via Radix Slot for composition
- TypeScript interfaces use `React.ComponentProps` for proper prop inheritance
- Consistent use of `cn()` utility for className merging
- Custom CSS utilities for status badges, role badges, and hover effects

### Configuration
- Shadcn/ui configured in `components.json` with New York style
- TypeScript paths configured for `@/*` imports
- Tailwind configured with CSS variables and custom base color (neutral)
- Custom CSS utilities in `globals.css` for project-specific styling
- Environment variables for database, auth, and file upload configuration

### File Storage Configuration
- **ImageKit.io** (Primary): Requires `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, and `IMAGEKIT_URL_ENDPOINT`
- **Cloudinary** (Legacy): Requires `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`
- Database automatically tracks storage provider for each document
- Seamless migration from Cloudinary to ImageKit with backward compatibility

### Role-Based Access Control
- **ADMIN**: Full system access, user management, all projects
- **PROJECT_LEAD**: Create/manage projects, assign team members
- **DEVELOPER**: View assigned projects, upload documents

### Server Actions Structure
All CRUD operations use Next.js Server Actions located in `src/lib/actions/`:
- `auth.ts` - Authentication-related actions and user creation
- `users.ts` - Legacy user management actions
- `users-new.ts` - Enhanced user management with admin controls
- `projects.ts` - Project management actions (including getUserProjects, getAllProjects)
- `documents.ts` - Legacy document/file management actions (Cloudinary)
- `documents-imagekit.ts` - New document/file management actions (ImageKit.io)
- `documents-helper.ts` - Helper functions for document retrieval
- `password-reset.ts` - Password reset token generation and validation
- `profile.ts` - User profile management actions

### API Routes
Custom API endpoints located in `src/app/api/`:
- `/api/upload/` - Secure file upload endpoint (uses ImageKit.io)
- `/api/download/[id]/` - Secure file download with permission checks (supports both storage providers)
- `/api/preview/[id]/` - File preview endpoint for images, PDFs, and text files (supports both storage providers)
- `/api/test-imagekit/` - ImageKit.io configuration and upload testing endpoint

### Key Features Implemented

#### Authentication System
- Email/password login with validation
- "Remember me" checkbox for extended sessions (30 days vs 24 hours)
- Forgot password flow with secure token generation
- Password reset with email simulation (console logging for development)
- Account lockout protection and rate limiting

#### Project Management
- Create, read, update, delete projects (CRUD)
- Role-based project access (Admin sees all, others see assigned)
- Project assignment system for team members
- Deadline tracking and status management (ACTIVE/COMPLETED)
- Dedicated project creation page at `/dashboard/projects/new`

#### User Management
- Admin-only user creation with role assignment
- User profile management and password changes
- Role-based permissions (ADMIN, PROJECT_LEAD, DEVELOPER)
- Dedicated user creation page at `/dashboard/admin/users/new`

#### Document Management
- **Primary Storage**: ImageKit.io cloud storage for new uploads
- **Legacy Support**: Cloudinary storage for existing files (seamless migration)
- Secure file upload with validation (PDF, DOC, DOCX, TXT, PNG, JPG, JPEG)
- Drag-and-drop bulk upload interface with progress tracking
- File preview system for supported formats (works with both storage providers)
- Role-based download permissions
- File size limits (10MB per file)
- File type icons and metadata display
- Automatic storage provider detection for downloads and previews

#### UI/UX Features
- Responsive design with Tailwind CSS
- Toast notifications for user feedback
- Loading states and progress indicators
- Form validation with error messaging
- Dark mode support (via next-themes)
- Accessible components using Radix UI primitives

## Development Workflow

### Code Quality
- **Linting**: Always run `npm run lint` before committing changes
- **Type Safety**: TypeScript strict mode enabled with comprehensive type checking
- **Code Style**: ESLint configured with Next.js and TypeScript rules
- **Import Organization**: Use `@/*` path aliases for clean imports

### Security Best Practices
- Never commit API keys, database URLs, or secrets to the repository
- All server actions include proper authentication and authorization checks
- Input validation performed on both client and server sides
- File uploads restricted by type, size, and user permissions
- SQL injection prevented through Prisma ORM parameterized queries

### Component Development
- Follow the existing component patterns in `src/components/dashboard/`
- Use shadcn/ui components as base building blocks
- Implement proper loading states and error handling
- Include proper TypeScript interfaces for all props
- Use the `cn()` utility for conditional className logic

### Database Operations
- Use Server Actions for all database operations
- Include proper error handling and user feedback
- Validate input with Zod schemas before database operations
- Use transactions for multi-step operations
- Always check user permissions before data access

### File Structure Conventions
- Place page components in `src/app/` following App Router structure
- Reusable components go in `src/components/`
- Server Actions in `src/lib/actions/` with descriptive filenames
- Types and interfaces in `src/types/` when shared across multiple files
- Utility functions in `src/lib/` with clear naming

### Testing and Deployment
- Test all role-based access controls thoroughly
- Verify file upload/download functionality with various file types
- Test password reset flow end-to-end
- Ensure responsive design works on mobile and desktop
- Run production build (`npm run build`) before deployment

## Important Reminders
- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- Always run `npm run lint` after making changes to ensure code quality