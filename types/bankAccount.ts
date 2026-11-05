export type BankAccountData = {
  _id: string;
  label: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  branch: string;
  swift: string;
  routingNumber: string;
  currency: string;
  note?: string;
  createdAt?: string;
};