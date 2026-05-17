/**
 * Navbar.jsx
 * ----------
 * Sticky top navigation with smooth scroll links.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const NAV_LINKS = [
  { label: 'Home',        href: '#hero'        },
  { label: 'Simulation',  href: '#simulation'  },
  { label: 'Comparison',  href: '#comparison'  },
  { label: 'Algorithms',  href: '#algorithms'  },
  { label: 'Dashboard',   href: '#dashboard'   },
  { label: 'Heatmap',     href: '#heatmap'     },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [active,   setActive]   = useState('#hero');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (e, href) => {
    e.preventDefault();
    setActive(href);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled
          ? 'rgba(10, 10, 20, 0.92)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(99,102,241,0.15)' : 'none',
        transition: 'all 0.4s ease',
        padding: '0 2rem',
      }}
    >
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #c44e52)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: '#fff', fontSize: 14,
          }}>RB</div>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15, letterSpacing: '0.02em' }}>
            5G Scheduler<span style={{ color: '#6366f1' }}>Viz</span>
          </span>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={e => handleNav(e, link.href)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                textDecoration: 'none',
                color: active === link.href ? '#6366f1' : '#94a3b8',
                background: active === link.href ? 'rgba(99,102,241,0.1)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { if (active !== link.href) e.target.style.color = '#e2e8f0'; }}
              onMouseLeave={e => { if (active !== link.href) e.target.style.color = '#94a3b8'; }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
