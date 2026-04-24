import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create Demo Agency
  const agency = await prisma.agency.upsert({
    where: { customDomain: "demo.agencypulse.com" },
    update: {},
    create: {
      name: "Demo Agency",
      customDomain: "demo.agencypulse.com",
      primaryColour: "#1A56A0",
    },
  });

  // Create Super Admin
  await prisma.user.upsert({
    where: { email: "admin@agencypulse.com" },
    update: {},
    create: {
      email: "admin@agencypulse.com",
      password: hashedPassword,
      name: "Admin User",
      role: "SUPER_ADMIN",
      agencyId: agency.id,
    },
  });

  // Create Staff User
  await prisma.user.upsert({
    where: { email: "staff@agencypulse.com" },
    update: {},
    create: {
      email: "staff@agencypulse.com",
      password: hashedPassword,
      name: "Staff User",
      role: "STAFF",
      agencyId: agency.id,
    },
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
