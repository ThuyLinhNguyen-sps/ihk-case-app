import "dotenv/config";
import * as bcrypt from "bcrypt";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing. Set it in .env or PowerShell env.");
  process.exit(1);
}

// Neon thường cần SSL. Nếu DATABASE_URL đã có ?sslmode=require thì ok.
// Nếu chưa có, thêm ssl config ở đây để chắc chắn.
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  const password = await bcrypt.hash("Admin123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {
      name: "Admin",
      role: Role.ADMIN,
    },
    create: {
      email: "admin@demo.com",
      name: "Admin",
      role: Role.ADMIN,
      password,
    },
  });

  console.log("✅ Admin user created / updated");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
