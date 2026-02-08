import { getPriceAreaFromPostalCode } from './postal-to-area';

/** Rörligt avtal: påslag, månadskostnad och total från prisfil (t.ex. variable_hourly_rate[area][0].no_commitment) */
export interface VariableRateNoCommitment {
  surcharge?: number;           // öre/kWh
  variable_costs?: number;     // öre/kWh
  el_certificate_fee?: number; // öre/kWh
  '12_month_discount'?: number; // öre/kWh rabatt
  /** Visat påslag = surcharge + variable_costs + el_certificate_fee - 12_month_discount */
  price?: number;              // spot
  total?: number;
  total_with_vat?: number;     // öre/kWh inkl. moms
  monthly_fee?: number;        // kr/månad
}

export interface CheapEnergyPrices {
  variable_fixed_prices: {
    [key: string]: {
      '3_months': number | { price?: number; total?: number; total_with_vat?: number };
      '6_months': number | { price?: number; total?: number; total_with_vat?: number };
      '9_months': number | { price?: number; total?: number; total_with_vat?: number };
      '1_year': number | { price?: number; total?: number; total_with_vat?: number };
      '2_years': number | { price?: number; total?: number; total_with_vat?: number };
      '3_years': number | { price?: number; total?: number; total_with_vat?: number };
      '4_years': number | { price?: number; total?: number; total_with_vat?: number };
      '5_years': number | { price?: number; total?: number; total_with_vat?: number };
      '6_years': number | { price?: number; total?: number; total_with_vat?: number };
      '7_years': number | { price?: number; total?: number; total_with_vat?: number };
      '8_years': number | { price?: number; total?: number; total_with_vat?: number };
      '9_years': number | { price?: number; total?: number; total_with_vat?: number };
      '10_years': number | { price?: number; total?: number; total_with_vat?: number };
    };
  };
  spot_prices: {
    [key: string]: number;
  };
  fixed_fees: {
    all_customers: number;
    all_customers_discount?: number;
    green_electricity: number;
  };
  /** Rörligt avtal per område – påslag finns här (Stockholms Elbolag / prisfilen) */
  variable_hourly_rate?: {
    [area: string]: Array<{ no_commitment?: VariableRateNoCommitment }>;
  };
  variable_monthly_rate?: {
    [area: string]: Array<{ no_commitment?: VariableRateNoCommitment }>;
  };
}

export type ElectricityArea = 'se1' | 'se2' | 'se3' | 'se4';

// New types for customer reminder system
export interface CustomerReminder {
  id?: number;
  customer_name: string;
  email: string;
  phone?: string;
  contract_type: '12_months' | '24_months' | '36_months' | 'variable';
  contract_start_date: string; // ISO date string
  reminder_date: string; // ISO date string (11 months before expiry)
  is_sent: boolean;
  created_at?: string;
  updated_at?: string;
  notes?: string;
}

export interface PendingReminder {
  id: number;
  customer_name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  created_at?: string;
}

export interface ContactFormData {
  name?: string;
  email: string;
  phone?: string;
  subscribeNewsletter: boolean;
  message?: string;
  contractType?: '12_months' | '24_months' | '36_months' | 'variable';
  contractStartDate?: string;
}

// Mapping av postnummer till elområden
export const getElectricityArea = (postalCode: string): ElectricityArea => {
  try {
    const area = getPriceAreaFromPostalCode(postalCode);
    if (area === 'se1' || area === 'se2' || area === 'se3' || area === 'se4') {
      return area;
    }
  } catch {
    // Ignorera och fall tillbaka på prefix-logik nedan
  }

  // Fallback: grov prefix-logik om exportfilen saknas eller postnumret inte finns
  const prefix = postalCode.substring(0, 2);
  const prefixNum = parseInt(prefix, 10);

  if (Number.isNaN(prefixNum)) return 'se3';
  if (prefixNum >= 98) return 'se1';
  if (prefixNum >= 85 && prefixNum <= 97) return 'se2';
  if (prefixNum >= 62 && prefixNum <= 84) return 'se3';
  return 'se4';
}; 