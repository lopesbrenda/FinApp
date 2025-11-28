const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'BRL', 'GBP'];
const BASE_CURRENCY = 'EUR';
const FRANKFURTER_API = 'https://api.frankfurter.app';

let ratesCache = {
  rates: null,
  date: null,
  timestamp: null
};

const CACHE_DURATION = 60 * 60 * 1000;

export function getSupportedCurrencies() {
  return SUPPORTED_CURRENCIES;
}

export function getBaseCurrency() {
  return BASE_CURRENCY;
}

export function isSupportedCurrency(currency) {
  return SUPPORTED_CURRENCIES.includes(currency?.toUpperCase());
}

export async function fetchLatestRates(baseCurrency = BASE_CURRENCY) {
  const now = Date.now();
  
  if (ratesCache.rates && ratesCache.timestamp && (now - ratesCache.timestamp) < CACHE_DURATION) {
    console.log('💱 Using cached exchange rates from', ratesCache.date);
    return ratesCache;
  }
  
  try {
    const currencies = SUPPORTED_CURRENCIES.filter(c => c !== baseCurrency).join(',');
    const response = await fetch(`${FRANKFURTER_API}/latest?from=${baseCurrency}&to=${currencies}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    ratesCache = {
      rates: { [baseCurrency]: 1, ...data.rates },
      date: data.date,
      timestamp: now,
      base: baseCurrency
    };
    
    console.log('💱 Fetched fresh exchange rates:', ratesCache.rates, 'Date:', ratesCache.date);
    return ratesCache;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    if (ratesCache.rates) {
      console.warn('💱 Using stale cached rates');
      return ratesCache;
    }
    
    return {
      rates: { EUR: 1, USD: 1.05, BRL: 6.10, GBP: 0.84 },
      date: new Date().toISOString().split('T')[0],
      timestamp: now,
      base: BASE_CURRENCY,
      fallback: true
    };
  }
}

export async function convertCurrency(amount, fromCurrency, toCurrency = BASE_CURRENCY) {
  if (!isSupportedCurrency(fromCurrency) || !isSupportedCurrency(toCurrency)) {
    throw new Error(`Unsupported currency: ${fromCurrency} or ${toCurrency}`);
  }
  
  fromCurrency = fromCurrency.toUpperCase();
  toCurrency = toCurrency.toUpperCase();
  
  if (fromCurrency === toCurrency) {
    return {
      originalAmount: amount,
      convertedAmount: amount,
      fromCurrency,
      toCurrency,
      exchangeRate: 1,
      rateDate: new Date().toISOString().split('T')[0]
    };
  }
  
  const { rates, date } = await fetchLatestRates(BASE_CURRENCY);
  
  let amountInBase;
  if (fromCurrency === BASE_CURRENCY) {
    amountInBase = amount;
  } else {
    amountInBase = amount / rates[fromCurrency];
  }
  
  let convertedAmount;
  let exchangeRate;
  
  if (toCurrency === BASE_CURRENCY) {
    convertedAmount = amountInBase;
    exchangeRate = 1 / rates[fromCurrency];
  } else {
    convertedAmount = amountInBase * rates[toCurrency];
    exchangeRate = rates[toCurrency] / rates[fromCurrency];
  }
  
  return {
    originalAmount: amount,
    convertedAmount: Math.round(convertedAmount * 100) / 100,
    fromCurrency,
    toCurrency,
    exchangeRate: Math.round(exchangeRate * 10000) / 10000,
    rateDate: date
  };
}

export async function convertToBaseCurrency(amount, fromCurrency) {
  return convertCurrency(amount, fromCurrency, BASE_CURRENCY);
}

export function validateAmount(value) {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: 'Amount is required' };
  }
  
  const stringValue = String(value).trim();
  
  if (!/^-?\d+([.,]\d{1,2})?$/.test(stringValue)) {
    if (/[.,].*[.,]/.test(stringValue)) {
      return { valid: false, error: 'Multiple decimal separators not allowed' };
    }
    if (/[.,]\d{3,}$/.test(stringValue)) {
      return { valid: false, error: 'Maximum 2 decimal places allowed' };
    }
    if (/[^0-9.,-]/.test(stringValue)) {
      return { valid: false, error: 'Invalid characters in amount' };
    }
    return { valid: false, error: 'Invalid amount format' };
  }
  
  const normalizedValue = stringValue.replace(',', '.');
  const numericValue = parseFloat(normalizedValue);
  
  if (isNaN(numericValue)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }
  
  if (numericValue < 0) {
    return { valid: false, error: 'Amount cannot be negative' };
  }
  
  if (numericValue > 999999999.99) {
    return { valid: false, error: 'Amount exceeds maximum limit' };
  }
  
  if (numericValue === 0) {
    return { valid: false, error: 'Amount must be greater than zero' };
  }
  
  return {
    valid: true,
    value: Math.round(numericValue * 100) / 100
  };
}

export function formatCurrency(amount, currency = BASE_CURRENCY, locale = 'en-IE') {
  const symbols = {
    EUR: '€',
    USD: '$',
    BRL: 'R$',
    GBP: '£'
  };
  
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  
  return `${symbols[currency] || currency} ${formatted}`;
}

export function getCurrencySymbol(currency) {
  const symbols = {
    EUR: '€',
    USD: '$',
    BRL: 'R$',
    GBP: '£'
  };
  return symbols[currency?.toUpperCase()] || currency;
}

export async function getExchangeRateDisplay(fromCurrency, toCurrency = BASE_CURRENCY) {
  if (fromCurrency === toCurrency) {
    return null;
  }
  
  const result = await convertCurrency(1, fromCurrency, toCurrency);
  return `1 ${fromCurrency} = ${result.convertedAmount.toFixed(4)} ${toCurrency}`;
}
