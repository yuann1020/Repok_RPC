import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function purgeUsers() {
  console.log('--- Purging Users and Related Data ---');
  
  try {
    // Delete data in order of dependencies
    // Payments depend on Bookings
    const paymentDelete = await prisma.payment.deleteMany({});
    console.log(`Deleted ${paymentDelete.count} payments.`);

    // BookingItems depend on Bookings and Availabilities
    const bookingItemDelete = await prisma.bookingItem.deleteMany({});
    console.log(`Deleted ${bookingItemDelete.count} booking items.`);

    // Bookings depend on Users
    const bookingDelete = await prisma.booking.deleteMany({});
    console.log(`Deleted ${bookingDelete.count} bookings.`);

    // PasswordResetTokens depend on Users
    const tokenDelete = await prisma.passwordResetToken.deleteMany({});
    console.log(`Deleted ${tokenDelete.count} reset tokens.`);

    // Comments depend on Users and Announcements
    const commentDelete = await prisma.comment.deleteMany({});
    console.log(`Deleted ${commentDelete.count} comments.`);

    // Finally, delete users
    const userDelete = await prisma.user.deleteMany({});
    console.log(`Deleted ${userDelete.count} users.`);

    console.log('--- Purge Complete ---');
  } catch (error) {
    console.error('Error during purge:', error);
  } finally {
    await prisma.$disconnect();
  }
}

purgeUsers();
