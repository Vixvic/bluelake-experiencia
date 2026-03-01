import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Season = 'winter' | 'summer';

interface SeasonalContextType {
  activeSeason: Season;
  selectedSeason: Season;
  setSelectedSeason: (s: Season) => void;
  isAutoMode: boolean;
}

const SeasonalContext = createContext<SeasonalContextType>({
  activeSeason: 'winter',
  selectedSeason: 'winter',
  setSelectedSeason: () => {},
  isAutoMode: true,
});

export const useSeasonalContext = () => useContext(SeasonalContext);

function getAutoSeason(): Season {
  const month = new Date().getMonth() + 1; // 1-12
  // Dic(12)-Jun(6) = Invierno, Jul(7)-Nov(11) = Verano
  return (month >= 7 && month <= 11) ? 'summer' : 'winter';
}

export const SeasonalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const autoSeason = getAutoSeason();
  const [activeSeason, setActiveSeason] = useState<Season>(autoSeason);
  const [selectedSeason, setSelectedSeason] = useState<Season>(autoSeason);
  const [isAutoMode, setIsAutoMode] = useState(true);

  useEffect(() => {
    // Cargar config desde DB
    supabase
      .from('seasonal_config')
      .select('*')
      .single()
      .then(({ data }) => {
        if (data) {
          const isAuto = data.mode === 'auto';
          setIsAutoMode(isAuto);
          const season = isAuto ? autoSeason : (data.current_season as Season);
          setActiveSeason(season);
          setSelectedSeason(season);
        }
      });
  }, []);

  return (
    <SeasonalContext.Provider value={{ activeSeason, selectedSeason, setSelectedSeason, isAutoMode }}>
      {children}
    </SeasonalContext.Provider>
  );
};
