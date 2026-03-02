import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import i18n from '@/i18n';

type Currency = 'PEN' | 'USD';

interface CurrencyContextType {
    currency: Currency;
    toggleCurrency: () => void;
    setCurrency: (c: Currency) => void;
    formatPrice: (amountInPEN: number) => string;
    exchangeRate: number; // PEN to USD rate
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
    const ctx = useContext(CurrencyContext);
    if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
    return ctx;
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Default currency based on language
    const [currency, setCurrency] = useState<Currency>(i18n.language === 'en' ? 'USD' : 'PEN');
    const [exchangeRate, setExchangeRate] = useState<number>(0.2703); // fallback

    // Fetch exchange rate from Supabase
    useEffect(() => {
        (supabase.from as any)('exchange_rates')
            .select('rate')
            .eq('currency_pair', 'PEN_USD')
            .single()
            .then(({ data }: { data: any }) => {
                if (data?.rate) {
                    setExchangeRate(Number(data.rate));
                }
            });
    }, []);

    // Sync currency with language changes
    useEffect(() => {
        const handleLangChange = (lng: string) => {
            setCurrency(lng === 'en' ? 'USD' : 'PEN');
        };
        i18n.on('languageChanged', handleLangChange);
        return () => { i18n.off('languageChanged', handleLangChange); };
    }, []);

    const toggleCurrency = useCallback(() => {
        setCurrency(prev => prev === 'PEN' ? 'USD' : 'PEN');
    }, []);

    const formatPrice = useCallback((amountInPEN: number): string => {
        if (currency === 'PEN') {
            return `S/ ${amountInPEN.toFixed(0)}`;
        }
        const usd = amountInPEN * exchangeRate;
        return `$ ${usd.toFixed(2)}`;
    }, [currency, exchangeRate]);

    return (
        <CurrencyContext.Provider value={{ currency, toggleCurrency, setCurrency, formatPrice, exchangeRate }}>
            {children}
        </CurrencyContext.Provider>
    );
};
