type InstrumentSpec = {
  type: 'metal' | 'crypto' | 'commodity' | 'index' | 'forex';
  contractSize: number;
  pipSize: number;
  baseValue: number;
};

type PairType = 'direct' | 'indirect' | 'cross' | 'metal' | 'crypto' | 'commodity' | 'index';

// Professional Multi-Asset Pip Calculation Engine
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
    'XPD/USD': { type: 'metal', contractSize: 100, pipSize: 0.01, baseValue: 1.0 },
    
    // Cryptocurrencies
    'BTC/USD': { type: 'crypto', contractSize: 1, pipSize: 0.01, baseValue: 0.01 },
    'ETH/USD': { type: 'crypto', contractSize: 1, pipSize: 0.01, baseValue: 0.01 },
    'LTC/USD': { type: 'crypto', contractSize: 1, pipSize: 0.01, baseValue: 0.01 },
    'XRP/USD': { type: 'crypto', contractSize: 1, pipSize: 0.0001, baseValue: 0.0001 },
    'ADA/USD': { type: 'crypto', contractSize: 1, pipSize: 0.0001, baseValue: 0.0001 },
    
    // Energy
    'CL/USD': { type: 'commodity', contractSize: 1000, pipSize: 0.01, baseValue: 10 },
    'BRENT/USD': { type: 'commodity', contractSize: 1000, pipSize: 0.01, baseValue: 10 },
    'NG/USD': { type: 'commodity', contractSize: 10000, pipSize: 0.001, baseValue: 10 },
    
    // Indices
    'SPX500': { type: 'index', contractSize: 1, pipSize: 0.1, baseValue: 0.1 },
    'NAS100': { type: 'index', contractSize: 1, pipSize: 0.25, baseValue: 0.25 },
    'GER40': { type: 'index', contractSize: 1, pipSize: 0.5, baseValue: 0.5 },
    'UK100': { type: 'index', contractSize: 1, pipSize: 0.5, baseValue: 0.5 },
    'JPN225': { type: 'index', contractSize: 1, pipSize: 1, baseValue: 1 },
  } as const;
  
  // Major currency exchange rates
  private static readonly EXCHANGE_RATES: Readonly<Record<string, number>> = {
    'EUR/USD': 1.0850,
    'GBP/USD': 1.2650,
    'AUD/USD': 0.6750,
    'NZD/USD': 0.6150,
    'USD/JPY': 149.50,
    'USD/CAD': 1.3650,
    'USD/CHF': 0.8950,
    'EUR/GBP': 0.8580,
    'EUR/JPY': 162.25,
    'GBP/JPY': 189.15,
    'AUD/JPY': 100.91,
    'EUR/CHF': 0.9720,
    'GBP/CHF': 1.1325,
    'XAU/USD': 2045.50,
    'XAG/USD': 24.15,
    'XPT/USD': 892.30,
    'XPD/USD': 1156.80,
    'BTC/USD': 43250.00,
    'ETH/USD': 2485.30,
    'LTC/USD': 73.25,
    'XRP/USD': 0.6234,
    'ADA/USD': 0.4892,
    'CL/USD': 75.85,
    'BRENT/USD': 80.20,
    'NG/USD': 2.651,
    'SPX500': 4725.80,
    'NAS100': 16845.30,
    'GER40': 16380.50,
    'UK100': 7630.25,
    'JPN225': 33245.50
  } as const;

  // Default forex spec
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
   * Get instrument specification
   */
  static getInstrumentSpec(symbol: string): InstrumentSpec {
    const pair = symbol.toUpperCase();
    
    // Check if it's a predefined instrument
    const spec = this.INSTRUMENT_SPECS[pair];
    if (spec) return spec;
    
    // Default forex handling
    return pair.includes('JPY') ? this.JPY_FOREX_SPEC : this.DEFAULT_FOREX_SPEC;
  }

  /**
   * Get accurate pip size based on instrument type
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
    
    const pair = symbol.toUpperCase();
    
    if (pair.endsWith('USD')) return 'direct';
    if (pair.startsWith('USD')) return 'indirect';
    
    return 'cross';
  }

  /**
   * Get current exchange rate
   */
  static getExchangeRate(symbol: string): number {
    return this.EXCHANGE_RATES[symbol.toUpperCase()] ?? 1.0;
  }

  /**
   * Calculate pip value for forex pairs
   */
  private static calculateForexPipValue(
    pairType: PairType,
    spec: InstrumentSpec,
    currentRate: number,
    pair: string
  ): number {
    switch (pairType) {
      case 'direct':
        return spec.pipSize * spec.contractSize;
        
      case 'indirect':
        return (spec.pipSize / currentRate) * spec.contractSize;
        
      case 'cross':
        return this.calculateCrossPairPipValue(pair, spec.pipSize);
        
      default:
        return 10;
    }
  }

  /**
   * Calculate pip value per lot using professional formulas for all asset classes
   */
  static calculatePipValue(symbol: string, accountCurrency = 'USD'): number {
    const pair = symbol.toUpperCase();
    const spec = this.getInstrumentSpec(pair);
    const pairType = this.getPairType(pair);
    const currentRate = this.getExchangeRate(pair);
    
    let pipValueUSD: number;
    
    switch (spec.type) {
      case 'metal':
        pipValueUSD = 1.0;
        break;
        
      case 'crypto':
        pipValueUSD = spec.pipSize * spec.contractSize;
        break;
        
      case 'commodity':
      case 'index':
        pipValueUSD = spec.baseValue;
        break;
        
      case 'forex':
      default:
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
    if (quoteUSDRate) {
      return pipSize * this.STANDARD_LOT * quoteUSDRate;
    }
    
    const usdQuoteRate = this.EXCHANGE_RATES[usdQuotePair];
    if (usdQuoteRate) {
      return (pipSize * this.STANDARD_LOT) / usdQuoteRate;
    }
    
    // Fallback estimates
    if (pair.includes('EUR')) return pipSize * this.STANDARD_LOT * 1.085;
    if (pair.includes('GBP')) return pipSize * this.STANDARD_LOT * 1.265;
    if (pair.includes('JPY')) return (pipSize * this.STANDARD_LOT) / 149.5;
    
    return 10;
  }

  /**
   * Calculate price distance in pips
   */
  private static calculatePipsDistance(
    spec: InstrumentSpec,
    priceDistance: number
  ): number {
    return priceDistance / spec.pipSize;
  }

  /**
   * Calculate risk amount with high precision
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
    
    if (spec.type === 'metal') {
      return priceDistance * lotSize * spec.contractSize;
    }
    
    const pipValue = this.calculatePipValue(symbol, accountCurrency);
    const pipsDistance = this.calculatePipsDistance(spec, priceDistance);
    
    return lotSize * pipsDistance * pipValue;
  }

  /**
   * Calculate potential profit with high precision
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
    
    if (spec.type === 'metal') {
      return priceDistance * lotSize * spec.contractSize;
    }
    
    const pipValue = this.calculatePipValue(symbol, accountCurrency);
    const pipsDistance = this.calculatePipsDistance(spec, priceDistance);
    
    return lotSize * pipsDistance * pipValue;
  }

  /**
   * Calculate suggested lot size based on risk percentage
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
    return Math.round(suggestedLots * 100) / 100;
  }

  /**
   * Calculate risk percentage from user-entered lot size
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
    
    return Math.round(riskPercentage * 100) / 100;
  }

  /**
   * Validate if lot size is within acceptable risk limits
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