import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  MapPin, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  XCircle,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { storage } from '../services/storage';
import { Attendance as AttendanceType, User } from '../types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export default function Attendance({ user }: { user: User }) {
  const [attendances, setAttendances] = useState<AttendanceType[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!user) return;

    const loadAttendances = () => {
      const allAttendances = storage.getAll<AttendanceType>('attendance');
      setAttendances(allAttendances.filter(a => a.userId === user.id).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    };

    loadAttendances();
    return storage.subscribe(loadAttendances);
  }, [user]);

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error('Location error:', err)
      );
    } catch (err) {
      console.error('Camera error:', err);
      alert('Gagal mengakses kamera.');
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        setPhoto(canvasRef.current.toDataURL('image/jpeg'));
        
        // Stop camera
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleAttendance = (type: 'in' | 'out') => {
    if (!photo || !location) return;
    setIsLoading(true);

    try {
      storage.add('attendance', {
        userId: user.id,
        branchId: user.branchId,
        type,
        timestamp: new Date().toISOString(),
        location,
        photoUrl: photo
      });

      setPhoto(null);
      setLocation(null);
      setIsCapturing(false);
      alert(`Berhasil Absen ${type === 'in' ? 'Masuk' : 'Pulang'}!`);
    } catch (error) {
      console.error('Attendance error:', error);
      alert('Gagal melakukan absensi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-neutral-800">Absensi Karyawan</h1>
          <p className="text-neutral-500 font-medium mt-1">Lakukan absensi harian dengan verifikasi lokasi & selfie</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Waktu Sekarang</p>
            <p className="text-2xl font-black text-neutral-800">{format(new Date(), 'HH:mm:ss')}</p>
          </div>
          <div className="bg-orange-500 p-4 rounded-2xl text-white shadow-lg shadow-orange-100">
            <Clock size={32} />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance Action */}
        <div className="lg:col-span-2 space-y-6">
          {!isCapturing ? (
            <button 
              onClick={startCamera}
              className="w-full aspect-video bg-white border-2 border-dashed border-neutral-200 rounded-[40px] flex flex-col items-center justify-center gap-6 hover:border-orange-500 hover:bg-orange-50 transition-all group"
            >
              <div className="bg-neutral-100 p-8 rounded-full text-neutral-400 group-hover:bg-orange-500 group-hover:text-white transition-all">
                <Camera size={48} />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-neutral-800">Mulai Absensi</h3>
                <p className="text-neutral-500 mt-1">Klik untuk membuka kamera & verifikasi lokasi</p>
              </div>
            </button>
          ) : (
            <div className="bg-white p-8 rounded-[40px] border border-neutral-200 shadow-xl space-y-6">
              <div className="relative aspect-video bg-neutral-900 rounded-[32px] overflow-hidden">
                {!photo ? (
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={photo} alt="Selfie" className="w-full h-full object-cover" />
                )}
                
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  <div className={`px-4 py-2 rounded-full text-xs font-black flex items-center gap-2 shadow-lg ${location ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    <MapPin size={14} />
                    {location ? 'Lokasi Terdeteksi' : 'Mencari Lokasi...'}
                  </div>
                </div>

                {!photo && (
                  <button 
                    onClick={takePhoto}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white p-6 rounded-full shadow-2xl text-orange-500 hover:scale-110 transition-all"
                  >
                    <Camera size={32} />
                  </button>
                )}
              </div>

              {photo && (
                <div className="flex gap-4">
                  <button 
                    onClick={() => setPhoto(null)}
                    className="flex-1 py-4 font-bold text-neutral-500 hover:text-neutral-700"
                  >
                    Ulangi Foto
                  </button>
                  <div className="flex-[2] flex gap-3">
                    <button 
                      onClick={() => handleAttendance('in')}
                      disabled={isLoading || !location}
                      className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-100 hover:bg-green-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 className="animate-spin" /> : <ArrowUpRight size={20} />}
                      Absen Masuk
                    </button>
                    <button 
                      onClick={() => handleAttendance('out')}
                      disabled={isLoading || !location}
                      className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-red-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 className="animate-spin" /> : <ArrowDownRight size={20} />}
                      Absen Pulang
                    </button>
                  </div>
                </div>
              )}
              
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        </div>

        {/* History */}
        <div className="bg-white border border-neutral-200 rounded-[40px] shadow-xl overflow-hidden flex flex-col">
          <div className="p-8 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-neutral-800">Riwayat Absensi</h2>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Aktivitas Terakhir</p>
            </div>
            <History className="text-neutral-300" size={24} />
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {attendances.map(att => (
              <div key={att.id} className="flex items-start gap-4 p-4 rounded-3xl hover:bg-neutral-50 transition-all">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-neutral-100 shadow-sm">
                  <img src={att.photoUrl} alt="Selfie" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-neutral-800">Absen {att.type === 'in' ? 'Masuk' : 'Pulang'}</h4>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${att.type === 'in' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {att.type}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">{format(new Date(att.timestamp), 'dd MMMM yyyy', { locale: id })}</p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-2 flex items-center gap-1">
                    <Clock size={10} />
                    {format(new Date(att.timestamp), 'HH:mm:ss')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
