import React from 'react';
import { Cpu, Power, Home as HomeIcon, Users, Activity, Sparkles, Wifi } from 'lucide-react';
import { useHome } from '../../context/HomeContext';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

export const MetricCards: React.FC = () => {
  const { devices, rooms, members } = useHome();

  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.status === 'online').length;

  let totalRelays = 0;
  let activeRelays = 0;
  devices.forEach((d) => {
    d.relay_channels?.forEach((ch) => {
      totalRelays++;
      if (ch.state) activeRelays++;
    });
  });

  const cards = [
    {
      title: 'Thiết Bị Trực Tuyến',
      value: `${onlineDevices}/${totalDevices}`,
      desc:
        onlineDevices === totalDevices && totalDevices > 0
          ? 'Tất cả thiết bị kết nối tốt'
          : totalDevices === 0
          ? 'Chưa đăng ký thiết bị'
          : `${totalDevices - onlineDevices} thiết bị đang offline`,
      icon: Cpu,
      gradient: 'from-blue-600 to-cyan-500',
      glow: 'glow-cyan',
      textColor: 'text-cyan-400',
      badge: onlineDevices > 0 ? `${Math.round((onlineDevices / (totalDevices || 1)) * 100)}% Online` : '0% Online',
      badgeColor: onlineDevices > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    },
    {
      title: 'Công Tắc Đang Bật',
      value: `${activeRelays}/${totalRelays}`,
      desc: activeRelays > 0 ? `${activeRelays} kênh tải đang tiêu thụ điện` : 'Tất cả tải điện đang tắt',
      icon: Power,
      gradient: 'from-amber-500 to-orange-500',
      glow: 'glow-amber',
      textColor: 'text-amber-400',
      badge: activeRelays > 0 ? `${activeRelays} Bật` : 'Đang Tắt Hết',
      badgeColor: activeRelays > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-800 text-slate-400 border-slate-700',
    },
    {
      title: 'Khu Vực & Phòng',
      value: rooms.length.toString(),
      desc: `${devices.length} thiết bị được phân bổ`,
      icon: HomeIcon,
      gradient: 'from-emerald-600 to-teal-500',
      glow: 'glow-emerald',
      textColor: 'text-emerald-400',
      badge: `${rooms.length} Không Gian`,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      title: 'Thành Viên Gia Đình',
      value: members.length.toString(),
      desc: 'Tài khoản có quyền điều khiển',
      icon: Users,
      gradient: 'from-purple-600 to-indigo-500',
      glow: 'glow-purple',
      textColor: 'text-purple-400',
      badge: 'Được Bảo Vệ',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="glass-card rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 tracking-wide">{c.title}</p>
                <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1 font-mono">
                  {c.value}
                </h4>
              </div>
              <div
                className={cn(
                  'h-11 w-11 rounded-2xl bg-gradient-to-tr flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105',
                  c.gradient
                )}
              >
                <Icon size={20} />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <p className="text-[11px] text-slate-400 truncate">{c.desc}</p>
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold border whitespace-nowrap', c.badgeColor)}>
                {c.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
