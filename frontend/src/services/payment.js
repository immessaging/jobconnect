// src/config/payment.js
// Load from environment variables in production
// NEVER commit real account details!

const getCompanyAccount = () => {
  // In development, you can set these in .env.local (gitignored)
  return {
    bankName: process.env.REACT_APP_COMPANY_BANK_NAME || 'Access Bank',
    accountNumber: process.env.REACT_APP_COMPANY_ACCOUNT_NUMBER || '0000000000',
    accountName: process.env.REACT_APP_COMPANY_ACCOUNT_NAME || 'Company Escrow Account',
    ussdCode: process.env.REACT_APP_COMPANY_USSD_CODE || '*901#',
  };
};

export default getCompanyAccount;