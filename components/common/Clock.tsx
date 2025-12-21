import React, { useState, useEffect } from 'react';
import { Card } from '../ui/brutalist';
import { Clock as ClockIcon } from 'lucide-react';

export const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  return (
    <Card className="flex items-center justify-between py-2 px-4 bg-[#FFD43B]">
      <div className="flex items-center gap-2 font-black text-xl">
        <ClockIcon className="w-6 h-6 border-2 border-black rounded-full p-0.5 bg-white" />
        <span>{formattedTime}</span>
      </div>
      <div className="text-xs font-bold border-l-2 border-black pl-2 ml-2">
        WIB
      </div>
    </Card>
  );
};
