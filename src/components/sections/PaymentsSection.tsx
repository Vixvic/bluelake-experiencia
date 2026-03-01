import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Banknote, CreditCard, Percent } from 'lucide-react';

const PaymentsSection: React.FC = () => {
  const { t } = useTranslation();

  const methods = [
    {
      icon: Banknote,
      key: 'transfer',
      color: 'text-jungle',
      bg: 'bg-jungle/10',
      highlight: false,
    },
    {
      icon: CreditCard,
      key: 'card',
      color: 'text-primary',
      bg: 'bg-primary/10',
      highlight: true,
    },
    {
      icon: Percent,
      key: 'partial',
      color: 'text-accent-orange',
      bg: 'bg-accent-orange/10',
      highlight: false,
    },
  ];

  return (
    <section className="section-padding bg-secondary/30">
      <div className="container-bluelake">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t('payments.title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('payments.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {methods.map(({ icon: Icon, key, color, bg, highlight }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 rounded-2xl border-2 text-center transition-all ${
                highlight
                  ? 'border-primary bg-primary/5 shadow-bluelake'
                  : 'border-border bg-card hover:border-primary/30 hover:shadow-md'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl ${bg} flex items-center justify-center mx-auto mb-5`}>
                <Icon className={`w-8 h-8 ${color}`} />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-2">
                {t(`payments.${key}.title`)}
              </h3>
              <div className={`text-2xl font-bold ${color} mb-3`}>
                {t(`payments.${key}.fee`)}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(`payments.${key}.desc`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PaymentsSection;
