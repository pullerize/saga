/**
 * Утилиты для работы с группой <g id="system"> внутри SVG-схемы системы.
 * Используются на стороне ProposalPreview, чтобы масштабировать только систему,
 * не трогая фон.
 */

export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Найти открывающий тег <g id="..."> или <g inkscape:label="..."> в SVG.
 *   • Сначала ищем по id (приоритет).
 *   • Если не нашли — ищем по inkscape:label, потому что Inkscape по умолчанию
 *     при экспорте кладёт пользовательское имя слоя именно в `inkscape:label`,
 *     а в `id` оставляет автогенерацию (g13, g11 и т.д.). Это позволяет
 *     дизайнеру не лазить в XML-редактор и просто называть слои в панели
 *     слоёв Inkscape.
 */
function findGroupOpen(
  svg: string,
  groupId: string,
  fromIndex = 0
): { start: number; afterOpen: number } | null {
  const sub = svg.slice(fromIndex);
  // 1) По id (классический вариант)
  const byId = new RegExp(`<g\\b[^>]*\\bid\\s*=\\s*["']${groupId}["'][^>]*>`, "i");
  let m = sub.match(byId);
  if (!m || m.index === undefined) {
    // 2) По inkscape:label (Inkscape-friendly fallback)
    const byLabel = new RegExp(
      `<g\\b[^>]*\\binkscape:label\\s*=\\s*["']${groupId}["'][^>]*>`,
      "i",
    );
    m = sub.match(byLabel);
    if (!m || m.index === undefined) return null;
  }
  return { start: fromIndex + m.index, afterOpen: fromIndex + m.index + m[0].length };
}

/**
 * Найти парный </g> для открытого <g> на позиции `afterOpen`.
 * Учитывает вложенные <g>...</g>.
 */
function findGroupClose(svg: string, afterOpen: number): { closeStart: number; closeEnd: number } | null {
  let depth = 1;
  let i = afterOpen;
  const open = /<g\b[^>]*>/gi;
  const close = /<\/g\s*>/gi;
  while (i < svg.length) {
    open.lastIndex = i;
    close.lastIndex = i;
    const oMatch = open.exec(svg);
    const cMatch = close.exec(svg);
    if (!cMatch) return null;
    if (oMatch && oMatch.index < cMatch.index) {
      depth++;
      i = oMatch.index + oMatch[0].length;
    } else {
      depth--;
      if (depth === 0) {
        return { closeStart: cMatch.index, closeEnd: cMatch.index + cMatch[0].length };
      }
      i = cMatch.index + cMatch[0].length;
    }
  }
  return null;
}

/**
 * Вернуть содержимое <g id="system">...</g> с правильным учётом вложенных <g>.
 */
export function extractSystemGroup(svg: string): { inner: string; full: string } | null {
  const open = findGroupOpen(svg, "system");
  if (!open) return null;
  const close = findGroupClose(svg, open.afterOpen);
  if (!close) return null;
  return {
    inner: svg.slice(open.afterOpen, close.closeStart),
    full: svg.slice(open.start, close.closeEnd),
  };
}

/**
 * Вернуть содержимое произвольной группы по id, с учётом вложенности.
 */
export function extractGroupById(
  svg: string,
  id: string
): { inner: string; full: string } | null {
  const open = findGroupOpen(svg, id);
  if (!open) return null;
  const close = findGroupClose(svg, open.afterOpen);
  if (!close) return null;
  return {
    inner: svg.slice(open.afterOpen, close.closeStart),
    full: svg.slice(open.start, close.closeEnd),
  };
}

/**
 * Грубый парсер path "d" — извлекает координаты точек.
 * Поддерживает абсолютные команды M, L, H, V, C, Q, Z (Figma и Inkscape экспортируют именно их).
 * Для C/Q берёт только конечные точки сегмента, не контрольные.
 */
function pathPoints(d: string): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  const tokens = d.match(/[A-Za-z][^A-Za-z]*/g) || [];
  let curX = 0;
  let curY = 0;
  let startX = 0;
  let startY = 0;
  for (const token of tokens) {
    const cmd = token[0];
    const args = token
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(Number)
      .filter((n) => !isNaN(n));
    switch (cmd) {
      case "M": {
        for (let i = 0; i < args.length; i += 2) {
          curX = args[i];
          curY = args[i + 1];
          if (i === 0) {
            startX = curX;
            startY = curY;
          }
          points.push([curX, curY]);
        }
        break;
      }
      case "L":
      case "T": {
        for (let i = 0; i < args.length; i += 2) {
          curX = args[i];
          curY = args[i + 1];
          points.push([curX, curY]);
        }
        break;
      }
      case "H": {
        for (const x of args) {
          curX = x;
          points.push([curX, curY]);
        }
        break;
      }
      case "V": {
        for (const y of args) {
          curY = y;
          points.push([curX, curY]);
        }
        break;
      }
      case "C": {
        // cubic bezier — берём только конечную точку (i+4, i+5)
        for (let i = 4; i < args.length; i += 6) {
          curX = args[i];
          curY = args[i + 1];
          points.push([curX, curY]);
        }
        break;
      }
      case "Q":
      case "S": {
        for (let i = 2; i < args.length; i += 4) {
          curX = args[i];
          curY = args[i + 1];
          points.push([curX, curY]);
        }
        break;
      }
      case "Z":
      case "z": {
        curX = startX;
        curY = startY;
        break;
      }
      // относительные команды и прочее игнорируем — их нет в Figma SVG
    }
  }
  return points;
}

/**
 * Вычислить bounding box всех элементов в SVG-фрагменте.
 * Идёт по всем <path d="..."/> и <rect x= y= width= height=>.
 */
export function computeBBox(fragment: string): BBox | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const pathRe = /<path\b[^>]*\sd\s*=\s*["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = pathRe.exec(fragment))) {
    const pts = pathPoints(m[1]);
    for (const [x, y] of pts) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  const rectRe = /<rect\b([^>]*)\/?>/g;
  while ((m = rectRe.exec(fragment))) {
    const attrs = m[1];
    const x = parseFloat(attrs.match(/\sx\s*=\s*["']([\d.\-]+)/)?.[1] || "0");
    const y = parseFloat(attrs.match(/\sy\s*=\s*["']([\d.\-]+)/)?.[1] || "0");
    const w = parseFloat(attrs.match(/\swidth\s*=\s*["']([\d.\-]+)/)?.[1] || "0");
    const h = parseFloat(attrs.match(/\sheight\s*=\s*["']([\d.\-]+)/)?.[1] || "0");
    if (w > 0 && h > 0) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + w > maxX) maxX = x + w;
      if (y + h > maxY) maxY = y + h;
    }
  }

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/**
 * Заменить (или добавить) viewBox корневого <svg>-тега. Если в SVG
 * уже есть viewBox — переписываем; иначе добавляем атрибут.
 */
export function setSvgViewBox(svg: string, bbox: BBox): string {
  const vbStr = `${bbox.x} ${bbox.y} ${bbox.w} ${bbox.h}`;
  if (/<svg[^>]*\bviewBox\s*=/i.test(svg)) {
    return svg.replace(
      /(<svg[^>]*\bviewBox\s*=\s*["'])[^"']*(["'])/i,
      `$1${vbStr}$2`,
    );
  }
  return svg.replace(/<svg\b/i, `<svg viewBox="${vbStr}"`);
}

/**
 * Прочитать `viewBox` корневого <svg>-тега. Это область, по которой SVG
 * масштабируется на странице, поэтому она важнее, чем геометрический
 * bbox содержимого: если viewBox шире (есть подписи, отступы), масштаб
 * применяется ко всему viewBox.
 */
export function getSvgViewBox(svg: string): BBox | null {
  const m = svg.match(
    /<svg\b[^>]*\bviewBox\s*=\s*["']\s*([\-\d.]+)\s+([\-\d.]+)\s+([\-\d.]+)\s+([\-\d.]+)\s*["']/i,
  );
  if (!m) return null;
  const x = parseFloat(m[1]);
  const y = parseFloat(m[2]);
  const w = parseFloat(m[3]);
  const h = parseFloat(m[4]);
  if (!isFinite(x) || !isFinite(y) || !isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return null;
  return { x, y, w, h };
}

/**
 * Позиционировать <g id="handles"> у внешних краёв крайних дверей.
 *
 * Используется после scaleSystemGroup. Handles находятся ВНЕ <g id="system">
 * (на верхнем уровне SVG), поэтому system scale на них не влияет — ручки
 * сохраняют свой исходный размер.
 *
 * Алгоритм:
 *   1. Найти двери внутри <g id="system"> — вычислить их центры в исходных координатах
 *   2. Применить scale к центру двери: door_screen = sysO + (door_orig - sysO) * scale
 *   3. Каждому кластеру handles применить translate так, чтобы его центр оказался
 *      у внешнего края двери (по X) и в центре двери (по Y) в screen-coordinates
 */
export function positionHandlesOnDoors(svg: string, scaleX: number, scaleY: number): string {
  const sysGroup = extractSystemGroup(svg);
  if (!sysGroup) return svg;
  const sysBBox = computeBBox(sysGroup.inner);
  if (!sysBBox || sysBBox.w === 0 || sysBBox.h === 0) return svg;

  const handlesGroup = extractGroupById(svg, "handles");
  if (!handlesGroup) return svg;

  const clusters = clusterPathsByPosition(handlesGroup.inner);
  if (clusters.length === 0) return svg;

  const doorCenters = findDoorCenters(sysGroup.inner);

  // Origin scaling = низ-центр системы (как в scaleSystemGroup)
  const sysCx = sysBBox.x + sysBBox.w / 2;
  const sysBottomY = sysBBox.y + sysBBox.h;

  // X-позиция: из исходного SVG (где Figma поставил, обычно у самого края двери)
  //            затем применяем system scale математически.
  // Y-позиция: ровно по центру ближайшей двери (после system scale).
  const wrappedClusters = clusters
    .map((cluster) => {
      const cBBox = computeBBox(cluster.fragment);
      if (!cBBox || cBBox.w === 0 || cBBox.h === 0) return cluster.fragment;
      const hcx = cBBox.x + cBBox.w / 2;
      const hcy = cBBox.y + cBBox.h / 2;

      // Х: исходная handle.cx со scaleX
      const targetCx_screen = sysCx + (hcx - sysCx) * scaleX;

      // Y: центр ближайшей двери (по X) после scaleY
      let targetCy_screen: number;
      if (doorCenters.length > 0) {
        // ищем дверь, к которой относится handle
        let nearestDoor = doorCenters[0];
        let bestDist = Math.abs(nearestDoor.cx - hcx);
        for (const d of doorCenters) {
          const dist = Math.abs(d.cx - hcx);
          if (dist < bestDist) {
            bestDist = dist;
            nearestDoor = d;
          }
        }
        targetCy_screen = sysBottomY + (nearestDoor.cy - sysBottomY) * scaleY;
      } else {
        targetCy_screen = sysBottomY + (hcy - sysBottomY) * scaleY;
      }

      const dx = targetCx_screen - hcx;
      const dy = targetCy_screen - hcy;
      if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return cluster.fragment;
      return `<g transform="translate(${dx} ${dy})">${cluster.fragment}</g>`;
    })
    .join("\n");

  const handlesOpen = handlesGroup.full.match(/<g\b[^>]*>/i)![0];
  return svg.replace(handlesGroup.full, handlesOpen + wrappedClusters + "</g>");
}

/**
 * Найти центры "дверей" — элементов с fill="#D5FFFF" (стандартный цвет стекла
 * в SVG-схемах SAGA). Учитывает и <path>, и <rect> (case-insensitive).
 */
export function findDoorCenters(fragment: string): Array<{ cx: number; cy: number; w: number; h: number }> {
  const doors: Array<{ cx: number; cy: number; w: number; h: number }> = [];
  // path
  const pathRe = /<path\b[^>]*\bfill\s*=\s*["']#d5ffff["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = pathRe.exec(fragment))) {
    const dMatch = m[0].match(/\sd\s*=\s*["']([^"']+)["']/);
    if (!dMatch) continue;
    const pts = pathPoints(dMatch[1]);
    if (pts.length === 0) continue;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of pts) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    doors.push({ cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: maxX - minX, h: maxY - minY });
  }
  // rect (Inkscape/Figma часто экспортируют двери прямоугольниками)
  const rectRe = /<rect\b[^>]*\bfill\s*=\s*["']#d5ffff["'][^>]*\/?>/gi;
  while ((m = rectRe.exec(fragment))) {
    const attrs = m[0];
    const x = parseFloat(attrs.match(/\sx\s*=\s*["']([\d.\-]+)/)?.[1] || "0");
    const y = parseFloat(attrs.match(/\sy\s*=\s*["']([\d.\-]+)/)?.[1] || "0");
    const w = parseFloat(attrs.match(/\swidth\s*=\s*["']([\d.\-]+)/)?.[1] || "0");
    const h = parseFloat(attrs.match(/\sheight\s*=\s*["']([\d.\-]+)/)?.[1] || "0");
    if (w > 0 && h > 0) {
      doors.push({ cx: x + w / 2, cy: y + h / 2, w, h });
    }
  }
  doors.sort((a, b) => a.cx - b.cx);
  return doors;
}

/**
 * Сгруппировать path-ы внутри SVG-фрагмента по позиции — каждый "кластер"
 * это набор соседних path-ов, образующих одну логическую фигуру (например
 * одну ручку). Используется для handles: левая ручка и правая ручка получают
 * каждая свой counter-scale.
 *
 * Алгоритм:
 *   1. Извлечь все <path>, посчитать центр каждого
 *   2. Сортировать по X
 *   3. Разделять на кластеры — если разница X-центров между соседними > threshold
 */
export function clusterPathsByPosition(
  fragment: string,
  thresholdRatio = 0.15 // % от полной ширины fragment
): Array<{ fragment: string }> {
  const pathTokens: Array<{ src: string; cx: number; cy: number }> = [];
  // Учитываем и <path>, и <rect> — Inkscape/Figma экспортируют ручки чаще всего как rect.
  const pathRe = /<path\b[^>]*\/?>/g;
  let m: RegExpExecArray | null;
  while ((m = pathRe.exec(fragment))) {
    const dMatch = m[0].match(/\sd\s*=\s*["']([^"']+)["']/);
    if (!dMatch) continue;
    const pts = pathPoints(dMatch[1]);
    if (pts.length === 0) continue;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of pts) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    pathTokens.push({
      src: m[0],
      cx: (minX + maxX) / 2,
      cy: (minY + maxY) / 2,
    });
  }
  // <rect>
  const rectRe = /<rect\b[^>]*\/?>/g;
  while ((m = rectRe.exec(fragment))) {
    const attrs = m[0];
    const x = parseFloat(attrs.match(/\sx\s*=\s*["']([\d.\-]+)/)?.[1] || "0");
    const y = parseFloat(attrs.match(/\sy\s*=\s*["']([\d.\-]+)/)?.[1] || "0");
    const w = parseFloat(attrs.match(/\swidth\s*=\s*["']([\d.\-]+)/)?.[1] || "0");
    const h = parseFloat(attrs.match(/\sheight\s*=\s*["']([\d.\-]+)/)?.[1] || "0");
    if (w > 0 && h > 0) {
      pathTokens.push({ src: attrs, cx: x + w / 2, cy: y + h / 2 });
    }
  }
  if (pathTokens.length === 0) return [];

  // Find total X range
  const xs = pathTokens.map((p) => p.cx);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const threshold = (xMax - xMin) * thresholdRatio;

  // Sort by X then split
  pathTokens.sort((a, b) => a.cx - b.cx);
  const clusters: Array<typeof pathTokens> = [];
  let current: typeof pathTokens = [];
  let lastX = -Infinity;
  for (const p of pathTokens) {
    if (current.length === 0 || p.cx - lastX <= threshold) {
      current.push(p);
    } else {
      clusters.push(current);
      current = [p];
    }
    lastX = p.cx;
  }
  if (current.length > 0) clusters.push(current);

  return clusters.map((c) => ({ fragment: c.map((p) => p.src).join("\n") }));
}

/**
 * Применить scaleX/scaleY к группе <g id="system"> в SVG.
 * Origin — верх-центр системы (двери "висят" на штанге).
 *
 * Дополнительно:
 *   • Все <path> и <rect> внутри group получают vector-effect="non-scaling-stroke" —
 *     толщина обводки (профили) не меняется при scale.
 *   • Если внутри есть <g id="handles">, к ним применяется counter-scale
 *     (1/sx, 1/sy), origin — центр bbox handles. Это сохраняет внешние размеры
 *     ручек пропорциональными, только перемещает их в новой позиции.
 */
export function scaleSystemGroup(svg: string, scaleX: number, scaleY: number): string {
  const group = extractSystemGroup(svg);
  if (!group) return svg;

  const bbox = computeBBox(group.inner);
  if (!bbox || bbox.w === 0 || bbox.h === 0) return svg;

  const inner = group.inner;
  const sysCx = bbox.x + bbox.w / 2;
  const sysBottomY = bbox.y + bbox.h;

  // 1. Scale on system group (origin = низ-центр системы)
  let result = svg;
  let openTag = group.full.match(/<g\b[^>]*>/i)![0];
  const needsScale = Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001;
  if (needsScale) {
    const transform = `translate(${sysCx} ${sysBottomY}) scale(${scaleX} ${scaleY}) translate(${-sysCx} ${-sysBottomY})`;
    openTag = openTag.replace(
      /<g\b([^>]*)\bid\s*=\s*["']system["']([^>]*)>/i,
      `<g$1id="system"$2 transform="${transform}">`
    );
  }
  const replacement = `${openTag}${inner}</g>`;
  result = result.replace(group.full, replacement);

  // 2. Тот же scale на <g id="handles"> — иначе ручки, которые лежат в SVG-
  //    координатах около краёв viewBox, остаются на месте и «улетают» от
  //    сжавшейся системы. С тем же origin они визуально следуют за дверями.
  if (needsScale) {
    const handles = extractGroupById(result, "handles");
    if (handles) {
      const hOpen = handles.full.match(/<g\b[^>]*>/i)![0];
      // Если у группы уже был свой transform — добавляем наш ВНУТРЬ через scale-translate.
      // Простой случай: у handles нет transform — добавляем atribut transform.
      const transform = `translate(${sysCx} ${sysBottomY}) scale(${scaleX} ${scaleY}) translate(${-sysCx} ${-sysBottomY})`;
      let newOpen = hOpen;
      if (/\btransform\s*=/.test(newOpen)) {
        newOpen = newOpen.replace(
          /\btransform\s*=\s*["']([^"']*)["']/i,
          (_full, existing) => `transform="${transform} ${existing}"`,
        );
      } else {
        newOpen = newOpen.replace(/<g\b/, `<g transform="${transform}"`);
      }
      result = result.replace(handles.full, newOpen + handles.inner + "</g>");
    }
  }

  return result;
}
