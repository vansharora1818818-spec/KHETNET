
export type Language = 
  | 'en' | 'hi' | 'pa' | 'ur' | 'mr' | 'gu' | 'ta' | 'te' 
  | 'kn' | 'ml' | 'bn' | 'as' | 'or' | 'ks' | 'doi' | 'mai' 
  | 'ne' | 'sat' | 'kok' | 'mni' | 'brx' | 'sa' | 'sd';

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
  isSubscribed?: boolean;
  subscriptionTier?: 'free_farmer' | 'premium_farmer' | 'pro_farmer' | 'trader_wholesaler' | 'enterprise' | 'gold' | 'platinum' | null;
  isSuspended?: boolean;
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
