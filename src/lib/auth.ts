import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import { SignInSchema } from "./validations";

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");

// Handle MFA verification during login
async function handleMFALogin(email: string, mfaToken: string) {
  try {
    // Verify the MFA token
    const decoded = jwt.verify(
      mfaToken,
      process.env.NEXTAUTH_SECRET || "fallback-secret"
    ) as { mfaVerified: boolean; email: string; userId: string };

    // Check if token is valid and matches email
    if (!decoded.mfaVerified || decoded.email !== email) {
      throw new Error("Invalid MFA token");
    }

    // Get user details
    const user = await db.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt.toISOString(),
    };
  } catch (error) {
    console.error("MFA login error:", error);
    throw new Error("MFA verification failed");
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        mfaToken: { label: "MFA Token", type: "text" },
        rememberMe: { label: "Remember Me", type: "checkbox" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email) {
            throw new Error("Email is required");
          }

          // Check if this is an MFA verification (mfaToken provided)
          if (credentials.mfaToken) {
            return await handleMFALogin(
              credentials.email,
              credentials.mfaToken
            );
          }

          // Regular password authentication
          if (!credentials.password) {
            throw new Error("Password is required");
          }

          // Validate input
          const validatedCredentials = SignInSchema.parse({
            email: credentials.email,
            password: credentials.password,
            rememberMe: credentials.rememberMe === "true",
          });

          // Find user in database
          const user = await db.user.findUnique({
            where: {
              email: validatedCredentials.email.toLowerCase(),
            },
            select: {
              id: true,
              email: true,
              passwordHash: true,
              firstName: true,
              lastName: true,
              role: true,
              mfaEnabled: true,
              createdAt: true,
            },
          });

          if (!user) {
            throw new Error("Invalid email or password");
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            validatedCredentials.password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            throw new Error("Invalid email or password");
          }

          // Regular authentication (MFA check is handled by pre-check API)
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            createdAt: user.createdAt.toISOString(),
            rememberMe: validatedCredentials.rememberMe,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours (default)
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Utility functions for password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
