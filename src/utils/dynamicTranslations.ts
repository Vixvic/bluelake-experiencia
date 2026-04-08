export const getDynamicTranslation = (text: string, language: string): string => {
  if (language === 'es') return text;
  
  const translationsEn: Record<string, string> = {
    // Included Items
    'Movilidad': 'Transport',
    'Guía turístico': 'Tour guide',
    'Ticket de Ingreso': 'Entrance ticket',
    'Transporte fluvial': 'River transport',
    'Almuerzo': 'Lunch',
    'Desayuno': 'Breakfast',
    'Cena': 'Dinner',
    'Botiquín de primeros auxilios': 'First aid kit',
    'Equipos de seguridad': 'Safety equipment',
    
    // Payment Methods
    'Transferencia': 'Bank Transfer',
    'Tarjeta (+6%)': 'Card (+6%)',
    'Yape': 'Yape',
    'Plin': 'Plin',
    
    // Specific Itinerary Items (from screenshot)
    'Recojo del Hotel y traslado al puerto de Bellavista Nanay': 'Hotel pick-up and transfer to Bellavista Nanay port',
    'Viaje por el Río Nanay': 'Trip along the Nanay River',
    'Llegada al Mariposario Pilpintuwasi (metamorfosis de las mariposas, jaguar, aves, monos)': 'Arrival at Pilpintuwasi Butterfly Farm (butterfly metamorphosis, jaguar, birds, monkeys)'
  };

  return translationsEn[text] || text;
};
