import { PrismaClient, CourtType, CourtStatus, CourtCategory, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- RESTORING DATABASE ---');

  const baseFacilities = ['Lighting', 'Seating area', 'Parking', 'Shower/Restroom'];
  const standardPrice = 50.00;
  const championshipPrice = 80.00;

  const courtsData = [
    { name: 'Court 1', category: CourtCategory.STANDARD, pricePerHour: standardPrice },
    { name: 'Court 2', category: CourtCategory.STANDARD, pricePerHour: standardPrice },
    { name: 'Court 3', category: CourtCategory.CHAMPIONSHIP, pricePerHour: championshipPrice },
    { name: 'Court 4', category: CourtCategory.CHAMPIONSHIP, pricePerHour: championshipPrice },
    { name: 'Court 5', category: CourtCategory.STANDARD, pricePerHour: standardPrice },
    { name: 'Court 6', category: CourtCategory.STANDARD, pricePerHour: standardPrice },
  ];

  console.log('Restining courts...');
  for (const court of courtsData) {
    const courtAttributes = {
      name: court.name,
      category: court.category,
      pricePerHour: court.pricePerHour,
      status: CourtStatus.ACTIVE,
      courtType: CourtType.INDOOR,
      facilities: baseFacilities,
    };

    const existingCourt = await prisma.court.findFirst({
      where: { name: court.name },
    });

    if (existingCourt) {
      await prisma.court.update({
        where: { id: existingCourt.id },
        data: courtAttributes,
      });
      console.log(`Updated ${court.name}`);
    } else {
      await prisma.court.create({
        data: courtAttributes,
      });
      console.log(`Created ${court.name}`);
    }
  }

  // Promote User to Admin
  const targetEmail = 'brittlmy@gmail.com';
  console.log(`Promoting ${targetEmail} to ADMIN...`);
  try {
    await prisma.user.update({
      where: { email: targetEmail },
      data: { role: Role.ADMIN },
    });
    console.log(`Success! User ${targetEmail} is now an ADMIN.`);
  } catch (error) {
    console.warn(`Could not promote ${targetEmail}. Please make sure you have created the account first.`);
  }

  console.log('--- RESTORATION COMPLETE ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
