import { getPriceAreaFromPostalCode } from './postal-to-area';

export interface CheapEnergyPrices {
  variable_fixed_prices: {
    [key: string]: {
      '3_months': number;
      '6_months': number;
      '1_year': number;
      '2_years': number;
      '3_years': number;
      '4_years': number;
      '5_years': number;
      '10_years': number;
    };
  };
  spot_prices: {
    [key: string]: number;
  };
  fixed_fees: {
    all_customers: number;
    all_customers_discount: number;
    green_electricity: number;
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