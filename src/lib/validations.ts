import { z } from "zod";

// Enum validation schemas
export const RoleSchema = z.enum(["ADMIN", "PROJECT_LEAD", "DEVELOPER"]);
export const ProjectStatusSchema = z.enum(["ACTIVE", "COMPLETED"]);

// User validation schemas
export const SignInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export const CreateUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  firstName: z.string().min(1, "First name is required").max(50, "First name must be less than 50 characters"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be less than 50 characters"),
  role: RoleSchema,
});

export const UpdateUserSchema = z.object({
  email: z.string().email("Please enter a valid email address").optional(),
  firstName: z.string().min(1, "First name is required").max(50, "First name must be less than 50 characters").optional(),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be less than 50 characters").optional(),
  role: RoleSchema.optional(),
});

// Project validation schemas
export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name must be less than 100 characters"),
  description: z.string().min(1, "Project description is required").max(1000, "Description must be less than 1000 characters"),
  deadline: z.string().refine((val) => {
    const date = new Date(val);
    return date > new Date();
  }, "Deadline must be in the future"),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name must be less than 100 characters").optional(),
  description: z.string().min(1, "Project description is required").max(1000, "Description must be less than 1000 characters").optional(),
  deadline: z.string().refine((val) => {
    if (!val) return true; // Optional field
    const date = new Date(val);
    return !isNaN(date.getTime()); // Valid date
  }, "Invalid date format").optional(),
  status: ProjectStatusSchema.optional(),
});

// Project assignment validation schemas
export const AssignUserToProjectSchema = z.object({
  projectId: z.string().cuid("Invalid project ID"),
  userIds: z.array(z.string().cuid("Invalid user ID")).min(1, "At least one user must be selected"),
});

export const RemoveUserFromProjectSchema = z.object({
  projectId: z.string().cuid("Invalid project ID"),
  userId: z.string().cuid("Invalid user ID"),
});

// File upload validation schemas
export const FileUploadSchema = z.object({
  projectId: z.string().cuid("Invalid project ID"),
  file: z.object({
    name: z.string().min(1, "File name is required"),
    size: z.number().max(10 * 1024 * 1024, "File size must be less than 10MB"),
    type: z.enum([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "image/png",
      "image/jpg",
      "image/jpeg",
    ], "Invalid file type. Only PDF, DOC, DOCX, TXT, PNG, JPG, and JPEG files are allowed"),
  }),
});

// General validation schemas
export const IdSchema = z.string().cuid("Invalid ID format");

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

// Type exports
export type SignInInput = z.infer<typeof SignInSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type AssignUserToProjectInput = z.infer<typeof AssignUserToProjectSchema>;
export type RemoveUserFromProjectInput = z.infer<typeof RemoveUserFromProjectSchema>;
export type FileUploadInput = z.infer<typeof FileUploadSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;