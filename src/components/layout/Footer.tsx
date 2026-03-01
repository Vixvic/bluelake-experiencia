import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Waves, MapPin, Phone, Mail, Instagram, Facebook, Youtube } from 'lucide-react';
import logo from '@/assets/logo-bluelake.png';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-primary-deep text-white/80">
      <div className="container-bluelake py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img
                src={logo}
                alt="Bluelake Logo"
                className="h-9 w-auto"
              />
              <span className="text-xl font-bold text-white">Bluelake Iquitos</span>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed mb-5">
              {t('footer.description')}
            </p>
            <div className="flex gap-3">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-accent-orange flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4 text-white" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-accent-orange flex items-center justify-center transition-colors">
                <Facebook className="w-4 h-4 text-white" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-accent-orange flex items-center justify-center transition-colors">
                <Youtube className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.navigation')}</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: t('nav.experiences'), href: '/#experiencias' },
                { label: t('nav.seasons'), href: '/#temporadas' },
                { label: t('nav.pier24'), href: '/#muelle24' },
                { label: t('nav.blog'), href: '/blog' },
                { label: t('nav.contact'), href: '/#contacto' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="hover:text-accent-orange transition-colors">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.contact')}</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-accent-orange mt-0.5 shrink-0" />
                <span>{t('footer.address')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-accent-orange shrink-0" />
                <a href="tel:+51996130193" className="hover:text-accent-orange transition-colors">
                  {t('footer.phone')}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-accent-orange shrink-0" />
                <a href="mailto:bluelakeiquitos@gmail.com" className="hover:text-accent-orange transition-colors">
                  {t('footer.email')}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.legal')}</h3>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li>{t('footer.ruc')}</li>
              <li>{t('footer.gercetur')}</li>
              <li className="mt-4">
                <Link to="/admin" className="hover:text-accent-orange transition-colors">
                  Admin Panel
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-white/40">
          <span>{t('footer.copyright')}</span>
          <span>Made with ❤️ in Iquitos, Amazonía Peruana</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
