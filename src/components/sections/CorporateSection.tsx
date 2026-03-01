import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Loader2, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const schema = z.object({
  company_name: z.string().min(2),
  contact_person: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  group_size: z.coerce.number().min(1).optional(),
  requested_dates: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const CorporateSection: React.FC = () => {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    const { error: err } = await supabase.from('corporate_requests').insert({
      company_name: data.company_name,
      contact_person: data.contact_person,
      email: data.email,
      phone: data.phone || null,
      group_size: data.group_size || null,
      requested_dates: data.requested_dates || null,
      notes: data.notes || null,
    });
    if (err) {
      setError(t('corporate.form.error'));
    } else {
      setSubmitted(true);
      reset();
    }
  };

  return (
    <section id="contacto" className="section-padding bg-background">
      <div className="container-bluelake">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 text-primary text-sm font-semibold mb-6">
              <Building2 className="w-4 h-4" />
              Corporativo
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              {t('corporate.title')}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              {t('corporate.subtitle')}
            </p>
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 space-y-3">
              {[
                'Grupos desde 10 personas',
                'Cotización personalizada en 24h',
                'Paquetes a medida',
                'Factura empresarial disponible',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-jungle shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center p-12 rounded-2xl border border-jungle/30 bg-jungle/5">
                <div className="w-16 h-16 rounded-full bg-jungle/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-jungle" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">¡Solicitud enviada!</h3>
                <p className="text-muted-foreground">{t('corporate.form.success')}</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-sm text-primary font-medium hover:underline"
                >
                  Enviar otra solicitud
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-border bg-card p-8 space-y-5 shadow-bluelake">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t('corporate.form.company')} *
                    </label>
                    <Input
                      {...register('company_name')}
                      placeholder={t('corporate.placeholders.company')}
                      className={errors.company_name ? 'border-destructive' : ''}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t('corporate.form.contact')} *
                    </label>
                    <Input
                      {...register('contact_person')}
                      placeholder={t('corporate.placeholders.contact')}
                      className={errors.contact_person ? 'border-destructive' : ''}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t('corporate.form.email')} *
                    </label>
                    <Input
                      {...register('email')}
                      type="email"
                      placeholder={t('corporate.placeholders.email')}
                      className={errors.email ? 'border-destructive' : ''}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t('corporate.form.phone')}
                    </label>
                    <Input
                      {...register('phone')}
                      placeholder={t('corporate.placeholders.phone')}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t('corporate.form.groupSize')}
                    </label>
                    <Input
                      {...register('group_size')}
                      type="number"
                      placeholder={t('corporate.placeholders.groupSize')}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t('corporate.form.dates')}
                    </label>
                    <Input
                      {...register('requested_dates')}
                      placeholder={t('corporate.placeholders.dates')}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    {t('corporate.form.notes')}
                  </label>
                  <Textarea
                    {...register('notes')}
                    placeholder={t('corporate.placeholders.notes')}
                    rows={4}
                    className="resize-none"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-accent-orange hover:bg-accent-orange-hover text-white font-bold rounded-xl transition-all hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t('corporate.form.submit')}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CorporateSection;
