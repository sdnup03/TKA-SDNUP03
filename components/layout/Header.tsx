
import React from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/brutalist';
import { GraduationCap, LogOut } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentUser, logout, activeExamId, appConfig } = useApp();

  // Hide header in exam mode to minimize distractions
  if (activeExamId && currentUser?.role === 'SISWA') return null;


  return (
    <header className="bg-white border-b-4 border-black py-2 sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-[#FF6B6B] p-1.5 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            <GraduationCap className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black tracking-tighter uppercase italic leading-none">{appConfig.appName}</h1>
            <p className="text-[10px] md:text-xs font-bold text-gray-500 leading-none mt-0.5">{appConfig.schoolName}</p>
          </div>
        </div>

        {currentUser && (
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
               <div className="font-black uppercase text-xs">{currentUser.name}</div>
               <div className="text-[10px] font-bold bg-black text-white inline-block px-1.5 rounded">{currentUser.role}</div>
             </div>
             
             <Button 
                size="sm" 
                variant="outline"
                onClick={logout}
                className="flex items-center gap-2 border-red-500 text-red-600 hover:bg-red-50 h-8 px-3 text-xs md:text-sm"
             >
               <LogOut className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">Keluar</span>
             </Button>
          </div>
        )}
      </div>
    </header>
  );
};
