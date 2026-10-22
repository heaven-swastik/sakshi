/**
 * StatusBadge.jsx — Compact status badge with icon.
 *
 * Props:
 *   status: 'verified' | 'attested' | 'pending' | 'flagged' | 'accepted' | 'rejected' | 'active' | 'revoked' | 'expired'
 *   size:   'sm' | 'md' (default 'sm')
 */

import React from 'react';
import { CheckCircle, Clock, AlertTriangle, XCircle, Shield, BadgeCheck } from 'lucide-react';
import { useI18n } from '../i18n';

const CONFIG = {
  verified: {
    icon: BadgeCheck,
    color: 'text-jade',
    bg:    'bg-jade-light',
    key:   'verified',
  },
  attested: {
    icon: Shield,
    color: 'text-ink',
    bg:    'bg-fog',
    key:   'attested',
  },
  pending: {
    icon: Clock,
    color: 'text-amber',
    bg:    'bg-amber-light',
    key:   'pending',
  },
  flagged: {
    icon: AlertTriangle,
    color: 'text-crimson',
    bg:    'bg-crimson-light',
    key:   'flagged',
  },
  accepted: {
    icon: CheckCircle,
    color: 'text-jade',
    bg:    'bg-jade-light',
    key:   'verified',
  },
  rejected: {
    icon: XCircle,
    color: 'text-crimson',
    bg:    'bg-crimson-light',
    key:   'flagged',
  },
  active: {
    icon: CheckCircle,
    color: 'text-jade',
    bg:    'bg-jade-light',
    key:   'active',
  },
  revoked: {
    icon: XCircle,
    color: 'text-crimson',
    bg:    'bg-crimson-light',
    key:   'revoked',
  },
  expired: {
    icon: Clock,
    color: 'text-amber',
    bg:    'bg-amber-light',
    key:   'expired',
  },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const { t } = useI18n();
  const cfg = CONFIG[status] ?? CONFIG.pending;
  const Icon = cfg.icon;
  const iconSize = size === 'md' ? 15 : 13;
  const textClass = size === 'md' ? 'text-sm' : 'text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${textClass} ${cfg.color} ${cfg.bg}`}
    >
      <Icon size={iconSize} strokeWidth={2.2} />
      {t(cfg.key)}
    </span>
  );
}
