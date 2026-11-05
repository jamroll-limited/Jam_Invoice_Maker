export type ClientData = {
  _id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;

  // NEW — Your Company (From) block (the issuer's company info)
  from?: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };

  // NEW — Bank / payment details block
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  branch?: string;
  swift?: string;
  routingNumber?: string;

  createdAt?: string;
};