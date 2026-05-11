/**
 * Процедурная генерация SVG-схем «вид системы» и «вид двери» по входным размерам.
 * Альтернатива авторским SVG из Figma: схема всегда соответствует фактическим
 * размерам и не требует адаптивного масштабирования через scaleSystemGroup.
 *
 * Формат вывода — совместим с pipeline в ProposalPreview:
 *   • Корневой <svg> с viewBox в миллиметрах
 *   • <g id="system"> вокруг основных элементов
 *   • <g id="handles"> для ручек
 *   • Невидимый <rect> 0,0 → w,h фиксирует bbox системы по полному viewBox,
 *     чтобы scaleSystemGroup не ужимал систему по аспекту
 *   • Большой белый <rect> покрывает весь холст SVG (включая зону подписей размеров)
 */

const STROKE_COLOR = "#333333";
const GLASS_COLOR = "#D5FFFF";
const TRACK_STROKE = 40;
const DOOR_BORDER = 6;
const PROFILE_STROKE = 25;
const HANDLE_STROKE = 10;
const HANDLE_TIP = 25;
const HANDLE_HEIGHT = 180;
const HANDLE_FROM_BOTTOM = 1000;
const OVERLAP = 16;

/** Преобразовать systemName из ProposalData к ключу системы. */
function resolveSystemType(systemName: string): string {
  const lower = (systemName || "").trim().toLowerCase();
  if (!lower) return "";
  if (lower.includes("каскад") || lower.includes("cascade")) return "cascade";
  if (lower.includes("синхрон") || lower.includes("sync")) return "sync";
  if (lower.includes("несвяз") || lower.includes("unlinked")) return "unlinked";
  if (lower.includes("встрое") || lower.includes("embedded")) return "embedded-wall";
  if (lower.includes("перегород") || lower.includes("partition")) return "partition";
  if (lower.includes("навесн") || lower.includes("wall-mount")) return "wall-mounted";
  if (lower.includes("углов") || lower.includes("angle")) return "angle";
  return lower;
}

function isCascade3plus0(systemName: string, subsystem: string): boolean {
  const type = resolveSystemType(systemName);
  const subTrim = (subsystem || "").trim();
  // "3+0" — одиночная секция; "3+0|3+0" — спаренная (другая подсистема, не пускаем)
  const isThreeZero = subTrim === "3+0" || /(^|\s)3\+0($|\s)/.test(subTrim);
  return type === "cascade" && isThreeZero;
}

/** Большой белый прямоугольник под весь возможный viewBox (включая поля для размеров). */
function bgRect(width: number, height: number): string {
  const pad = Math.max(width, height);
  return `<rect x="${-pad}" y="${-pad}" width="${width + pad * 3}" height="${height + pad * 3}" fill="#ffffff"/>`;
}

/**
 * Ручка — три линии «П»-скобы, открытой НАРУЖУ.
 *   inwardDir = +1 → ручка у левого края (x=outerEdgeX слева), пальцы влево
 *   inwardDir = -1 → ручка у правого края (x=outerEdgeX справа), пальцы вправо
 * Концы пальцев упираются в outerEdgeX, стойка глубже внутри на HANDLE_TIP.
 */
function handleSvg(outerEdgeX: number, inwardDir: -1 | 1, gapHeight: number): string {
  const tipX = outerEdgeX;
  const barX = outerEdgeX + inwardDir * HANDLE_TIP;
  const cy = gapHeight - HANDLE_FROM_BOTTOM;
  const top = cy - HANDLE_HEIGHT / 2;
  const bottom = cy + HANDLE_HEIGHT / 2;
  return [
    `<line x1="${barX}" y1="${top}" x2="${tipX}" y2="${top}" stroke="${STROKE_COLOR}" stroke-width="${HANDLE_STROKE}"/>`,
    `<line x1="${barX}" y1="${bottom}" x2="${tipX}" y2="${bottom}" stroke="${STROKE_COLOR}" stroke-width="${HANDLE_STROKE}"/>`,
    `<line x1="${barX}" y1="${top}" x2="${barX}" y2="${bottom}" stroke="${STROKE_COLOR}" stroke-width="${HANDLE_STROKE}"/>`,
  ].join("\n    ");
}

/**
 * Каскад 3+0: 3 наезжающие двери, перекрытие 16 мм. Вид всей системы.
 * Размеры (gapWidth, gapHeight) — фактические в мм.
 */
function buildCascade3plus0System(gapWidth: number, gapHeight: number): string {
  const DOOR_WIDTH = (gapWidth + 2 * OVERLAP) / 3;
  const DOOR_TOP_Y = TRACK_STROKE + 15;
  const DOOR_BOTTOM_Y = gapHeight;
  const DOOR_HEIGHT = DOOR_BOTTOM_Y - DOOR_TOP_Y;

  const door1X = 0;
  const door2X = DOOR_WIDTH - OVERLAP;
  const door3X = gapWidth - DOOR_WIDTH;

  const trackY = TRACK_STROKE / 2;

  const door = (x: number) =>
    `<rect x="${x}" y="${DOOR_TOP_Y}" width="${DOOR_WIDTH}" height="${DOOR_HEIGHT}" fill="${GLASS_COLOR}" stroke="${STROKE_COLOR}" stroke-width="${DOOR_BORDER}"/>`;

  const profile = (x: number, y: number) =>
    `<line x1="${x}" y1="${y}" x2="${x + DOOR_WIDTH}" y2="${y}" stroke="${STROKE_COLOR}" stroke-width="${PROFILE_STROKE}"/>`;

  // Порядок отрисовки: задние двери (2, 3) ниже, передняя (1) поверх в зоне overlap.
  const doors = [
    `${door(door2X)}\n    ${profile(door2X, DOOR_TOP_Y)}\n    ${profile(door2X, DOOR_BOTTOM_Y)}`,
    `${door(door3X)}\n    ${profile(door3X, DOOR_TOP_Y)}\n    ${profile(door3X, DOOR_BOTTOM_Y)}`,
    `${door(door1X)}\n    ${profile(door1X, DOOR_TOP_Y)}\n    ${profile(door1X, DOOR_BOTTOM_Y)}`,
  ].join("\n    ");

  return `<svg xmlns="http://www.w3.org/2000/svg" data-procedural="true" viewBox="0 0 ${gapWidth} ${gapHeight}" width="${gapWidth}" height="${gapHeight}">
  ${bgRect(gapWidth, gapHeight)}
  <g id="system">
    <rect x="0" y="0" width="${gapWidth}" height="${gapHeight}" fill="none" stroke="none"/>
    <line x1="0" y1="${trackY}" x2="${gapWidth}" y2="${trackY}" stroke="#000000" stroke-width="${TRACK_STROKE}"/>
    ${doors}
  </g>
  <g id="handles">
    ${handleSvg(0, 1, gapHeight)}
    ${handleSvg(gapWidth, -1, gapHeight)}
  </g>
</svg>`;
}

/**
 * Каскад 3+0: вид одиночной двери (передней). Один прямоугольник стекла,
 * верхний и нижний горизонтальные профили, ручка на левом краю.
 * (doorWidth, gapHeight) — фактические размеры одной двери и общая высота проёма.
 */
function buildCascade3plus0Door(doorWidth: number, gapHeight: number): string {
  const DOOR_TOP_Y = TRACK_STROKE + 15;
  const DOOR_BOTTOM_Y = gapHeight;
  const DOOR_HEIGHT = DOOR_BOTTOM_Y - DOOR_TOP_Y;
  const trackY = TRACK_STROKE / 2;

  const door = `<rect x="0" y="${DOOR_TOP_Y}" width="${doorWidth}" height="${DOOR_HEIGHT}" fill="${GLASS_COLOR}" stroke="${STROKE_COLOR}" stroke-width="${DOOR_BORDER}"/>`;
  const profileTop = `<line x1="0" y1="${DOOR_TOP_Y}" x2="${doorWidth}" y2="${DOOR_TOP_Y}" stroke="${STROKE_COLOR}" stroke-width="${PROFILE_STROKE}"/>`;
  const profileBottom = `<line x1="0" y1="${DOOR_BOTTOM_Y}" x2="${doorWidth}" y2="${DOOR_BOTTOM_Y}" stroke="${STROKE_COLOR}" stroke-width="${PROFILE_STROKE}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" data-procedural="true" viewBox="0 0 ${doorWidth} ${gapHeight}" width="${doorWidth}" height="${gapHeight}">
  ${bgRect(doorWidth, gapHeight)}
  <g id="system">
    <rect x="0" y="0" width="${doorWidth}" height="${gapHeight}" fill="none" stroke="none"/>
    <line x1="0" y1="${trackY}" x2="${doorWidth}" y2="${trackY}" stroke="#000000" stroke-width="${TRACK_STROKE}"/>
    ${door}
    ${profileTop}
    ${profileBottom}
  </g>
  <g id="handles">
    ${handleSvg(0, 1, gapHeight)}
  </g>
</svg>`;
}

/**
 * Каскад 3+0: вид сверху. Три секции, изображающие конфигурации каскадных дверей:
 *   1) «закрыто» — двери разнесены по всей ширине проёма (каскадно)
 *   2) все двери сдвинуты вправо
 *   3) все двери сдвинуты влево
 * Над секцией 2 — размерная линия с шириной открытого проёма (gapWidth − doorWidth).
 * Над секцией 3 — размерная линия с шириной двери (doorWidth).
 */
function buildCascade3plus0Top(gapWidth: number, doorWidth: number): string {
  const WALL = 110;             // боковые стены
  const SECTION_H = 280;        // высота одной секции
  const SECTION_GAP = 340;      // зазор между секциями (нужно место под подписи + воздух)
  const TOP_GAP = 280;          // зазор над секцией 1 (под общую размерную линию проёма)
  const TOTAL_W = gapWidth + WALL * 2;
  const TOTAL_H = TOP_GAP + SECTION_H * 3 + SECTION_GAP * 2;

  const BG = "#F9F9F9";
  const WALL_C = "#B0B0B0";
  const STRIPE_C = "#4DE5FF";
  const CAP_C = "#323232";
  const STRIPE_STROKE = 10;
  const CAP_STROKE = 10;
  const CAP_HEIGHT = 38;
  const OVERLAP_TOP = 16;

  const railFracs = [0.32, 0.5, 0.68];
  const railY = (sectionY: number, idx: number) => sectionY + SECTION_H * railFracs[idx];

  const doorStripe = (xStart: number, xEnd: number, sectionY: number, railIdx: number) => {
    const y = railY(sectionY, railIdx);
    return [
      `<line x1="${xStart}" y1="${y}" x2="${xEnd}" y2="${y}" stroke="${STRIPE_C}" stroke-width="${STRIPE_STROKE}"/>`,
      `<line x1="${xStart}" y1="${y - CAP_HEIGHT / 2}" x2="${xStart}" y2="${y + CAP_HEIGHT / 2}" stroke="${CAP_C}" stroke-width="${CAP_STROKE}"/>`,
      `<line x1="${xEnd}" y1="${y - CAP_HEIGHT / 2}" x2="${xEnd}" y2="${y + CAP_HEIGHT / 2}" stroke="${CAP_C}" stroke-width="${CAP_STROKE}"/>`,
    ].join("\n    ");
  };

  const sectionBg = (y: number) =>
    `<rect x="${WALL}" y="${y}" width="${gapWidth}" height="${SECTION_H}" fill="${BG}"/>`;

  const TICK = 50;
  const FONT_SIZE = 90;
  const DIM_STROKE = 5;

  const dimLine = (x1: number, x2: number, y: number, label: string) => {
    const midX = (x1 + x2) / 2;
    return [
      `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${CAP_C}" stroke-width="${DIM_STROKE}"/>`,
      `<line x1="${x1}" y1="${y - TICK / 2}" x2="${x1}" y2="${y + TICK / 2}" stroke="${CAP_C}" stroke-width="${DIM_STROKE}"/>`,
      `<line x1="${x2}" y1="${y - TICK / 2}" x2="${x2}" y2="${y + TICK / 2}" stroke="${CAP_C}" stroke-width="${DIM_STROKE}"/>`,
      `<text x="${midX}" y="${y - 25}" font-size="${FONT_SIZE}" fill="${CAP_C}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700">${label}</text>`,
    ].join("\n    ");
  };

  // Стены — серые блоки слева и справа
  const wallLeft = `<rect x="0" y="0" width="${WALL}" height="${TOTAL_H}" fill="${WALL_C}"/>`;
  const wallRight = `<rect x="${TOTAL_W - WALL}" y="0" width="${WALL}" height="${TOTAL_H}" fill="${WALL_C}"/>`;

  // Section 1: каскад в исходном положении (разнесён)
  const sec1Y = TOP_GAP;
  const s1 = [
    sectionBg(sec1Y),
    doorStripe(WALL, WALL + doorWidth, sec1Y, 0),
    doorStripe(WALL + doorWidth - OVERLAP_TOP, WALL + 2 * doorWidth - OVERLAP_TOP, sec1Y, 1),
    doorStripe(WALL + gapWidth - doorWidth, WALL + gapWidth, sec1Y, 2),
  ].join("\n    ");

  // Section 2: все 3 двери сдвинуты вправо
  const sec2Y = sec1Y + SECTION_H + SECTION_GAP;
  const rightX1 = WALL + gapWidth - doorWidth;
  const rightX2 = WALL + gapWidth;
  const s2 = [
    sectionBg(sec2Y),
    doorStripe(rightX1, rightX2, sec2Y, 0),
    doorStripe(rightX1, rightX2, sec2Y, 1),
    doorStripe(rightX1, rightX2, sec2Y, 2),
  ].join("\n    ");

  // Section 3: все 3 двери сдвинуты влево
  const sec3Y = sec2Y + SECTION_H + SECTION_GAP;
  const leftX1 = WALL;
  const leftX2 = WALL + doorWidth;
  const s3 = [
    sectionBg(sec3Y),
    doorStripe(leftX1, leftX2, sec3Y, 0),
    doorStripe(leftX1, leftX2, sec3Y, 1),
    doorStripe(leftX1, leftX2, sec3Y, 2),
  ].join("\n    ");

  // Размер над секцией 1: общая ширина проёма = gapWidth
  const dimTopY = sec1Y - TOP_GAP * 0.3;
  const dimTop = dimLine(
    WALL,
    WALL + gapWidth,
    dimTopY,
    `${Math.round(gapWidth)} мм`,
  );

  // Размер над секцией 2: ширина свободного проёма слева = gapWidth − doorWidth
  const dimMidY = sec2Y - SECTION_GAP * 0.3;
  const dimMid = dimLine(
    WALL,
    WALL + (gapWidth - doorWidth),
    dimMidY,
    `${Math.round(gapWidth - doorWidth)} мм`,
  );

  // Размер над секцией 3: ширина двери (кластер слева) = doorWidth
  const dimBotY = sec3Y - SECTION_GAP * 0.3;
  const dimBot = dimLine(
    WALL,
    WALL + doorWidth,
    dimBotY,
    `${Math.round(doorWidth)} мм`,
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" data-procedural="true" viewBox="0 0 ${TOTAL_W} ${TOTAL_H}" width="${TOTAL_W}" height="${TOTAL_H}">
  ${bgRect(TOTAL_W, TOTAL_H)}
  <g id="system">
    <rect x="0" y="0" width="${TOTAL_W}" height="${TOTAL_H}" fill="none" stroke="none"/>
    ${wallLeft}
    ${wallRight}
    ${s1}
    ${s2}
    ${s3}
    ${dimTop}
    ${dimMid}
    ${dimBot}
  </g>
</svg>`;
}

/**
 * Вернуть SVG для «вида системы», если для пары (system, subsystem) есть формула.
 */
export function tryGenerateSystemScheme(
  systemName: string,
  subsystem: string,
  width: number,
  height: number
): string | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  if (isCascade3plus0(systemName, subsystem)) return buildCascade3plus0System(width, height);
  return null;
}

/**
 * Вернуть SVG для «вида двери», если для пары (system, subsystem) есть формула.
 */
export function tryGenerateDoorScheme(
  systemName: string,
  subsystem: string,
  doorWidth: number,
  height: number
): string | null {
  if (!Number.isFinite(doorWidth) || !Number.isFinite(height) || doorWidth <= 0 || height <= 0) return null;
  if (isCascade3plus0(systemName, subsystem)) return buildCascade3plus0Door(doorWidth, height);
  return null;
}

/**
 * Вернуть SVG для «вида сверху», если для пары (system, subsystem) есть формула.
 */
export function tryGenerateTopScheme(
  systemName: string,
  subsystem: string,
  gapWidth: number,
  doorWidth: number
): string | null {
  if (!Number.isFinite(gapWidth) || !Number.isFinite(doorWidth) || gapWidth <= 0 || doorWidth <= 0) return null;
  if (isCascade3plus0(systemName, subsystem)) return buildCascade3plus0Top(gapWidth, doorWidth);
  return null;
}
