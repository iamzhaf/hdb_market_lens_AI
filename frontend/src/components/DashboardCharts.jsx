import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Layers, MapPin, TrendingUp, PieChart as PieIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardCharts({ chartData, theme }) {
  const [metricTab, setMetricTab] = useState('index');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDark = theme === 'dark';
  const textColor = isDark ? '#9ca3af' : '#475569';
  const gridColor = isDark ? 'rgba(75, 85, 99, 0.2)' : 'rgba(148, 163, 184, 0.2)';

  const trend = chartData.trend || [];
  const towns = chartData.towns || [];
  const flatTypes = chartData.flat_types || [];
  const flatModels = chartData.flat_models || [];
  const flatTypesByYear = chartData.flat_types_by_year || [];

  // Color Palette
  const colors = ['#0047AB', '#1e60c4', '#3b82f6', '#0077b6', '#10b981', '#f59e0b', '#ec4899', '#f43f5e'];

  // Consistent color mapping for flat types
  const flatTypeColors = {
    '4 ROOM': '#0047AB',
    '3 ROOM': '#1e60c4',
    '5 ROOM': '#3b82f6',
    'EXECUTIVE': '#0077b6',
    '2 ROOM': '#10b981',
    '1 ROOM': '#f59e0b',
    'MULTI-GENERATION': '#ec4899',
    'MULTI GENERATION': '#ec4899'
  };

  // Option 1: Price and Transaction Trend
  const trendOption = {
    backgroundColor: 'transparent',
    color: colors,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['Avg Resale Price', 'Transactions'],
      textStyle: { color: textColor, fontFamily: 'Outfit' },
      top: '5%',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: trend.map(d => d.label),
        axisPointer: { type: 'shadow' },
        axisLabel: { color: textColor, fontFamily: 'Outfit' },
        axisLine: { lineStyle: { color: gridColor } }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: 'Avg Price (S$)',
        nameTextStyle: { color: textColor, fontFamily: 'Outfit' },
        axisLabel: {
          formatter: (v) => `S$${v >= 1e3 ? (v / 1e3).toFixed(0) + 'k' : v}`,
          color: textColor,
          fontFamily: 'Outfit'
        },
        splitLine: { lineStyle: { color: gridColor } }
      },
      {
        type: 'value',
        name: 'Transactions',
        nameTextStyle: { color: textColor, fontFamily: 'Outfit' },
        axisLabel: { color: textColor, fontFamily: 'Outfit' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: 'Transactions',
        type: 'bar',
        yAxisIndex: 1,
        data: trend.map(d => d.txn_count),
        itemStyle: {
          color: isDark ? 'rgba(0, 71, 171, 0.45)' : 'rgba(0, 71, 171, 0.75)',
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: 'Avg Resale Price',
        type: 'line',
        data: trend.map(d => d.avg_price),
        lineStyle: { width: 2, color: '#0047AB' },
        itemStyle: { color: '#0047AB' },
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  };

  // Option 2: Towns Bar Chart
  const townsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '5%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: (v) => `S$${(v / 1e3).toFixed(0)}k`,
        color: textColor,
        fontFamily: 'Outfit'
      },
      splitLine: { lineStyle: { color: gridColor } }
    },
    yAxis: {
      type: 'category',
      data: towns.map(d => d.label).reverse(),
      axisLabel: { color: textColor, fontFamily: 'Outfit', interval: 0 },
      axisLine: { lineStyle: { color: gridColor } }
    },
    series: [
      {
        name: 'Avg Resale Price',
        type: 'bar',
        data: towns.map(d => d.avg_price).reverse(),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#0047AB' }
            ]
          },
          borderRadius: [0, 4, 4, 0]
        }
      }
    ]
  };

  // Option 3: Flat Type Pie
  const flatTypesOption = {
    backgroundColor: 'transparent',
    color: colors,
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} flats ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: '0%',
      left: 'center',
      type: 'scroll',
      textStyle: { color: textColor, fontFamily: 'Outfit', fontSize: 10 }
    },
    series: [
      {
        name: 'Flat Types',
        type: 'pie',
        radius: ['35%', '58%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: isDark ? '#0b0f19' : '#f8fafc',
          borderWidth: 2
        },
        label: { show: false },
        labelLine: { show: false },
        data: flatTypes.map(d => ({
          name: d.label,
          value: d.value,
          itemStyle: {
            color: flatTypeColors[d.label] || '#9ca3af'
          }
        }))
      }
    ]
  };

  // Option 4: Popular Flat Type by transactions across years (stacked bar)
  const yearsList = [...new Set(flatTypesByYear.map(d => d.year))].sort((a, b) => a - b);
  const flatTypesList = [...new Set(flatTypesByYear.map(d => d.flat_type))];

  const flatTypesAcrossYearsOption = {
    backgroundColor: 'transparent',
    color: colors,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: flatTypesList,
      textStyle: { color: textColor, fontFamily: 'Outfit', fontSize: 10 },
      top: '0%',
      type: 'scroll'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: yearsList,
      axisLabel: { color: textColor, fontFamily: 'Outfit' },
      axisLine: { lineStyle: { color: gridColor } }
    },
    yAxis: {
      type: 'value',
      name: 'Transactions',
      nameTextStyle: { color: textColor, fontFamily: 'Outfit' },
      axisLabel: { color: textColor, fontFamily: 'Outfit' },
      splitLine: { lineStyle: { color: gridColor } }
    },
    series: flatTypesList.map(type => {
      const data = yearsList.map(year => {
        const item = flatTypesByYear.find(d => d.year === year && d.flat_type === type);
        return item ? item.txn_count : 0;
      });
      return {
        name: type,
        type: 'bar',
        stack: 'total',
        itemStyle: {
          color: flatTypeColors[type] || '#9ca3af'
        },
        emphasis: { focus: 'series' },
        data: data
      };
    })
  };

  // Option 5: Growth rate of average price
  const growthData = [];
  for (let i = 1; i < trend.length; i++) {
    const prev = trend[i - 1].avg_price;
    const curr = trend[i].avg_price;
    if (prev && curr) {
      const rate = ((curr - prev) / prev) * 100;
      growthData.push({
        label: trend[i].label,
        growth_rate: parseFloat(rate.toFixed(2))
      });
    }
  }

  const growthOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const item = params[0];
        const year = item.name;
        const rate = item.value;
        const originalVal = trend.find(d => String(d.label) === String(year));
        const priceStr = originalVal && originalVal.avg_price
          ? `S$${originalVal.avg_price.toLocaleString()}`
          : 'N/A';
        return `
          <div style="font-family: Outfit; padding: 4px 8px;">
            <strong style="display: block; margin-bottom: 4px; color: ${isDark ? '#fff' : '#0f172a'}">${year}</strong>
            <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 2px;">
              <span style="color: ${textColor}">Avg Price Growth:</span>
              <strong style="color: ${rate >= 0 ? '#10b981' : '#ef4444'}">${rate >= 0 ? '+' : ''}${rate}%</strong>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span style="color: ${textColor}">Average Price:</span>
              <strong style="color: ${isDark ? '#fff' : '#0f172a'}">${priceStr}</strong>
            </div>
          </div>
        `;
      },
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: gridColor,
      borderWidth: 1,
      textStyle: { fontFamily: 'Outfit' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: growthData.map(d => d.label),
      axisLabel: { color: textColor, fontFamily: 'Outfit' },
      axisLine: { lineStyle: { color: gridColor } }
    },
    yAxis: {
      type: 'value',
      name: 'YoY Growth (%)',
      nameTextStyle: { color: textColor, fontFamily: 'Outfit' },
      axisLabel: {
        formatter: '{value}%',
        color: textColor,
        fontFamily: 'Outfit'
      },
      splitLine: { lineStyle: { color: gridColor } }
    },
    series: [
      {
        name: 'YoY Growth Rate',
        type: 'line',
        smooth: true,
        data: growthData.map(d => d.growth_rate),
        lineStyle: { width: 3, color: '#0047AB' },
        itemStyle: { color: '#0047AB' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 71, 171, 0.35)' },
              { offset: 1, color: 'rgba(0, 71, 171, 0.0)' }
            ]
          }
        },
        symbol: 'circle',
        symbolSize: 5,
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: {
            type: 'dashed',
            color: isDark ? 'rgba(239, 68, 68, 0.5)' : 'rgba(220, 38, 38, 0.5)',
            width: 1.5
          },
          data: [{ yAxis: 0 }]
        }
      }
    ]
  };

  // Option 6: HDB Resale Price Index (Base 2000 = 100)
  const baseYearItem = trend.find(d => String(d.label) === '2000');
  const basePrice = baseYearItem ? baseYearItem.avg_price : null;
  const indexData = basePrice
    ? trend.map(d => ({
      label: d.label,
      index: parseFloat(((d.avg_price / basePrice) * 100).toFixed(1))
    }))
    : [];

  const indexOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const item = params[0];
        const year = item.name;
        const indexVal = item.value;
        const originalVal = trend.find(d => String(d.label) === String(year));
        const priceStr = originalVal && originalVal.avg_price
          ? `S$${originalVal.avg_price.toLocaleString()}`
          : 'N/A';
        return `
          <div style="font-family: Outfit; padding: 4px 8px;">
            <strong style="display: block; margin-bottom: 4px; color: ${isDark ? '#fff' : '#0f172a'}">${year}</strong>
            <div style="display: flex; justify-content: justify; gap: 16px; margin-bottom: 2px;">
              <span style="color: ${textColor}">Price Index:</span>
              <strong style="color: #0047AB">${indexVal}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span style="color: ${textColor}">Average Price:</span>
              <strong style="color: ${isDark ? '#fff' : '#0f172a'}">${priceStr}</strong>
            </div>
          </div>
        `;
      },
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: gridColor,
      borderWidth: 1,
      textStyle: { fontFamily: 'Outfit' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: indexData.map(d => d.label),
      axisLabel: { color: textColor, fontFamily: 'Outfit' },
      axisLine: { lineStyle: { color: gridColor } }
    },
    yAxis: {
      type: 'value',
      name: 'Index (Base 2000 = 100)',
      nameTextStyle: { color: textColor, fontFamily: 'Outfit' },
      axisLabel: {
        formatter: '{value}',
        color: textColor,
        fontFamily: 'Outfit'
      },
      splitLine: { lineStyle: { color: gridColor } }
    },
    series: [
      {
        name: 'Price Index',
        type: 'line',
        smooth: true,
        data: indexData.map(d => d.index),
        lineStyle: { width: 3, color: '#0047AB' },
        itemStyle: { color: '#0047AB' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 71, 171, 0.35)' },
              { offset: 1, color: 'rgba(0, 71, 171, 0.0)' }
            ]
          }
        },
        symbol: 'circle',
        symbolSize: 5,
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: {
            type: 'dashed',
            color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.4)',
            width: 1.5
          },
          data: [{ yAxis: 100 }]
        }
      }
    ]
  };

  return (
    <div className="flex flex-col gap-6">
      {/* <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6"> */}
      <Card className="bg-card/60 border-border backdrop-blur-md">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <TrendingUp size={18} className="text-muted-foreground" />
            <span>Market Resale Trend (1990 - 2026)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] w-full pt-4">
          <ReactECharts option={trendOption} style={{ height: '100%', width: '100%' }} />
        </CardContent>
      </Card>

      {/* <Card className="bg-card/60 border-border backdrop-blur-md">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <MapPin size={18} className="text-muted-foreground" />
              <span>Top Estates by Price (SGD)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] w-full pt-4">
            <ReactECharts option={townsOption} style={{ height: '100%', width: '100%' }} />
          </CardContent>
        </Card> */}
      {/* </div> */}

      <Card className="bg-card/60 border-border backdrop-blur-md">
        <CardHeader className="border-b border-border pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <TrendingUp size={18} className="text-muted-foreground" />
            <span>
              {metricTab === 'index'
                ? 'HDB Resale Price Index (Base 2000 = 100)'
                : 'YoY Growth Rate of Average Resale Price (1991 - 2026)'}
            </span>
          </CardTitle>
          <Tabs value={metricTab} onValueChange={setMetricTab} className="w-[240px] mr-2">
            <TabsList className="grid grid-cols-2 h-8 p-1">
              <TabsTrigger value="index" className="text-xs">Price Index</TabsTrigger>
              <TabsTrigger value="growth" className="text-xs">YoY Growth</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="h-[280px] w-full pt-4">
          <ReactECharts
            option={metricTab === 'index' ? indexOption : growthOption}
            key={metricTab}
            style={{ height: '100%', width: '100%' }}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card/60 border-border backdrop-blur-md md:col-span-1">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <PieIcon size={18} className="text-muted-foreground" />
              <span>Transaction Share by Flat Type</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] w-full pt-4">
            <ReactECharts option={flatTypesOption} style={{ height: '100%', width: '100%' }} />
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border backdrop-blur-md md:col-span-3">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Layers size={18} className="text-muted-foreground" />
              <span>Popular Flat Types over Years</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] w-full pt-4">
            <ReactECharts option={flatTypesAcrossYearsOption} style={{ height: '100%', width: '100%' }} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
