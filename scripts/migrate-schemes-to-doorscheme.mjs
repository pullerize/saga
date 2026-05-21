import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

// Перенос SubsystemScheme(ratioType=system|top, с категориями) → DoorScheme(viewType=system|top).
// Источник — variants/schemes. Целевая привязка — к (systemSlug, subsystemName) ПЕРВОГО варианта.
// Несколько вариантов одной подсистемы (теоретически) дадут дубликаты — берём первый по createdAt.

const variants = await db.subsystemVariant.findMany({
  include: { schemes: { orderBy: { sortOrder: "asc" } } },
  orderBy: [{ systemSlug: "asc" }, { subsystemName: "asc" }, { createdAt: "asc" }],
});

const seenSubsystems = new Set();
let totalCopied = 0;
let totalSkippedDup = 0;
let totalSkippedNoCat = 0;
let totalSkippedSecondVariant = 0;

for (const v of variants) {
  const key = `${v.systemSlug}::${v.subsystemName}`;
  if (seenSubsystems.has(key)) {
    const skipCount = v.schemes.filter((s) => s.ratioType === "system" || s.ratioType === "top").length;
    totalSkippedSecondVariant += skipCount;
    continue;
  }
  seenSubsystems.add(key);

  for (const s of v.schemes) {
    if (s.ratioType !== "system" && s.ratioType !== "top") continue;
    if (!s.heightCategory || !s.widthCategory) {
      totalSkippedNoCat++;
      continue;
    }
    try {
      await db.doorScheme.create({
        data: {
          systemSlug: v.systemSlug,
          subsystemName: v.subsystemName,
          viewType: s.ratioType,
          shotlanType: null,
          svgContent: s.svgContent,
          heightCategory: s.heightCategory,
          widthCategory: s.widthCategory,
        },
      });
      totalCopied++;
    } catch (err) {
      // Скорее всего unique violation — такая запись уже есть.
      if (String(err).includes("Unique") || String(err).includes("UNIQUE")) {
        totalSkippedDup++;
      } else {
        console.error(`Failed for ${key} ${s.ratioType} ${s.heightCategory}/${s.widthCategory}:`, err);
      }
    }
  }
}

console.log(`Copied:                ${totalCopied}`);
console.log(`Skipped (duplicates):  ${totalSkippedDup}`);
console.log(`Skipped (no category): ${totalSkippedNoCat}`);
console.log(`Skipped (2nd variant): ${totalSkippedSecondVariant}`);

await db.$disconnect();
