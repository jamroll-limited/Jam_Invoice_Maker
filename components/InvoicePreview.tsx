import React, { forwardRef } from "react";
import { InvoiceFormData, InvoiceItem } from "@/types/invoice";
import { format } from "date-fns";

type InvoicePreviewProps = {
  data: Partial<InvoiceFormData>;
};

/* ------------------------------------------------------------------ */
/*  Page dimensions (A4 at 72dpi) — unchanged                          */
/* ------------------------------------------------------------------ */
export const PAGE_WIDTH = 612;
export const PAGE_HEIGHT = 842;

const PADDING = 30;

// A4 preview layout measurements used for deterministic PDF pagination.
const BOTTOM_FOOTER_H = 72;
const HEADER_H = 165;
const TITLE_H = 60;
const TABLE_HEADER_H = 32;
const FIRST_PAGE_GAP = 32;
const FOOTER_H = 10;

const USABLE_H = PAGE_HEIGHT - PADDING * 2 - BOTTOM_FOOTER_H;

const FIRST_PAGE_ITEMS_CAP =
  USABLE_H - HEADER_H - TITLE_H - TABLE_HEADER_H - FIRST_PAGE_GAP;

const NEXT_PAGE_ITEMS_CAP = USABLE_H - HEADER_H - TABLE_HEADER_H;

/* ------------------------------------------------------------------ */
/*  Pagination helpers — unchanged logic                               */
/* ------------------------------------------------------------------ */
function estimateItemH(item: InvoiceItem): number {
  let h = 34;
  if (item.note) h += 16;
  if (item.subItems?.length) h += item.subItems.length * 14;
  return h;
}

type PageSlice = {
  items: InvoiceItem[];
  isFirst: boolean;
  isLast: boolean;
};

function buildPages(items: InvoiceItem[]): PageSlice[] {
  if (!items.length) {
    return [{ items: [], isFirst: true, isLast: true }];
  }

  const pages: PageSlice[] = [];
  const queue = [...items];
  let firstPage = true;

  while (queue.length > 0) {
    const cap = firstPage ? FIRST_PAGE_ITEMS_CAP : NEXT_PAGE_ITEMS_CAP;
    const chunk: InvoiceItem[] = [];
    let used = 0;

    while (queue.length > 0) {
      const h = estimateItemH(queue[0]);
      if (used + h > cap && chunk.length > 0) break;
      chunk.push(queue.shift()!);
      used += h;
    }

    pages.push({
      items: chunk,
      isFirst: firstPage,
      isLast: queue.length === 0,
    });
    firstPage = false;
  }

  const lp = pages[pages.length - 1];
  const lpCap = lp.isFirst ? FIRST_PAGE_ITEMS_CAP : NEXT_PAGE_ITEMS_CAP;
  const lpUsed = lp.items.reduce((s, item) => s + estimateItemH(item), 0);

  // Move the totals and payment block to a trailing page when it cannot fit.
  if (lpUsed + FOOTER_H > lpCap) {
    lp.isLast = false;
    pages.push({ items: [], isFirst: false, isLast: true });
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

/* ------------------------------------------------------------------ */
/*  Page wrapper style                                                 */
/* ------------------------------------------------------------------ */
function pageStyle(pageIdx: number, isLast: boolean): React.CSSProperties {
  return {
    width: `${PAGE_WIDTH}px`,
    height: `${PAGE_HEIGHT}px`,
    padding: `${PADDING}px`,
    background: "white",
    color: "black",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    marginBottom: !isLast ? "20px" : 0,
    breakAfter: !isLast ? "page" as const : "auto",
    overflow: "hidden",
  };
}

/* ------------------------------------------------------------------ */
/*  Header section (logo + From/To)                                    */
/* ------------------------------------------------------------------ */
function HeaderSection({ logoUrl, from, to }: {
  logoUrl?: string;
  from: { name: string; email: string; phone: string; address: string };
  to: { name: string; email: string; phone: string; address: string };
}) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
      {/* Left: Logo only */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {logoUrl ? (
          <img
            src={logoUrl}
            crossOrigin="anonymous"
            style={{ width: "80px", height: "80px", objectFit: "contain" }}
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

      {/* Right: From (top) + To (bottom), stacked vertically */}
      <div style={{ textAlign: "left", fontSize: FONT_SIZES.md, maxWidth: "260px" }}>
        {/* From on top */}
        {from.name && (
          <div style={{ fontSize: FONT_SIZES.base, marginBottom: "12px" }}>
            <h4 style={{ color: COLORS.brand, fontWeight: "bold", margin: 0 }}>From:</h4>
            <p style={{ fontWeight: 700, margin: 0 }}>{from.name}</p>
            {from.address && <p style={{ color: COLORS.textSecondary, margin: 0 }}>{from.address}</p>}
            {from.phone && <p style={{ color: COLORS.textSecondary, margin: 0 }}>{from.phone}</p>}
            {from.email && <p style={{ color: COLORS.textSecondary, margin: 0 }}>{from.email}</p>}
          </div>
        )}

        {/* To on bottom */}
        <div>
          <h4 style={{ color: COLORS.brand, fontWeight: "bold", margin: 0 }}>To:</h4>
          <p style={{ fontWeight: "bold", margin: 0 }}>{to.name}</p>
          <p style={{ color: COLORS.textSecondary, whiteSpace: "pre-line", margin: 0 }}>{to.address}</p>
          <p style={{ color: COLORS.textSecondary, margin: 0 }}>{to.email}</p>
          <p style={{ color: COLORS.textSecondary, margin: 0 }}>{to.phone}</p>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Title section (INVOICE #INV-001)                                   */
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
    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", gap: "2px" }}>
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
/*  Items table                                                        */
/* ------------------------------------------------------------------ */
function ItemsTable({
  page,
  startIdx,
  isEmpty,
}: {
  page: PageSlice;
  startIdx: number;
  isEmpty: boolean;
}) {
  const thBase: React.CSSProperties = {
    textAlign: "center",
    paddingBottom: "6px",
    lineHeight: "1",
    verticalAlign: "middle",
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
            <th style={{ ...thBase, textAlign: "left" }}>Items</th>
            <th style={{ ...thBase, width: "70px" }}>Quantity</th>
            <th style={{ ...thBase, width: "60px" }}>Unit Price</th>
            <th style={{ ...thBase, width: "60px" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {page.items.length > 0
            ? page.items.map((item, i) => {
              const globalIdx = startIdx + i;
              return (
                <tr key={i} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  {/* Description */}
                  <td
                    style={{
                      textAlign: "left",
                      fontSize: FONT_SIZES.md,
                      padding: "7px 0",
                      wordBreak: "break-word",
                      minWidth: 0,
                    }}
                  >
                    <span style={{ fontWeight: 600, display: "block", margin: 0 }}>
                      {globalIdx + 1}. {item.name}
                    </span>
                    {item.note && (
                      <p
                        style={{
                          fontSize: FONT_SIZES.sm,
                          color: COLORS.textMuted,
                          margin: 0,
                          marginTop: "2px",
                          fontStyle: "italic",
                        }}
                      >
                        {item.note}
                      </p>
                    )}
                    {item.subItems && item.subItems.length > 0 && (
                      <ul style={{ margin: 0, marginTop: "2px", padding: 0, listStyle: "none" }}>
                        {item.subItems.map((sub, si) => (
                          <li
                            key={si}
                            style={{ fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, margin: 0 }}
                          >
                            - {sub}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>

                  {/* Quantity — NOTE: original renders unitPrice here (preserved) */}
                  <td
                    style={{
                      textAlign: "center",
                      padding: "7px 4px",
                      fontSize: FONT_SIZES.md,
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                      width: "70px",
                    }}
                  >
                    {item.unitPrice}
                  </td>

                  {/* Unit Price — NOTE: original renders quantity here (preserved) */}
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
                    {item.quantity}
                  </td>

                  {/* Amount */}
                  <td
                    style={{
                      textAlign: "center",
                      padding: "7px 4px",
                      fontSize: FONT_SIZES.md,
                      verticalAlign: "top",
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                      width: "90px",
                    }}
                  >
                    {(item.quantity * item.unitPrice).toFixed(2)}
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
                  No items added
                </td>
              </tr>
            )}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Totals rows                                                        */
/* ------------------------------------------------------------------ */
function TotalsSection({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", fontSize: FONT_SIZES.sm }}>
        {rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: FONT_SIZES.md,
              fontWeight: "bold",
              height: "32px",
              lineHeight: 1.2,
              borderTop: `1px solid ${COLORS.borderDark}`,
            }}
          >
            <h2
              style={{
                color: COLORS.pink,
                margin: 0,
                fontSize: FONT_SIZES.md,
                fontWeight: "bold",
                lineHeight: 1.2,
              }}
            >
              {row.label}
            </h2>
            <h2
              style={{
                margin: 0,
                fontSize: FONT_SIZES.md,
                fontWeight: "bold",
                lineHeight: 1.2,
              }}
            >
              {row.value}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Payment info block (for invoices)                                  */
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

  return (
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
        }}
      >
        <div>
          <h3 style={{ fontSize: FONT_SIZES.xl, fontWeight: "bold", margin: 0 }}>
            Payment Information:
          </h3>
        </div>
        <div style={{ textAlign: "left", fontSize: FONT_SIZES.sm }}>
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
  );
}

/* ------------------------------------------------------------------ */
/*  Notes block (for quotations)                                       */
/* ------------------------------------------------------------------ */
function NotesBlock({
  notes,
}: {
  notes?: { text?: string; points?: string[] };
}) {
  if (!notes?.text && !(notes?.points && notes.points.length > 0)) return null;

  return (
    <div
      style={{
        width: "100%",
        padding: "10px 16px",
        border: `1px solid ${COLORS.brand}`,
        backgroundColor: COLORS.brandDark,
        marginTop: "8px",
      }}
    >
      <h3
        style={{
          fontSize: FONT_SIZES.md,
          fontWeight: "bold",
          color: "white",
          margin: 0,
          marginBottom: "6px",
        }}
      >
        Notes:
      </h3>
      {notes?.text && (
        <p
          style={{
            fontSize: FONT_SIZES.sm,
            color: "white",
            margin: 0,
            marginBottom: notes?.points?.length ? "6px" : 0,
            whiteSpace: "pre-line",
          }}
        >
          {notes.text}
        </p>
      )}
      {notes?.points && notes.points.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {notes.points.map((pt, i) => (
            <li
              key={i}
              style={{ fontSize: FONT_SIZES.sm, color: "white", margin: 0, marginBottom: "2px" }}
            >
              • {pt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ data }, ref) => {
    const {
      invoiceNumber = "INV-001",
      name = "Invoice",
      description,
      logoUrl,
      type,
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
        currency: "$",
      },
      notes,
      items = [],
      vat = 0,
      discount = 0,
      advancePaid = 0,
    } = data;

    const isQuotation = type === "quotation";

    // Totals calculation — unchanged
    const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const vatAmount = ((subtotal - (discount ?? 0)) * (vat ?? 0)) / 100;
    const grandTotal = subtotal + vatAmount - (discount ?? 0) - (advancePaid ?? 0);
    const cur = paymentInfo.currency || "";

    const totalRows = [
      { label: "Sub-Total", value: `${subtotal.toFixed(2)} (${cur})` },
      ...((vat ?? 0) > 0
        ? [{ label: `VAT (${vat}%)`, value: `${vatAmount.toFixed(2)} (${cur})` }]
        : []),
      ...((discount ?? 0) > 0
        ? [{ label: "Discount (-)", value: `${Number(discount).toFixed(2)} (${cur})` }]
        : []),
      ...((advancePaid ?? 0) > 0
        ? [{ label: "Advance Paid (-)", value: `${Number(advancePaid).toFixed(2)} (${cur})` }]
        : []),
      { label: "Grand Total", value: `${Number(grandTotal).toFixed(2)} (${cur})` },
    ];

    const pages = buildPages(items);

    // Keeps item numbering continuous across paginated invoice pages.
    const startIndices = (() => {
      let offset = 0;
      return pages.map((p) => {
        const s = offset;
        offset += p.items.length;
        return s;
      });
    })();

    return (
      <div ref={ref} style={{ lineHeight: "normal" }}>
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

                <ItemsTable
                  page={page}
                  startIdx={startIndices[pageIdx]}
                  isEmpty={page.isLast && items.length === 0}
                />

                {page.isLast && (
                  <div style={{ marginTop: "8px" }}>
                    <TotalsSection rows={totalRows} />
                    <div style={{ width: "100%" }}>
                      {isQuotation ? (
                        <NotesBlock notes={notes} />
                      ) : (
                        <PaymentInfoBlock paymentInfo={paymentInfo} />
                      )}
                    </div>
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

InvoicePreview.displayName = "InvoicePreview";