// Гарантирует, что для каждого компонента из формул (SystemFormula.componentName)
// есть ценовая позиция в таблице Component. Компонент = строка спецификации с
// ценой за единицу; количество считает формула. Новые создаются с ценой 0
// (задаётся в /admin/prices). Служебные имена пропускаются.
//
// Запуск:  node scripts/sync-formula-components.mjs
// Использует DATABASE_URL из окружения/.env (на проде — prod.db).

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NON_COMPONENT = new Set(["Ширина двери", "Стекло (м²)"]);

function norm(s) {
  return s
    .replace(/\([^)]*\)/g, "")
    .replace(/[^а-яА-Яa-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е");
}

function slugifyKey(s) {
  const map = {
    а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",
    л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",
    ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
  };
  return (
    s.toLowerCase().split("").map((c) => map[c] ?? c).join("")
      .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || `comp_${Date.now()}`
  );
}

async function main() {
  const formulas = await prisma.systemFormula.findMany({ select: { componentName: true } });
  const names = [...new Set(formulas.map((f) => f.componentName.trim()))].filter(
    (n) => n && !NON_COMPONENT.has(n),
  );
  const comps = await prisma.component.findMany({ select: { name: true, key: true } });
  const haveExact = new Set(comps.map((c) => c.name));
  const haveNorm = new Set(comps.map((c) => norm(c.name)));
  const haveKeys = new Set(comps.map((c) => c.key));

  let created = 0;
  for (const name of names) {
    if (haveExact.has(name) || haveNorm.has(norm(name))) continue;
    let key = slugifyKey(name);
    if (haveKeys.has(key)) key = `${key}_${Date.now().toString(36).slice(-4)}`;
    await prisma.component.create({
      data: { key, name, unit: "шт", category: "component", defaultPrice: 0 },
    });
    haveExact.add(name); haveNorm.add(norm(name)); haveKeys.add(key);
    created++;
    console.log("  + создан компонент:", name);
  }
  console.log(created === 0 ? "Все компоненты формул уже есть." : `Создано компонентов: ${created}`);
  console.log("Всего компонентов:", await prisma.component.count());
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
