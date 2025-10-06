import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateLink() {
  const updated = await prisma.shortLink.update({
    where: { shortCode: 'IizBoE' },
    data: {
      originalUrl: 'https://ggbetbestoffer.com/l/68d268a4acf1578e4f091ec2'
    }
  });

  console.log('✅ Link updated successfully!');
  console.log('Short Code:', updated.shortCode);
  console.log('New Destination:', updated.originalUrl);

  await prisma.$disconnect();
}

updateLink();
