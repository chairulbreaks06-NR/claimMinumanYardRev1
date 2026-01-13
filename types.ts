
import { Timestamp } from 'firebase/firestore';

export interface UserData {
  id?: string;
  uid?: string;
  nrp: string;
  password?: string;
  displayName: string;
  role: 'user' | 'admin_area' | 'general_admin' | 'admin_vendor';
  accessRights?: 'all' | 'food_only' | 'drink_only';
  assignedArea?: string;
  createdAt?: Timestamp;
}

export interface InventoryItem {
  id: string;
  name: string;
  warehouseStock: number;
  area: string;
  day?: string[]; // Diubah menjadi array untuk mendukung banyak hari
  category?: 'Makanan' | 'Minuman';
  createdAt?: Timestamp;
}

export interface Claim {
  id: string;
  userId: string;
  userName: string;
  userNrp: string;
  inventoryId: string;
  itemName: string;
  drinkName?: string; // Legacy support
  date: string;
  category: 'Makanan' | 'Minuman';
  status: string;
  location: string;
  area: string;
  timestamp: Timestamp;
}

export interface ChartData {
  name: string;
  count: number;
  percent: number;
}
