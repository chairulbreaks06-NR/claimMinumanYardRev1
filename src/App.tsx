import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, addDoc, updateDoc, 
  query, where, onSnapshot, serverTimestamp, orderBy, 
  runTransaction, deleteDoc, getDocs, enableIndexedDbPersistence 
} from 'firebase/firestore';
import { 
  CupSoda, ClipboardList, Users, CheckCircle, Ticket, 
  LogOut, Package, MapPin, Clock, ArrowRight, Lock, 
  User, Edit, Trash2, Building2, WifiOff,
  LayoutDashboard, History, UserCircle, Search, Briefcase, 
  Loader2, BarChart3, TrendingUp, CalendarDays, FileSpreadsheet, Download, Filter,
  Utensils, AlertCircle, Globe, Printer, FileText
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

// Cek Waktu Cut Off (07:30 - 19:00)
const isClaimWindowOpen = () => {
    const now = new Date();
    const hour = now.getHours();
    const min = now.getMinutes();
    const currentMinutes = hour * 60 + min;
    const startMinutes = 7 * 60 + 30; // 07:30
    const endMinutes = 19 * 60;       // 19:00
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

const YARDS = ['Yard Cakung', 'Yard Sukapura', 'Yard Jababeka'];
const DAYS_OPTION = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu', 'Daily'];
const CATEGORY_OPTION = ['Makanan', 'Minuman']; 

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
    csvContent += "Tanggal,Waktu,Nama Karyawan,NRP,Menu,Kategori,Lokasi,Status\n";
    data.forEach(row => {
        const dateTimeStr = formatDateTime(row.timestamp);
        const timeStr = dateTimeStr.split(', ')[1] || '-';
        const sanitizedName = row.userName ? row.userName.replace(/,/g, " ") : "-";
        const sanitizedItem = row.itemName ? row.itemName.replace(/,/g, " ") : "-";
        const category = row.category || 'Minuman';
        const rowString = `${row.date},${timeStr},"${sanitizedName}","${row.userNrp || '-'}","${sanitizedItem}","${category}","${row.area || '-'}",Sukses`;
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in print:hidden">
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
        <div className="bg-red-500 text-white text-[10px] font-bold text-center py-1 absolute top-0 w-full z-50 flex items-center justify-center gap-1 print:hidden">
            <WifiOff size={12} /> MODE OFFLINE
        </div>
    );
};

const MobileWrapper = ({ children, className = "" }) => (
  <div className="fixed inset-0 bg-gray-900 flex justify-center items-center font-sans overflow-hidden touch-none print:relative print:bg-white print:block print:h-auto print:overflow-visible">
    <style>{`
      @media print {
        @page { 
            size: A4 portrait; 
            margin: 1cm; 
        }
        
        body { 
            background-color: #ffffff !important; 
            -webkit-print-color-adjust: exact; 
            font-family: Arial, sans-serif;
            color: #000000 !important;
        }

        /* HIDE ELEMENTS */
        .no-print, button, input, select, .connection-status { 
            display: none !important; 
        }
        
        /* SHOW ELEMENTS */
        .print-only { 
            display: block !important; 
        }
        
        /* RESET CONTAINER STYLES */
        .mobile-container, .bg-indigo-900, .bg-slate-50, .bg-white { 
            box-shadow: none !important; 
            max-width: 100% !important; 
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            border-radius: 0 !important;
            background-color: #ffffff !important; 
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
        }

        /* RESET SUMMARY CARDS COLORS */
        .summary-card {
            background-color: #ffffff !important;
            border: 1px solid #000 !important;
            color: #000 !important;
            box-shadow: none !important;
        }
        .summary-card h2, .summary-card p {
            color: #000 !important;
        }

        /* TABLE STYLING FOR PRINT */
        table { 
            width: 100% !important; 
            border-collapse: collapse; 
            font-size: 10pt; 
            border: 1px solid #000;
        }
        thead { display: table-header-group; }
        tr { break-inside: avoid; }
        th { 
            background-color: #f0f0f0 !important; 
            color: #000 !important; 
            font-weight: bold;
            border: 1px solid #000 !important;
            padding: 8px;
        }
        td { 
            border: 1px solid #000 !important; 
            padding: 6px; 
            text-align: left; 
            color: #000 !important;
        }
        
        ::-webkit-scrollbar { display: none; }
      }
      
      body { overflow: hidden; position: fixed; width: 100%; height: 100%; }
      * { -webkit-tap-highlight-color: transparent; }
    `}</style>
    
    <div className={`w-full h-full md:h-[95dvh] md:max-w-md md:rounded-[2.5rem] bg-gray-50 flex flex-col relative overflow-hidden shadow-2xl mobile-container ${className}`}>
      <ConnectionStatus />
      {children}
    </div>
  </div>
);

const CouponModal = ({ data, onClose }) => {
  if (!data) return null;
  const isFood = data.category === 'Makanan';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 print:hidden">
      <div className="bg-white w-full max-w-xs rounded-3xl overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-300">
        <div className={`${isFood ? 'bg-orange-500' : 'bg-blue-600'} h-32 flex items-center justify-center text-center p-4 relative overflow-hidden`}>
            <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-50" style={{backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2.5px)', backgroundSize: '10px 10px'}}></div>
            <div className="relative z-10">
                <div className="bg-white/20 p-3 rounded-full inline-block mb-2 backdrop-blur-sm">
                  {isFood ? <Utensils className="text-white" size={32} /> : <CupSoda className="text-white" size={32} />}
                </div>
                <h3 className="text-white font-bold text-xl tracking-wider shadow-sm">E-TICKET {isFood ? 'MAKAN' : 'MINUM'}</h3>
                <p className={`${isFood ? 'text-orange-100' : 'text-blue-100'} text-[10px] uppercase font-bold tracking-widest`}>{data.location}</p>
            </div>
        </div>
        
        <div className="p-6 pt-6 text-center bg-white relative">
            <h2 className="text-2xl font-black text-slate-800 mb-2 leading-tight">{data.itemName}</h2>
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

  const LOGO_URL = "https://github.com/chairulbreaks06-NR/ClaimSofdrinkYard/blob/main/logo%20Claim%20Sofdrink%20(1).png?raw=true";

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
    <MobileWrapper className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="flex-1 flex flex-col justify-center px-8 relative z-10 w-full overflow-y-auto">
        <div className="flex flex-col items-center justify-center mb-8">
            <div className="mb-4 animate-in zoom-in duration-500">
                <img 
                    src={LOGO_URL} 
                    alt="Logo Claim Softdrink Baru"
                    className="w-auto h-64 object-contain"
                    key={LOGO_URL} 
                />
            </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
          <div className="relative">
            <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input type="text" placeholder="NRP" className="w-full bg-white/10 text-white placeholder:text-gray-400 border border-white/20 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-400 transition-all"
              value={nrp} onChange={(e) => setNrp(e.target.value)} />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input type="password" placeholder="Password" className="w-full bg-white/10 text-white placeholder:text-gray-400 border border-white/20 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-400 transition-all"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <div className="bg-red-500/20 border border-red-500/50 p-2 rounded-lg"><p className="text-red-200 text-xs text-center font-bold">{error}</p></div>}
          
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-blue-500">
            {loading ? <Loader2 className="animate-spin" /> : 'Masuk'} {!loading && <ArrowRight size={20} />}
          </button>

          <div className="w-full text-center mt-6">
            <p className="text-[10px] text-slate-500 font-medium">APLIKASI BY IRL92 &copy; 2026</p>
          </div>
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

// --- 6. Admin Dashboard ---
const AdminDashboard = ({ user, area, logout }) => {
  const [activeTab, setActiveTab] = useState('history'); 
  const [successMsg, setSuccessMsg] = useState(null);
  
  const [allClaims, setAllClaims] = useState([]); // Local Area Claims
  const [globalClaims, setGlobalClaims] = useState([]); // For General Admin (All Areas)
  const [inventory, setInventory] = useState([]);
  const [usersList, setUsersList] = useState([]);
  
  // Filter Local
  const [filterType, setFilterType] = useState('today'); 
  const [historySearch, setHistorySearch] = useState('');
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());

  // Filter Global
  const [globalStartDate, setGlobalStartDate] = useState(getTodayString());
  const [globalEndDate, setGlobalEndDate] = useState(getTodayString());
  const [globalAreaFilter, setGlobalAreaFilter] = useState('All'); 
  const [globalCategoryFilter, setGlobalCategoryFilter] = useState('All'); 

  // Stok
  const [newItemName, setNewItemName] = useState('');
  const [newItemStock, setNewItemStock] = useState('');
  const [newItemDay, setNewItemDay] = useState('Daily');
  const [newItemCategory, setNewItemCategory] = useState('Makanan'); 
  const [editingItem, setEditingItem] = useState(null); 

  // User Management
  const [newUserNrp, setNewUserNrp] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserAccess, setNewUserAccess] = useState('all'); 
  const [editingUser, setEditingUser] = useState(null); 
  
  // Role
  const [accountType, setAccountType] = useState('user'); 
  const [newUserRole, setNewUserRole] = useState('user'); 
  const [assignedYard, setAssignedYard] = useState(YARDS[0]); 

  // LOGIKA FILTER OTOMATIS
  useEffect(() => {
    const today = new Date();
    const formatDateInput = (d) => d.toISOString().split('T')[0];
    
    if (filterType === 'today') {
        setStartDate(formatDateInput(today));
        setEndDate(formatDateInput(today));
    } else if (filterType === 'week') {
        const past = new Date();
        past.setDate(today.getDate() - 7);
        setStartDate(formatDateInput(past));
        setEndDate(formatDateInput(today));
    } else if (filterType === 'month') {
        const past = new Date();
        past.setDate(today.getDate() - 30);
        setStartDate(formatDateInput(past));
        setEndDate(formatDateInput(today));
    }
  }, [filterType]);

  useEffect(() => {
    if (accountType === 'user') {
        setNewUserRole('user');
    } else {
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
      const q = query(collection(db, 'claims'), where('area', '==', area));
      return onSnapshot(q, (snap) => {
          const fetchedData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          fetchedData.sort((a, b) => {
              const timeA = a.timestamp?.seconds || 0;
              const timeB = b.timestamp?.seconds || 0;
              return timeB - timeA;
          });
          setAllClaims(fetchedData);
      });
  }, [area]);

  // Fetch GLOBAL DATA with Enhanced Filters
  useEffect(() => {
      if (user.role === 'general_admin' && activeTab === 'global') {
          const q = query(collection(db, 'claims'));
          return onSnapshot(q, (snap) => {
              const allData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
              
              const filteredGlobal = allData.filter(item => {
                  const matchDate = item.date >= globalStartDate && item.date <= globalEndDate;
                  const matchArea = globalAreaFilter === 'All' || item.area === globalAreaFilter;
                  const itemCat = item.category || 'Minuman'; 
                  const matchCategory = globalCategoryFilter === 'All' || itemCat === globalCategoryFilter;

                  return matchDate && matchArea && matchCategory;
              });

              filteredGlobal.sort((a,b) => {
                   const timeA = a.timestamp?.seconds || 0;
                   const timeB = b.timestamp?.seconds || 0;
                   return timeB - timeA;
              });
              setGlobalClaims(filteredGlobal