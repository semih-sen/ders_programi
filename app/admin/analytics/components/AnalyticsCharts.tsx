'use client';

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DailyTrafficData {
  date: string;
  count: number;
}

interface ActionData {
  action: string;
  count: number;
}

interface DeviceData {
  device: string;
  count: number;
  [key: string]: string | number;
}

interface AnalyticsChartsProps {
  dailyTraffic: DailyTrafficData[];
  topActions: ActionData[];
  deviceDistribution: DeviceData[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsCharts({
  dailyTraffic,
  topActions,
  deviceDistribution,
}: AnalyticsChartsProps) {
  return (
    <div className="space-y-6">
      {/* Daily Traffic Chart */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4">
          📈 Son 7 Günlük Trafik
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dailyTraffic}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorCount)"
              name="Ziyaret"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Grid for Action and Device Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Actions Chart */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4">
            ⚡ Kullanıcı Eylemleri
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topActions}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="action" 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="count" fill="#10b981" name="Eylem Sayısı" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Device Distribution Chart */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4">
            📱 Cihaz Dağılımı
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) =>
                  `${entry.device}: ${((entry.percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {deviceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {deviceDistribution.map((entry, index) => (
              <div key={entry.device} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-slate-300">
                  {entry.device}: {entry.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
