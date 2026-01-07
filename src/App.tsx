import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, addDoc, updateDoc, 
  query, where, onSnapshot, serverTimestamp, orderBy, 
  runTransaction, deleteDoc, getDocs, enableIndexedDbPersistence 
} from 'firebase/firestore';
import { 
  Coffee, ClipboardList, Users, CheckCircle, Ticket, 
  LogOut, Package, MapPin, Clock, ArrowRight, Lock, 
  User, Edit, Trash2, Building2, WifiOff,
  LayoutDashboard, History, UserCircle, Search, Briefcase, 
  Loader2, BarChart3, TrendingUp, CalendarDays, FileSpreadsheet, Download
} from 'lucide-react';

// --- 1. Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDVNvKd6x4Iw_BIvP6OFRB9cSrXXIW5SD4",
  authDomain: "claimlunchmkt.firebaseapp.com",
  projectId: "claimlunchmkt",
  storageBucket: "claimlunchmkt.firebasestorage.app",
  messagingSenderId: "502120224174",
  appId: "1:502120224174:web:d8f3b330ccdb31a825a43f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') console.log('Persistence failed');
    else if (err.code === 'unimplemented') console.log('Persistence not supported');
  });
} catch (e) { console.log("Persistence init error:", e); }

// --- 2. Helpers ---
const formatDate = (date) => date.toISOString().split('T')[0];
const getTodayString = () => formatDate(new Date());
const getDayName = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date().getDay()];
};

const YARDS = ['Yard Cakung', 'Yard Sukapura', 'Yard Jababeka'];
const DAYS_OPTION = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu', 'Setiap Hari'];

const formatDateTime = (timestamp) => {
  if (!timestamp) return '-';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(); 
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(date);
};

const exportToCSV = (data, fileName) => {
    if (!data || data.length === 0) {
        alert("Tidak ada data untuk diunduh.");
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Tanggal,Waktu,Nama Karyawan,NRP,Nama Minuman,Lokasi,Status\n";
    data.forEach(row => {
        const dateTimeStr = formatDateTime(row.timestamp);
        const timeStr = dateTimeStr.split(', ')[1] || '-';
        const sanitizedName = row.userName ? row.userName.replace(/,/g, " ") : "-";
        const sanitizedDrink = row.drinkName ? row.drinkName.replace(/,/g, " ") : "-";
        const rowString = `${row.date},${timeStr},"${sanitizedName}","${row.userNrp || '-'}","${sanitizedDrink}","${row.area || '-'}",Sukses`;
        csvContent += rowString + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}_${getTodayString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- 3. Shared Components ---

const SuccessModal = ({ message, onClose }) => {
    if (!message) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-in zoom-in-95 w-3/4 max-w-sm">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">Berhasil!</h3>
                <p className="text-slate-500 text-sm mb-4 text-center">{message}</p>
                <button onClick={onClose} className="bg-slate-800 text-white px-6 py-2 rounded-xl text-sm font-bold w-full">Tutup</button>
            </div>
        </div>
    );
}

const ConnectionStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    if (isOnline) return null;
    return (
        <div className="bg-red-500 text-white text-[10px] font-bold text-center py-1 absolute top-0 w-full z-50 flex items-center justify-center gap-1">
            <WifiOff size={12} /> MODE OFFLINE
        </div>
    );
};

const MobileWrapper = ({ children, className = "" }) => (
  <div className="fixed inset-0 bg-gray-900 flex justify-center items-center font-sans overflow-hidden touch-none">
    <style>{`
      body { overflow: hidden; position: fixed; width: 100%; height: 100%; }
      * { -webkit-tap-highlight-color: transparent; }
    `}</style>
    
    <div className={`w-full h-full md:h-[95dvh] md:max-w-md md:rounded-[2.5rem] bg-gray-50 flex flex-col relative overflow-hidden shadow-2xl ${className}`}>
      <ConnectionStatus />
      {children}
    </div>
  </div>
);

const CouponModal = ({ data, onClose }) => {
  if (!data) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xs rounded-3xl overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="bg-blue-600 h-32 flex items-center justify-center text-center p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-50" style={{backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2.5px)', backgroundSize: '10px 10px'}}></div>
            <div className="relative z-10">
                <div className="bg-white/20 p-3 rounded-full inline-block mb-2 backdrop-blur-sm">
                  <Ticket className="text-white" size={32} />
                </div>
                <h3 className="text-white font-bold text-xl tracking-wider shadow-sm">KUPON DIGITAL</h3>
                <p className="text-blue-100 text-[10px] uppercase font-bold tracking-widest">{data.location}</p>
            </div>
        </div>
        
        <div className="p-6 pt-6 text-center bg-white relative">
            <h2 className="text-2xl font-black text-slate-800 mb-2 leading-tight">{data.drinkName}</h2>
            <div className="border-2 border-dashed rounded-xl p-3 mb-6 border-green-400 bg-green-50">
                <div className="text-xl font-black uppercase tracking-widest text-green-600">
                  BERHASIL KLAIM
                </div>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg mb-6">
               <div className="text-left">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Waktu</p>
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Clock size={12}/> {formatDateTime(data.timestamp).split(',')[1]}
                  </p>
               </div>
               <div className="text-right border-l pl-3">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Status</p>
                  <p className="text-xs font-bold text-green-600 flex items-center justify-end gap-1"><CheckCircle size={12}/> Selesai</p>
               </div>
            </div>
            <button onClick={onClose} className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-transform">Tutup</button>
        </div>
      </div>
    </div>
  );
};

// --- 4. Login Screen ---
const LoginScreen = ({ onLoginSuccess }) => {
  const [nrp, setNrp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (nrp.toUpperCase() === 'ADMIN' && password === 'GSI2025!') {
        onLoginSuccess({ uid: 'master-admin', nrp: 'ADMIN', role: 'general_admin', displayName: 'Master Admin' });
        return;
      }
      const q = query(collection(db, 'users'), where('nrp', '==', nrp), where('password', '==', password));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        onLoginSuccess({ ...querySnapshot.docs[0].data(), uid: querySnapshot.docs[0].id });
      } else {
        setError('NRP atau Password salah!'); setLoading(false);
      }
    } catch (err) { setError('Koneksi Error'); setLoading(false); }
  };

  return (
    <MobileWrapper className="bg-gradient-to-br from-slate-900 to-indigo-950">
      <div className="flex-1 flex flex-col justify-center px-8 relative z-10 w-full overflow-y-auto">
        <div className="flex justify-center mb-6">
            <img 
                src="https://github.com/chairulbreaks06-NR/ClaimSofdrinkYard/blob/main/logo%20Claim%20Sofdrink%20(1).png?raw=true" 
                alt="Logo Claim Softdrink"
                className="w-auto h-40 object-contain drop-shadow-2xl animate-in zoom-in duration-500"
            />
        </div>
        <p className="text-blue-200 mb-8 text-center text-sm opacity-80">Portal Layanan Karyawan</p>
        <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
          <div className="relative">
            <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input type="text" placeholder="NRP" className="w-full bg-white/10 text-white placeholder:text-gray-400 border border-white/20 rounded-xl py-3 pl-12 pr-4 focus:outline-none"
              value={nrp} onChange={(e) => setNrp(e.target.value)} />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input type="password" placeholder="Password" className="w-full bg-white/10 text-white placeholder:text-gray-400 border border-white/20 rounded-xl py-3 pl-12 pr-4 focus:outline-none"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-red-300 text-xs text-center font-bold">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95">
            {loading ? '...' : 'Masuk'} <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </MobileWrapper>
  );
};

// --- 5. Area Selection ---
const AreaSelectionScreen = ({ user, onSelectArea, onLogout }) => {
  return (
    <MobileWrapper className="bg-slate-50">
      <div className="flex-1 flex flex-col w-full p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8 shrink-0">
            <div><h1 className="text-2xl font-bold text-slate-800">Pilih Area</h1><p className="text-slate-500 text-sm">Halo, {user.displayName}</p></div>
            <button onClick={onLogout} className="text-red-500 bg-red-50 p-2 rounded-full"><LogOut size={18}/></button>
        </div>
        <div className="grid gap-4 w-full">
            {YARDS.map((yard) => (
                <button key={yard} onClick={() => onSelectArea(yard)}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:border-blue-500 transition-all group w-full text-left">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex-shrink-0"><Building2 size={24} /></div>
                        <span className="font-bold text-lg text-slate-700">{yard}</span>
                    </div>
                    <ArrowRight className="text-slate-300 group-hover:text-blue-500" />
                </button>
            ))}
        </div>
      </div>
    </MobileWrapper>
  );
};

// --- 6. Admin Dashboard (UPDATED) ---
const AdminDashboard = ({ user, area, logout }) => {
  const [activeTab, setActiveTab] = useState('history'); 
  const [successMsg, setSuccessMsg] = useState(null);
  
  const [allClaims, setAllClaims] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [usersList, setUsersList] = useState([]);
  
  const [historySearch, setHistorySearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // State Inventory
  const [newItemName, setNewItemName] = useState('');
  const [newItemStock, setNewItemStock] = useState('');
  const [newItemDay, setNewItemDay] = useState('Setiap Hari');
  const [editingItem, setEditingItem] = useState(null); 

  // State User Management
  const [newUserNrp, setNewUserNrp] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserName, setNewUserName] = useState('');
  
  // Logic Role Baru
  const [accountType, setAccountType] = useState('user'); // 'user' atau 'admin'
  const [newUserRole, setNewUserRole] = useState('user'); // 'user', 'admin_area', 'general_admin'

  // Update role otomatis saat accountType berubah
  useEffect(() => {
    if (accountType === 'user') {
        setNewUserRole('user');
    } else {
        // Default ke admin area jika baru pindah ke admin
        if (newUserRole === 'user') setNewUserRole('admin_area');
    }
  }, [accountType]);

  useEffect(() => {
    const q = query(collection(db, 'inventory'), where('area', '==', area));
    return onSnapshot(q, (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setInventory(items);
    });
  }, [area]);

  useEffect(() => {
      const q = query(collection(db, 'claims'), where('area', '==', area), orderBy('timestamp', 'desc'));
      return onSnapshot(q, (snap) => {
          setAllClaims(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
  }, [area]);

  useEffect(() => {
    if(activeTab === 'manage' && user.role !== 'user') {
        const q = user.role === 'general_admin' ? query(collection(db, 'users'), orderBy('displayName')) : query(collection(db, 'users'), where('role', '==', 'user'));
        return onSnapshot(q, (snap) => setUsersList(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
  }, [activeTab, user.role]);

  const showSuccess = (msg) => {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 2000);
  };

  const handleSaveInventory = async (e) => {
    e.preventDefault();
    if (!newItemName || !newItemStock) return;
    try {
        if (editingItem) {
            await updateDoc(doc(db, 'inventory', editingItem.id), { 
                name: newItemName, 
                warehouseStock: parseInt(newItemStock),
                day: newItemDay
            });
            setEditingItem(null);
        } else {
            await addDoc(collection(db, 'inventory'), { 
                name: newItemName, 
                warehouseStock: parseInt(newItemStock), 
                area, 
                day: newItemDay,
                createdAt: serverTimestamp() 
            });
        }
        setNewItemName(''); setNewItemStock(''); setNewItemDay('Setiap Hari'); showSuccess("Stok Disimpan");
    } catch(err) { alert("Error: " + err.message); }
  };

  const startEdit = (item) => {
      setEditingItem(item);
      setNewItemName(item.name);
      setNewItemStock(item.warehouseStock);
      setNewItemDay(item.day || 'Setiap Hari');
  }

  const handleAddUser = async (e) => {
      e.preventDefault();
      try {
          await addDoc(collection(db, 'users'), { 
            nrp: newUserNrp, 
            password: newUserPass, 
            displayName: newUserName, 
            role: newUserRole, 
            createdAt: serverTimestamp() 
          });
          setNewUserNrp(''); setNewUserPass(''); setNewUserName(''); 
          setAccountType('user'); // Reset form
          showSuccess("User Ditambahkan");
      } catch (e) { alert("Gagal tambah user"); }
  };

  const statsData = useMemo(() => {
      const totalClaims = allClaims.length;
      const drinkCounts = {};
      allClaims.forEach(claim => {
          const drink = claim.drinkName;
          drinkCounts[drink] = (drinkCounts[drink] || 0) + 1;
      });
      const chartData = Object.keys(drinkCounts).map(drink => ({
          name: drink,
          count: drinkCounts[drink],
          percent: totalClaims > 0 ? Math.round((drinkCounts[drink] / totalClaims) * 100) : 0
      })).sort((a,b) => b.count - a.count);

      return { totalClaims, chartData };
  }, [allClaims]);

  const renderHistory = () => {
      const filteredClaims = allClaims.filter(item => {
          const matchName = item.userName.toLowerCase().includes(historySearch.toLowerCase());
          let matchDate = true;
          if (startDate) matchDate = matchDate && item.date >= startDate;
          if (endDate) matchDate = matchDate && item.date <= endDate;
          return matchName && matchDate;
      });

      return (
        <div className="p-6 pb-28 w-full animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-bold text-slate-700 text-xl mb-4 flex items-center gap-2"><History size={20}/> Riwayat Klaim</h3>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4 space-y-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-3 text-gray-400"/>
                    <input type="text" placeholder="Cari nama karyawan..." className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:border-indigo-400"
                        value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 ml-1">Dari</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-gray-700 focus:outline-none"/>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 ml-1">Sampai</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-gray-700 focus:outline-none"/>
                    </div>
                </div>
                <button 
                    onClick={() => exportToCSV(filteredClaims, `Laporan_GSI_${area}`)}
                    className="w-full bg-green-600 text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-700 active:scale-95 transition-all">
                    <FileSpreadsheet size={16}/> Download Data ({filteredClaims.length})
                </button>
            </div>

            <div className="space-y-3">
                {filteredClaims.length === 0 && <p className="text-center text-gray-400 py-10">Tidak ada riwayat.</p>}
                {filteredClaims.map(claim => (
                    <div key={claim.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-slate-700 text-sm">{claim.userName}</h4>
                            <p className="text-xs text-gray-400 mb-1">{claim.drinkName}</p>
                            <span className="text-[10px] text-gray-400">{formatDateTime(claim.timestamp)}</span>
                        </div>
                        <span className="text-[10px] px-2 py-1 rounded font-bold bg-green-100 text-green-600 flex items-center gap-1"><CheckCircle size={10}/> Sukses</span>
                    </div>
                ))}
            </div>
        </div>
      );
  };

  const renderStats = () => (
      <div className="p-6 pb-28 w-full animate-in fade-in slide-in-from-bottom-4">
          <h3 className="font-bold text-slate-700 text-xl mb-6 flex items-center gap-2"><BarChart3 size={20}/> Statistik Area</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-indigo-600 p-5 rounded-2xl text-white shadow-lg shadow-indigo-200">
                  <p className="text-indigo-200 text-xs font-bold mb-1">Total Klaim</p>
                  <h2 className="text-3xl font-black">{statsData.totalClaims}</h2>
                  <p className="text-[10px] opacity-80 mt-2">Semua Waktu</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-gray-400 text-xs font-bold mb-1">Minuman Favorit</p>
                  <h2 className="text-xl font-bold text-slate-800 line-clamp-2">{statsData.chartData[0]?.name || '-'}</h2>
                  <p className="text-[10px] text-green-600 font-bold mt-2 flex items-center gap-1"><TrendingUp size={12}/> {statsData.chartData[0]?.count || 0} Klaim</p>
              </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h4 className="font-bold text-slate-700 mb-4 text-sm">Distribusi Minuman</h4>
              <div className="space-y-4">
                  {statsData.chartData.map((data, index) => (
                      <div key={index}>
                          <div className="flex justify-between text-xs mb-1"><span className="font-bold text-slate-600">{data.name}</span><span className="text-slate-400">{data.count} ({data.percent}%)</span></div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${data.percent}%` }}></div></div>
                      </div>
                  ))}
                  {statsData.chartData.length === 0 && <p className="text-center text-xs text-gray-400">Belum ada data statistik.</p>}
              </div>
          </div>
      </div>
  );

  const renderManage = () => (
      <div className="p-6 pb-28 space-y-8 w-full animate-in fade-in slide-in-from-bottom-4">
          <div>
            <h3 className="font-bold text-slate-700 text-lg mb-3 flex items-center gap-2"><Package size={18}/> Kelola Stok</h3>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 mb-4">
                <form onSubmit={handleSaveInventory} className="space-y-2">
                    <input required placeholder="Nama Minuman" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-gray-900" value={newItemName} onChange={e=>setNewItemName(e.target.value)} />
                    <div className="flex gap-2">
                        <input required type="number" placeholder="Jumlah" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-gray-900" value={newItemStock} onChange={e=>setNewItemStock(e.target.value)} />
                        <select className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-gray-900" value={newItemDay} onChange={e=>setNewItemDay(e.target.value)}>
                            {DAYS_OPTION.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <button type="submit" className={`px-4 py-2 rounded-lg text-white font-bold text-sm w-full ${editingItem ? 'bg-orange-500' : 'bg-indigo-600'}`}>{editingItem ? 'Update' : 'Simpan'}</button>
                    {editingItem && <button type="button" onClick={()=>{setEditingItem(null); setNewItemName(''); setNewItemStock(''); setNewItemDay('Setiap Hari');}} className="w-full bg-gray-100 text-gray-500 py-2 rounded-lg text-xs font-bold">Batal Edit</button>}
                </form>
            </div>
            <div className="space-y-2">
                {inventory.map(item => (
                    <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-50 p-2 rounded-lg"><Coffee size={16} className="text-indigo-500"/></div>
                            <div>
                                <div className="font-bold text-slate-700 text-sm">{item.name}</div>
                                <div className="text-[10px] text-gray-400 flex items-center gap-2">
                                    <span>Sisa: {item.warehouseStock}</span>
                                    <span className="bg-gray-100 px-1.5 rounded text-gray-500">{item.day || 'Setiap Hari'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={()=>startEdit(item)} className="p-2 bg-orange-50 text-orange-500 rounded-lg"><Edit size={14}/></button>
                            <button onClick={()=>confirm("Hapus?") && deleteDoc(doc(db, 'inventory', item.id))} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))}
            </div>
          </div>
          {(user.role === 'general_admin' || user.role === 'admin_area') && (
              <div>
                 <h3 className="font-bold text-slate-700 text-lg mb-3 flex items-center gap-2"><Users size={18}/> Kelola User</h3>
                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-100 mb-4">
                    <form onSubmit={handleAddUser} className="space-y-3">
                        <input required placeholder="Nama Lengkap" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-gray-900" value={newUserName} onChange={e=>setNewUserName(e.target.value)} />
                        
                        <div className="flex gap-2">
                            <input required type="text" placeholder="NRP" className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-gray-900" value={newUserNrp} onChange={e=>setNewUserNrp(e.target.value)} />
                            <input required type="text" placeholder="Password" className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-gray-900" value={newUserPass} onChange={e=>setNewUserPass(e.target.value)} />
                        </div>
                        
                        {/* UPDATE: Dropdown Pilihan Role */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 ml-1">Tipe Akun</label>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs font-bold text-slate-700"
                                    value={accountType} 
                                    onChange={(e) => setAccountType(e.target.value)}
                                >
                                    <option value="user">User Karyawan</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>

                            {/* Tampilkan Pilihan Otoritas Hanya Jika Tipe Akun = Admin */}
                            {accountType === 'admin' && (
                                <div className="animate-in fade-in zoom-in-95">
                                    <label className="text-[10px] font-bold text-gray-400 ml-1">Otoritas</label>
                                    <select 
                                        className="w-full bg-purple-50 border border-purple-200 rounded-lg px-2 py-2 text-xs font-bold text-purple-700"
                                        value={newUserRole} 
                                        onChange={(e) => setNewUserRole(e.target.value)}
                                    >
                                        <option value="admin_area">Admin Area</option>
                                        <option value="general_admin">Admin General</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded-lg font-bold text-sm mt-2 hover:bg-purple-700 transition-colors">Tambah User</button>
                    </form>
                 </div>
                 <div className="space-y-2 max-h-60 overflow-y-auto">
                      {usersList.map(u => (
                          <div key={u.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                              <div><div className="font-bold text-sm text-slate-700">{u.displayName}</div><div className="text-[10px] text-gray-400">{u.nrp}</div></div>
                              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${u.role === 'user' ? 'bg-gray-100 text-gray-600' : 'bg-purple-100 text-purple-600'}`}>
                                {u.role === 'general_admin' ? 'General' : u.role === 'admin_area' ? 'Admin Area' : 'User'}
                              </span>
                          </div>
                      ))}
                 </div>
              </div>
          )}
      </div>
  );

  // --- MENU BUTTON HELPER ---
  const MenuButton = ({ id, label, icon: Icon }) => (
      <button 
        onClick={() => setActiveTab(id)} 
        className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-lg transition-all duration-300 ${
            activeTab === id 
            ? 'bg-white text-indigo-900 shadow-md transform scale-100' 
            : 'text-indigo-200 hover:bg-white/10 hover:text-white'
        }`}
      >
        <Icon size={18} strokeWidth={activeTab === id ? 2.5 : 2} className="mb-1"/>
        <span className="text-[10px] font-bold tracking-wide">{label}</span>
      </button>
  );

  return (
    <MobileWrapper className="bg-slate-50">
      <SuccessModal message={successMsg} onClose={() => setSuccessMsg(null)} />
      
      {/* HEADER FIXED + NAVIGASI BARU DI ATAS */}
      <div className="bg-indigo-900 pt-6 pb-4 px-6 rounded-b-[2rem] shadow-xl flex flex-col w-full shrink-0 z-20 relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
         <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/20 rounded-full -ml-5 -mb-5 blur-xl"></div>

         <div className="flex justify-between items-start mb-4 relative z-10">
             <div>
                <h2 className="text-xl font-black text-white tracking-tight">Admin Panel</h2>
                <p className="text-xs text-indigo-300 flex items-center gap-1 font-medium mt-0.5">
                    <MapPin size={10} className="text-orange-400"/> {area}
                </p>
             </div>
             <button onClick={logout} className="bg-white/10 backdrop-blur-sm p-2 rounded-full hover:bg-white/20 text-white transition-colors border border-white/5">
                <LogOut size={16}/>
             </button>
         </div>

         {/* MENU NAVIGASI (Segmented Control Style) */}
         <div className="bg-indigo-950/50 p-1.5 rounded-xl flex gap-1 backdrop-blur-md border border-white/5 relative z-10">
            <MenuButton id="history" label="Riwayat" icon={History} />
            <MenuButton id="stats" label="Statistik" icon={BarChart3} />
            <MenuButton id="manage" label="Kelola" icon={Briefcase} />
         </div>
      </div>
      
      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto w-full overscroll-none scrollbar-hide bg-slate-50">
          {activeTab === 'history' && renderHistory()}
          {activeTab === 'stats' && renderStats()}
          {activeTab === 'manage' && renderManage()}
      </div>
      
      {/* FOOTER DIHAPUS - Area Bawah Kosong untuk Scroll */}
    </MobileWrapper>
  );
};

// --- 7. Employee Dashboard ---
const EmployeeDashboard = ({ user, area, logout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [menuItems, setMenuItems] = useState([]);
  const [todaysClaim, setTodaysClaim] = useState(null);
  const [showCoupon, setShowCoupon] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [isClaiming, setIsClaiming] = useState(false); 
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'inventory'), where('area', '==', area));
    return onSnapshot(q, (snap) => {
        const allItems = snap.docs.map(d => ({id: d.id, ...d.data()}));
        const todayName = getDayName();
        const filteredMenu = allItems.filter(item => {
            return !item.day || item.day === 'Setiap Hari' || item.day === todayName;
        });
        filteredMenu.sort((a,b) => a.name.localeCompare(b.name));
        setMenuItems(filteredMenu);
    });
  }, [area]);

  useEffect(() => {
    const q = query(collection(db, 'claims'), where('userId', '==', user.uid), where('date', '==', getTodayString()));
    return onSnapshot(q, (snap) => {
      if (!snap.empty) setTodaysClaim({ id: snap.docs[0].id, ...snap.docs[0].data() });
      else setTodaysClaim(null);
    });
  }, [user]);

  useEffect(() => {
      if (activeTab === 'history') {
          const q = query(collection(db, 'claims'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'));
          return onSnapshot(q, (snap) => setHistoryList(snap.docs.map(d => ({id: d.id, ...d.data()}))));
      }
  }, [activeTab, user]);

  const userStats = useMemo(() => {
      const total = historyList.length;
      const counts = {};
      historyList.forEach(item => {
          counts[item.drinkName] = (counts[item.drinkName] || 0) + 1;
      });
      const breakdown = Object.keys(counts).map(name => ({
          name,
          count: counts[name],
          percent: total > 0 ? Math.round((counts[name] / total) * 100) : 0
      })).sort((a, b) => b.count - a.count);

      return { total, breakdown };
  }, [historyList]);

  const handleOrder = async (item) => {
    if (todaysClaim) return;
    if (isClaiming) return;
    if (item.warehouseStock <= 0) { alert("Stok Habis!"); return; }
    
    setIsClaiming(true);
    try {
        await runTransaction(db, async (t) => {
             const invRef = doc(db, 'inventory', item.id);
             const invDoc = await t.get(invRef);
             if (!invDoc.exists()) throw new Error("Item tidak ditemukan!");
             const currentStock = invDoc.data().warehouseStock;
             
             if (currentStock <= 0) throw new Error("Stok habis saat diproses!");

             const newClaimRef = doc(collection(db, 'claims'));
             t.set(newClaimRef, {
                userId: user.uid, userName: user.displayName, userNrp: user.nrp || '-',
                inventoryId: item.id, drinkName: item.name, date: getTodayString(),
                status: 'completed', location: area, area: area, timestamp: serverTimestamp()
             });

             t.update(invRef, { warehouseStock: currentStock - 1 });
        });
        
        setShowCoupon(true);
    } catch (e) { 
        alert("Gagal klaim: " + e.message); 
    } finally {
        setIsClaiming(false);
    }
  };

  const renderDashboard = () => (
    <div className="p-6 pb-28 w-full">
         <div className={`p-5 rounded-3xl text-white shadow-xl mb-6 relative overflow-hidden ${todaysClaim ? 'bg-slate-800' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
             <div className="relative z-10">
                 <p className="text-xs opacity-80 mb-1">Status Hari Ini</p>
                 <h3 className="text-2xl font-bold flex items-center gap-2">
                     {todaysClaim ? 'Berhasil Klaim' : 'Belum Klaim'}
                     {todaysClaim && <CheckCircle size={20} className="text-green-400"/>}
                 </h3>
                 {todaysClaim && (
                     <button onClick={()=>setShowCoupon(true)} className="mt-3 bg-white/20 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-white/30 transition-all">
                         <Ticket size={14}/> Lihat E-Tiket
                     </button>
                 )}
             </div>
             <ClipboardList className="absolute right-4 bottom-4 text-white/10" size={60} />
         </div>

         <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-700">Menu Tersedia</h3>
            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-bold flex items-center gap-1"><CalendarDays size={12}/> {getDayName()}</span>
         </div>
         
         <div className="space-y-3">
             {menuItems.length === 0 && <p className="text-gray-400 text-center text-sm py-10">Tidak ada menu untuk hari ini.</p>}
             {menuItems.map(item => (
                 <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center flex-shrink-0"><Coffee size={24}/></div>
                         <div>
                             <div className="font-bold text-slate-800">{item.name}</div>
                             <div className={`text-xs font-bold px-2 py-0.5 rounded-md w-fit mt-1 flex items-center gap-1 ${item.warehouseStock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                 <Package size={10} /> Stok: {item.warehouseStock}
                             </div>
                         </div>
                     </div>
                     <button 
                       disabled={todaysClaim || item.warehouseStock <= 0 || isClaiming} 
                       onClick={()=>handleOrder(item)}
                       className={`px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 flex-shrink-0 flex items-center justify-center ${todaysClaim || item.warehouseStock <= 0 ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                         {isClaiming ? <Loader2 className="animate-spin" size={16}/> : (todaysClaim ? 'Selesai' : item.warehouseStock <= 0 ? 'Habis' : 'Klaim')}
                     </button>
                 </div>
             ))}
         </div>
    </div>
  );

  const renderHistory = () => {
      const filteredHistory = historyList.filter(item => {
          let matchDate = true;
          if (startDate) matchDate = matchDate && item.date >= startDate;
          if (endDate) matchDate = matchDate && item.date <= endDate;
          return matchDate;
      });

      return (
        <div className="p-6 pb-28 w-full">
            <h3 className="font-bold text-slate-700 mb-4 text-xl">Riwayat & Statistik</h3>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
                <div className="flex items-center gap-4 mb-4 border-b border-slate-50 pb-4">
                    <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                        <Coffee size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Total Minuman</p>
                        <h2 className="text-2xl font-black text-slate-800">{userStats.total} <span className="text-xs font-normal text-gray-400">Gelas</span></h2>
                    </div>
                </div>
                <div className="space-y-3">
                    {userStats.breakdown.slice(0, 5).map((item, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-slate-600">{item.name}</span>
                                <span className="text-slate-400">{item.count} ({item.percent}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${item.percent}%` }}></div>
                            </div>
                        </div>
                    ))}
                    {userStats.total === 0 && <p className="text-center text-xs text-gray-400">Belum ada statistik.</p>}
                </div>
            </div>

            <h4 className="font-bold text-slate-700 mb-3 text-sm">Daftar Riwayat</h4>
            
            <div className="bg-white p-3 rounded-2xl border border-slate-100 mb-4 shadow-sm">
                 <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 ml-1">Dari</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2 text-xs text-gray-700 focus:outline-none"/>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 ml-1">Sampai</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2 text-xs text-gray-700 focus:outline-none"/>
                    </div>
                </div>
                <button 
                    onClick={() => exportToCSV(filteredHistory, `Riwayat_Saya_${user.nrp}`)}
                    className="w-full bg-slate-800 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-900 active:scale-95 transition-all">
                    <Download size={14}/> Download Riwayat
                </button>
            </div>

            <div className="space-y-3">
                {filteredHistory.length === 0 && <p className="text-gray-400 text-center mt-4 text-xs">Belum ada riwayat di tanggal ini.</p>}
                {filteredHistory.map(item => (
                    <div key={item.id} onClick={() => {if(item.date === getTodayString()) setShowCoupon(true)}} className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden ${item.date === getTodayString() ? 'cursor-pointer ring-1 ring-blue-400' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-slate-800">{item.drinkName}</span>
                            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{item.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="text-xs font-bold px-2 py-1 rounded flex items-center gap-1 bg-green-100 text-green-600">
                                <CheckCircle size={12}/> Berhasil
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      );
  };

  const renderProfile = () => (
      <div className="p-6 pb-28 w-full">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center mb-6">
              <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-slate-400"><User size={40} /></div>
              <h2 className="text-xl font-bold text-slate-800">{user.displayName}</h2>
              <p className="text-slate-500 text-sm mb-4">{user.nrp || 'No NRP'}</p>
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2"><MapPin size={14} /> {area}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <button onClick={logout} className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50 text-red-500 font-bold">
                  <span className="flex items-center gap-3"><LogOut size={18}/> Keluar Akun</span><ArrowRight size={16} className="text-red-300"/>
              </button>
          </div>
          <p className="text-center text-gray-300 text-xs mt-8">Versi Aplikasi 2.9.1 Admin Update</p>
      </div>
  );

  return (
    <MobileWrapper className="bg-slate-50">
      {showCoupon && <CouponModal data={todaysClaim} onClose={() => setShowCoupon(false)} />}
      
      {/* HEADER FIXED */}
      <div className="bg-white px-6 py-4 rounded-b-3xl shadow-sm flex justify-between items-center w-full shrink-0 z-20">
         <div><h2 className="text-lg font-bold text-slate-800">{activeTab === 'dashboard' ? 'Beranda' : activeTab === 'history' ? 'Riwayat' : 'Profil Saya'}</h2><p className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={10}/> {area}</p></div>
         <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">{user.displayName.charAt(0)}</div>
      </div>
      
      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto w-full overscroll-none scrollbar-hide">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'history' && renderHistory()}
          {activeTab === 'profile' && renderProfile()}
      </div>
      
      {/* FOOTER FIXED */}
      <div className="bg-white border-t border-slate-100 py-3 px-6 pb-6 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-30 flex justify-between items-center shrink-0">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dashboard' ? 'text-blue-600 scale-105' : 'text-slate-400'}`}>
              <div className={`p-1.5 rounded-xl ${activeTab === 'dashboard' ? 'bg-blue-50' : 'bg-transparent'}`}><LayoutDashboard size={22} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} /></div>
              <span className="text-[10px] font-bold">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'history' ? 'text-blue-600 scale-105' : 'text-slate-400'}`}>
              <div className={`p-1.5 rounded-xl ${activeTab === 'history' ? 'bg-blue-50' : 'bg-transparent'}`}><History size={22} strokeWidth={activeTab === 'history' ? 2.5 : 2} /></div>
              <span className="text-[10px] font-bold">Riwayat</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-blue-600 scale-105' : 'text-slate-400'}`}>
              <div className={`p-1.5 rounded-xl ${activeTab === 'profile' ? 'bg-blue-50' : 'bg-transparent'}`}><UserCircle size={22} strokeWidth={activeTab === 'profile' ? 2.5 : 2} /></div>
              <span className="text-[10px] font-bold">Profil</span>
          </button>
      </div>
    </MobileWrapper>
  );
};

// --- 8. Main App ---
const App = () => {
  const [user, setUser] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const handleLogout = () => { setUser(null); setSelectedArea(null); };

  if (!user) return <LoginScreen onLoginSuccess={setUser} />;
  if (!selectedArea) return <AreaSelectionScreen user={user} onSelectArea={setSelectedArea} onLogout={handleLogout} />;
  if (['admin_area', 'general_admin'].includes(user.role)) return <AdminDashboard user={user} area={selectedArea} logout={handleLogout} />;
  return <EmployeeDashboard user={user} area={selectedArea} logout={handleLogout} />;
};

export default App;