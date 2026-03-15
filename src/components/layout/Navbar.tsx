import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/contexts/CurrencyContext';
import i18n from '@/i18n';
import logo from '@/assets/logo-bluelake.png';

const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang, setLang] = useState(i18n.language);
  const { currency, toggleCurrency } = useCurrency();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleLang = () => {
    const next = lang === 'es' ? 'en' : 'es';
    i18n.changeLanguage(next);
    setLang(next);
  };

  const navLinks = [
    { key: 'nav.aboutUs', href: '/nosotros', isRoute: true },
    { key: 'nav.experiences', href: '#experiencias', isRoute: false },
    { key: 'nav.seasons', href: '#temporadas', isRoute: false },
    { key: 'nav.blog', href: '/blog', isRoute: true },
    { key: 'nav.contact', href: '#contacto', isRoute: false },
  ];

  const isHome = location.pathname === '/' || location.pathname === '';

  const handleHashClick = (hash: string) => {
    const id = hash.replace('#', '');
    if (isHome) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || !isHome
        ? 'bg-white/95 backdrop-blur-md shadow-bluelake border-b border-border'
        : 'bg-transparent'
        }`}
    >
      <div className="container-bluelake flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={logo}
            alt="Bluelake Logo"
            className="h-9 w-auto"
          />
          <span className={`text-xl font-bold tracking-tight transition-colors ${isScrolled || !isHome ? 'text-primary' : 'text-white'
            }`}>
            Bluelake Iquitos
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ key, href, isRoute }) =>
            isRoute ? (
              <Link
                key={key}
                to={href}
                className={`text-sm font-medium transition-colors hover:text-accent-orange ${isScrolled || !isHome ? 'text-foreground' : 'text-white/90'
                  }`}
              >
                {t(key)}
              </Link>
            ) : (
              <button
                key={key}
                onClick={() => handleHashClick(href)}
                className={`text-sm font-medium transition-colors hover:text-accent-orange ${isScrolled || !isHome ? 'text-foreground' : 'text-white/90'
                  }`}
              >
                {t(key)}
              </button>
            )
          )}
        </nav>

        {/* Right controls */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleLang}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-all ${isScrolled || !isHome
              ? 'border-border text-foreground hover:border-primary hover:text-primary'
              : 'border-white/30 text-white hover:border-white'
              }`}
          >
            <Globe className="w-3.5 h-3.5" />
            {lang.toUpperCase()}
          </button>
          <button
            onClick={toggleCurrency}
            className={`text-sm font-bold px-3 py-1.5 rounded-full border transition-all ${isScrolled || !isHome
              ? 'border-border text-foreground hover:border-primary hover:text-primary'
              : 'border-white/30 text-white hover:border-white'
              }`}
          >
            {currency === 'PEN' ? 'S/' : '$'}
          </button>
          <Link to="/login">
            <Button
              variant="outline"
              className={`font-semibold px-4 rounded-full transition-all ${isScrolled || !isHome
                ? 'border-border text-foreground hover:border-primary hover:text-primary'
                : 'border-white/40 text-white bg-white/10 hover:bg-white/20'
                }`}
            >
              {t('nav.login') || 'Iniciar sesión'}
            </Button>
          </Link>
          <button onClick={() => handleHashClick('#experiencias')}>
            <Button className="bg-accent-orange hover:bg-accent-orange-hover text-white font-semibold px-5 rounded-full shadow-orange animate-pulse-orange">
              {t('nav.bookNow')}
            </Button>
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden p-2 rounded-lg transition-colors ${isScrolled || !isHome ? 'text-foreground' : 'text-white'
            }`}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-border shadow-lg"
          >
            <div className="container-bluelake py-4 flex flex-col gap-1">
              {navLinks.map(({ key, href, isRoute }) =>
                isRoute ? (
                  <Link
                    key={key}
                    to={href}
                    onClick={() => setMobileOpen(false)}
                    className="py-3 px-4 text-sm font-medium text-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                  >
                    {t(key)}
                  </Link>
                ) : (
                  <button
                    key={key}
                    onClick={() => { setMobileOpen(false); handleHashClick(href); }}
                    className="py-3 px-4 text-left text-sm font-medium text-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                  >
                    {t(key)}
                  </button>
                )
              )}
              <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-border">
                <Link to="/login" className="w-full" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full font-semibold rounded-full">
                    {t('nav.login') || 'Iniciar sesión'}
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleLang}
                    className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-full border border-border text-foreground"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {lang.toUpperCase()}
                  </button>
                  <button onClick={() => { setMobileOpen(false); handleHashClick('#experiencias'); }} className="flex-1">
                    <Button className="w-full bg-accent-orange hover:bg-accent-orange-hover text-white font-semibold rounded-full">
                      {t('nav.bookNow')}
                    </Button>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
