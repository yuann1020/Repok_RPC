import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  let users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      fullName: true,
      createdAt: true,
    },
  });

  if (users.length === 0) {
    console.log('No users found. Seeding default admin...');
    const adminEmail = 'admin@example.com';
    const adminPassword = 'Admin123!';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: passwordHash,
        fullName: 'System Admin',
        role: Role.ADMIN,
      },
    });
    console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);
    users = [admin as any];
  }

  console.log('--- Users List ---');
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
