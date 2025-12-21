
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button, Input, Card } from '../ui/brutalist';
import { GraduationCap, LogIn, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isLoading, appConfig } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Isi dulu username sama passwordnya.');
      return;
    }
    
    setError('');
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Gagal login. Cek lagi username atau password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDF7] p-4">
      <Card className="w-full max-w-md bg-white shadow-[8px_8px_0px_0px_#000] border-2 border-black animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="inline-block bg-[#FF6B6B] p-3 border-2 border-black shadow-[4px_4px_0px_0px_#000] mb-4">
            <GraduationCap className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">{appConfig.appName}</h1>
          <p className="text-gray-500 font-bold mt-1">Login dulu biar bisa akses ruang ujian</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block font-bold mb-1 text-sm">Username</label>
            <Input 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Ketik username kamu..." 
              autoFocus
            />
          </div>
          <div>
            <label className="block font-bold mb-1 text-sm">Password</label>
            <Input 
              type="password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Password jangan sampe salah..." 
            />
          </div>

          {error && (
            <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 font-bold text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full py-3 text-lg mt-4 flex justify-center items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? 'Sabar...' : (
               <>
                 <LogIn className="w-5 h-5" /> Gas Masuk
               </>
            )}
          </Button>
        </form>

        <div className="mt-8 pt-4 border-t-2 border-gray-100 text-center text-xs text-gray-400 font-bold">
          <p>&copy; 2025 {appConfig.appName.toUpperCase()} • {appConfig.schoolName.toUpperCase()}</p>
        </div>
      </Card>
    </div>
  );
};
