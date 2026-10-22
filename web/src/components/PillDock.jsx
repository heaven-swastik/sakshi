/**
 * PillDock.jsx — Floating bottom pill navigation.
 *
 * Fixed, bottom 24px, centred horizontally.
 * White background, fog border, dock shadow.
 * 5 tabs: Upload | Radar | Score | You | Proof
 * Active tab: ink background, white text + icon, rounded-full inset pill.
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Upload, RadioTower, BarChart2, User, ShieldCheck } from 'lucide-react';
import { useI18n } from '../i18n';

const NAV_ITEMS = [
  { to: '/upload',    icon: Upload,      labelKey: 'navUpload' },
  { to: '/radar',     icon: RadioTower,  labelKey: 'navRadar'  },
  { to: '/integrity', icon: BarChart2,   labelKey: 'navScore'  },
  { to: '/citizen',   icon: User,        labelKey: 'navYou'    },
  { to: '/proof',     icon: ShieldCheck, labelKey: 'navProof'  },
];

export default function PillDock() {
  const { t } = useI18n();
  const location = useLocation();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div
        className="flex items-center gap-1 bg-white border border-fog rounded-full shadow-dock px-2 py-2"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)' }}
      >
        {NAV_ITEMS.map(({ to, icon: Icon, labelKey }) => {
          const isActive = location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              className={`
                flex flex-col items-center gap-0.5 px-4 py-2 rounded-full transition-all duration-150
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2
                ${isActive
                  ? 'bg-ink text-white'
                  : 'text-slate hover:text-ink hover:bg-paper'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.2 : 1.8}
                aria-hidden="true"
              />
              <span className="text-[10px] font-medium leading-none tracking-wide">
                {t(labelKey)}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
