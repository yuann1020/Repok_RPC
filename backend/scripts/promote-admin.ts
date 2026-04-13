import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteAdmin() {
  const emailArg = process.argv[2];
  const targetEmail = emailArg || 'admin@example.com';

  if (!emailArg) {
    console.warn(`No email provided. Defaulting to '${targetEmail}'. Usage: npx tsx backend/scripts/promote-admin.ts <email>`);
  }

  try {
    const user = await prisma.user.update({
      where: { email: targetEmail },
      data: { role: Role.ADMIN },
    });

    console.log(`Success! User ${user.email} has been promoted to ${user.role}.`);
  } catch (error) {
    console.error(`Failed to promote user. Does '${targetEmail}' exist in the database?`);
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
  }
}

promoteAdmin();
