import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.preorderProduct.findUnique({
    where: { goodsNo: 157485 }
  });
  
  if (product) {
    console.log('Product found in database:');
    console.log('goodsNo:', product.goodsNo);
    console.log('name:', product.name);
    console.log('\nRaw data keys:', Object.keys(product.raw));
    console.log('\nRaw data sample:', JSON.stringify(product.raw, null, 2).substring(0, 1000));
  } else {
    console.log('Product 157485 not found in PreorderProduct table');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
