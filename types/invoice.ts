export type InvoiceItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  note?: string;
  subItems?: string[];
};

export type ReceiptLineItem = {
  invoiceNo: string;
  description: string;
  amount: number;
};

export type ReceiptInfo = {
  currency: string;
  showInvoiceNo: boolean;
  lineItems: ReceiptLineItem[];
  paidAmount: number;
  receivedAmount: number;
  paymentMethod: "cash" | "cheque" | "accountTransfer" | "";
  accountTransferName: string;
  note?: string;
  receivedBy: {
    name: string;
    designation: string;
    companyName: string;
    address: string;
    mobile: string;
  };
};

export type ServiceItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  note?: string;
  subItems?: string[];
};

export type ServiceGroup = {
  serviceName: string;
  items: ServiceItem[];
};

export type InvoiceFormData = {
  invoiceNumber: string;
  name: string;
  description?: string;
  type: "invoice" | "serviceInvoice" | "quotation" | "receipt";
  logoUrl?: string;

  from: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };

  to: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };

  date: Date;
  dueDate: Date;

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

  items: InvoiceItem[];

  vat: number;
  discount: number;
  advancePaid: number;
  total: number;

  notes?: {
    text: string;
    points: string[];
  };

  receiptInfo?: ReceiptInfo;

  status: "Paid" | "Unpaid" | "Hold" | "Cancelled";
};

export type ServiceInvoiceFormData = {
  invoiceNumber: string;
  name: string;
  description?: string;
  type: "serviceInvoice";
  logoUrl?: string;

  from: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };

  to: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };

  date: Date;
  dueDate: Date;

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

  services: ServiceGroup[];

  vat: number;
  discount: number;
  advancePaid: number;
  total: number;

  status: "Paid" | "Unpaid" | "Hold" | "Cancelled";
};