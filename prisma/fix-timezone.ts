import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Timezone Fix: Wiping old UTC-based slots and regenerating with UTC+8 ===\n');

  // 1. Delete all booking items, bookings, and payments first (they reference old slots)
  const deletedPayments = await prisma.payment.deleteMany({});
  console.log(`Deleted ${deletedPayments.count} payments`);

  const deletedItems = await prisma.bookingItem.deleteMany({});
  console.log(`Deleted ${deletedItems.count} booking items`);

  const deletedBookings = await prisma.booking.deleteMany({});
  console.log(`Deleted ${deletedBookings.count} bookings`);

  // 2. Delete all old availability slots
  const deletedSlots = await prisma.courtAvailability.deleteMany({});
  console.log(`Deleted ${deletedSlots.count} old availability slots\n`);

  // 3. Get all courts
  const courts = await prisma.court.findMany();
  console.log(`Found ${courts.length} courts to generate availability for\n`);

  // 4. Generate slots for each court (May 1 - May 31, 2026)
  //    Operating hours: 8 AM - midnight local Malaysian time (UTC+8)
  const startDate = new Date('2026-05-01T00:00:00+08:00');
  const endDate = new Date('2026-05-31T00:00:00+08:00');

  let totalInserted = 0;

  for (const court of courts) {
    const slots: any[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const year = current.getFullYear();
      // Use local date components (since startDate is created from +08:00, 
      // getTimezoneOffset will vary by system. Use UTC offset arithmetic.)
      const utcMs = current.getTime();
      const localDate = new Date(utcMs + 8 * 60 * 60 * 1000);
      const y = localDate.getUTCFullYear();
      const m = String(localDate.getUTCMonth() + 1).padStart(2, '0');
      const d = String(localDate.getUTCDate()).padStart(2, '0');

      for (let hour = 8; hour < 24; hour++) {
        const slotStart = new Date(`${y}-${m}-${d}T${String(hour).padStart(2, '0')}:00:00+08:00`);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

        slots.push({
          courtId: court.id,
          startTime: slotStart,
          endTime: slotEnd,
          isAvailable: true,
          basePrice: Number(court.pricePerHour),
        });
      }

      // Move to next day (add 24 hours in ms)
      current.setTime(current.getTime() + 24 * 60 * 60 * 1000);
    }

    const result = await prisma.courtAvailability.createMany({
      data: slots,
      skipDuplicates: true,
    });

    console.log(`  ${court.name}: generated ${result.count} slots`);
    totalInserted += result.count;
  }

  console.log(`\n=== Done! Total ${totalInserted} slots created with correct UTC+8 timezone ===`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
