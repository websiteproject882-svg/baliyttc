"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock } from 'lucide-react';

interface UrgencyBadgeProps {
  type: 'limited_seats' | 'countdown' | 'scarcity';
  text: string;
  endsAt?: Date;
  seatCount?: number;
  totalSeats?: number;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({
  type,
  text,
  endsAt,
  seatCount,
  totalSeats,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!endsAt) return;

    const timer = setInterval(() => {
      const now = new Date();
      const diff = endsAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(timer);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`);
      } else {
        setTimeLeft(`${minutes}m left`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endsAt]);

  const badgeContent = {
    limited_seats: {
      icon: Zap,
      bgColor: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/50',
      textColor: 'text-amber-700',
      label: text,
    },
    countdown: {
      icon: Clock,
      bgColor: 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-400/50',
      textColor: 'text-red-700 font-semibold',
      label: timeLeft || text,
    },
    scarcity: {
      icon: Zap,
      bgColor: 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/50',
      textColor: 'text-amber-800 font-semibold',
      label: `${seatCount}/${totalSeats} seats remaining`,
    },
  };

  const config = badgeContent[type];
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
    >
      <IconComponent size={14} className="animate-pulse" />
      <span>{config.label}</span>
    </motion.div>
  );
};
