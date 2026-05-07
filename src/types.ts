
export type Language = 'en' | 'hi' | 'ta' | 'te';

export interface User {
  id: string;
  name: string;
  age: number;
  email: string;
  mobile?: string;
  role: 'farmer' | 'wholesaler' | null;
  state: string;
  region: string;
  language: Language;
}

export interface Product {
  id: string;
  farmerId: string;
  farmerName: string;
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
  status: 'pending' | 'approved' | 'declined';
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
