import React from 'react';
import { Activity, DollarSign, Layers, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function KPICards({ kpis }) {
  const formatSGD = (num) => {
    if (!num) return '$0';
    if (num >= 1e9) {
      return (num / 1e9).toFixed(2) + ' B';
    }
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatNum = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat('en-SG').format(num);
  };

  const cards = [
    {
      title: 'Total Transactions',
      value: formatNum(kpis.total_transactions),
      meta: 'Overall volume',
      trend: '+4.2% MoM',
      icon: Activity,
      accent: 'accent-indigo'
    },
    {
      title: 'Average Resale Price',
      value: formatSGD(kpis.avg_price),
      meta: 'Per unit average',
      trend: '+1.8% MoM',
      icon: TrendingUp,
      accent: 'accent-blue'
    },
    {
      title: 'Total Sales Volume',
      value: formatSGD(kpis.total_volume),
      meta: 'Market capital',
      trend: '+5.4% YoY',
      icon: DollarSign,
      accent: 'accent-purple'
    },
    {
      title: 'Average Floor Area',
      value: `${kpis.avg_area || 0} sqm`,
      meta: 'Average flat size',
      trend: 'Steady',
      icon: Layers,
      accent: 'accent-green'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <Card
            key={i}
            className="relative overflow-hidden bg-card/60 border-border backdrop-blur-md hover:border-primary/50 hover:shadow-[0_8px_30px_rgba(0,71,171,0.08)] transition-all duration-300"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className="text-muted-foreground/70" size={18} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight mb-1 text-foreground">
                {card.value}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-emerald-500 font-semibold">{card.trend}</span>
                <span>{card.meta}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
