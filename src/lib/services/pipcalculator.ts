// lib/services/pipCalculator.ts or app/components/ProfessionalPipCalculator.ts

type InstrumentSpec = {
  type: 'metal' | 'crypto' | 'commodity' | 'index' | 'forex';
  contractSize: number;
  pipSize: number;
  baseValue: number;
};

type PairType = 'direct' | 'indirect' | 'cross' | 'metal' | 'crypto' | 'commodity' | 'index';

/**
 * Professional Multi-Asset Pip Calculation Engine
 * Supports forex, precious metals, cryptocurrencies, commodities, and indices
 * Uses industry-standard formulas matching MetaTrader, OANDA, and institutional platforms
 */
class ProfessionalPipCalculator {
  private static readonly STANDARD_LOT = 100000;
  
  // Instrument specifications for different asset classes
  private static readonly INSTRUMENT_SPECS: Readonly<Record<string, InstrumentSpec>> = {
    // Precious Metals
    'XAU/USD': { type: 'metal', contractSize: 100, pipSize: 0.01, baseValue: 1.0 },
    'XAUUSD': { type: 'metal', contractSize: 100, pipSize: 0.01, baseValue: 1.0 },
    'XAG/USD': { type: 'metal', contractSize: 5000, pipSize: 0.001, baseValue: 5.0 },
    'XAGUSD': { type: 'metal', contractSize: 5000, pipSize: 0.001, baseValue: 5.0 },
    'XPT/USD': { type: 'metal', contractSize: 50, pipSize: 0.01, baseValue: 0.5 },
    'XPTUSD': { type: 'metal', contractSize: 50, pipSize: 0.01, baseValue: 0.5 },
    'XPD/USD': { type: 'metal', contractSize: 100, pipSize: 0.01, baseValue: 1.0 },
    'XPDUSD': { type: 'metal', contractSize: 100, pipSize: 0.01, baseValue: 1.0 },
    
    // Cryptocurrencies
    'BTC/USD': { type: 'crypto', contractSize: 1, pipSize: 0.01, baseValue: 0.01 },
    'BTCUSD': { type: 'crypto', contractSize: 1, pipSize: 0.01, baseValue: 0.01 },
    'ETH/USD': { type: 'crypto', contractSize: 1, pipSize: 0.01, baseValue: 0.01 },
    'ETHUSD': { type: 'crypto', contractSize: 1, pipSize: 0.01, baseValue: 0.01 },
    'LTC/USD': { type: 'crypto', contractSize: 1, pipSize: 0.01, baseValue: 0.01 },
    'LTCUSD': { type: 'crypto', contractSize: 1, pipSize: 0.01, baseValue: 0.01 },
    'XRP/USD': { type: 'crypto', contractSize: 1, pipSize: 0.0001, baseValue: 0.0001 },
    'XRPUSD': { type: 'crypto', contractSize: 1, pipSize: 0.0001, baseValue: 0.0001 },
    'ADA/USD': { type: 'crypto', contractSize: 1, pipSize: 0.0001, baseValue: 0.0001 },
    'ADAUSD': { type: 'crypto', contractSize: 1, pipSize: 0.0001, baseValue: 0.0001 },
    
    // Energy & Commodities
    'CL/USD': { type: 'commodity', contractSize: 1000, pipSize: 0.01, baseValue: 10 },
    'CRUSD': { type: 'commodity', contractSize: 1000, pipSize: 0.01, baseValue: 10 },
    'BRENT/USD': { type: 'commodity', contractSize: 1000, pipSize: 0.01, baseValue: 10 },
    'UKOIL': { type: 'commodity', contractSize: 1000, pipSize: 0.01, baseValue: 10 },
    'NG/USD': { type: 'commodity', contractSize: 10000, pipSize: 0.001, baseValue: 10 },
    'NGAS': { type: 'commodity', contractSize: 10000, pipSize: 0.001, baseValue: 10 },
    
    // Indices
    'SPX500': { type: 'index', contractSize: 1, pipSize: 0.1, baseValue: 0.1 },
    'US500': { type: 'index', contractSize: 1, pipSize: 0.1, baseValue: 0.1 },
    'NAS100': { type: 'index', contractSize: 1, pipSize: 0.25, baseValue: 0.25 },
    'US100': { type: 'index', contractSize: 1, pipSize: 0.25, baseValue: 0.25 },
    'GER40': { type: 'index', contractSize: 1, pipSize: 0.5, baseValue: 0.5 },
    'DE40': { type: 'index', contractSize: 1, pipSize: 0.5, baseValue: 0.5 },
    'UK100': { type: 'index', contractSize: 1, pipSize: 0.5, baseValue: 0.5 },
    'JPN225': { type: 'index', contractSize: 1, pipSize: 1, baseValue: 1 },
    'JP225': { type: 'index', contractSize: 1, pipSize: 1, baseValue: 1 },
  } as const;
  
  // Major currency exchange rates (in production, fetch from live API)
  private static readonly EXCHANGE_RATES: Readonly<Record<string, number>> = {
    'EUR/USD': 1.0850, 'EURUSD': 1.0850,
    'GBP/USD': 1.2650, 'GBPUSD': 1.2650,
    'AUD/USD': 0.6750, 'AUDUSD': 0.6750,
    'NZD/USD': 0.6150, 'NZDUSD': 0.6150,
    'USD/JPY': 149.50, 'USDJPY': 149.50,
    'USD/CAD': 1.3650, 'USDCAD': 1.3650,
    'USD/CHF': 0.8950, 'USDCHF': 0.8950,
    'EUR/GBP': 0.8580, 'EURGBP': 0.8580,
    'EUR/JPY': 162.25, 'EURJPY': 162.25,
    'GBP/JPY': 189.15, 'GBPJPY': 189.15,
    'AUD/JPY': 100.91, 'AUDJPY': 100.91,
    'EUR/CHF': 0.9720, 'EURCHF': 0.9720,
    'GBP/CHF': 1.1325, 'GBPCHF': 1.1325,
    'XAU/USD': 2045.50, 'XAUUSD': 2045.50,
    'XAG/USD': 24.15, 'XAGUSD': 24.15,
    'XPT/USD': 892.30, 'XPTUSD': 892.30,
    'XPD/USD': 1156.80, 'XPDUSD': 1156.80,
    'BTC/USD': 43250.00, 'BTCUSD': 43250.00,
    'ETH/USD': 2485.30, 'ETHUSD': 2485.30,
    'LTC/USD': 73.25, 'LTCUSD': 73.25,
    'XRP/USD': 0.6234, 'XRPUSD': 0.6234,
    'ADA/USD': 0.4892, 'ADAUSD': 0.4892,
    'CL/USD': 75.85, 'CRUSD': 75.85,
    'BRENT/USD': 80.20, 'UKOIL': 80.20,
    'NG/USD': 2.651, 'NGAS': 2.651,
    'SPX500': 4725.80, 'US500': 4725.80,
    'NAS100': 16845.30, 'US100': 16845.30,
    'GER40': 16380.50, 'DE40': 16380.50,
    'UK100': 7630.25,
    'JPN225': 33245.50, 'JP225': 33245.50
  } as const;

  private static readonly DEFAULT_FOREX_SPEC: InstrumentSpec = {
    type: 'forex',
    contractSize: this.STANDARD_LOT,
    pipSize: 0.0001,
    baseValue: 0.0001
  };

  private static readonly JPY_FOREX_SPEC: InstrumentSpec = {
    type: 'forex',
    contractSize: this.STANDARD_LOT,
    pipSize: 0.01,
    baseValue: 0.01
  };

  /**
   * Get instrument specification for any symbol
   */
  static getInstrumentSpec(symbol: string): InstrumentSpec {
    const pair = symbol.toUpperCase().replace(/\s/g, '');
    const spec = this.INSTRUMENT_SPECS[pair];
    if (spec) return spec;
    
    // Default forex handling for unknown pairs
    return pair.includes('JPY') ? this.JPY_FOREX_SPEC : this.DEFAULT_FOREX_SPEC;
  }

  /**
   * Get accurate pip/point size based on instrument type
   */
  static getPipSize(symbol: string): number {
    return this.getInstrumentSpec(symbol).pipSize;
  }

  /**
   * Determine instrument type and quote structure
   */
  static getPairType(symbol: string): PairType {
    const spec = this.getInstrumentSpec(symbol);
    if (spec.type !== 'forex') return spec.type;
    
    const pair = symbol.toUpperCase().replace(/\s/g, '');
    if (pair.endsWith('USD')) return 'direct';
    if (pair.startsWith('USD')) return 'indirect';
    return 'cross';
  }

  /**
   * Get current exchange rate (in production, fetch from live API)
   */
  static getExchangeRate(symbol: string): number {
    const pair = symbol.toUpperCase().replace(/\s/g, '');
    return this.EXCHANGE_RATES[pair] ?? 1.0;
  }

  /**
   * Get human-readable contract unit name
   */
  static getContractUnit(symbol: string): string {
    const spec = this.getInstrumentSpec(symbol);
    const pair = symbol.toUpperCase();
    
    switch (spec.type) {
      case 'metal':
        if (pair.includes('XAU')) return 'oz (gold)';
        if (pair.includes('XAG')) return 'oz (silver)';
        if (pair.includes('XPT')) return 'oz (platinum)';
        if (pair.includes('XPD')) return 'oz (palladium)';
        return 'oz';
      case 'crypto':
        if (pair.includes('BTC')) return 'BTC';
        if (pair.includes('ETH')) return 'ETH';
        if (pair.includes('LTC')) return 'LTC';
        if (pair.includes('XRP')) return 'XRP';
        if (pair.includes('ADA')) return 'ADA';
        return 'coins';
      case 'commodity':
        if (pair.includes('CL') || pair.includes('BRENT') || pair.includes('CRUDE')) return 'barrels';
        if (pair.includes('NG') || pair.includes('NGAS')) return 'MMBtu';
        return 'units';
      case 'index':
        return 'contracts';
      default:
        return 'currency units';
    }
  }

  /**
   * Calculate pip value for forex pairs using triangulation
   */
  private static calculateForexPipValue(
    pairType: PairType,
    spec: InstrumentSpec,
    currentRate: number,
    pair: string
  ): number {
    switch (pairType) {
      case 'direct':
        // Direct quote: USD is quote currency (EUR/USD, GBP/USD)
        return spec.pipSize * spec.contractSize;
        
      case 'indirect':
        // Indirect quote: USD is base currency (USD/JPY, USD/CAD)
        return (spec.pipSize / currentRate) * spec.contractSize;
        
      case 'cross':
        // Cross pair: no USD (EUR/GBP, GBP/JPY)
        return this.calculateCrossPairPipValue(pair, spec.pipSize);
        
      default:
        return 10; // Fallback
    }
  }

  /**
   * Calculate pip value per lot using professional formulas
   */
  static calculatePipValue(symbol: string, accountCurrency = 'USD'): number {
    const pair = symbol.toUpperCase().replace(/\s/g, '');
    const spec = this.getInstrumentSpec(pair);
    const pairType = this.getPairType(pair);
    const currentRate = this.getExchangeRate(pair);
    
    let pipValueUSD: number;
    
    switch (spec.type) {
      case 'metal':
        // Metals: simplified pip value for display
        pipValueUSD = 1.0;
        break;
        
      case 'crypto':
        // Crypto: pip value = pip size × contract size
        pipValueUSD = spec.pipSize * spec.contractSize;
        break;
        
      case 'commodity':
      case 'index':
        // Commodities & Indices: use base value
        pipValueUSD = spec.baseValue;
        break;
        
      case 'forex':
      default:
        // Forex: complex calculation based on quote structure
        pipValueUSD = this.calculateForexPipValue(pairType, spec, currentRate, pair);
        break;
    }
    
    return pipValueUSD;
  }

  /**
   * Calculate pip value for cross currency pairs using triangulation
   */
  private static calculateCrossPairPipValue(pair: string, pipSize: number): number {
    const quoteCurrency = pair.substring(4, 7);
    const quoteUSDPair = `${quoteCurrency}/USD`;
    const usdQuotePair = `USD/${quoteCurrency}`;
    
    const quoteUSDRate = this.EXCHANGE_RATES[quoteUSDPair];
    if (quoteUSDRate) return pipSize * this.STANDARD_LOT * quoteUSDRate;
    
    const usdQuoteRate = this.EXCHANGE_RATES[usdQuotePair];
    if (usdQuoteRate) return (pipSize * this.STANDARD_LOT) / usdQuoteRate;
    
    // Fallback approximations
    if (pair.includes('EUR')) return pipSize * this.STANDARD_LOT * 1.085;
    if (pair.includes('GBP')) return pipSize * this.STANDARD_LOT * 1.265;
    if (pair.includes('JPY')) return (pipSize * this.STANDARD_LOT) / 149.5;
    
    return 10;
  }

  /**
   * Convert price distance to pips/points
   */
  private static calculatePipsDistance(spec: InstrumentSpec, priceDistance: number): number {
    return priceDistance / spec.pipSize;
  }

  /**
   * Calculate risk amount with high precision
   * For metals: direct calculation (price move × lot size × contract size)
   * For others: pip-based calculation
   */
  static calculateRiskAmount(
    symbol: string,
    lotSize: number,
    entryPrice: number,
    stopLoss: number,
    accountCurrency = 'USD'
  ): number {
    if (lotSize <= 0 || entryPrice <= 0 || stopLoss <= 0) return 0;
    
    const spec = this.getInstrumentSpec(symbol);
    const priceDistance = Math.abs(entryPrice - stopLoss);
    
    // Special handling for metals - direct price-based calculation
    if (spec.type === 'metal') {
      return priceDistance * lotSize * spec.contractSize;
    }
    
    // Standard pip-based calculation for forex, crypto, commodities, indices
    const pipValue = this.calculatePipValue(symbol, accountCurrency);
    const pipsDistance = this.calculatePipsDistance(spec, priceDistance);
    
    return lotSize * pipsDistance * pipValue;
  }

  /**
   * Calculate potential profit with high precision
   * For metals: direct calculation (price move × lot size × contract size)
   * For others: pip-based calculation
   */
  static calculatePotentialProfit(
    symbol: string,
    lotSize: number,
    entryPrice: number,
    takeProfit: number,
    accountCurrency = 'USD'
  ): number {
    if (lotSize <= 0 || entryPrice <= 0 || takeProfit <= 0) return 0;
    
    const spec = this.getInstrumentSpec(symbol);
    const priceDistance = Math.abs(entryPrice - takeProfit);
    
    // Special handling for metals - direct price-based calculation
    if (spec.type === 'metal') {
      return priceDistance * lotSize * spec.contractSize;
    }
    
    // Standard pip-based calculation for forex, crypto, commodities, indices
    const pipValue = this.calculatePipValue(symbol, accountCurrency);
    const pipsDistance = this.calculatePipsDistance(spec, priceDistance);
    
    return lotSize * pipsDistance * pipValue;
  }

  /**
   * Calculate suggested lot size based on risk percentage
   * Returns the lot size that would risk the specified percentage of account balance
   */
  static calculateSuggestedLotSize(
    symbol: string,
    entryPrice: number,
    stopLoss: number,
    accountBalance: number,
    riskPercentage: number,
    accountCurrency = 'USD'
  ): number {
    if (!entryPrice || !stopLoss || !accountBalance || riskPercentage <= 0) return 0;

    const targetRiskAmount = accountBalance * (riskPercentage / 100);
    const pipSize = this.getPipSize(symbol);
    const pipValue = this.calculatePipValue(symbol, accountCurrency);
    
    const stopLossDistance = Math.abs(entryPrice - stopLoss);
    if (stopLossDistance <= 0) return 0;

    const pipsDistance = stopLossDistance / pipSize;
    const pipRisk = pipsDistance * pipValue;
    
    if (pipRisk <= 0) return 0;
    
    const suggestedLots = targetRiskAmount / pipRisk;
    return Math.round(suggestedLots * 100) / 100; // Round to 2 decimals
  }

  /**
   * Calculate risk percentage from a given lot size
   * Useful for validating if a manually entered lot size is within risk limits
   */
  static calculateRiskPercentageFromLotSize(
    symbol: string,
    lotSize: number,
    entryPrice: number,
    stopLoss: number,
    accountBalance: number,
    accountCurrency = 'USD'
  ): number {
    if (lotSize <= 0 || !entryPrice || !stopLoss || !accountBalance) return 0;

    const riskAmount = this.calculateRiskAmount(symbol, lotSize, entryPrice, stopLoss, accountCurrency);
    const riskPercentage = (riskAmount / accountBalance) * 100;
    
    return Math.round(riskPercentage * 100) / 100; // Round to 2 decimals
  }

  /**
   * Validate if lot size is within acceptable risk limits
   * Returns validation result with actual risk vs maximum allowed risk
   */
  static isLotSizeWithinRiskLimit(
    symbol: string,
    lotSize: number,
    entryPrice: number,
    stopLoss: number,
    accountBalance: number,
    maxRiskPercentage: number,
    accountCurrency = 'USD'
  ): { valid: boolean; actualRisk: number; maxRisk: number } {
    const actualRiskPercentage = this.calculateRiskPercentageFromLotSize(
      symbol,
      lotSize,
      entryPrice,
      stopLoss,
      accountBalance,
      accountCurrency
    );

    return {
      valid: actualRiskPercentage <= maxRiskPercentage,
      actualRisk: actualRiskPercentage,
      maxRisk: maxRiskPercentage
    };
  }
}

export { ProfessionalPipCalculator };
export type { InstrumentSpec, PairType };