"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { glassDescriptions } from "@/lib/calculations/media";

/* ── Fonts ── */
Font.register({
  family: "Roboto",
  fonts: [
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf", fontWeight: 400 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf", fontWeight: 700 },
  ],
});

/* ── Types ── */
export interface CalculationPDFProps {
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  managerName?: string;
  managerPhone?: string;
  branchAddress?: string;
  systemName: string;
  subsystemName: string;
  fullWidth: number;
  height: number;
  doorWidth: number;
  openWidth?: number;
  glassType: string;
  shotlanType: string;
  components: Array<{ name: string; key: string; qty: number; price: number; sum: number; unit: string; group?: string }>;
  totalPrice: number;
  services?: Array<{ name: string; price: number }>;
  customServices?: Array<{ name: string; description: string; price: number }>;
  variant?: {
    variantName: string;
    items: Array<{ title: string; description: string; iconUrl?: string | null }>;
    schemes?: Array<{ label: string; svgContent: string }>;
  } | null;
  schemeSvgs?: string[];
  schemeSizes?: Array<{ w: number; h: number }>;
  /**
   * Готовые подписи «Вида сверху»: позиция в нормализованных (0..1) координатах
   * SVG viewBox + текст. Рендерятся overlay'ем тем же стилем, что у
   * подписей «Вида системы»/«Вида двери».
   */
  topLabels?: Array<{ xNorm: number; yNorm: number; text: string }>;
  /**
   * Соотношения «одна дверь / весь viewBox» в системном и дверном SVG.
   * Если задано — слот «Вид двери» рендерится так, чтобы реальная дверь
   * внутри его SVG совпала по визуальным размерам с одной дверью в «Вид
   * системы». Подписи/размеры вокруг двери в дверном SVG учитываются через
   * `door`, а пустое место по высоте ячейки превращается в отступ сверху.
   */
  doorBoxRatio?: {
    sys: { w: number; h: number };
    door: { w: number; h: number };
    /** Доля padBottom от высоты SVG «вид системы» (свободное место под низом стекла). */
    sysPadBFrac?: number;
    /** То же для SVG «вид двери». */
    doorPadBFrac?: number;
  };
  glassImageUrl?: string;
  railImageUrl?: string;
  date?: string;
  /**
   * До 3 свободных строк после блока «Общая сумма». Если значение пустое —
   * рисуется пустая линия для рукописной заметки после печати.
   */
  notes?: string[];
  /**
   * Логотип компании партнёра (если PDF готовит сторонняя компания, не Saga Group).
   * При наличии в шапке каждой страницы рядом с «SAGA» появляется блок
   * «лого партнёра × SAGA».
   */
  partnerLogoUrl?: string | null;
  partnerCompanyName?: string | null;
}

/* ── Brand palette ── */
const BRAND_DARK = "#062D35";
const BRAND = "#0A3C46";
const GOLD = "#BAA08F";
const GOLD_LIGHT = "#D4BFAE";
const WHITE = "#FFFFFF";
const IVORY = "#FAFAF8";
const TEXT = "#1C1C1C";
const TEXT_SEC = "#555555";
const GRAY = "#8A8A8A";
const BORDER = "#E0DDD8";
const ROW_ALT = "#F7F6F4";

/* ── Styles ── */
const s = StyleSheet.create({
  /* Page */
  page: { fontFamily: "Roboto", fontSize: 9.5, color: TEXT, backgroundColor: WHITE, paddingTop: 54, paddingBottom: 44, paddingHorizontal: 0 },

  /* Top bar */
  topBar: { backgroundColor: BRAND_DARK, height: 5, marginTop: -40 },

  /* Header */
  headerWrap: { backgroundColor: BRAND, paddingHorizontal: 44, paddingTop: 22, paddingBottom: 18 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { fontSize: 30, fontFamily: "Roboto", fontWeight: 700, color: WHITE, letterSpacing: 7 },
  tagline: { fontSize: 8, color: GOLD_LIGHT, marginTop: 2, letterSpacing: 1.5, textTransform: "uppercase" },
  headerRight: { alignItems: "flex-end", paddingTop: 4 },
  docLabel: { fontSize: 7, color: GOLD, fontFamily: "Roboto", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2 },
  dateText: { fontSize: 9, color: WHITE, marginTop: 3 },

  /* Gold stripe */
  goldStripe: { height: 2.5, backgroundColor: GOLD },

  /* Body */
  body: { paddingHorizontal: 44, paddingTop: 22, flex: 1 },

  /* Info cards */
  cardsRow: { flexDirection: "row", marginBottom: 20 },
  card: { width: "48%", backgroundColor: IVORY, borderRadius: 6, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 0.5, borderColor: BORDER },
  cardLeft: { marginRight: "4%" },
  cardTitle: { fontSize: 6.5, fontFamily: "Roboto", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, paddingBottom: 5, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  cardRow: { flexDirection: "row", marginBottom: 4, alignItems: "flex-start" },
  cardLabel: { fontSize: 8, color: GRAY, width: 60, paddingTop: 1 },
  cardValue: { fontSize: 9, fontFamily: "Roboto", fontWeight: 700, color: TEXT, flex: 1 },

  /* Params grid */
  paramsSection: { marginBottom: 20 },
  paramsGrid: { flexDirection: "row", flexWrap: "wrap", backgroundColor: BRAND, borderRadius: 6, paddingVertical: 12, paddingHorizontal: 18 },
  paramCell: { width: "50%", paddingVertical: 4, paddingHorizontal: 5 },
  paramRow: { flexDirection: "row", alignItems: "baseline" },
  paramLabel: { fontSize: 7, color: GOLD_LIGHT, width: 65, textTransform: "uppercase", letterSpacing: 0.5 },
  paramValue: { fontSize: 9, fontFamily: "Roboto", fontWeight: 700, color: WHITE, flex: 1 },

  /* Variant cards */
  variantSection: { marginBottom: 18 },
  variantTitle: { fontSize: 6.5, fontFamily: "Roboto", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 },
  variantRow: { flexDirection: "row" },
  variantCard: { width: "31%", backgroundColor: IVORY, borderRadius: 5, borderWidth: 0.5, borderColor: BORDER, padding: 8, marginRight: "3.5%" },
  variantCardLast: { marginRight: 0 },
  variantIcon: { width: 32, height: 32, borderRadius: 4, marginBottom: 5 },
  variantIconPlaceholder: { width: 32, height: 32, borderRadius: 4, backgroundColor: BORDER, marginBottom: 5 },
  variantCardTitle: { fontSize: 8, fontFamily: "Roboto", fontWeight: 700, color: TEXT, marginBottom: 2 },
  variantCardDesc: { fontSize: 7, color: GRAY, lineHeight: 1.4 },

  /* Scheme page */
  schemePage: { fontFamily: "Roboto", fontSize: 9.5, color: TEXT, backgroundColor: WHITE, paddingTop: 54, paddingBottom: 44, paddingHorizontal: 0 },
  schemeHeader: { backgroundColor: BRAND, paddingHorizontal: 44, paddingTop: 12, paddingBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  schemeLogo: { fontSize: 18, fontFamily: "Roboto", fontWeight: 700, color: WHITE, letterSpacing: 5 },
  schemeTitle: { fontSize: 10, fontFamily: "Roboto", fontWeight: 700, color: WHITE, textAlign: "right" },
  schemeSub: { fontSize: 7, color: GOLD_LIGHT, textAlign: "right", marginTop: 1 },
  schemeBody: { flex: 1, flexDirection: "row", paddingHorizontal: 30, paddingVertical: 15, justifyContent: "center", alignItems: "center" },
  schemeLabel: { fontSize: 7, fontFamily: "Roboto", fontWeight: 700, color: BRAND, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, textAlign: "center" },

  /* Section title */
  sectionTitle: { fontSize: 7.5, fontFamily: "Roboto", fontWeight: 700, color: BRAND, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 },

  /* Table */
  table: { borderRadius: 4, overflow: "hidden", borderWidth: 0.5, borderColor: BORDER, marginBottom: 18 },
  tableHeader: { flexDirection: "row", backgroundColor: BRAND_DARK, paddingVertical: 7, paddingHorizontal: 8 },
  tableHeaderCell: { fontSize: 7, fontFamily: "Roboto", fontWeight: 700, color: GOLD_LIGHT, textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  tableRowAlt: { backgroundColor: ROW_ALT },
  tableCell: { fontSize: 8.5, color: TEXT_SEC },
  tableCellBold: { fontSize: 8.5, fontFamily: "Roboto", fontWeight: 700, color: TEXT },
  colNum: { width: "5%" },
  colName: { width: "39%" },
  colQty: { width: "10%", textAlign: "center" },
  colUnit: { width: "10%", textAlign: "center" },
  colPrice: { width: "18%", textAlign: "right" },
  colTotal: { width: "18%", textAlign: "right" },

  /* Подзаголовок группы внутри таблицы (Комплектующие/Шотланки/Стекло/Доп. расходы). */
  tableGroupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: IVORY, paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  tableGroupLabel: { fontSize: 7.5, fontFamily: "Roboto", fontWeight: 700, color: BRAND, textTransform: "uppercase", letterSpacing: 1 },
  tableGroupTotal: { fontSize: 7.5, fontFamily: "Roboto", fontWeight: 700, color: BRAND, textAlign: "right" },

  /* Total block */
  totalBlock: { backgroundColor: BRAND_DARK, borderRadius: 6, paddingVertical: 16, paddingHorizontal: 22, marginBottom: 22 },
  totalNote: { fontSize: 8.5, color: GOLD_LIGHT, lineHeight: 1.5 },
  totalValueRow: { flexDirection: "row", alignItems: "baseline", marginTop: 6 },
  totalValue: { fontSize: 13, fontFamily: "Roboto", fontWeight: 700, color: WHITE },
  totalCurrency: { fontSize: 9, color: GOLD_LIGHT, marginLeft: 4 },

  /* Заметки — 3 пустые/заполняемые линии после блока с итогом */
  notesBlock: { marginBottom: 22 },
  noteLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: GRAY,
    minHeight: 18,
    marginBottom: 12,
    justifyContent: "flex-end",
    paddingBottom: 3,
  },
  noteText: { fontSize: 9, color: TEXT, lineHeight: 1.3 },

  /* QR */
  qrRow: { flexDirection: "row", marginBottom: 22 },
  qrBlock: { width: "48%", flexDirection: "row", alignItems: "center", padding: 8 },
  qrBlockLeft: { marginRight: "4%" },
  qrPlaceholder: { width: 48, height: 48, borderWidth: 0.5, borderColor: BORDER, borderRadius: 3, backgroundColor: IVORY, justifyContent: "center", alignItems: "center" },
  qrText: { fontSize: 6, color: GRAY },
  qrLabel: { marginLeft: 10, flex: 1 },
  qrTitle: { fontSize: 8, fontFamily: "Roboto", fontWeight: 700, color: TEXT, marginBottom: 2 },
  qrDesc: { fontSize: 6.5, color: GRAY, lineHeight: 1.4 },

  /* Signatures */
  sigRow: { flexDirection: "row", marginBottom: 16 },
  sigCell: { width: "50%", flexDirection: "row", alignItems: "flex-end", paddingRight: 14 },
  sigLabel: { fontSize: 8, color: TEXT_SEC },
  sigLine: { flex: 1, borderBottomWidth: 0.5, borderBottomColor: GRAY, marginLeft: 5, marginBottom: 1 },

  /* Services */
  servicesRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  serviceName: { fontSize: 8.5, color: TEXT_SEC, flex: 1 },
  servicePrice: { fontSize: 8.5, fontFamily: "Roboto", fontWeight: 700, color: TEXT, width: 90, textAlign: "right" },

  /* Fixed header (all pages) */
  fixedHeader: { position: "absolute", top: 0, left: 0, right: 0 },
  fixedHeaderBar: { backgroundColor: BRAND, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, paddingHorizontal: 44 },
  fixedHeaderLogo: { fontSize: 14, fontFamily: "Roboto", fontWeight: 700, color: WHITE, letterSpacing: 4 },
  fixedHeaderRight: { flexDirection: "row", alignItems: "center" },
  fixedHeaderText: { fontSize: 7, color: GOLD_LIGHT, marginLeft: 12 },
  fixedHeaderGold: { height: 2, backgroundColor: GOLD },

  /* Footer */
  footer: { position: "absolute", bottom: 0, left: 0, right: 0 },
  footerGold: { height: 1.5, backgroundColor: GOLD },
  footerBar: { backgroundColor: BRAND_DARK, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, paddingHorizontal: 44 },
  footerText: { fontSize: 7, color: GRAY },
  footerBrand: { fontSize: 7, color: GOLD, fontFamily: "Roboto", fontWeight: 700, letterSpacing: 2 },
});

/* ── Helpers ── */
function fmt(n: number): string {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
function formatDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}

/* ── Shared fixed header ──
   Если передано имя сторонней компании партнёра — слева рисуем
   «<Имя компании> × Saga Group», иначе только «SAGA». */
function FixedHeader({
  systemName,
  date,
  partnerCompanyName,
}: {
  systemName: string;
  date: string;
  partnerCompanyName?: string | null;
}) {
  return (
    <View style={s.fixedHeader} fixed>
      <View style={s.fixedHeaderBar}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {partnerCompanyName ? (
            <>
              <Text style={[s.fixedHeaderLogo, { fontWeight: 400, letterSpacing: 1 }]}>{partnerCompanyName}</Text>
              <Text style={{ marginHorizontal: 6, color: GOLD_LIGHT, fontSize: 9 }}>×</Text>
              <Text style={[s.fixedHeaderLogo, { fontWeight: 400, letterSpacing: 1 }]}>Saga Group</Text>
            </>
          ) : (
            <Text style={s.fixedHeaderLogo}>SAGA</Text>
          )}
        </View>
        <View style={s.fixedHeaderRight}>
          <Text style={s.fixedHeaderText}>{systemName}</Text>
          <Text style={s.fixedHeaderText}>{date}</Text>
        </View>
      </View>
      <View style={s.fixedHeaderGold} />
    </View>
  );
}

/* ── Shared fixed footer ── */
function Footer({ managerName, managerPhone }: { managerName?: string; managerPhone?: string }) {
  const managerLine = [managerName?.trim(), managerPhone?.trim()].filter(Boolean).join(" · ");
  return (
    <View style={s.footer} fixed>
      <View style={s.footerGold} />
      <View style={s.footerBar}>
        <Text style={s.footerText}>{managerLine || ""}</Text>
        <Text style={s.footerBrand}>SAGA</Text>
        <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </View>
  );
}

/* ── Document ── */
export default function CalculationPDF(props: CalculationPDFProps) {
  const {
    customerName, customerPhone, customerAddress,
    managerName, managerPhone, branchAddress,
    systemName, subsystemName,
    fullWidth, height, doorWidth, openWidth,
    glassType, shotlanType,
    components, totalPrice,
    services, customServices, variant, schemeSvgs, schemeSizes, topLabels, glassImageUrl, railImageUrl, date, notes,
    partnerLogoUrl, partnerCompanyName, doorBoxRatio,
  } = props;
  // Имя сторонней компании показываем только если это не Saga Group.
  // (logo URL остаётся в пропсах для совместимости, но в шапке мы выводим имя.)
  void partnerLogoUrl;
  const isExternal =
    !!partnerCompanyName &&
    partnerCompanyName.trim().toLowerCase() !== "saga group";
  const headerCompanyName = isExternal ? partnerCompanyName : undefined;

  const formattedDate = formatDate(date);
  const servicesTotal = services?.reduce((a, sv) => a + sv.price, 0) ?? 0;

  const params: { label: string; value: string }[] = [
    { label: "Система", value: systemName },
    { label: "Подсистема", value: subsystemName },
    { label: "Ш × В", value: `${fullWidth} × ${height} мм` },
    { label: "Дверь", value: `${doorWidth} мм` },
  ];
  if (openWidth) params.push({ label: "Проём", value: `${openWidth} мм` });
  params.push({ label: "Стекло", value: glassType });
  params.push({ label: "Шотланки", value: shotlanType && shotlanType !== "Без шотланок" ? shotlanType : "отсутствуют" });
  // Боковая обшивка и Закладные — важные параметры: выводим их в блоке
  // «Параметры» (значение — описание из доп. услуг, иначе «Да»/«—»). Остальные
  // доп. услуги остаются только в блоке «Спецификация».
  {
    const svc = (name: string) =>
      customServices?.find((s) => s.name.trim().toLowerCase() === name.toLowerCase());
    const svcValue = (s?: { description: string; price: number }) =>
      !s ? "—" : s.description?.trim() ? s.description.trim() : s.price > 0 ? "Да" : "—";
    for (const name of ["Боковая обшивка", "Закладные"]) {
      params.push({ label: name, value: svcValue(svc(name)) });
    }
  }

  return (
    <Document title={`SAGA — ${systemName} — ${customerName}`} author="SAGA Group">

      {/* ═══════════════ PAGE 1: Cover ═══════════════ */}
      <Page size="A4" style={s.page}>
        <FixedHeader systemName={systemName} date={formattedDate} partnerCompanyName={headerCompanyName} />

        <View style={s.body}>
          {/* Hero title */}
          <View style={{ marginBottom: 10, paddingTop: 0 }}>
            <Text style={{ fontSize: 22, fontFamily: "Roboto", fontWeight: 700, color: BRAND, letterSpacing: 0.5 }}>
              Коммерческое предложение
            </Text>
            <View style={{ width: 60, height: 2.5, backgroundColor: GOLD, marginTop: 8, borderRadius: 2 }} />
            <Text style={{ fontSize: 9, color: TEXT_SEC, marginTop: 8, lineHeight: 1.6 }}>
              Индивидуальный расчёт дверной системы {systemName} для вашего проекта. Все комплектующие сертифицированы и имеют гарантию производителя.
            </Text>
          </View>

          {/* Client + Manager — larger cards */}
          <View style={{ flexDirection: "row", marginBottom: 16 }}>
            <View style={{ width: "48%", backgroundColor: IVORY, borderRadius: 8, padding: 18, borderWidth: 0.5, borderColor: BORDER, marginRight: "4%" }}>
              <Text style={{ fontSize: 7, fontFamily: "Roboto", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, paddingBottom: 6, borderBottomWidth: 0.5, borderBottomColor: BORDER }}>
                Клиент
              </Text>
              <View style={{ marginBottom: 6 }}><Text style={{ fontSize: 7.5, color: GRAY }}>Имя</Text><Text style={{ fontSize: 11, fontFamily: "Roboto", fontWeight: 700, color: TEXT }}>{customerName}</Text></View>
              {customerPhone ? <View style={{ marginBottom: 6 }}><Text style={{ fontSize: 7.5, color: GRAY }}>Телефон</Text><Text style={{ fontSize: 10, color: TEXT }}>{customerPhone}</Text></View> : null}
              {customerAddress ? <View style={{ marginBottom: 6 }}><Text style={{ fontSize: 7.5, color: GRAY }}>Адрес</Text><Text style={{ fontSize: 9, color: TEXT }}>{customerAddress}</Text></View> : null}
            </View>
            {(managerName || branchAddress) ? (
              <View style={{ width: "48%", backgroundColor: IVORY, borderRadius: 8, padding: 18, borderWidth: 0.5, borderColor: BORDER }}>
                <Text style={{ fontSize: 7, fontFamily: "Roboto", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, paddingBottom: 6, borderBottomWidth: 0.5, borderBottomColor: BORDER }}>
                  Ваш менеджер
                </Text>
                {managerName ? <View style={{ marginBottom: 6 }}><Text style={{ fontSize: 7.5, color: GRAY }}>Имя</Text><Text style={{ fontSize: 11, fontFamily: "Roboto", fontWeight: 700, color: TEXT }}>{managerName}</Text></View> : null}
                {managerPhone ? <View style={{ marginBottom: 6 }}><Text style={{ fontSize: 7.5, color: GRAY }}>Телефон</Text><Text style={{ fontSize: 10, color: TEXT }}>{managerPhone}</Text></View> : null}
                {branchAddress ? <View style={{ marginBottom: 6 }}><Text style={{ fontSize: 7.5, color: GRAY }}>Филиал</Text><Text style={{ fontSize: 9, color: TEXT }}>{branchAddress}</Text></View> : null}
              </View>
            ) : null}
          </View>

          {/* System params — full width dark block. Каждый параметр — карточка
              в сетке: label сверху (мелким золотым), value снизу (крупным белым).
              Это даёт одинаковую высоту строк независимо от длины меток/значений. */}
          <View style={{ backgroundColor: BRAND, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 22, marginBottom: 14 }}>
            <Text style={{ fontSize: 7, fontFamily: "Roboto", fontWeight: 700, color: GOLD_LIGHT, textTransform: "uppercase", letterSpacing: 2, marginBottom: 14 }}>
              Параметры системы
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
              {params.map((p) => (
                <View
                  key={p.label}
                  style={{
                    width: "33.3333%",
                    paddingHorizontal: 6,
                    paddingVertical: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 7,
                      fontFamily: "Roboto",
                      fontWeight: 700,
                      color: GOLD_LIGHT,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                      marginBottom: 4,
                    }}
                  >
                    {p.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontFamily: "Roboto",
                      fontWeight: 700,
                      color: WHITE,
                      lineHeight: 1.3,
                    }}
                  >
                    {p.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Variant cards — premium style. wrap={false} держит весь блок
              «Преимущества системы» (заголовок + 3 карточки) на одной странице. */}
          {variant && variant.items.length > 0 && (
            <View wrap={false} style={{ marginBottom: 14 }}>
              {/* Section header with golden rule */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                <View style={{ height: 1, width: 18, backgroundColor: GOLD, marginRight: 8 }} />
                <Text style={{ fontSize: 7, fontFamily: "Roboto", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: 2.5 }}>
                  Преимущества системы
                </Text>
                <View style={{ height: 1, flex: 1, backgroundColor: BORDER, marginLeft: 8 }} />
              </View>

              <View style={{ flexDirection: "row" }}>
                {variant.items.map((item, i) => {
                  const isLast = i === variant.items.length - 1;
                  const num = String(i + 1).padStart(2, "0");
                  return (
                    <View
                      key={i}
                      style={{
                        width: "31%",
                        marginRight: isLast ? 0 : "3.5%",
                        backgroundColor: WHITE,
                        borderRadius: 6,
                        borderWidth: 0.5,
                        borderColor: BORDER,
                        paddingTop: 14,
                        paddingHorizontal: 12,
                        paddingBottom: 14,
                        alignItems: "center",
                        position: "relative",
                      }}
                    >
                      {/* Top gold accent line */}
                      <View
                        style={{
                          position: "absolute",
                          top: 0,
                          left: "25%",
                          width: "50%",
                          height: 2,
                          backgroundColor: GOLD,
                        }}
                      />

                      {/* Card number badge */}
                      <Text
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 10,
                          fontSize: 6.5,
                          fontFamily: "Roboto",
                          fontWeight: 700,
                          color: GOLD,
                          letterSpacing: 1.5,
                        }}
                      >
                        {num}
                      </Text>

                      {/* Картинка-визуал (компактнее, чтобы влезали все 3 карточки) */}
                      <View
                        style={{
                          width: "100%",
                          height: 90,
                          borderRadius: 6,
                          backgroundColor: IVORY,
                          borderWidth: 0.5,
                          borderColor: GOLD_LIGHT,
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: 4,
                          marginBottom: 10,
                          overflow: "hidden",
                        }}
                      >
                        {item.iconUrl ? (
                          <Image
                            src={item.iconUrl}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <View style={{ width: 56, height: 56, borderRadius: 6, backgroundColor: BORDER }} />
                        )}
                      </View>

                      {/* Заголовок преимущества */}
                      <Text
                        style={{
                          fontSize: 9,
                          fontFamily: "Roboto",
                          fontWeight: 700,
                          color: TEXT,
                          textAlign: "center",
                          marginBottom: 5,
                          letterSpacing: 0.2,
                          lineHeight: 1.2,
                        }}
                      >
                        {item.title}
                      </Text>

                      {/* Gold divider under title */}
                      <View
                        style={{
                          height: 1,
                          width: 20,
                          backgroundColor: GOLD,
                          marginBottom: 5,
                          opacity: 0.6,
                        }}
                      />

                      {/* Описание */}
                      {item.description ? (
                        <Text
                          style={{
                            fontSize: 7,
                            color: TEXT_SEC,
                            textAlign: "center",
                            lineHeight: 1.4,
                          }}
                        >
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Premium note at bottom */}
          <View style={{ marginTop: "auto", borderTopWidth: 0.5, borderTopColor: BORDER, paddingTop: 14 }}>
            <Text style={{ fontSize: 7.5, color: GRAY, textAlign: "center", lineHeight: 1.6 }}>
              SAGA — премиальные раздвижные дверные системы. Гарантия 3 года на все комплектующие.
            </Text>
          </View>
        </View>

        <Footer managerName={managerName} managerPhone={managerPhone} />
      </Page>

      {/* ═══════════════ PAGE 2: Schemes + Materials ═══════════════ */}
      {schemeSvgs && schemeSvgs.filter(Boolean).length > 0 && (
        <Page size="A4" style={s.schemePage}>
          <FixedHeader systemName={systemName} date={formattedDate} partnerCompanyName={headerCompanyName} />

          {/* Top 70%: 3 схемы в 2 строки.
              Row 1 (70% площади): «Вид системы» (60% ширины) + «Вид двери» (40% ширины)
              Row 2 (30% площади): «Вид сверху» во всю ширину
              Блок схем прижат к верху и левому краю (justifyContent: flex-start
              здесь и в renderRow1/renderRow2). */}
          <View wrap={false} style={{ paddingLeft: 44, paddingRight: 44, paddingTop: 28, flex: 7, justifyContent: "flex-start" }}>
            {(() => {
              const labels = ["Вид системы", "Вид двери", "Вид сверху"];
              const items = schemeSvgs.map((src, i) => ({
                src,
                size: schemeSizes?.[i],
                label: labels[i] ?? "Схема",
              }));
              const row1 = [items[0], items[1]].filter((x) => x && !!x.src);
              const row2 = [items[2]].filter((x) => x && !!x.src);
              const hasRow1 = row1.length > 0;
              const hasRow2 = row2.length > 0;
              if (!hasRow1 && !hasRow2) return null;

              const maxRowW = 430;  // уменьшено под бо́льшие отступы контейнера (paddingLeft/Right 44)
              const colGap = 24;
              const rowGap = 80;
              // Бюджет высоты под все схемы — должен умещаться в ~70% страницы A4
              // (≈ 513pt при flex:7 / flex:3 и стандартных полях). Подписи рядов и
              // paddingTop добавляются сверху, поэтому totalH должен быть заметно
              // меньше, иначе нижний блок «Стекло + Рельсовая система» вытесняется
              // на следующую страницу.
              const totalH = 440;
              const row1H = hasRow1 && hasRow2 ? totalH * 0.55 - rowGap / 2
                : hasRow1 ? totalH
                : 0;
              const row2H = hasRow2 && hasRow1 ? totalH * 0.45 - rowGap / 2
                : hasRow2 ? totalH
                : 0;

              // Row 1: «Вид системы» (слева) + «Вид двери» (справа), выровнены по
              // НИЖНЕЙ кромке (alignItems: flex-end ниже).
              // КАРТИНКА ДВЕРИ по высоте подогнана так, что её СТЕКЛО точно
              // совпадает с высотой стекла одной двери внутри «Вида системы»:
              //   doorImgH = sysH · (sys.h / door.h)
              // — где sys.h/door.h доли стекла в их viewBox. Аналогично по
              // ширине: doorImgW = sysW · (sys.w / door.w) = sysW · wRel.
              // Остаточная разница padBottom-долей корректируется сдвигом вниз
              // через translateY, чтобы низ стекла двери совпал с низом стекла
              // системы.
              const useDoorRatio =
                !!doorBoxRatio &&
                doorBoxRatio.sys.w > 0 && doorBoxRatio.sys.h > 0 &&
                doorBoxRatio.door.w > 0 && doorBoxRatio.door.h > 0;
              const wRel = useDoorRatio ? doorBoxRatio!.sys.w / doorBoxRatio!.door.w : 1;
              const hRel = useDoorRatio ? doorBoxRatio!.sys.h / doorBoxRatio!.door.h : 1;
              const r1Aspects = row1.map((p, i) => {
                if (i === 1 && useDoorRatio) {
                  // Ячейка двери — КОМПАКТНАЯ (= ширине картинки).
                  // Так лейбл «Вид двери», сама картинка и подпись «700 мм»
                  // ВСЕ центрируются по одной оси — центру картинки.
                  // «2900 мм» (absolute справа) — не влияет на layout.
                  const sysAspect =
                    row1[0]?.size?.w && row1[0]?.size?.h ? row1[0]!.size!.w / row1[0]!.size!.h : 1;
                  return sysAspect * (wRel / hRel);
                }
                return p.size?.w && p.size?.h ? p.size.w / p.size.h : 1;
              });
              const r1SumR = r1Aspects.reduce((a, b) => a + b, 0) || 1;
              const r1Gap = colGap * Math.max(0, row1.length - 1);
              const r1H = Math.min((maxRowW - r1Gap) / r1SumR, row1H);
              const r1Widths = r1Aspects.map((r) => Math.round(r1H * r));
              const r1TotalW = r1Widths.reduce((a, b) => a + b, 0) + r1Gap;
              const sysW = r1Widths[0] ?? 0;
              const sysH = Math.round(r1H);
              const doorImgH = useDoorRatio ? Math.round(sysH * hRel) : sysH;
              const doorImgW = useDoorRatio ? Math.round(sysW * wRel) : (r1Widths[1] ?? 0);
              // Сдвиг дверной группы (Image + оба числа) вниз для точного
              // совпадения нижнего края стекла двери с нижним краем стекла
              // системы. Картинки выровнены по нижней кромке (flex-end), но
              // padBottom-доли в их SVG РАЗНЫЕ — стекло двери получается на
              // (doorImgH·doorPadBFrac − sysH·sysPadBFrac) px выше стекла
              // системы. Компенсируем этим сдвигом.
              const sysPadBFrac = doorBoxRatio?.sysPadBFrac ?? 0;
              const doorPadBFrac = doorBoxRatio?.doorPadBFrac ?? 0;
              const doorShiftDown = useDoorRatio
                ? doorImgH * doorPadBFrac - sysH * sysPadBFrac
                : 0;

              // Row 2 (вид сверху): шире — на всю ширину первой строки
              // (= «Вид системы» + colGap + «Вид двери»). Так картинка вида
              // сверху в PDF не сжимается под узкую системную колонку.
              const r2Aspect =
                row2[0]?.size?.w && row2[0]?.size?.h ? row2[0]!.size!.w / row2[0]!.size!.h : 6;
              const r2DrawW = r1TotalW || maxRowW;
              const r2NaturalH = r2DrawW / r2Aspect;
              const r2DrawH = Math.min(r2NaturalH, row2H);

              function renderRow1(key: string) {
                return (
                  <View
                    key={key}
                    style={{ flexDirection: "row", justifyContent: "center", alignItems: "flex-end" }}
                  >
                    {row1.map((p, i) => {
                      const isDoor = i === 1 && useDoorRatio;
                      const isSystem = i === 0;
                      const cellW = r1Widths[i];
                      const imgW = isDoor ? doorImgW : cellW;
                      const imgH = isDoor ? doorImgH : sysH;
                      // ОДИН стиль шрифта на все подписи размеров — и у «вида системы»,
                      // и у «вида двери». Числа рисуются СНАРУЖИ картинки (как
                      // PDF-Text), а не внутри SVG → размер не зависит от того, как
                      // картинка масштабируется.
                      const dimNumStyle = { fontSize: 8, fontFamily: "Roboto" as const, fontWeight: 700 as const, color: BRAND };
                      // У «вида системы» число высоты — слева (повёрнуто на -90°),
                      // у «вида двери» — справа (повёрнуто на +90°).
                      const hNumOnLeft = isSystem;
                      const showDims = isSystem || isDoor;
                      const widthValue = isDoor ? doorWidth : fullWidth;
                      // Сдвиг ВНИЗ дверной группы (Image + оба числа) — выравнивает
                      // нижнюю кромку самой ДВЕРИ с нижней кромкой САМОЙ СИСТЕМЫ
                      // внутри их SVG. Для системы сдвиг = 0.
                      const shiftDown = isDoor ? doorShiftDown : 0;
                      const shiftTransform = shiftDown !== 0 ? `translateY(${shiftDown})` : undefined;
                      // Для «Вид двери» собираем компактную группу
                      // [лейбл → картинка → подпись ширины] шириной imgW и
                      // центрируем её внутри cellW. Тогда «Вид двери» сверху,
                      // «700 мм» снизу и сама картинка стоят на ОДНОЙ
                      // вертикальной оси — точно по центру картинки.
                      // У «Вид системы» оставляем старую раскладку (лейбл по
                      // ширине ячейки, картинка прижата к низу).
                      if (isDoor) {
                        // Структура — ЗЕРКАЛО системной ячейки (см. ниже):
                        // [лейбл сверху] → [контейнер cellW × sysH, картинка
                        // прижата к низу] → подпись «… мм» absolute под
                        // картинкой. Так лейбл «Вид двери» оказывается на той
                        // же высоте, что и лейбл «Вид системы», а нижние
                        // кромки картинок выровнены по строке.
                        // cellW = imgW (компактная), значит лейбл, картинка и
                        // подпись ширины — на одной вертикальной оси.
                        return (
                          <View
                            key={i}
                            style={{ alignItems: "center", marginLeft: colGap }}
                          >
                            <Text style={s.schemeLabel}>{p.label}</Text>
                            <View
                              style={{
                                width: cellW,
                                height: sysH,
                                alignItems: "center",
                                justifyContent: "flex-end",
                                position: "relative",
                              }}
                            >
                              <View style={{ width: imgW, height: imgH, position: "relative" }}>
                                <Image src={p.src} style={{ width: imgW, height: imgH, transform: shiftTransform }} />
                                {showDims && (
                                  <View
                                    style={{
                                      position: "absolute",
                                      left: "100%",
                                      marginLeft: -4,
                                      top: 0,
                                      height: imgH,
                                      width: 16,
                                      alignItems: "center",
                                      justifyContent: "center",
                                      transform: shiftTransform,
                                    }}
                                  >
                                    <Text style={{ ...dimNumStyle, width: imgH, textAlign: "center", transform: "rotate(90deg)", transformOrigin: "center" }}>{height} мм</Text>
                                  </View>
                                )}
                              </View>
                              {showDims && (
                                <View style={{ position: "absolute", top: "100%", left: 0, right: 0, alignItems: "center", marginTop: 3, transform: shiftTransform }}>
                                  <Text style={dimNumStyle}>{widthValue} мм</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      }
                      return (
                        <View
                          key={i}
                          style={{ alignItems: "center", marginLeft: i === 0 ? 0 : colGap }}
                        >
                          <Text style={s.schemeLabel}>{p.label}</Text>
                          <View
                            style={{
                              width: cellW,
                              height: sysH,
                              alignItems: "center",
                              justifyContent: "flex-end",
                              position: "relative",
                            }}
                          >
                            <View style={{ width: imgW, height: imgH, position: "relative" }}>
                              <Image src={p.src} style={{ width: imgW, height: imgH }} />
                              {/* высота слева, повёрнута на -90°. */}
                              {showDims && (
                                <View
                                  style={{
                                    position: "absolute",
                                    right: "100%",
                                    marginRight: 3,
                                    top: 0,
                                    height: imgH,
                                    width: 16,
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Text style={{ ...dimNumStyle, width: imgH, textAlign: "center", transform: "rotate(-90deg)", transformOrigin: "center" }}>{height} мм</Text>
                                </View>
                              )}
                              {/* ширина — под картинкой, absolute. */}
                              {showDims && (
                                <View style={{ position: "absolute", top: "100%", left: 0, right: 0, alignItems: "center", marginTop: 3 }}>
                                  <Text style={dimNumStyle}>{widthValue} мм</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              }

              function renderRow2(key: string) {
                const p = row2[0];
                if (!p) return null;
                // Стиль подписей размеров — ТОТ ЖЕ, что у системы/двери,
                // чтобы шрифт и размер совпадали один к одному.
                const dimNumStyle = { fontSize: 8, fontFamily: "Roboto" as const, fontWeight: 700 as const, color: BRAND };
                const imgH = Math.round(r2DrawH);
                return (
                  <View
                    key={key}
                    style={{ flexDirection: "row", justifyContent: "center" }}
                  >
                    {/* «Вид сверху» — на всю ширину первого ряда, прижат
                        влево. */}
                    <View style={{ width: r1TotalW, alignItems: "center" }}>
                      <Text style={s.schemeLabel}>{p.label}</Text>
                      <View style={{ width: r2DrawW, height: imgH, position: "relative" }}>
                        <Image
                          src={p.src}
                          style={{ width: r2DrawW, height: imgH }}
                        />
                        {(topLabels ?? []).map((lbl, k) => {
                          // RN-PDF не поддерживает transform: translate(-50%, -50%),
                          // поэтому центрируем через фикс ширину/высоту и сдвиг.
                          const labelW = 60;
                          const labelH = 10;
                          const left = Math.round(lbl.xNorm * r2DrawW - labelW / 2);
                          const top = Math.round(lbl.yNorm * imgH - labelH / 2);
                          return (
                            <Text
                              key={k}
                              style={{
                                ...dimNumStyle,
                                position: "absolute",
                                left,
                                top,
                                width: labelW,
                                textAlign: "center",
                              }}
                            >
                              {lbl.text}
                            </Text>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                );
              }

              return (
                <>
                  {hasRow1 && renderRow1("r1")}
                  {hasRow1 && hasRow2 && <View style={{ height: rowGap }} />}
                  {hasRow2 && renderRow2("r2")}
                </>
              );
            })()}
          </View>

          {/* Divider */}
          <View style={{ height: 0.5, backgroundColor: BORDER, marginHorizontal: 44 }} />

          {/* Bottom 30%: glass + rail photos */}
          <View wrap={false} style={{ flexDirection: "row", paddingHorizontal: 44, paddingTop: 4, flex: 3 }}>
            {/* Glass */}
            <View style={{ width: "50%", paddingRight: 10 }}>
              <Text style={{ fontSize: 7, fontFamily: "Roboto", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
                {"Стекло: " + glassType}
              </Text>
              {glassImageUrl ? (
                <View
                  style={{
                    width: "100%",
                    height: 160,
                    borderRadius: 10,
                    borderWidth: 0.5,
                    borderColor: BORDER,
                    overflow: "hidden",
                    backgroundColor: IVORY,
                  }}
                >
                  <Image
                    src={glassImageUrl}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center center",
                    }}
                  />
                </View>
              ) : (
                <View style={{ width: "100%", height: 140, backgroundColor: IVORY, borderRadius: 10, borderWidth: 0.5, borderColor: BORDER, justifyContent: "center", alignItems: "flex-start" }}>
                  <Text style={{ fontSize: 9, color: GRAY, marginLeft: 12 }}>Фото стекла</Text>
                </View>
              )}
              {glassDescriptions[glassType] && (
                <Text style={{ fontSize: 8, color: TEXT_SEC, marginTop: 8, lineHeight: 1.4 }}>
                  {glassDescriptions[glassType]}
                </Text>
              )}
            </View>
            {/* Rail */}
            <View style={{ width: "50%", paddingLeft: 10 }}>
              <Text style={{ fontSize: 7, fontFamily: "Roboto", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
                Рельсовая система
              </Text>
              {railImageUrl ? (
                <View
                  style={{
                    width: "100%",
                    height: 160,
                    borderRadius: 10,
                    borderWidth: 0.5,
                    borderColor: BORDER,
                    overflow: "hidden",
                    backgroundColor: IVORY,
                  }}
                >
                  <Image
                    src={railImageUrl}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      objectPosition: "center center",
                    }}
                  />
                </View>
              ) : (
                <View style={{ width: "100%", height: 140, backgroundColor: IVORY, borderRadius: 10, borderWidth: 0.5, borderColor: BORDER, justifyContent: "center", alignItems: "flex-start" }}>
                  <Text style={{ fontSize: 9, color: GRAY, marginLeft: 12 }}>Фото рельсы</Text>
                </View>
              )}
            </View>
          </View>

          <Footer managerName={managerName} managerPhone={managerPhone} />
        </Page>
      )}

      {/* ═══════════════ PAGE 3+: Specification ═══════════════ */}
      <Page size="A4" style={s.page}>
        <FixedHeader systemName={systemName} date={formattedDate} partnerCompanyName={headerCompanyName} />

        <View style={s.body}>
          {/* Components table — группируем по category (group): Комплектующие,
              Шотланки, Стекло, Доп. расходы. Подзаголовок группы рисуется внутри
              таблицы как полоса (как в HTML-превью). Sticky-блок (заголовок +
              шапка + первые ~25 строк) держим в wrap=false, чтобы заголовок
              никогда не оставался один в конце страницы. */}
          {(() => {
            const GROUPS = [
              { key: "component", label: "Комплектующие" },
              { key: "shotlan", label: "Шотланки" },
              { key: "glass", label: "Стекло" },
              { key: "extra", label: "Дополнительные расходы" },
            ];
            // Раскладываем в плоский поток строк: подзаголовок группы → её товары → ...
            type FlatRow =
              | { kind: "groupHeader"; key: string; label: string; total: number }
              | { kind: "item"; key: string; idx: number; item: typeof components[number] };
            const flat: FlatRow[] = [];
            let globalIdx = 0;
            for (const g of GROUPS) {
              const items = components.filter((c) => (c.group || "component") === g.key);
              if (items.length === 0) continue;
              const groupTotal = items.reduce((acc, c) => acc + c.sum, 0);
              flat.push({ kind: "groupHeader", key: `gh-${g.key}`, label: g.label, total: groupTotal });
              for (const c of items) {
                globalIdx++;
                flat.push({ kind: "item", key: `${c.key}-${globalIdx}`, idx: globalIdx, item: c });
              }
            }

            const renderRow = (r: FlatRow) =>
              r.kind === "groupHeader" ? (
                <View key={r.key} style={s.tableGroupHeader}>
                  <Text style={s.tableGroupLabel}>{r.label}</Text>
                  <Text style={s.tableGroupTotal}>{fmt(r.total)} у.е.</Text>
                </View>
              ) : (
                <View key={r.key} style={[s.tableRow, r.idx % 2 === 1 ? s.tableRowAlt : {}]}>
                  <Text style={[s.tableCell, s.colNum]}>{r.idx}</Text>
                  <Text style={[s.tableCell, s.colName]}>{r.item.name}</Text>
                  <Text style={[s.tableCell, s.colQty]}>{typeof r.item.qty === "number" && r.item.qty % 1 !== 0 ? r.item.qty.toFixed(2) : r.item.qty}</Text>
                  <Text style={[s.tableCell, s.colUnit]}>{r.item.unit}</Text>
                  <Text style={[s.tableCell, s.colPrice]}>{fmt(r.item.price)}</Text>
                  <Text style={[s.tableCellBold, s.colTotal]}>{fmt(r.item.sum)}</Text>
                </View>
              );

            const stickyCount = 25;
            const sticky = flat.slice(0, stickyCount);
            const rest = flat.slice(stickyCount);

            return (
              <>
                <View wrap={false}>
                  <Text style={s.sectionTitle}>Спецификация</Text>
                  <View style={[s.table, rest.length > 0 ? { marginBottom: 0, borderBottomWidth: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : {}]}>
                    <View style={s.tableHeader}>
                      <Text style={[s.tableHeaderCell, s.colNum]}>#</Text>
                      <Text style={[s.tableHeaderCell, s.colName]}>Наименование</Text>
                      <Text style={[s.tableHeaderCell, s.colQty]}>Кол.</Text>
                      <Text style={[s.tableHeaderCell, s.colUnit]}>Ед.</Text>
                      <Text style={[s.tableHeaderCell, s.colPrice]}>Цена</Text>
                      <Text style={[s.tableHeaderCell, s.colTotal]}>Сумма</Text>
                    </View>
                    {sticky.map(renderRow)}
                  </View>
                </View>
                {rest.length > 0 && (
                  <View style={[s.table, { marginTop: 0, borderTopWidth: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
                    {rest.map(renderRow)}
                  </View>
                )}
              </>
            );
          })()}

          {/* Services */}
          {services && services.length > 0 ? (
            <View wrap={false}>
              <Text style={s.sectionTitle}>Дополнительные услуги</Text>
              <View style={[s.table, { marginBottom: 18 }]}>
                <View style={s.tableHeader}>
                  <Text style={[s.tableHeaderCell, { flex: 1 }]}>Услуга</Text>
                  <Text style={[s.tableHeaderCell, { width: 90, textAlign: "right" }]}>Стоимость</Text>
                </View>
                {services.map((srv, i) => (
                  <View key={srv.name + i} style={[s.servicesRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                    <Text style={s.serviceName}>{srv.name}</Text>
                    <Text style={s.servicePrice}>{fmt(srv.price)} у.е.</Text>
                  </View>
                ))}
                <View style={[s.servicesRow, { borderBottomWidth: 0, backgroundColor: IVORY }]}>
                  <Text style={[s.serviceName, { fontFamily: "Roboto", fontWeight: 700, color: TEXT }]}>Итого услуги:</Text>
                  <Text style={s.servicePrice}>{fmt(servicesTotal)} у.е.</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Custom services */}
          {customServices && customServices.length > 0 && (
            <View wrap={false}>
              <Text style={s.sectionTitle}>Дополнительные услуги</Text>
              <View style={[s.table, { marginBottom: 18 }]}>
                <View style={s.tableHeader}>
                  <Text style={[s.tableHeaderCell, { flex: 1 }]}>Услуга</Text>
                  <Text style={[s.tableHeaderCell, { width: 90, textAlign: "right" }]}>Стоимость</Text>
                </View>
                {customServices.map((svc, i) => (
                  <View key={i} style={[s.servicesRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                    <Text style={s.serviceName}>
                      {svc.name}{svc.description ? ` (${svc.description})` : ""}
                    </Text>
                    <Text style={s.servicePrice}>{fmt(svc.price)} у.е.</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Total — right after components. Never split across pages. */}
          <View wrap={false} style={s.totalBlock}>
            <Text style={s.totalNote}>Спецификации дверей указаны в предыдущих страницах.</Text>
            <View style={s.totalValueRow}>
              <Text style={s.totalNote}>Общая сумма составляет: </Text>
              <Text style={s.totalValue}>{fmt(totalPrice + (customServices?.reduce((a, sv) => a + sv.price, 0) ?? 0))}</Text>
              <Text style={s.totalCurrency}> у.е.</Text>
            </View>
            <Text
              style={{
                fontSize: 6.5,
                color: GOLD_LIGHT,
                opacity: 0.7,
                marginTop: 8,
                lineHeight: 1.4,
              }}
            >
              Цена в валюте указана лишь для ознакомления. Оплата производится только в национальной
              валюте страны по курсу центробанка на момент оплаты.
            </Text>
            <Text
              style={{
                fontSize: 6.5,
                color: GOLD_LIGHT,
                opacity: 0.85,
                marginTop: 4,
                lineHeight: 1.4,
              }}
            >
              Коммерческое предложение действует в течение 14 дней с момента его генерации
              {date ? ` (${formatDate(date)})` : ""}.
            </Text>
          </View>

          {/* Заметки — 3 свободные строки. Если props.notes[i] заполнено — печатаем,
              иначе оставляем пустую линию для рукописной заметки. */}
          <View wrap={false} style={s.notesBlock}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={s.noteLine}>
                <Text style={s.noteText}>{notes?.[i] ?? ""}</Text>
              </View>
            ))}
          </View>

          {/* QR + Signatures — placed immediately after the total block */}
          <View wrap={false} style={{ marginTop: 16 }}>
            <View style={s.qrRow}>
              <View style={[s.qrBlock, s.qrBlockLeft]}>
                <View style={s.qrPlaceholder}><Text style={s.qrText}>QR</Text></View>
                <View style={s.qrLabel}>
                  <Text style={s.qrTitle}>Гарантийные условия</Text>
                  <Text style={s.qrDesc}>Отсканируйте QR-код для ознакомления с гарантийными условиями</Text>
                </View>
              </View>
              <View style={s.qrBlock}>
                <View style={s.qrPlaceholder}><Text style={s.qrText}>QR</Text></View>
                <View style={s.qrLabel}>
                  <Text style={s.qrTitle}>Договор оферты</Text>
                  <Text style={s.qrDesc}>Отсканируйте QR-код для ознакомления с условиями оферты</Text>
                </View>
              </View>
            </View>

            <View style={{ marginBottom: 10 }}>
              <View style={s.sigRow}>
                <View style={s.sigCell}><Text style={s.sigLabel}>Получил предоплату</Text><View style={s.sigLine} /></View>
                <View style={s.sigCell}><Text style={s.sigLabel}>Дата</Text><View style={s.sigLine} /></View>
              </View>
              <View style={s.sigRow}>
                <View style={s.sigCell}><Text style={s.sigLabel}>Остаток</Text><View style={s.sigLine} /></View>
                <View style={s.sigCell}><Text style={s.sigLabel}>Подпись</Text><View style={s.sigLine} /></View>
              </View>
            </View>
          </View>
        </View>

        <Footer managerName={managerName} managerPhone={managerPhone} />
      </Page>

    </Document>
  );
}
