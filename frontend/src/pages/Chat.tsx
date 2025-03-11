import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  IconButton,
  Divider,
  Badge,
  InputAdornment,
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { styled } from '@mui/material/styles';

// Styled components
const ChatContainer = styled(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  height: 'calc(100vh - 64px)',
  backgroundColor: theme.palette.background.default,
}));

const ContactsList = styled(Paper)(({ theme }: { theme: any }) => ({
  width: 320,
  height: '100%',
  overflowY: 'auto',
  borderRight: `1px solid ${theme.palette.divider}`,
}));

const ChatArea = styled(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  height: '100%',
}));

const MessageList = styled(Box)(({ theme }: { theme: any }) => ({
  flexGrow: 1,
  padding: theme.spacing(2),
  overflowY: 'auto',
  backgroundColor: theme.palette.grey[50],
}));

const MessageInput = styled(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const Message = styled(Paper)(({ theme, isOutgoing }: { theme: any; isOutgoing?: boolean }) => ({
  padding: theme.spacing(1, 2),
  marginBottom: theme.spacing(1),
  maxWidth: '70%',
  alignSelf: isOutgoing ? 'flex-end' : 'flex-start',
  backgroundColor: isOutgoing ? theme.palette.primary.light : theme.palette.background.paper,
  color: isOutgoing ? theme.palette.primary.contrastText : theme.palette.text.primary,
  borderRadius: theme.spacing(2),
}));

interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
}

interface ChatMessage {
  id: string;
  text: string;
  timestamp: string;
  isOutgoing: boolean;
  status: 'sent' | 'delivered' | 'read';
}

// Mock data
const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Test WhatsApp',
    avatar: '',
    lastMessage: 'Hello from WhatsApp integration test',
    lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    unread: 1,
  },
  {
    id: '2',
    name: 'John Doe',
    avatar: '',
    lastMessage: 'Hey, how are you?',
    lastMessageTime: '10:30 AM',
    unread: 2,
  },
  {
    id: '3',
    name: 'Jane Smith',
    avatar: '',
    lastMessage: 'Can we schedule a meeting?',
    lastMessageTime: 'Yesterday',
    unread: 0,
  },
  {
    id: '4',
    name: 'Bob Johnson',
    avatar: '',
    lastMessage: 'Thanks for your help!',
    lastMessageTime: 'Yesterday',
    unread: 0,
  },
  {
    id: '5',
    name: 'Alice Brown',
    avatar: '',
    lastMessage: 'I need more information about your product',
    lastMessageTime: 'Monday',
    unread: 0,
  },
];

const mockMessages: Record<string, ChatMessage[]> = {
  '1': [
    {
      id: '1',
      text: 'Hello! This is a WhatsApp integration test.',
      timestamp: new Date(Date.now() - 300000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOutgoing: false,
      status: 'read',
    },
    {
      id: '2',
      text: 'Hi! I\'m testing the WhatsApp integration with your number.',
      timestamp: new Date(Date.now() - 240000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOutgoing: true,
      status: 'delivered',
    },
    {
      id: '3',
      text: 'This message should be sent to +34611151646 when I click send.',
      timestamp: new Date(Date.now() - 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOutgoing: true,
      status: 'sent',
    },
  ],
  '2': [
    {
      id: '1',
      text: 'Hey there!',
      timestamp: '10:15 AM',
      isOutgoing: false,
      status: 'read',
    },
    {
      id: '2',
      text: 'Hi! How can I help you today?',
      timestamp: '10:16 AM',
      isOutgoing: true,
      status: 'read',
    },
    {
      id: '3',
      text: 'I have a question about your service',
      timestamp: '10:18 AM',
      isOutgoing: false,
      status: 'read',
    },
    {
      id: '4',
      text: 'Sure, I\'d be happy to answer any questions you have. What would you like to know?',
      timestamp: '10:20 AM',
      isOutgoing: true,
      status: 'read',
    },
    {
      id: '5',
      text: 'What are your business hours?',
      timestamp: '10:25 AM',
      isOutgoing: false,
      status: 'read',
    },
    {
      id: '6',
      text: 'We\'re open Monday to Friday, 9 AM to 6 PM.',
      timestamp: '10:26 AM',
      isOutgoing: true,
      status: 'delivered',
    },
    {
      id: '7',
      text: 'Thanks! And do you offer weekend support?',
      timestamp: '10:30 AM',
      isOutgoing: false,
      status: 'read',
    },
  ],
};

const Chat: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(mockContacts[0]);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(
    selectedContact ? mockMessages[selectedContact.id] || [] : []
  );
  const [sendingMessage, setSendingMessage] = useState(false);

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setMessages(mockMessages[contact.id] || []);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedContact) return;

    // Create new message object
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOutgoing: true,
      status: 'sent',
    };

    // Add message to UI immediately
    setMessages([...messages, newMessage]);
    const sentText = messageText;
    setMessageText('');
    
    // For the test WhatsApp contact, actually send the message via API
    if (selectedContact.id === '1') {
      setSendingMessage(true);
      try {
        // Get the phone number from the contact in Contacts.tsx
        // For now we're hardcoding it since we know it's your number
        const phoneNumber = '+34611151646';
        
        const response = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: phoneNumber,
            body: sentText,
            type: 'text'
          }),
        });
        
        if (response.ok) {
          // Update message status to delivered
          setMessages(prev => 
            prev.map(msg => 
              msg.id === newMessage.id 
                ? { ...msg, status: 'delivered' as const } 
                : msg
            )
          );
          console.log('Message sent successfully');
        } else {
          console.error('Failed to send message:', await response.text());
          // You might want to show an error to the user
        }
      } catch (error) {
        console.error('Error sending message:', error);
        // You might want to show an error to the user
      } finally {
        setSendingMessage(false);
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <ChatContainer>
      <ContactsList elevation={0}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search contacts"
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Divider />
        <List disablePadding>
          {mockContacts.map((contact) => (
            <ListItem
              key={contact.id}
              button
              selected={selectedContact?.id === contact.id}
              onClick={() => handleContactSelect(contact)}
              divider
            >
              <ListItemAvatar>
                <Badge
                  color="primary"
                  badgeContent={contact.unread}
                  invisible={contact.unread === 0}
                >
                  <Avatar src={contact.avatar}>{contact.name.charAt(0)}</Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={contact.name}
                secondary={contact.lastMessage}
                primaryTypographyProps={{
                  fontWeight: contact.unread > 0 ? 'bold' : 'normal',
                }}
                secondaryTypographyProps={{
                  noWrap: true,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {contact.lastMessageTime}
              </Typography>
            </ListItem>
          ))}
        </List>
      </ContactsList>

      <ChatArea>
        {selectedContact ? (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Avatar src={selectedContact.avatar} sx={{ mr: 2 }}>
                {selectedContact.name.charAt(0)}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1">{selectedContact.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Online
                </Typography>
              </Box>
              <IconButton>
                <MoreVertIcon />
              </IconButton>
            </Box>

            <MessageList>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                {messages.map((message) => (
                  <Message key={message.id} isOutgoing={message.isOutgoing}>
                    <Typography variant="body1">{message.text}</Typography>
                    <Typography
                      variant="caption"
                      color={message.isOutgoing ? 'inherit' : 'text.secondary'}
                      sx={{ display: 'block', textAlign: 'right', mt: 0.5, opacity: 0.8 }}
                    >
                      {message.timestamp}
                    </Typography>
                  </Message>
                ))}
              </Box>
            </MessageList>

            <MessageInput>
              <IconButton sx={{ mr: 1 }}>
                <AttachFileIcon />
              </IconButton>
              <TextField
                fullWidth
                placeholder="Type a message"
                variant="outlined"
                size="small"
                value={messageText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                multiline
                maxRows={4}
                disabled={sendingMessage}
              />
              <IconButton 
                color="primary" 
                onClick={handleSendMessage} 
                sx={{ ml: 1 }}
                disabled={sendingMessage || !messageText.trim()}
              >
                {sendingMessage ? <CircularProgress size={24} /> : <SendIcon />}
              </IconButton>
            </MessageInput>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Select a contact to start chatting
            </Typography>
          </Box>
        )}
      </ChatArea>
    </ChatContainer>
  );
};

export default Chat; 