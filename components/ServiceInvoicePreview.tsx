import React, { forwardRef } from "react";
import { format } from "date-fns";
import { ServiceInvoiceFormData, ServiceGroup, ServiceItem } from "@/types/invoice";

type ServiceInvoicePreviewProps = {
  data: Partial<ServiceInvoiceFormData>;
};

/* ------------------------------------------------------------------ */
/*  Page dimensions (A4 at 72dpi) — unchanged                          */
/* ------------------------------------------------------------------ */
export const PAGE_WIDTH_2 = 612;
export const PAGE_HEIGHT_2 = 842;

const PADDING = 30;
const BOTTOM_FOOTER_H = 72;
const HEADER_H = 165;
const TITLE_H = 60;
const TABLE_HEADER_H = 32;
const FIRST_PAGE_GAP = 24;
const FOOTER_H = 200;

// A4 preview layout measurements used for deterministic PDF pagination.
const USABLE_H = PAGE_HEIGHT_2 - PADDING * 2 - BOTTOM_FOOTER_H;
const FIRST_PAGE_ITEMS_CAP =
  USABLE_H - HEADER_H - TITLE_H - TABLE_HEADER_H - FIRST_PAGE_GAP;
const NEXT_PAGE_ITEMS_CAP = USABLE_H - TABLE_HEADER_H;

/* ------------------------------------------------------------------ */
/*  Flat-row types & helpers — unchanged logic                         */
/* ------------------------------------------------------------------ */
type ServiceHeaderRow = { type: "service-header"; name: string; idx: number };
type ServiceItemRow = {
  type: "item";
  item: ServiceItem;
  serviceIdx: number;
  itemIdx: number;
};
type SubtotalRow = { type: "subtotal"; amount: number; currency: string };
type FlatRow = ServiceHeaderRow | ServiceItemRow | SubtotalRow;

function estimateFlatRowH(row: FlatRow): number {
  if (row.type === "service-header") return 30;
  if (row.type === "subtotal") return 26;
  let h = 34;
  if (row.item.note) h += 16;
  if (row.item.subItems?.length) h += row.item.subItems.length * 14;
  return h;
}

function flattenServices(
  services: ServiceGroup[],
  currency: string,
): FlatRow[] {
  const rows: FlatRow[] = [];
  services.forEach((svc, si) => {
    rows.push({
      type: "service-header",
      name: svc.serviceName || `Service ${si + 1}`,
      idx: si,
    });
    svc.items.forEach((item, ii) => {
      rows.push({ type: "item", item, serviceIdx: si, itemIdx: ii });
    });
    const sub = svc.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    rows.push({ type: "subtotal", amount: sub, currency });
  });
  return rows;
}

type PageSlice2 = { rows: FlatRow[]; isFirst: boolean; isLast: boolean };

function buildPages2(rows: FlatRow[]): PageSlice2[] {
  if (!rows.length) return [{ rows: [], isFirst: true, isLast: true }];

  const pages: PageSlice2[] = [];
  const queue = [...rows];
  let firstPage = true;

  while (queue.length > 0) {
    const cap = firstPage ? FIRST_PAGE_ITEMS_CAP : NEXT_PAGE_ITEMS_CAP;
    const chunk: FlatRow[] = [];
    let used = 0;

    while (queue.length > 0) {
      const h = estimateFlatRowH(queue[0]);
      if (used + h > cap && chunk.length > 0) break;
      chunk.push(queue.shift()!);
      used += h;
    }

    pages.push({ rows: chunk, isFirst: firstPage, isLast: queue.length === 0 });
    firstPage = false;
  }

  const lp = pages[pages.length - 1];
  const lpCap = lp.isFirst ? FIRST_PAGE_ITEMS_CAP : NEXT_PAGE_ITEMS_CAP;
  const lpUsed = lp.rows.reduce((s, r) => s + estimateFlatRowH(r), 0);

  // Move the totals and payment block to a trailing page when it cannot fit.
  if (lpUsed + FOOTER_H > lpCap) {
    lp.isLast = false;
    pages.push({ rows: [], isFirst: false, isLast: true });
  }

  return pages;
}

/* ------------------------------------------------------------------ */
/*  Reusable style constants — extracted from inline, values identical */
/* ------------------------------------------------------------------ */
const COLORS = {
  brand: "#5A378F",
  brandDark: "#5A3691",
  pink: "#EA2B7B",
  textPrimary: "#374151",
  textSecondary: "#4b5563",
  textMuted: "#6b7280",
  textFaint: "#9ca3af",
  border: "#e5e7eb",
  borderDark: "#B1B1B1",
  borderDarkest: "#7D7E81",
  subtotalRowBg: "#f5f3ff",
  logoBg: "#f3f4f6",
} as const;

const FONT_SIZES = {
  xs: "8px",
  sm: "10px",
  base: "11px",
  md: "12px",
  lg: "14px",
  xl: "16px",
  title: "20px",
} as const;

const FONT_FAMILY =
  "'HelveticaNowDisplay', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/* ------------------------------------------------------------------ */
/*  Page wrapper style                                                 */
/* ------------------------------------------------------------------ */
function pageStyle(pageIdx: number, isLast: boolean): React.CSSProperties {
  return {
    width: `${PAGE_WIDTH_2}px`,
    height: `${PAGE_HEIGHT_2}px`,
    padding: `${PADDING}px`,
    background: "white",
    color: "black",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    marginBottom: !isLast ? "20px" : 0,
    breakAfter: !isLast ? ("page" as const) : "auto",
    overflow: "hidden",
    fontFamily: FONT_FAMILY,
  };
}

/* ------------------------------------------------------------------ */
/*  Header section (logo + From/To)                                    */
/* ------------------------------------------------------------------ */
function HeaderSection({
  logoUrl,
  from,
  to,
}: {
  logoUrl?: string;
  from: { name: string; email: string; phone: string; address: string };
  to: { name: string; email: string; phone: string; address: string };
}) {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "14px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {logoUrl ? (
          <img
            src={logoUrl}
            crossOrigin="anonymous"
            style={{
              width: "120px",
              height: "120px",
              objectFit: "contain",
              objectPosition: "left",
            }}
            alt="Logo"
          />
        ) : (
          <div
            style={{
              width: "80px",
              height: "80px",
              background: COLORS.logoBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: FONT_SIZES.sm,
              color: COLORS.textFaint,
            }}
          >
            Logo
          </div>
        )}
      </div>
      <div style={{ textAlign: "left", fontSize: FONT_SIZES.md, width: "150px" }}>
        {from.name && (
          <div style={{ fontSize: FONT_SIZES.base }}>
            <h4 style={{ color: COLORS.brand, fontWeight: "bold", margin: 0 }}>From:</h4>
            <p style={{ fontWeight: 700, margin: 0 }}>{from.name}</p>
            {from.address && <p style={{ color: COLORS.textSecondary, margin: 0 }}>{from.address}</p>}
            {from.phone && <p style={{ color: COLORS.textSecondary, margin: 0 }}>{from.phone}</p>}
            {from.email && <p style={{ color: COLORS.textSecondary, margin: 0 }}>{from.email}</p>}
          </div>
        )}
        <div>
          <h4
            style={{
              color: COLORS.brand,
              fontWeight: "bold",
              marginTop: "10px",
            }}
          >
            To:
          </h4>
          <p style={{ fontWeight: "bold", margin: 0 }}>{to.name}</p>
          <p style={{ color: COLORS.textSecondary, whiteSpace: "pre-line", margin: 0 }}>
            {to.address}
          </p>
          <p style={{ color: COLORS.textSecondary, margin: 0 }}>{to.email}</p>
          <p style={{ color: COLORS.textSecondary, margin: 0 }}>{to.phone}</p>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Title section (INVOICE #INV2-001)                                  */
/* ------------------------------------------------------------------ */
function TitleSection({ name, invoiceNumber }: { name: string; invoiceNumber: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "24px",
        fontSize: FONT_SIZES.title,
        fontWeight: "bold",
        textTransform: "uppercase",
        marginBottom: "14px",
      }}
    >
      <h1 style={{ margin: 0, fontSize: FONT_SIZES.title, fontWeight: "bold" }}>{name}</h1>
      <h1 style={{ margin: 0, fontSize: FONT_SIZES.title, fontWeight: "bold" }}>#{invoiceNumber}</h1>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Description section (between title and dates)                      */
/* ------------------------------------------------------------------ */
function DescriptionSection({ description }: { description?: string }) {
  if (!description?.trim()) return null;

  return (
    <div
      style={{
        marginBottom: "14px",
        padding: "8px 12px",
        background: COLORS.logoBg,
        borderRadius: "2px",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: FONT_SIZES.md,
          color: COLORS.textPrimary,
          whiteSpace: "pre-line",
          lineHeight: 1.4,
        }}
      >
        {description}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dates section                                                      */
/* ------------------------------------------------------------------ */
function DatesSection({ date, dueDate }: { date: Date; dueDate: Date }) {
  const dateRowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    gap: "4px",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: FONT_SIZES.md,
    fontWeight: "bold",
    margin: 0,
  };
  const valueStyle: React.CSSProperties = {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    margin: 0,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: "2px",
      }}
    >
      <div style={dateRowStyle}>
        <h4 style={labelStyle}>Invoice Date:</h4>
        <p style={valueStyle}>{format(new Date(date), "MMM dd, yyyy")}</p>
      </div>
      <div style={dateRowStyle}>
        <h4 style={labelStyle}>Due Date:</h4>
        <p style={valueStyle}>{format(new Date(dueDate), "MMM dd, yyyy")}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Services & items table                                             */
/* ------------------------------------------------------------------ */
function ServicesTable({
  page,
  isEmpty,
}: {
  page: PageSlice2;
  isEmpty: boolean;
}) {
  const thBase: React.CSSProperties = {
    textAlign: "center",
    paddingBottom: "6px",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        width: "100%",
        borderTop: `1px solid ${COLORS.borderDarkest}`,
        paddingTop: "8px",
        marginTop: "14px",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ color: COLORS.brand, fontSize: FONT_SIZES.md, fontWeight: "bold" }}>
            <th style={{ textAlign: "left", paddingBottom: "6px" }}>Services &amp; Items</th>
            <th style={{ ...thBase, width: "60px" }}>Qty</th>
            <th style={{ ...thBase, width: "60px" }}>Unit Price</th>
            <th style={{ ...thBase, width: "60px" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {page.rows.length > 0
            ? page.rows.map((row, ri) => {
              if (row.type === "service-header") {
                return (
                  <tr key={ri}>
                    <td
                      colSpan={4}
                      style={{
                        background: COLORS.brand,
                        color: "white",
                        fontSize: FONT_SIZES.base,
                        fontWeight: "bold",
                        padding: "6px 8px",
                        borderRadius: "2px",
                      }}
                    >
                      {row.idx + 1}. {row.name}
                    </td>
                  </tr>
                );
              }

              if (row.type === "subtotal") {
                return (
                  <tr key={ri} style={{ background: COLORS.subtotalRowBg }}>
                    <td
                      colSpan={3}
                      style={{
                        textAlign: "right",
                        fontSize: FONT_SIZES.sm,
                        fontWeight: "bold",
                        padding: "5px 8px",
                        color: COLORS.brand,
                      }}
                    >
                      Service Subtotal:
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        fontSize: FONT_SIZES.sm,
                        fontWeight: "bold",
                        padding: "5px 0",
                        color: COLORS.brand,
                      }}
                    >
                      {row.amount.toFixed(2)}
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={ri} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  <td
                    style={{
                      textAlign: "left",
                      fontSize: FONT_SIZES.md,
                      padding: "7px 0 7px 14px",
                      wordBreak: "break-word",
                      minWidth: 0,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>
                      {row.itemIdx + 1}. {row.item.name}
                    </span>
                    {row.item.note && (
                      <p
                        style={{
                          fontSize: FONT_SIZES.sm,
                          color: COLORS.textMuted,
                          margin: "2px 0 0",
                          fontStyle: "italic",
                        }}
                      >
                        {row.item.note}
                      </p>
                    )}
                    {row.item.subItems && row.item.subItems.length > 0 && (
                      <ul style={{ margin: "2px 0 0", padding: 0, listStyle: "none" }}>
                        {row.item.subItems.map((sub, si) => (
                          <li
                            key={si}
                            style={{ fontSize: FONT_SIZES.sm, color: COLORS.textSecondary }}
                          >
                            - {sub}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      padding: "7px 4px",
                      fontSize: FONT_SIZES.md,
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                      width: "60px",
                    }}
                  >
                    {row.item.quantity}
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      padding: "7px 4px",
                      fontSize: FONT_SIZES.md,
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                      width: "90px",
                    }}
                  >
                    {row.item.unitPrice}
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      padding: "7px 4px",
                      fontSize: FONT_SIZES.md,
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                      width: "90px",
                    }}
                  >
                    {(row.item.quantity * row.item.unitPrice).toFixed(2)}
                  </td>
                </tr>
              );
            })
            : isEmpty && (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    textAlign: "center",
                    padding: "24px 0",
                    color: COLORS.textFaint,
                    fontSize: FONT_SIZES.lg,
                  }}
                >
                  No services added
                </td>
              </tr>
            )}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Single totals row                                                  */
/* ------------------------------------------------------------------ */
function TotalsRow({ label, value }: { label: string; value: string }) {
  const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: FONT_SIZES.md,
    fontWeight: "bold",
    height: "32px",
    lineHeight: 1.2,
    borderTop: `1px solid ${COLORS.borderDark}`,
  };
  const labelStyle: React.CSSProperties = {
    color: COLORS.pink,
    margin: 0,
    fontSize: FONT_SIZES.md,
    fontWeight: "bold",
    lineHeight: 1.2,
  };
  const valueStyle: React.CSSProperties = {
    margin: 0,
    fontSize: FONT_SIZES.md,
    fontWeight: "bold",
    lineHeight: 1.2,
  };

  return (
    <div style={rowStyle}>
      <h2 style={labelStyle}>{label}</h2>
      <h2 style={valueStyle}>{value}</h2>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Payment info block                                                 */
/* ------------------------------------------------------------------ */
function PaymentInfoBlock({
  paymentInfo,
}: {
  paymentInfo: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    branch: string;
    swift: string;
    routingNumber?: string;
    currency: string;
    note?: string;
  };
}) {
  const labelStyle: React.CSSProperties = {
    fontSize: FONT_SIZES.xs,
    color: "white",
    margin: 0,
  };
  const valueStyle: React.CSSProperties = {
    fontSize: FONT_SIZES.xs,
    fontWeight: "bold",
    margin: 0,
  };
  const rowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    gap: "4px",
  };

  const hasNote = !!paymentInfo.note?.trim();

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          width: "100%",
          color: "white",
          padding: "10px 32px 10px 32px",
          border: `1px solid ${COLORS.brand}`,
          backgroundColor: COLORS.brandDark,
          gap: "8px",
          marginTop: "8px",
          verticalAlign: "top",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* Left: Note (60% width) — "Note:" label + text below */}
          <div style={{ flex: "0 0 60%", maxWidth: "60%" }}>
            {hasNote ? (
              <>
                <h3
                  style={{
                    fontSize: FONT_SIZES.md,
                    fontWeight: "bold",
                    margin: 0,
                    marginBottom: "4px",
                    lineHeight: 1.2,
                    color: "white",
                  }}
                >
                  Note:
                </h3>
                <p
                  style={{
                    fontSize: FONT_SIZES.sm,
                    color: "white",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    lineHeight: 1.4,
                  }}
                >
                  {paymentInfo.note}
                </p>
              </>
            ) : (
              <h3 style={{ fontSize: FONT_SIZES.xl, fontWeight: "bold", margin: 0 }}>
                Payment Information:
              </h3>
            )}
          </div>

          {/* Right: Payment info (40% width) — heading + account rows */}
          <div
            style={{
              textAlign: "left",
              fontSize: FONT_SIZES.sm,
              flex: "0 0 40%",
              maxWidth: "40%",
            }}
          >
            {hasNote && (
              <h3
                style={{
                  fontSize: FONT_SIZES.lg,
                  fontWeight: "bold",
                  margin: 0,
                  marginBottom: "6px",
                  lineHeight: 1.2,
                  color: "white",
                }}
              >
                Payment Information:
              </h3>
            )}
            <div style={rowStyle}>
              <p style={labelStyle}>Account Name:</p>
              <h4 style={valueStyle}>{paymentInfo.accountName}</h4>
            </div>
            <div style={rowStyle}>
              <p style={labelStyle}>Account Number:</p>
              <h4 style={valueStyle}>{paymentInfo.accountNumber}</h4>
            </div>
            <div style={rowStyle}>
              <p style={labelStyle}>Bank Name:</p>
              <h4 style={valueStyle}>{paymentInfo.bankName}</h4>
            </div>
            <div style={rowStyle}>
              <p style={labelStyle}>Branch:</p>
              <h4 style={valueStyle}>{paymentInfo.branch}</h4>
            </div>
            <div style={rowStyle}>
              <p style={labelStyle}>SWIFT Code:</p>
              <h4 style={valueStyle}>{paymentInfo.swift}</h4>
            </div>
            <div style={rowStyle}>
              <p style={labelStyle}>Routing Number:</p>
              <h4 style={valueStyle}>{paymentInfo.routingNumber}</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export const ServiceInvoicePreview = forwardRef<HTMLDivElement, ServiceInvoicePreviewProps>(
  ({ data }, ref) => {
    const {
      invoiceNumber = "INV2-001",
      name = "Invoice",
      description,
      logoUrl,
      from = { name: "", email: "", phone: "", address: "" },
      to = { name: "", email: "", phone: "", address: "" },
      date = new Date(),
      dueDate = new Date(),
      paymentInfo = {
        accountName: "",
        accountNumber: "",
        bankName: "",
        branch: "",
        swift: "",
        routingNumber: "",
        currency: "USD",
      },
      services = [],
      vat = 0,
      discount = 0,
      advancePaid = 0,
    } = data;

    // Totals calculation — unchanged
    const grandSubtotal = services.reduce(
      (s, svc) => s + svc.items.reduce((a, i) => a + i.quantity * i.unitPrice, 0),
      0,
    );
    const vatAmount = ((grandSubtotal - (discount ?? 0)) * (vat ?? 0)) / 100;
    const grandTotal = grandSubtotal + vatAmount - (discount ?? 0) - (advancePaid ?? 0);

    const flatRows = flattenServices(services, paymentInfo.currency || "USD");
    const pages = buildPages2(flatRows);

    return (
      <div ref={ref}>
        {pages.map((page, pageIdx) => {
          const isLastPage = pageIdx === pages.length - 1;

          return (
            <div key={pageIdx} data-invoice-page="true" style={pageStyle(pageIdx, isLastPage)}>
              {/* Main invoice content */}
              <div style={{ flex: 1, overflow: "hidden" }}>
                {page.isFirst && <HeaderSection logoUrl={logoUrl} from={from} to={to} />}
                {page.isFirst && <TitleSection name={name} invoiceNumber={invoiceNumber} />}
                {page.isFirst && <DescriptionSection description={description} />}
                {page.isFirst && <DatesSection date={date} dueDate={dueDate} />}

                <ServicesTable
                  page={page}
                  isEmpty={page.isLast && services.length === 0}
                />

                {page.isLast && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ width: "100%" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          fontSize: FONT_SIZES.sm,
                        }}
                      >
                        <TotalsRow
                          label="Sub-Total"
                          value={`${grandSubtotal.toFixed(2)} (${paymentInfo.currency})`}
                        />

                        {(vat ?? 0) > 0 && (
                          <TotalsRow
                            label={`VAT (${vat}%)`}
                            value={`${vatAmount.toFixed(2)} (${paymentInfo.currency})`}
                          />
                        )}

                        {(discount ?? 0) > 0 && (
                          <TotalsRow
                            label="Discount (-)"
                            value={`${Number(discount).toFixed(2)} (${paymentInfo.currency})`}
                          />
                        )}

                        {(advancePaid ?? 0) > 0 && (
                          <TotalsRow
                            label="Advance Paid (-)"
                            value={`${Number(advancePaid).toFixed(2)} (${paymentInfo.currency})`}
                          />
                        )}

                        <TotalsRow
                          label="Grand Total"
                          value={`${Number(grandTotal).toFixed(2)} (${paymentInfo.currency})`}
                        />
                      </div>
                    </div>

                    <PaymentInfoBlock paymentInfo={paymentInfo} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);

ServiceInvoicePreview.displayName = "ServiceInvoicePreview";