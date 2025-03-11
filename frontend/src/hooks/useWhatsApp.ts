import { useState, useEffect, useCallback } from 'react';
import whatsappService, { 
  Contact, 
  Message, 
  Flow, 
  WhatsAppStats 
} from '../services/whatsappService';

interface UseWhatsAppOptions {
  autoFetchStats?: boolean;
}

export const useWhatsApp = (options: UseWhatsAppOptions = {}) => {
  const { autoFetchStats = false } = options;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [stats, setStats] = useState<WhatsAppStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch contacts
  const fetchContacts = useCallback(async (query?: string, tags?: string[], status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await whatsappService.getContacts(query, tags, status);
      setContacts(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch contacts');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch messages for a contact
  const fetchMessages = useCallback(async (contactId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await whatsappService.getMessages(contactId);
      setMessages(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch messages');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (contactId: string, text: string, mediaUrl?: string) => {
    setLoading(true);
    setError(null);
    try {
      const message = await whatsappService.sendMessage(contactId, text, mediaUrl);
      setMessages((prev) => [...prev, message]);
      return message;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch flows
  const fetchFlows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await whatsappService.getFlows();
      setFlows(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch flows');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await whatsappService.getStats();
      setStats(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch stats');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new contact
  const createContact = useCallback(async (contact: Omit<Contact, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      const newContact = await whatsappService.createContact(contact);
      setContacts((prev) => [...prev, newContact]);
      return newContact;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create contact');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a contact
  const updateContact = useCallback(async (id: string, contact: Partial<Contact>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedContact = await whatsappService.updateContact(id, contact);
      setContacts((prev) => 
        prev.map((c) => (c.id === id ? updatedContact : c))
      );
      if (selectedContact?.id === id) {
        setSelectedContact(updatedContact);
      }
      return updatedContact;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update contact');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedContact]);

  // Delete a contact
  const deleteContact = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await whatsappService.deleteContact(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      if (selectedContact?.id === id) {
        setSelectedContact(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete contact');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedContact]);

  // Save a flow
  const saveFlow = useCallback(async (flow: Flow) => {
    setLoading(true);
    setError(null);
    try {
      let savedFlow: any;
      if (flow.id) {
        // Update existing flow
        savedFlow = await whatsappService.updateFlow(flow.id, flow);
        setFlows((prev) => 
          prev.map((f) => (f.id === flow.id ? savedFlow : f))
        );
      } else {
        // Create new flow
        const { id, createdAt, updatedAt, ...newFlowData } = flow;
        savedFlow = await whatsappService.createFlow(newFlowData as any);
        setFlows((prev) => [...prev, savedFlow]);
      }
      return savedFlow;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save flow');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a flow
  const deleteFlow = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await whatsappService.deleteFlow(id);
      setFlows((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete flow');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle flow activation
  const toggleFlowActivation = useCallback(async (id: string, activate: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const updatedFlow = activate
        ? await whatsappService.activateFlow(id)
        : await whatsappService.deactivateFlow(id);
      
      setFlows((prev) => 
        prev.map((f) => (f.id === id ? updatedFlow : f))
      );
      return updatedFlow;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle flow activation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch stats if enabled
  useEffect(() => {
    if (autoFetchStats) {
      fetchStats();
    }
  }, [autoFetchStats, fetchStats]);

  return {
    // State
    contacts,
    selectedContact,
    messages,
    flows,
    stats,
    loading,
    error,
    
    // Setters
    setSelectedContact,
    
    // Actions
    fetchContacts,
    fetchMessages,
    sendMessage,
    fetchFlows,
    fetchStats,
    createContact,
    updateContact,
    deleteContact,
    saveFlow,
    deleteFlow,
    toggleFlowActivation,
  };
};

export default useWhatsApp; 