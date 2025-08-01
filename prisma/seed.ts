import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Hash passwords with salt rounds 12
  const hashPassword = async (password: string) => {
    return bcrypt.hash(password, 12);
  };

  // Create users
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@pixelforge.com" },
    update: {},
    create: {
      email: "admin@pixelforge.com",
      passwordHash: await hashPassword("Admin123!"),
      firstName: "John",
      lastName: "Admin",
      role: "ADMIN",
    },
  });

  const projectLeadUser = await prisma.user.upsert({
    where: { email: "lead@pixelforge.com" },
    update: {},
    create: {
      email: "lead@pixelforge.com",
      passwordHash: await hashPassword("Lead123!"),
      firstName: "Sarah",
      lastName: "Johnson",
      role: "PROJECT_LEAD",
    },
  });

  const developer1 = await prisma.user.upsert({
    where: { email: "dev1@pixelforge.com" },
    update: {},
    create: {
      email: "dev1@pixelforge.com",
      passwordHash: await hashPassword("Dev123!"),
      firstName: "Mike",
      lastName: "Developer",
      role: "DEVELOPER",
    },
  });

  const developer2 = await prisma.user.upsert({
    where: { email: "dev2@pixelforge.com" },
    update: {},
    create: {
      email: "dev2@pixelforge.com",
      passwordHash: await hashPassword("Dev123!"),
      firstName: "Emily",
      lastName: "Chen",
      role: "DEVELOPER",
    },
  });

  const developer3 = await prisma.user.upsert({
    where: { email: "dev3@pixelforge.com" },
    update: {},
    create: {
      email: "dev3@pixelforge.com",
      passwordHash: await hashPassword("Dev123!"),
      firstName: "Alex",
      lastName: "Rodriguez",
      role: "DEVELOPER",
    },
  });

  console.log("✅ Users created");

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      name: "Pixel Quest RPG",
      description: "A classic 2D RPG game with pixel art graphics, featuring turn-based combat and an engaging storyline.",
      deadline: new Date("2024-12-31"),
      status: "ACTIVE",
      createdById: projectLeadUser.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Space Shooter Pro",
      description: "Fast-paced space shooter game with power-ups, multiple levels, and boss battles.",
      deadline: new Date("2024-10-15"),
      status: "ACTIVE",
      createdById: adminUser.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: "Puzzle Master",
      description: "Mind-bending puzzle game with over 100 levels and unique mechanics.",
      deadline: new Date("2024-08-30"),
      status: "COMPLETED",
      createdById: projectLeadUser.id,
    },
  });

  console.log("✅ Projects created");

  // Assign developers to projects
  await prisma.projectAssignment.createMany({
    data: [
      {
        projectId: project1.id,
        userId: developer1.id,
        assignedById: projectLeadUser.id,
      },
      {
        projectId: project1.id,
        userId: developer2.id,
        assignedById: projectLeadUser.id,
      },
      {
        projectId: project2.id,
        userId: developer2.id,
        assignedById: adminUser.id,
      },
      {
        projectId: project2.id,
        userId: developer3.id,
        assignedById: adminUser.id,
      },
      {
        projectId: project3.id,
        userId: developer1.id,
        assignedById: projectLeadUser.id,
      },
      {
        projectId: project3.id,
        userId: developer3.id,
        assignedById: projectLeadUser.id,
      },
    ],
  });

  console.log("✅ Project assignments created");

  console.log("🎉 Database seeded successfully!");
  
  console.log("\n📋 Test Accounts:");
  console.log("Admin: admin@pixelforge.com / Admin123!");
  console.log("Project Lead: lead@pixelforge.com / Lead123!");
  console.log("Developer 1: dev1@pixelforge.com / Dev123!");
  console.log("Developer 2: dev2@pixelforge.com / Dev123!");
  console.log("Developer 3: dev3@pixelforge.com / Dev123!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });