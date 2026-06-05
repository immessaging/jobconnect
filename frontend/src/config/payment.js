// ============================================
// JOBCONNECT PAYMENT CONFIGURATION
// ============================================
// ⚠️  NEVER commit real account details to GitHub!
// ⚠️  Use environment variables in production
// ⚠️  See .env.example for required variables
// ============================================

const getCompanyAccount = () => {
  return {
    bankName: process.env.REACT_APP_COMPANY_BANK_NAME || 'Access Bank',
    accountNumber: process.env.REACT_APP_COMPANY_ACCOUNT_NUMBER || '0000000000',
    accountName: process.env.REACT_APP_COMPANY_ACCOUNT_NAME || 'Company Escrow Account',
    ussdCode: process.env.REACT_APP_COMPANY_USSD_CODE || '*901#',
  };
};

// Nigerian Banks List
export const NIGERIAN_BANKS = [
  'Access Bank', 'GTBank', 'First Bank', 'UBA', 'Zenith Bank',
  'Fidelity Bank', 'Stanbic IBTC', 'Union Bank', 'Polaris Bank',
  'Ecobank', 'Wema Bank', 'Heritage Bank', 'Keystone Bank',
  'Sterling Bank', 'Unity Bank', 'Jaiz Bank', 'Titan Trust Bank'
];

// USSD Codes
export const USSD_CODES = {
  'Access Bank': '*901#',
  'GTBank': '*737#',
  'First Bank': '*894#',
  'UBA': '*919#',
  'Zenith Bank': '*966#',
  'Fidelity Bank': '*770#',
  'Stanbic IBTC': '*909#',
  'Union Bank': '*826#',
  'Polaris Bank': '*833#',
  'Ecobank': '*326#',
  'Wema Bank': '*945#',
};

export default getCompanyAccount;