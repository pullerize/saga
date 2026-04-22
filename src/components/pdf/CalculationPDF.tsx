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
  glassImageUrl?: string;
  railImageUrl?: string;
  date?: string;
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

  /* Total block */
  totalBlock: { backgroundColor: BRAND_DARK, borderRadius: 6, paddingVertical: 16, paddingHorizontal: 22, marginBottom: 22 },
  totalNote: { fontSize: 8.5, color: GOLD_LIGHT, lineHeight: 1.5 },
  totalValueRow: { flexDirection: "row", alignItems: "baseline", marginTop: 6 },
  totalValue: { fontSize: 13, fontFamily: "Roboto", fontWeight: 700, color: WHITE },
  totalCurrency: { fontSize: 9, color: GOLD_LIGHT, marginLeft: 4 },

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

/* ── Shared fixed header ── */
function FixedHeader({ systemName, date }: { systemName: string; date: string }) {
  return (
    <View style={s.fixedHeader} fixed>
      <View style={s.fixedHeaderBar}>
        <Text style={s.fixedHeaderLogo}>SAGA</Text>
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
function Footer() {
  return (
    <View style={s.footer} fixed>
      <View style={s.footerGold} />
      <View style={s.footerBar}>
        <Text style={s.footerText}>saga-group.uz</Text>
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
    services, customServices, variant, schemeSvgs, schemeSizes, glassImageUrl, railImageUrl, date,
  } = props;

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
  if (shotlanType && shotlanType !== "Без шотланок") params.push({ label: "Шотланки", value: shotlanType });

  return (
    <Document title={`SAGA — ${systemName} — ${customerName}`} author="SAGA Group">

      {/* ═══════════════ PAGE 1: Cover ═══════════════ */}
      <Page size="A4" style={s.page}>
        <FixedHeader systemName={systemName} date={formattedDate} />

        <View style={s.body}>
          {/* Hero title */}
          <View style={{ marginBottom: 28, paddingTop: 8 }}>
            <Text style={{ fontSize: 22, fontFamily: "Roboto", fontWeight: 700, color: BRAND, letterSpacing: 0.5 }}>
              Коммерческое предложение
            </Text>
            <View style={{ width: 60, height: 2.5, backgroundColor: GOLD, marginTop: 8, borderRadius: 2 }} />
            <Text style={{ fontSize: 9, color: TEXT_SEC, marginTop: 8, lineHeight: 1.6 }}>
              Индивидуальный расчёт дверной системы {systemName} для вашего проекта. Все комплектующие сертифицированы и имеют гарантию производителя.
            </Text>
          </View>

          {/* Client + Manager — larger cards */}
          <View style={{ flexDirection: "row", marginBottom: 24 }}>
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

          {/* System params — full width dark block */}
          <View style={{ backgroundColor: BRAND, borderRadius: 8, paddingVertical: 16, paddingHorizontal: 22, marginBottom: 24 }}>
            <Text style={{ fontSize: 7, fontFamily: "Roboto", fontWeight: 700, color: GOLD_LIGHT, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
              Параметры системы
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {params.map((p) => (
                <View key={p.label} style={{ width: "50%", paddingVertical: 5, paddingHorizontal: 5 }}>
                  <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                    <Text style={{ fontSize: 7.5, color: GOLD_LIGHT, width: 70, textTransform: "uppercase", letterSpacing: 0.3 }}>{p.label}</Text>
                    <Text style={{ fontSize: 10, fontFamily: "Roboto", fontWeight: 700, color: WHITE, flex: 1 }}>{p.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Variant cards — premium style */}
          {variant && variant.items.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              {/* Section header with golden rule */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                <View style={{ height: 1, width: 18, backgroundColor: GOLD, marginRight: 8 }} />
                <Text style={{ fontSize: 7, fontFamily: "Roboto", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: 2.5 }}>
                  {variant.variantName}
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
                        paddingTop: 18,
                        paddingHorizontal: 14,
                        paddingBottom: 16,
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

                      {/* Icon with gold-tinted circular backdrop */}
                      <View
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 32,
                          backgroundColor: IVORY,
                          borderWidth: 0.5,
                          borderColor: GOLD_LIGHT,
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 12,
                        }}
                      >
                        {item.iconUrl ? (
                          <Image
                            src={item.iconUrl}
                            style={{ width: 42, height: 42, borderRadius: 4 }}
                          />
                        ) : (
                          <View style={{ width: 42, height: 42, borderRadius: 4, backgroundColor: BORDER }} />
                        )}
                      </View>

                      {/* Title */}
                      <Text
                        style={{
                          fontSize: 9.5,
                          fontFamily: "Roboto",
                          fontWeight: 700,
                          color: TEXT,
                          textAlign: "center",
                          marginBottom: 6,
                          letterSpacing: 0.2,
                        }}
                      >
                        {item.title}
                      </Text>

                      {/* Gold divider under title */}
                      <View
                        style={{
                          height: 1,
                          width: 22,
                          backgroundColor: GOLD,
                          marginBottom: 8,
                          opacity: 0.6,
                        }}
                      />

                      {/* Description */}
                      {item.description ? (
                        <Text
                          style={{
                            fontSize: 7.5,
                            color: TEXT_SEC,
                            textAlign: "center",
                            lineHeight: 1.55,
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

        <Footer />
      </Page>

      {/* ═══════════════ PAGE 2: Schemes + Materials ═══════════════ */}
      {schemeSvgs && schemeSvgs.filter(Boolean).length > 0 && (
        <Page size="A4" style={s.schemePage}>
          <FixedHeader systemName={systemName} date={formattedDate} />

          {/* Top 70%: up to 4 schemes in 2 rows
              Row 1 (70% of schemes area): "Вид системы" + "Вид двери" + "Вид сбоку"
              Row 2 (30% of schemes area): "Вид сверху" */}
          <View wrap={false} style={{ paddingHorizontal: 30, paddingTop: 10, flex: 7, justifyContent: "center" }}>
            {(() => {
              const labels = ["Вид системы", "Вид двери", "Вид сбоку", "Вид сверху"];
              const items = schemeSvgs.map((src, i) => ({
                src,
                size: schemeSizes?.[i],
                label: labels[i] ?? "Схема",
              }));
              const row1 = [items[0], items[1], items[2]].filter((x) => x && !!x.src);
              const row2 = [items[3]].filter((x) => x && !!x.src);
              const hasRow1 = row1.length > 0;
              const hasRow2 = row2.length > 0;
              if (!hasRow1 && !hasRow2) return null;

              const maxRowW = 500;
              const colGap = 18;
              const rowGap = 14;
              // Total vertical budget for schemes area. Must fit inside ~70% of an A4
              // page after subtracting paddings, labels above each row and the row gap —
              // otherwise @react-pdf/renderer pushes the overflow onto blank extra pages.
              const totalH = 440;
              const row1H = hasRow1 && hasRow2 ? totalH * 0.7 - rowGap / 2
                : hasRow1 ? totalH
                : 0;
              const row2H = hasRow2 && hasRow1 ? totalH * 0.3 - rowGap / 2
                : hasRow2 ? totalH
                : 0;

              function renderRow(row: typeof items, maxH: number, key: string, fillWidth = false) {
                const ratios = row.map((p) =>
                  p.size?.w && p.size?.h ? p.size.w / p.size.h : 0.6
                );
                const sumR = ratios.reduce((a, b) => a + b, 0);
                const totalGap = colGap * (row.length - 1);
                const h = Math.min((maxRowW - totalGap) / sumR, maxH);

                return (
                  <View
                    key={key}
                    style={{
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "flex-end",
                    }}
                  >
                    {row.map((p, i) => {
                      // When fillWidth is on (single-element row like "Top view") we reserve
                      // the full row box but keep the image's aspect ratio via objectFit so
                      // embedded labels don't get distorted.
                      const baseW = Math.round(h * ratios[i]);
                      const isFill = fillWidth && row.length === 1;
                      const w = isFill ? Math.round(maxRowW) : baseW;
                      const imgH = isFill ? Math.round(maxH) : Math.round(h);
                      return (
                        <View
                          key={i}
                          style={{ alignItems: "center", marginLeft: i === 0 ? 0 : colGap }}
                        >
                          <Text style={s.schemeLabel}>{p.label}</Text>
                          <Image
                            src={p.src}
                            style={{ width: w, height: imgH, objectFit: isFill ? "contain" : undefined }}
                          />
                        </View>
                      );
                    })}
                  </View>
                );
              }

              return (
                <>
                  {hasRow1 && renderRow(row1, row1H, "r1")}
                  {hasRow1 && hasRow2 && <View style={{ height: rowGap }} />}
                  {hasRow2 && renderRow(row2, row2H, "r2", /* fillWidth */ true)}
                </>
              );
            })()}
          </View>

          {/* Divider */}
          <View style={{ height: 0.5, backgroundColor: BORDER, marginHorizontal: 44 }} />

          {/* Bottom 30%: glass + rail photos */}
          <View wrap={false} style={{ flexDirection: "row", paddingHorizontal: 44, paddingTop: 14, flex: 3 }}>
            {/* Glass */}
            <View style={{ width: "50%", paddingRight: 10 }}>
              <Text style={{ fontSize: 7, fontFamily: "Roboto", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
                {"Стекло: " + glassType}
              </Text>
              {glassImageUrl ? (
                <Image src={glassImageUrl} style={{ width: "100%", maxHeight: 140, objectFit: "contain", borderRadius: 6 }} />
              ) : (
                <View style={{ width: "100%", height: 140, backgroundColor: IVORY, borderRadius: 6, borderWidth: 0.5, borderColor: BORDER, justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ fontSize: 9, color: GRAY }}>Фото стекла</Text>
                </View>
              )}
            </View>
            {/* Rail */}
            <View style={{ width: "50%", paddingLeft: 10 }}>
              <Text style={{ fontSize: 7, fontFamily: "Roboto", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
                Рельсовая система
              </Text>
              {railImageUrl ? (
                <Image src={railImageUrl} style={{ width: "100%", maxHeight: 140, objectFit: "contain", borderRadius: 6 }} />
              ) : (
                <View style={{ width: "100%", height: 140, backgroundColor: IVORY, borderRadius: 6, borderWidth: 0.5, borderColor: BORDER, justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ fontSize: 9, color: GRAY }}>Фото рельсы</Text>
                </View>
              )}
            </View>
          </View>

          <Footer />
        </Page>
      )}

      {/* ═══════════════ PAGE 3+: Specification ═══════════════ */}
      <Page size="A4" style={s.page}>
        <FixedHeader systemName={systemName} date={formattedDate} />

        <View style={s.body}>
          {/* Components table — keep title + table header + first few rows glued
              together so the title never lands alone at the bottom of a page. */}
          {(() => {
            const stickyCount = 25;
            const sticky = components.slice(0, stickyCount);
            const rest = components.slice(stickyCount);
            return (
              <>
                <View wrap={false}>
                  <Text style={s.sectionTitle}>Комплектующие</Text>
                  <View style={[s.table, { marginBottom: 0, borderBottomWidth: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}>
                    <View style={s.tableHeader}>
                      <Text style={[s.tableHeaderCell, s.colNum]}>#</Text>
                      <Text style={[s.tableHeaderCell, s.colName]}>Наименование</Text>
                      <Text style={[s.tableHeaderCell, s.colQty]}>Кол.</Text>
                      <Text style={[s.tableHeaderCell, s.colUnit]}>Ед.</Text>
                      <Text style={[s.tableHeaderCell, s.colPrice]}>Цена</Text>
                      <Text style={[s.tableHeaderCell, s.colTotal]}>Сумма</Text>
                    </View>
                    {sticky.map((c, i) => (
                      <View key={c.key + i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                        <Text style={[s.tableCell, s.colNum]}>{i + 1}</Text>
                        <Text style={[s.tableCell, s.colName]}>{c.name}</Text>
                        <Text style={[s.tableCell, s.colQty]}>{typeof c.qty === "number" && c.qty % 1 !== 0 ? c.qty.toFixed(2) : c.qty}</Text>
                        <Text style={[s.tableCell, s.colUnit]}>{c.unit}</Text>
                        <Text style={[s.tableCell, s.colPrice]}>{fmt(c.price)}</Text>
                        <Text style={[s.tableCellBold, s.colTotal]}>{fmt(c.sum)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                {rest.length > 0 && (
                  <View style={[s.table, { marginTop: 0, borderTopWidth: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
                    {rest.map((c, i) => {
                      const realIdx = stickyCount + i;
                      return (
                        <View key={c.key + realIdx} style={[s.tableRow, realIdx % 2 === 1 ? s.tableRowAlt : {}]}>
                          <Text style={[s.tableCell, s.colNum]}>{realIdx + 1}</Text>
                          <Text style={[s.tableCell, s.colName]}>{c.name}</Text>
                          <Text style={[s.tableCell, s.colQty]}>{typeof c.qty === "number" && c.qty % 1 !== 0 ? c.qty.toFixed(2) : c.qty}</Text>
                          <Text style={[s.tableCell, s.colUnit]}>{c.unit}</Text>
                          <Text style={[s.tableCell, s.colPrice]}>{fmt(c.price)}</Text>
                          <Text style={[s.tableCellBold, s.colTotal]}>{fmt(c.sum)}</Text>
                        </View>
                      );
                    })}
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

        <Footer />
      </Page>

    </Document>
  );
}
