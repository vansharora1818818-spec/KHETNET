
export type Language = 'en' | 'hi' | 'ta' | 'te' | 'pa' | 'kn' | 'ml';

export interface User {
  id: string;
  name: string;
  age: number;
  email: string;
  password?: string;
  mobile?: string;
  role: 'farmer' | 'wholesaler' | 'host' | null;
  state: string;
  region: string;
  language: Language;
}

export interface Product {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerMobile?: string;
  name: string;
  photo: string;
  costPerKg: number;
  maxQuantity: number;
  state: string;
  region: string;
  createdAt: number;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  wholesalerId: string;
  wholesalerName: string;
  farmerId: string;
  farmerName?: string;
  farmerMobile?: string;
  status: 'pending' | 'approved' | 'declined' | 'received';
  expiryTime?: number;
  createdAt: number;
  totalCost: number;
  quantity: number;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  text: string;
  timestamp: number;
  location?: { lat: number; lng: number };
}
