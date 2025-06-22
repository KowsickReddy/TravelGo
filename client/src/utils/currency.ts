
export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '₹0';
  }

  // Format in Indian numbering system (lakhs, crores)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

export function parseCurrency(currencyString: string): number {
  // Remove currency symbol and spaces, parse number
  const cleaned = currencyString.replace(/[₹,\s]/g, '');
  return parseFloat(cleaned) || 0;
}

// Convert any currency to INR format
export function convertToINR(amount: number, fromCurrency = 'USD'): number {
  // In a real app, you'd use a currency conversion API
  // For now, using approximate conversion rates
  const conversionRates: { [key: string]: number } = {
    USD: 83.0, // 1 USD = 83 INR (approximate)
    EUR: 90.0, // 1 EUR = 90 INR (approximate)
    GBP: 105.0, // 1 GBP = 105 INR (approximate)
    INR: 1.0,
  };

  return amount * (conversionRates[fromCurrency] || 1);
}

// Format for display in components
export function displayPrice(amount: number | string): string {
  return formatCurrency(amount);
}

// Format with prefix for better readability
export function formatPriceRange(min: number, max: number): string {
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
}
