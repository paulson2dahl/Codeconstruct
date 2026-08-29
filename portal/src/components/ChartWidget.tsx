import React from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Scatter
} from 'recharts';
import { ChevronDown, ChevronUp, Download, Maximize } from 'lucide-react';
import './ChartWidget.css';

interface ChartWidgetProps {
  title: string;
  config: {
    type: 'line' | 'bar' | 'area' | 'pie' | 'scatter' | 'composed';
    data: any[];
    xKey?: string;
    yKeys?: string | string[];
    groupBy?: string;
    colors?: string[];
    height?: number;
    showLegend?: boolean;
    showGrid?: boolean;
    showTooltip?: boolean;
  };
}

const CHART_COLORS = [
  '#4a90d9', '#f5a623', '#7ed321', '#d0021b', '#9013fe', '#50e3c2',
  '#f5a623', '#bd10e0', '#4a90d9', '#7ed321',
];

export const ChartWidget = ({ title, config }: ChartWidgetProps) => {
  const [expanded, setExpanded] = React.useState(true);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [chartType, setChartType] = React.useState(config.type);

  const renderChart = () => {
    const { data, xKey, yKeys, colors = CHART_COLORS, height = 300 } = config;
    const yKeyArray = Array.isArray(yKeys) ? yKeys : yKeys ? [yKeys] : [];

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="tf-chart-tooltip">
            <div className="tf-tooltip-label">{label}</div>
            {payload.map((entry: any, idx: number) => (
              <div key={idx} className="tf-tooltip-row" style={{ borderColor: entry.color }}>
                <span className="tf-tooltip-name">{entry.name}: </span>
                <span className="tf-tooltip-value">{entry.value?.toLocaleString() ?? entry.value}</span>
              </div>
            ))}
          </div>
        );
      }
      return null;
    };

    const commonProps = {
      data,
      margin: { top: 10, right: 20, left: 0, bottom: 0 },
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart {...commonProps}>
              {config.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="#3a4150" />}
              <XAxis dataKey={xKey} stroke="#5a6475" tick={{ fill: '#a0a0b0', fontSize: 11 }} />
              <YAxis stroke="#5a6475" tick={{ fill: '#a0a0b0', fontSize: 11 }} />
              {config.showTooltip !== false && <Tooltip content={<CustomTooltip />} />}
              {config.showLegend !== false && <Legend />}
              {yKeyArray.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[idx % colors.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart {...commonProps}>
              {config.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="#3a4150" />}
              <XAxis dataKey={xKey} stroke="#5a6475" tick={{ fill: '#a0a0b0', fontSize: 11 }} />
              <YAxis stroke="#5a6475" tick={{ fill: '#a0a0b0', fontSize: 11 }} />
              {config.showTooltip !== false && <Tooltip content={<CustomTooltip />} />}
              {config.showLegend !== false && <Legend />}
              {yKeyArray.map((key, idx) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[idx % colors.length]}
                  fill={colors[idx % colors.length]}
                  fillOpacity={0.3}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart {...commonProps} layout="vertical">
              {config.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke={config.showGrid === false ? 'transparent' : '#3a4150'} vertical={false} />}
              <YAxis type="category" dataKey={xKey} stroke="#5a6475" tick={{ fill: '#a0a0b0', fontSize: 11 }} width={100} />
              <XAxis stroke="#5a6475" tick={{ fill: '#a0a0b0', fontSize: 11 }} />
              {config.showTooltip !== false && <Tooltip content={<CustomTooltip />} />}
              {config.showLegend !== false && <Legend />}
              {yKeyArray.map((key, idx) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[idx % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart {...commonProps}>
              {config.showTooltip !== false && <Tooltip content={<CustomTooltip />} />}
              {config.showLegend !== false && <Legend />}
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey={yKeyArray[0] || 'value'}
                nameKey={xKey || 'name'}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                labelLine={false}
              >
                {data.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart {...commonProps}>
              {config.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="#3a4150" />}
              <XAxis dataKey={xKey} stroke="#5a6475" tick={{ fill: '#a0a0b0', fontSize: 11 }} />
              <YAxis stroke="#5a6475" tick={{ fill: '#a0a0b0', fontSize: 11 }} />
              {config.showTooltip !== false && <Tooltip content={<CustomTooltip />} />}
              {config.showLegend !== false && <Legend />}
              <Scatter
                data={data}
                fill={colors[0]}
                shape="circle"
                name={yKeyArray[0]}
                xAxisId={0}
                yAxisId={0}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`tf-chart-widget ${fullscreen ? 'fullscreen' : ''}`}>
      <div className="tf-chart-header">
        <div className="tf-chart-title-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="tf-chart-icon">
            {chartType === 'pie' ? <circle cx="12" cy="12" r="10" /> : chartType === 'bar' ? (
              <>
                <rect x="3" y="17" width="4" height="7" />
                <rect x="9" y="10" width="4" height="14" />
                <rect x="15" y="5" width="4" height="19" />
              </>
            ) : (
              <>
                <path d="M3 18l4-4 4 4 4-8 4 4 4-10" />
              </>
            )}
          </svg>
          <h3 className="tf-chart-title">{title}</h3>
        </div>
        <div className="tf-chart-controls">
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as any)}
            className="tf-chart-type-select"
          >
            <option value="line">Line</option>
            <option value="area">Area</option>
            <option value="bar">Bar</option>
            <option value="pie">Pie</option>
            <option value="scatter">Scatter</option>
          </select>
          <button className="tf-chart-btn" onClick={() => setFullscreen(!fullscreen)} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            <Maximize size={16} />
          </button>
          <button className="tf-chart-btn" title="Download as PNG">
            <Download size={16} />
          </button>
          <button className="tf-chart-toggle" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="tf-chart-body">
          <div className="tf-chart-container" style={{ height: config.height || 300 }}>
            {renderChart()}
          </div>
          <div className="tf-chart-data-info">
            {config.data.length} data points • {config.xKey || 'Index'} vs {Array.isArray(config.yKeys) ? config.yKeys.join(', ') : config.yKeys || 'Value'}
          </div>
        </div>
      )}
    </div>
  );
};