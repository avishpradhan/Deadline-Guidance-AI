import { AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import Badge from './Badge';

const riskConfig = {
  low: {
    icon: ShieldCheck,
    label: 'Low Risk',
    variant: 'low',
  },
  medium: {
    icon: AlertTriangle,
    label: 'Medium Risk',
    variant: 'medium',
  },
  high: {
    icon: ShieldAlert,
    label: 'High Risk',
    variant: 'high',
  },
};

export default function RiskBadge({ level = 'low', showIcon = true, pulse = false, className = '' }) {
  const config = riskConfig[level] || riskConfig.low;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} dot pulse={pulse && level !== 'low'} className={className}>
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </Badge>
  );
}
