'use client';

import React, { useEffect, useState } from 'react';

interface WatermarkProps {
  candidateName: string;
  token: string;
}

export const Watermark: React.FC<WatermarkProps> = ({ candidateName, token }) => {
  const [timestamp, setTimestamp] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimestamp(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none">
      <div className="animate-watermark absolute rounded-md bg-slate-900/10 px-3 py-1.5 backdrop-blur-[1px] border border-slate-700/10 text-xs font-mono text-slate-700/40 dark:text-slate-300/30">
        <p className="font-semibold">{candidateName}</p>
        <p className="text-[10px]">ID: {token.substring(0, 10)} | {timestamp}</p>
      </div>
    </div>
  );
};
