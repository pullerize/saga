import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const DEFAULT = "Saga Group";

async function main() {
  let saga = await prisma.company.findUnique({ where: { name: DEFAULT } });
  if (!saga) {
    saga = await prisma.company.create({ data: { name: DEFAULT } });
    console.log("Создана компания Saga Group:", saga.id);
  } else {
    console.log("Saga Group уже существует:", saga.id);
  }

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  console.log(`Найдено админов: ${admins.length}`);
  let updated = 0;
  for (const a of admins) {
    if (a.companyId === saga.id && a.companyName === saga.name) continue;
    await prisma.user.update({
      where: { id: a.id },
      data: { companyId: saga.id, companyName: saga.name },
    });
    updated++;
    console.log(`  → ${a.email} привязан к Saga Group`);
  }
  console.log(`Обновлено: ${updated}`);
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); process.exit(1); });
