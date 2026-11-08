import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import path from "node:path";
import {
  ServiceInvoiceFormData,
  InvoiceFormData,
  InvoiceItem,
  ServiceGroup,
  ServiceItem,
} from "@/types/invoice";
import { readFileSync } from "node:fs";
import type { ReactElement, ReactNode } from "react";

const publicPath = path.join(process.cwd(), "public");

type NodeRuntimeGlobal = typeof globalThis & {
  require?: NodeRequire;
};

declare const __non_webpack_require__: NodeRequire | undefined;

function loadReactForPdfRenderer() {
  const runtimeGlobal = globalThis as NodeRuntimeGlobal;
  const runtimeRequire =
    typeof __non_webpack_require__ === "function"
      ? __non_webpack_require__
      : runtimeGlobal.require;

  if (!runtimeRequire) {
    throw new Error("PDF renderer could not load the Node React runtime");
  }

  return runtimeRequire("react") as typeof import("react");
}

const { createElement } = loadReactForPdfRenderer();

function pdfElement(
  type: any,
  props?: any,
  ...children: ReactNode[]
): ReactElement {
  return createElement(type, props, ...children) as ReactElement;
}

Font.register({
  family: "HelveticaNowDisplay",
  fonts: [
    {
      src: path.join(publicPath, "fonts", "HelveticaNowDisplay-Regular.ttf"),
      fontWeight: 400,
      fontStyle: "normal",
    },
    {
      src: path.join(publicPath, "fonts", "HelveticaNowDisplay-Regular.ttf"),
      fontWeight: 400,
      fontStyle: "italic",
    },
    {
      src: path.join(publicPath, "fonts", "HelveticaNowDisplay-Medium.ttf"),
      fontWeight: 500,
      fontStyle: "normal",
    },
    {
      src: path.join(publicPath, "fonts", "HelveticaNowDisplay-Bold.ttf"),
      fontWeight: 700,
      fontStyle: "normal",
    },
  ],
});

// Wrap whole words instead of auto-hyphenating (e.g. "pay-ments").
Font.registerHyphenationCallback((word) => [word]);

type InvoicePdfDocumentProps = {
  invoice: Partial<InvoiceFormData & ServiceInvoiceFormData>;
};

type TotalRow = {
  label: string;
  value: string;
};

const jamrollLogoPath = path.join(publicPath, "assets", "Jamroll Logo.png");
const jamrollLogoDataUri = `data:image/png;base64,${readFileSync(jamrollLogoPath).toString("base64")}`;

const styles = StyleSheet.create({
  page: {
    width: 612,
    padding: 24,
    paddingBottom: 100,
    backgroundColor: "#ffffff",
    color: "#000000",
    fontFamily: "HelveticaNowDisplay",
    fontSize: 11,
  },
  content: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  logo: {
    width: 72,
    height: 72,
    objectFit: "contain",
  },
  logoPlaceholder: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
  placeholderText: {
    fontSize: 9,
    color: "#9ca3af",
  },
  clientBlock: {
    width: 150,
  },
  fromBlock: {
    fontSize: 10,
    marginBottom: 9,
  },
  accentLabel: {
    color: "#5A378F",
    fontWeight: 700,
  },
  mutedText: {
    color: "#4b5563",
  },
  titleRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    textTransform: "uppercase",
    marginRight: 4,
  },
  descriptionBox: {
    marginBottom: 10,
    paddingTop: 4,
    paddingBottom: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 2,
  },
  descriptionText: {
    fontSize: 11,
    color: "#374151",
    lineHeight: 1.3,
  },
  datesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dateItem: {
    flexDirection: "row",
  },
  dateLabel: {
    fontWeight: 700,
    marginRight: 4,
  },
  table: {
    borderTopWidth: 1,
    borderTopColor: "#7D7E81",
    paddingTop: 6,
  },
  tableHeader: {
    flexDirection: "row",
    color: "#5A378F",
    fontWeight: 700,
    paddingBottom: 5,
    fontSize: 10,
  },
  itemColumn: {
    width: "46%",
  },
  numberColumn: {
    width: "18%",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 5,
  },
  itemName: {
    fontWeight: 600,
  },
  itemNote: {
    fontSize: 9,
    color: "#6b7280",
    fontStyle: "italic",
    marginTop: 2,
  },
  subItem: {
    fontSize: 9,
    color: "#4b5563",
    marginTop: 2,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 20,
  },
  serviceHeader: {
    backgroundColor: "#5A378F",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 700,
    paddingVertical: 5,
    paddingHorizontal: 7,
  },
  serviceSubtotalRow: {
    flexDirection: "row",
    backgroundColor: "#f5f3ff",
    paddingVertical: 4,
    paddingHorizontal: 7,
  },
  serviceSubtotalLabel: {
    width: "82%",
    textAlign: "right",
    color: "#5A378F",
    fontSize: 9,
    fontWeight: 700,
  },
  serviceSubtotalValue: {
    width: "18%",
    textAlign: "center",
    color: "#5A378F",
    fontSize: 9,
    fontWeight: 700,
  },
  totals: {
    marginTop: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 28,
    borderTopWidth: 1,
    borderTopColor: "#B1B1B1",
  },
  totalLabel: {
    color: "#EA2B7B",
    fontSize: 11,
    fontWeight: 700,
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 700,
  },
  paymentBox: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#5A378F",
    backgroundColor: "#5A3691",
    color: "#ffffff",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: 700,
  },
  paymentDetails: {
    width: 140,
  },
  paymentNoteColumn: {
    width: "58%",
    paddingRight: 10,
  },
  paymentNoteTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 4,
  },
  paymentNoteText: {
    fontSize: 9,
    lineHeight: 1.3,
  },
  paymentDetailsWithNote: {
    width: "42%",
  },
  paymentDetailsTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 5,
  },
  paymentLine: {
    flexDirection: "row",
    fontSize: 7,
    lineHeight: 1.3,
  },
  paymentLineLabel: {
    marginRight: 3,
  },
  paymentLineValue: {
    fontWeight: 700,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
  },
  footerText: {
    color: "#4b5563",
  },
  footerLogo: {
    width: 140,
    height: 44,
    objectFit: "contain",
  },
});

export function InvoicePdfDocument({ invoice }: InvoicePdfDocumentProps) {
  return createInvoicePdfDocument(invoice);
}

export function createInvoicePdfDocument(
  invoice: Partial<InvoiceFormData & ServiceInvoiceFormData>,
) {
  const docType = invoice.type as string | undefined;
  const isServiceInvoice = docType === "serviceInvoice";
  const isQuotation = docType === "quotation";
  const paymentInfo = withPaymentDefaults(invoice.paymentInfo);
  const currency = paymentInfo.currency || "USD";

  return pdfElement(
    Document,
    null,
    pdfElement(
      Page,
      { size: [612, 842], style: styles.page, wrap: true },
      pdfElement(
        View,
        { style: styles.content },
        pdfElement(InvoiceHeader, { invoice }),
        pdfElement(InvoiceTitle, { invoice }),
        pdfElement(InvoiceDescription, { description: invoice.description }),
        pdfElement(InvoiceDates, { invoice }),
        isServiceInvoice
          ? pdfElement(ServiceTable, { services: invoice.services ?? [] })
          : pdfElement(ItemTable, { items: invoice.items ?? [] }),
        pdfElement(TotalsBlock, {
          rows: isServiceInvoice
            ? buildServiceTotalRows(invoice, currency)
            : buildItemTotalRows(invoice, currency),
          paymentInfo,
          isQuotation,
          notes: invoice.notes,
        }),
      ),
      pdfElement(InvoiceFooter),
    ),
  );
}

function InvoiceHeader({ invoice }: InvoicePdfDocumentProps) {
  const logoUrl = invoice.logoUrl;
  const to = invoice.to ?? { name: "", email: "", phone: "", address: "" };
  const from = invoice.from ?? { name: "", email: "", phone: "", address: "" };

  return pdfElement(
    View,
    { style: styles.header },
    logoUrl
      ? pdfElement(Image, { src: logoUrl, style: styles.logo })
      : pdfElement(
        View,
        { style: styles.logoPlaceholder },
        pdfElement(Text, { style: styles.placeholderText }, "Logo"),
      ),
    // Right column: From (top) + To (bottom), same as the on-screen preview.
    pdfElement(
      View,
      { style: styles.clientBlock },
      from.name?.trim()
        ? pdfElement(
          View,
          { style: styles.fromBlock },
          pdfElement(Text, { style: styles.accentLabel }, "From:"),
          pdfElement(Text, { style: { fontWeight: 700 } }, from.name),
          ...[from.address, from.phone, from.email]
            .filter((line) => line?.trim())
            .map((line, i) => pdfElement(Text, { key: `from-${i}`, style: styles.mutedText }, line)),
        )
        : null,
      pdfElement(Text, { style: styles.accentLabel }, "To:"),
      pdfElement(Text, { style: { fontWeight: 700 } }, to.name),
      ...[to.address, to.email, to.phone]
        .filter((line) => line?.trim())
        .map((line, i) => pdfElement(Text, { key: `to-${i}`, style: styles.mutedText }, line)),
    ),
  );
}

function InvoiceTitle({ invoice }: InvoicePdfDocumentProps) {
  return pdfElement(
    View,
    { style: styles.titleRow },
    pdfElement(Text, { style: styles.title }, invoice.name || "Invoice"),
    pdfElement(Text, { style: styles.title }, `#${invoice.invoiceNumber || "INV-001"}`),
  );
}

function InvoiceDescription({ description }: { description?: string }) {
  const text = description?.trim();
  if (!text) return null;

  return pdfElement(
    View,
    { style: styles.descriptionBox },
    pdfElement(Text, { style: styles.descriptionText }, text),
  );
}

function InvoiceDates({ invoice }: InvoicePdfDocumentProps) {
  const isQuotation = (invoice.type as string) === "quotation";
  return pdfElement(
    View,
    { style: styles.datesRow },
    pdfElement(
      View,
      { style: styles.dateItem },
      pdfElement(Text, { style: styles.dateLabel }, isQuotation ? "Quotation Date:" : "Invoice Date:"),
      pdfElement(Text, { style: styles.mutedText }, formatDate(invoice.date)),
    ),
    pdfElement(
      View,
      { style: styles.dateItem },
      pdfElement(Text, { style: styles.dateLabel }, isQuotation ? "Valid Until:" : "Due Date:"),
      pdfElement(Text, { style: styles.mutedText }, formatDate(invoice.dueDate)),
    ),
  );
}

function ItemTable({ items }: { items: InvoiceItem[] }) {
  return pdfElement(
    View,
    { style: styles.table },
    pdfElement(
      View,
      { style: styles.tableHeader, fixed: true },
      pdfElement(Text, { style: styles.itemColumn }, "Items"),
      pdfElement(Text, { style: styles.numberColumn }, "Quantity"),
      pdfElement(Text, { style: styles.numberColumn }, "Unit Price"),
      pdfElement(Text, { style: styles.numberColumn }, "Amount"),
    ),
    items.length > 0
      ? items.map((item, index) =>
        pdfElement(ItemRow, { key: `${item.name}-${index}`, item, indexLabel: `${index + 1}.` }),
      )
      : pdfElement(Text, { style: styles.emptyText }, "No items added"),
  );
}

function ServiceTable({ services }: { services: ServiceGroup[] }) {
  return pdfElement(
    View,
    { style: styles.table },
    pdfElement(
      View,
      { style: styles.tableHeader, fixed: true },
      pdfElement(Text, { style: styles.itemColumn }, "Services & Items"),
      pdfElement(Text, { style: styles.numberColumn }, "Qty"),
      pdfElement(Text, { style: styles.numberColumn }, "Unit Price"),
      pdfElement(Text, { style: styles.numberColumn }, "Amount"),
    ),
    services.length > 0
      ? services.map((service, serviceIndex) =>
        pdfElement(
          View,
          { key: `${service.serviceName}-${serviceIndex}` },
          ...serviceRowGroups(service, serviceIndex),
        ),
      )
      : pdfElement(Text, { style: styles.emptyText }, "No services added"),
  );
}

/**
 * between items
 */
function serviceRowGroups(service: ServiceGroup, serviceIndex: number) {
  const header = pdfElement(
    Text,
    { key: "header", style: styles.serviceHeader },
    `${serviceIndex + 1}. ${service.serviceName || `Service ${serviceIndex + 1}`}`,
  );
  const subtotal = pdfElement(
    View,
    { key: "subtotal", style: styles.serviceSubtotalRow },
    pdfElement(Text, { style: styles.serviceSubtotalLabel }, "Service Subtotal:"),
    pdfElement(Text, { style: styles.serviceSubtotalValue }, formatMoney(sumItems(service.items))),
  );
  const rows = service.items.map((item, itemIndex) =>
    pdfElement(ItemRow, {
      key: `${item.name}-${itemIndex}`,
      item,
      indexLabel: `${itemIndex + 1}.`,
      indented: true,
    }),
  );

  if (rows.length <= 1) {
    return [pdfElement(View, { key: "all", wrap: false }, header, ...rows, subtotal)];
  }

  return [
    pdfElement(View, { key: "first", wrap: false }, header, rows[0]),
    ...rows.slice(1, -1),
    pdfElement(View, { key: "last", wrap: false }, rows[rows.length - 1], subtotal),
  ];
}

function ItemRow({
  item,
  indexLabel,
  indented = false,
}: {
  item: InvoiceItem | ServiceItem;
  indexLabel: string;
  indented?: boolean;
}) {
  return pdfElement(
    View,
    { style: styles.tableRow, wrap: false },
    pdfElement(
      View,
      { style: [styles.itemColumn, indented ? { paddingLeft: 14 } : {}] },
      pdfElement(Text, { style: styles.itemName }, `${indexLabel} ${item.name}`),
      item.note ? pdfElement(Text, { style: styles.itemNote }, item.note) : null,
      item.subItems?.map((subItem, index) =>
        pdfElement(Text, { key: `${subItem}-${index}`, style: styles.subItem }, `- ${subItem}`),
      ),
    ),
    pdfElement(Text, { style: styles.numberColumn }, item.quantity),
    pdfElement(Text, { style: styles.numberColumn }, formatMoney(item.unitPrice)),
    pdfElement(Text, { style: styles.numberColumn }, formatMoney(item.quantity * item.unitPrice)),
  );
}

function TotalsBlock({
  rows,
  paymentInfo,
  isQuotation,
  notes,
}: {
  rows: TotalRow[];
  paymentInfo: ReturnType<typeof withPaymentDefaults>;
  isQuotation?: boolean;
  notes?: { text?: string; points?: string[] };
}) {
  const hasNotes = isQuotation && (notes?.text || (notes?.points && notes.points.length > 0));

  const totalRows = rows.map((row) =>
    pdfElement(
      View,
      { key: row.label, style: styles.totalRow },
      pdfElement(Text, { style: styles.totalLabel }, row.label),
      pdfElement(Text, { style: styles.totalValue }, row.value),
    ),
  );

  // Page-break rules
  const totalsGroup = pdfElement(View, { wrap: false }, ...totalRows);

  if (!isQuotation) {
    return pdfElement(
      View,
      { style: styles.totals },
      totalsGroup,
      pdfElement(PaymentInfoBox, { paymentInfo }),
    );
  }

  // Quotation notes can be long. Keep short notes in one piece; let very long
  const notesLength = (notes?.text?.length ?? 0) + (notes?.points ?? []).join(" ").length;
  const notesAreShort = (notes?.points?.length ?? 0) <= 10 && notesLength <= 900;

  const notesBox = hasNotes
    ? pdfElement(
      View,
      { style: styles.paymentBox, wrap: !notesAreShort },
      pdfElement(Text, { style: [styles.paymentTitle, { marginBottom: 6 }] }, "Notes:"),
      notes?.text
        ? pdfElement(Text, { style: { fontSize: 10, color: "white", marginBottom: notes?.points?.length ? 6 : 0 } }, notes.text)
        : null,
      ...(notes?.points ?? []).map((pt, i) =>
        pdfElement(Text, { key: String(i), style: { fontSize: 10, color: "white", marginBottom: 2 } }, `• ${pt}`),
      ),
    )
    : null;

  return pdfElement(View, { style: styles.totals }, totalsGroup, notesBox);
}

function PaymentInfoBox({
  paymentInfo,
}: {
  paymentInfo: ReturnType<typeof withPaymentDefaults>;
}) {
  const note = paymentInfo.note.trim();
  const lines = [
    pdfElement(PaymentLine, { key: "an", label: "Account Name:", value: paymentInfo.accountName }),
    pdfElement(PaymentLine, { key: "ac", label: "Account Number:", value: paymentInfo.accountNumber }),
    pdfElement(PaymentLine, { key: "bn", label: "Bank Name:", value: paymentInfo.bankName }),
    pdfElement(PaymentLine, { key: "br", label: "Branch:", value: paymentInfo.branch }),
    pdfElement(PaymentLine, { key: "sw", label: "SWIFT Code:", value: paymentInfo.swift }),
    pdfElement(PaymentLine, { key: "rn", label: "Routing Number:", value: paymentInfo.routingNumber }),
  ];

  // "Payment Information" 
  if (note) {
    return pdfElement(
      View,
      { style: styles.paymentBox, wrap: false },
      pdfElement(
        View,
        { style: [styles.paymentRow, { alignItems: "flex-start" }] },
        pdfElement(
          View,
          { style: styles.paymentNoteColumn },
          pdfElement(Text, { style: styles.paymentNoteTitle }, "Note:"),
          pdfElement(Text, { style: styles.paymentNoteText }, note),
        ),
        pdfElement(
          View,
          { style: styles.paymentDetailsWithNote },
          pdfElement(Text, { style: styles.paymentDetailsTitle }, "Payment Information:"),
          ...lines,
        ),
      ),
    );
  }

  return pdfElement(
    View,
    { style: styles.paymentBox, wrap: false },
    pdfElement(
      View,
      { style: styles.paymentRow },
      pdfElement(Text, { style: styles.paymentTitle }, "Payment Information:"),
      pdfElement(View, { style: styles.paymentDetails }, ...lines),
    ),
  );
}

function PaymentLine({ label, value }: { label: string; value: string }) {
  return pdfElement(
    View,
    { style: styles.paymentLine },
    pdfElement(Text, { style: styles.paymentLineLabel }, label),
    pdfElement(Text, { style: styles.paymentLineValue }, value),
  );
}

function InvoiceFooter() {
  return pdfElement(
    View,
    { style: styles.footer, fixed: true },
    pdfElement(
      View,
      { style: styles.footerText },
      pdfElement(Text, null, "+880 1784 398 934"),
      pdfElement(Text, null, "info@jamroll.xyz"),
      pdfElement(Text, null, "www.jamroll.xyz"),
    ),
    pdfElement(Image, { src: jamrollLogoDataUri, style: styles.footerLogo }),
  );
}

function buildItemTotalRows(
  invoice: Partial<InvoiceFormData & ServiceInvoiceFormData>,
  currency: string,
): TotalRow[] {
  const subtotal = sumItems(invoice.items ?? []);
  const discount = invoice.discount ?? 0;
  const advancePaid = invoice.advancePaid ?? 0;
  const vat = invoice.vat ?? 0;
  const vatAmount = ((subtotal - discount) * vat) / 100;
  const total = subtotal + vatAmount - discount - advancePaid;

  return buildTotalRows(subtotal, vat, vatAmount, discount, advancePaid, total, currency);
}

function buildServiceTotalRows(
  invoice: Partial<InvoiceFormData & ServiceInvoiceFormData>,
  currency: string,
): TotalRow[] {
  const subtotal = (invoice.services ?? []).reduce((t, s) => t + sumItems(s.items), 0);
  const discount = invoice.discount ?? 0;
  const advancePaid = invoice.advancePaid ?? 0;
  const vat = invoice.vat ?? 0;
  const vatAmount = ((subtotal - discount) * vat) / 100;
  const total = subtotal + vatAmount - discount - advancePaid;

  return buildTotalRows(subtotal, vat, vatAmount, discount, advancePaid, total, currency);
}

function buildTotalRows(
  subtotal: number,
  vat: number,
  vatAmount: number,
  discount: number,
  advancePaid: number,
  total: number,
  currency: string,
): TotalRow[] {
  const rows: TotalRow[] = [
    { label: "Sub-Total", value: fmt(currency, subtotal) },
  ];

  if (vat > 0) {
    rows.push({ label: `VAT (${vat}%)`, value: fmt(currency, vatAmount) });
  }

  if (discount > 0) {
    rows.push({ label: "Discount (-)", value: fmt(currency, discount) });
  }

  if (advancePaid > 0) {
    rows.push({ label: "Advance Paid (-)", value: fmt(currency, advancePaid) });
  }

  rows.push({ label: "Grand Total", value: fmt(currency, total) });

  return rows;
}

function sumItems(items: Array<InvoiceItem | ServiceItem>) {
  return items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
}

function withPaymentDefaults(
  paymentInfo: Partial<InvoiceFormData["paymentInfo"]> | undefined,
) {
  return {
    accountName: paymentInfo?.accountName ?? "",
    accountNumber: paymentInfo?.accountNumber ?? "",
    bankName: paymentInfo?.bankName ?? "",
    branch: paymentInfo?.branch ?? "",
    swift: paymentInfo?.swift ?? "",
    routingNumber: paymentInfo?.routingNumber ?? "",
    currency: paymentInfo?.currency ?? "USD",
    note: paymentInfo?.note ?? "",
  };
}

function formatDate(date: Date | string | undefined) {
  return format(new Date(date ?? Date.now()), "MMM dd, yyyy");
}

function formatMoney(value: number) {
  return Number(value).toFixed(2);
}

function fmt(currency: string, value: number) {
  return `${formatMoney(value)} (${currency})`;
}
