// Удаляет «мусорные» компоненты, которые ранее авто-создавались из характеристик
// (ParamDefinition). Характеристики — это переменные для формул, а не ценовые
// позиции. Удаляем компонент, если:
//   • его key совпадает с key характеристики (значит он авто-создан), И
//   • он НЕ используется в формулах (по нормализованному имени), И
//   • он НЕ входит в шотланки (по key), И
//   • у него нет переопределения цены компанией (CompanyPrice).
//
// Запуск:  node scripts/cleanup-junk-components.mjs
// Использует DATABASE_URL из окружения/.env (на проде — prod.db).

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function norm(s) {
  return s
    .replace(/\([^)]*\)/g, "")
    .replace(/[^а-яА-Яa-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е");
}

async function main() {
  const comps = await prisma.component.findMany();
  const params = await prisma.paramDefinition.findMany();
  const paramKeys = new Set(params.map((d) => d.key));
  const formulas = await prisma.systemFormula.findMany({ select: { componentName: true } });
  const fNames = new Set(formulas.map((f) => norm(f.componentName)));
  const shotlans = await prisma.shotlanOption.findMany({ select: { components: true } });
  const shKeys = new Set();
  shotlans.forEach((s) => {
    const c = s.components;
    if (c && typeof c === "object") Object.keys(c).forEach((k) => shKeys.add(k));
  });
  const cprices = await prisma.companyPrice.findMany({ select: { componentId: true } });
  const overridden = new Set(cprices.map((c) => c.componentId));

  const ids = [];
  const names = [];
  for (const c of comps) {
    if (
      paramKeys.has(c.key) &&
      !fNames.has(norm(c.name)) &&
      !shKeys.has(c.key) &&
      !overridden.has(c.id)
    ) {
      ids.push(c.id);
      names.push(c.name);
    }
  }

  if (ids.length === 0) {
    console.log("Мусорных компонентов не найдено. Ничего не удалено.");
  } else {
    console.log("Удаляю мусорные компоненты (" + ids.length + "):");
    names.forEach((n) => console.log("  -", n));
    const r = await prisma.component.deleteMany({ where: { id: { in: ids } } });
    console.log("Удалено:", r.count);
  }
  console.log("Осталось компонентов:", await prisma.component.count());
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
