import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import path from "node:path";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import messages from "@/messages/ar.json";
import type { InvoicePdfProps } from "@/types";

Font.register({
  family: "IBM Plex Sans Arabic PDF",
  src: path.join(
    process.cwd(),
    "public",
    "fonts",
    "IBMPlexSansArabic-Regular.ttf",
  ),
});
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "IBM Plex Sans Arabic PDF",
    fontSize: 10,
    direction: "rtl",
  },
  heading: { fontSize: 20, textAlign: "right", marginBottom: 5 },
  detail: { textAlign: "right", marginBottom: 4 },
  section: { marginTop: 18, paddingTop: 8, borderTopWidth: 1 },
  row: {
    flexDirection: "row-reverse",
    paddingVertical: 5,
    borderBottomWidth: 0.5,
  },
  product: { width: "40%", textAlign: "right" },
  unit: { width: "15%", textAlign: "right" },
  number: { width: "15%", textAlign: "right" },
  total: { width: "15%", textAlign: "right" },
  totals: { marginTop: 14, alignItems: "flex-end" },
  totalRow: {
    width: "55%",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  footer: { marginTop: 24, textAlign: "center" },
});

const label = messages.invoicePdf;

export function InvoicePdf({ data }: InvoicePdfProps) {
  return (
    <Document
      title={`${label.saleTitle} #${String(data.number).padStart(6, "0")}`}
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>{data.shopName}</Text>
        {data.shopAddress ? (
          <Text style={styles.detail}>{data.shopAddress}</Text>
        ) : null}
        {data.shopPhone ? (
          <Text style={styles.detail}>{data.shopPhone}</Text>
        ) : null}
        <View style={styles.section}>
          <Text style={styles.heading}>
            {label.saleTitle} #{String(data.number).padStart(6, "0")}
          </Text>
          {data.cancelled ? (
            <Text style={styles.detail}>{label.cancelled}</Text>
          ) : null}
          <Text style={styles.detail}>
            {label.date}: {formatDate(data.issuedAt)}
          </Text>
          <Text style={styles.detail}>
            {label.cashier}: {data.cashierName}
          </Text>
          {data.customerName ? (
            <Text style={styles.detail}>
              {label.customer}: {data.customerName}
              {data.customerPhone ? ` — ${data.customerPhone}` : ""}
            </Text>
          ) : null}
          <Text style={styles.detail}>
            {label.cashbox}: {data.cashboxName}
          </Text>
        </View>
        <View style={styles.section}>
          <View style={styles.row} fixed>
            <Text style={styles.product}>{label.product}</Text>
            <Text style={styles.unit}>{label.unit}</Text>
            <Text style={styles.number}>{label.quantity}</Text>
            <Text style={styles.number}>{label.price}</Text>
            <Text style={styles.total}>{label.lineTotal}</Text>
          </View>
          {data.lines.map((line, index) => (
            <View key={index} style={styles.row} wrap={false}>
              <Text style={styles.product}>{line.name}</Text>
              <Text style={styles.unit}>{line.unit}</Text>
              <Text style={styles.number}>{formatNumber(line.quantity)}</Text>
              <Text style={styles.number}>
                {formatNumber(line.price, 4)} {label.currency}
              </Text>
              <Text style={styles.total}>{formatMoney(line.total)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.totals} wrap={false}>
          <View style={styles.totalRow}>
            <Text>{label.subtotal}</Text>
            <Text>{formatMoney(data.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>{label.discount}</Text>
            <Text>{formatMoney(data.discount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>{label.total}</Text>
            <Text>{formatMoney(data.total)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>{label.paid}</Text>
            <Text>{formatMoney(data.paid)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>{label.remaining}</Text>
            <Text>{formatMoney(data.remaining)}</Text>
          </View>
        </View>
        {data.notes ? (
          <Text style={styles.section}>
            {label.notes}: {data.notes}
          </Text>
        ) : null}
        {data.footer ? <Text style={styles.footer}>{data.footer}</Text> : null}
      </Page>
    </Document>
  );
}
