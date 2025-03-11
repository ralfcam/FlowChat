import apiService from './api';

export interface Message {
  id: string;
  contactId: string;
  text: string;
  timestamp: string;
  isOutgoing: boolean;
  status: 'sent' | 'delivered' | 'read';
  mediaUrl?: string;
  mediaType?: 'image' | 'audio' | 'video' | 'document';
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  lastContact: string;
  status: 'active' | 'inactive' | 'blocked';
  profilePicUrl?: string;
  notes?: string;
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppStats {
  activeContacts: number;
  messagesLast24h: number;
  activeFlows: number;
  responseRate: number;
}

const whatsappService = {
  // Messages
  getMessages: (contactId: string): Promise<Message[]> =>
    apiService.get<Message[]>(`/whatsapp/messages/${contactId}`),

  sendMessage: (contactId: string, text: string, mediaUrl?: string): Promise<Message> =>
    apiService.post<Message>('/whatsapp/messages', { contactId, text, mediaUrl }),

  // Contacts
  getContacts: (query?: string, tags?: string[], status?: string): Promise<Contact[]> =>
    apiService.get<Contact[]>('/whatsapp/contacts', { query, tags, status }),

  getContact: (id: string): Promise<Contact> =>
    apiService.get<Contact>(`/whatsapp/contacts/${id}`),

  createContact: (contact: Omit<Contact, 'id'>): Promise<Contact> =>
    apiService.post<Contact>('/whatsapp/contacts', contact),

  updateContact: (id: string, contact: Partial<Contact>): Promise<Contact> =>
    apiService.put<Contact>(`/whatsapp/contacts/${id}`, contact),

  deleteContact: (id: string): Promise<void> =>
    apiService.delete(`/whatsapp/contacts/${id}`),

  // Flows
  getFlows: (): Promise<Flow[]> =>
    apiService.get<Flow[]>('/whatsapp/flows'),

  getFlow: (id: string): Promise<Flow> =>
    apiService.get<Flow>(`/whatsapp/flows/${id}`),

  createFlow: (flow: Omit<Flow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Flow> =>
    apiService.post<Flow>('/whatsapp/flows', flow),

  updateFlow: (id: string, flow: Partial<Flow>): Promise<Flow> =>
    apiService.put<Flow>(`/whatsapp/flows/${id}`, flow),

  deleteFlow: (id: string): Promise<void> =>
    apiService.delete(`/whatsapp/flows/${id}`),

  activateFlow: (id: string): Promise<Flow> =>
    apiService.post<Flow>(`/whatsapp/flows/${id}/activate`),

  deactivateFlow: (id: string): Promise<Flow> =>
    apiService.post<Flow>(`/whatsapp/flows/${id}/deactivate`),

  // Stats
  getStats: (): Promise<WhatsAppStats> =>
    apiService.get<WhatsAppStats>('/whatsapp/stats'),
};

export default whatsappService; 