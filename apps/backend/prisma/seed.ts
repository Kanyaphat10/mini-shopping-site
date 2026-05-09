import { PrismaClient, UserRole, ProductStatus, OrderStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      name: 'John Customer',
      password: passwordHash,
      role: UserRole.CUSTOMER,
    },
  });

  const courier = await prisma.user.upsert({
    where: { email: 'courier@example.com' },
    update: {},
    create: {
      email: 'courier@example.com',
      name: 'Speedy Courier',
      password: passwordHash,
      role: UserRole.COURIER,
      vehicleType: 'Van',
    },
  });

  const serviceAgent = await prisma.user.upsert({
    where: { email: 'agent@example.com' },
    update: {},
    create: {
      email: 'agent@example.com',
      name: 'Support Agent',
      password: passwordHash,
      role: UserRole.SERVICE_AGENT,
    },
  });

  console.log('Users created.');

  // 2. Create Products
  const productsData = [
    { sku: 'PROD-001', name: 'Wireless Headphones', description: 'Noise-cancelling wireless headphones.', price: 199.99, stock: 50, productStatus: ProductStatus.ACTIVE },
    { sku: 'PROD-002', name: 'Smartphone 12 Pro', description: 'Latest model with amazing camera.', price: 999.99, stock: 20, productStatus: ProductStatus.ACTIVE },
    { sku: 'PROD-003', name: 'Gaming Laptop', description: 'High performance gaming laptop.', price: 1499.00, stock: 5, productStatus: ProductStatus.ACTIVE },
    { sku: 'PROD-004', name: 'Mechanical Keyboard', description: 'Clicky switches and RGB lighting.', price: 89.50, stock: 0, productStatus: ProductStatus.OUT_OF_STOCK },
    { sku: 'PROD-005', name: 'Wireless Mouse', description: 'Ergonomic design for long sessions.', price: 45.00, stock: 100, productStatus: ProductStatus.ACTIVE },
    { sku: 'PROD-006', name: '4K Monitor', description: 'Crisp 27-inch display.', price: 299.99, stock: 15, productStatus: ProductStatus.ACTIVE },
    { sku: 'PROD-007', name: 'USB-C Hub', description: '7-in-1 multi-port adapter.', price: 35.00, stock: 200, productStatus: ProductStatus.ACTIVE },
    { sku: 'PROD-008', name: 'Portable SSD 1TB', description: 'Fast external storage.', price: 120.00, stock: 0, productStatus: ProductStatus.OUT_OF_STOCK },
    { sku: 'PROD-009', name: 'Smartwatch', description: 'Fitness tracker and notifications.', price: 150.00, stock: 30, productStatus: ProductStatus.ACTIVE },
    { sku: 'PROD-010', name: 'Hidden Test Product', description: 'This product should not be visible.', price: 10.00, stock: 10, productStatus: ProductStatus.HIDDEN },
  ];

  const products = [];
  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
    products.push(product);
  }
  console.log('Products created.');

  // 3. Create Sample Cart
  const cart = await prisma.cart.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
      items: {
        create: [
          { productId: products[0].id, quantity: 1 },
          { productId: products[6].id, quantity: 2 },
        ],
      },
    },
  });
  console.log('Sample cart created.');

  // 4. Create Historical Order
  const order = await prisma.order.create({
    data: {
      userId: customer.id,
      status: OrderStatus.DELIVERED,
      totalPrice: 289.49, // 199.99 + 89.50
      shippingAddr: '123 Test St, Tech City',
      items: {
        create: [
          { productId: products[0].id, quantity: 1, price: 199.99 },
          { productId: products[3].id, quantity: 1, price: 89.50 },
        ],
      },
      payment: {
        create: {
          amount: 289.49,
          status: PaymentStatus.COMPLETED,
          transactionId: 'txn_123456789',
        },
      },
      shipment: {
        create: {
          courierId: courier.id,
          status: 'DELIVERED',
          trackingNumber: 'TRK987654321',
        },
      },
    },
  });
  console.log('Historical order created.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
