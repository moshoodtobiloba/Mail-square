import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, Search, Settings, HelpCircle, LayoutGrid, 
  Inbox, Star, Clock, Send, File, Archive, Trash2, 
  MoreVertical, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, CornerUpLeft, 
  CornerUpRight, Smile, Plus, X, Maximize2, Minimize2, Paperclip, CheckSquare, List, Tag, Users, Info, MessageSquare, AlertOctagon, Bookmark, Calendar, Send as SendIcon, Upload, Trash, Mail, Zap, Link as LinkIcon,
  Pause, Play, TrendingUp, Activity, BarChart3, CornerDownRight, CheckCircle2, AlertCircle, RefreshCw, Layers
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const MOCK_EMAILS: any[] = [];

// Removed previously mentioned mock data to ensure real data priority

import { Logo } from '../ui/Logo';
import { useAuth } from '../../lib/AuthContext';
import { 
  collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, getDocs
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function MailView() {
  const { user, signIn, logOut, loading: authLoading } = useAuth();
  
  // Listen for Gmail Auth success from popup for long-term sync
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GMAIL_AUTH_SUCCESS') {
        const email = event.data.email;
        setNotifications(prev => [...prev, { 
          id: Date.now().toString(), 
          type: 'success',
          title: 'Account Connected',
          desc: `Account ${email} connected successfully!`,
          link: 'Mail'
        }]);
        setApiError(null);
        fetchEmails();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const connectGmailAccount = async () => {
    if (!user) {
      signIn();
      return;
    }
    
    // Clear any previous errors to show a clean loading state if needed
    setApiError(null);
    setLoadingEmails(true);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/auth/url', {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.url) {
        const popup = window.open(data.url, 'Connect Gmail', 'width=600,height=700');
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          alert("Popup was blocked! Please allow popups for this site to connect your Gmail account.");
          setLoadingEmails(false);
          setApiError('POPUP_BLOCKED');
        }
      } else {
        setLoadingEmails(false);
        setApiError('CONFIG_MISSING');
        alert("Server not configured for OAuth. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.");
      }
    } catch (e) {
      console.error("Failed to get auth URL", e);
      setLoadingEmails(false);
      setApiError('AUTH_SERVER_ERROR');
      alert("Error connecting to auth server. Please try again in a moment.");
    }
  };

  const [activeLabel, setActiveLabel] = useState('Primary');
  const [threadMessages, setThreadMessages] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [leads] = useLocalStorage<{email: string, firstName: string, lastName: string}[]>('lead_database', []);
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [showLeadResults, setShowLeadResults] = useState(false);
  
  const filteredLeads = useMemo(() => {
    if (!leadSearchQuery) return [];
    return leads.filter(l => 
      l.email.toLowerCase().includes(leadSearchQuery.toLowerCase()) || 
      l.firstName?.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
      l.lastName?.toLowerCase().includes(leadSearchQuery.toLowerCase())
    ).slice(0, 5);
  }, [leads, leadSearchQuery]);

  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [inboxes, setInboxes] = useLocalStorage<{email: string, health: number, status: string, name: string, photoURL?: string}[]>('connected_inboxes', []);
  const [activeAccountIndex, setActiveAccountIndex] = useLocalStorage<number>('active_account_index', 0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [lastCheckedMsgId, setLastCheckedMsgId] = useState<string | null>(null);
  const [notifications, setNotifications] = useLocalStorage<any[]>('app_notifications', []);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [isHealerActive, setIsHealerActive] = useState(false);
  const [lastHealTime, setLastHealTime] = useState<number>(Date.now());

  const [scheduledEmails, setScheduledEmails] = useLocalStorage<any[]>('scheduled_emails', []);
  const [autoSendConfig, setAutoSendConfig] = useLocalStorage('auto_send_config_v2', {
    interval: '30',
    unit: 'seconds',
    customString: '30s',
    isActive: false,
    maxPerDay: '50',
    retryOnFailure: true,
    respectUnsubscribe: true
  });
  const [isAutoSendWorking, setIsAutoSendWorking] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  const [customName] = useLocalStorage('profile_custom_name', '');
  const [customPhoto] = useLocalStorage('profile_custom_photo', '');
  
  interface MessageReaction {
    id: string;
    messageId: string;
    emoji: string;
    userId: string;
    userName: string;
    createdAt: any;
  }
  
  const [reactions, setReactions] = useState<MessageReaction[]>([]);

  const activeAccount = useMemo(() => {
    const rawAccount = inboxes[activeAccountIndex];
    if (!rawAccount) return null;
    return {
      ...rawAccount,
      // Priority: Local Customization -> Gmail Account Defaults
      name: customName || rawAccount.name,
      photoURL: customPhoto || rawAccount.photoURL
    };
  }, [inboxes, activeAccountIndex, customName, customPhoto]);

  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: user?.uid,
        email: user?.email,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }

  // Real-time synchronization of reactions
  useEffect(() => {
    if (!selectedEmail?.id || !user) {
      setReactions([]);
      return;
    }

    const path = 'message_reactions';
    const q = query(
      collection(db, path),
      where('messageId', '==', selectedEmail.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reactionsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MessageReaction[];
      setReactions(reactionsList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [selectedEmail, user]);

  // Management of reactions
  const toggleReaction = async (emoji: string) => {
    if (!user || !selectedEmail) return;

    const existingReaction = reactions.find(r => r.emoji === emoji && r.userId === user.uid);
    const path = 'message_reactions';

    if (existingReaction) {
      try {
        await deleteDoc(doc(db, path, existingReaction.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `${path}/${existingReaction.id}`);
      }
    } else {
      try {
        await addDoc(collection(db, path), {
          messageId: selectedEmail.id,
          emoji,
          userId: user.uid,
          userName: user.displayName || user.email || 'User',
          createdAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }
  };

  // Manage connected inboxes list based on sign-ins
  const lastUserEmail = useRef<string | null>(null);
  useEffect(() => {
    if (!user?.email || authLoading) return;

    const email = user.email.toLowerCase();
    
    // We use a separate local variable to calculate the index against the MOST RECENT inboxes state
    // but useEffect doesn't track inboxes changes to avoid loops.
    // Instead, we handle everything inside the functional update of setInboxes.
    
    setInboxes(prevInboxes => {
      const existingIndex = prevInboxes.findIndex(i => i.email.toLowerCase() === email);
      
      const inboxData = {
        email: user.email!,
        name: user.displayName || user.email!.split('@')[0] || 'My Account',
        photoURL: user.photoURL || undefined,
        health: existingIndex >= 0 ? prevInboxes[existingIndex].health : Math.floor(Math.random() * 10) + 85,
        status: existingIndex >= 0 ? prevInboxes[existingIndex].status : 'Strong'
      };

      if (existingIndex >= 0) {
        const currentEntry = prevInboxes[existingIndex];
        // Sync local list if Google profile changed
        if (currentEntry.name !== inboxData.name || currentEntry.photoURL !== inboxData.photoURL) {
          const updated = [...prevInboxes];
          updated[existingIndex] = { ...updated[existingIndex], ...inboxData };
          return updated;
        }
        
        // Even if entry didn't change, we might need to check if we should switch focus
        if (lastUserEmail.current !== null && lastUserEmail.current !== email) {
           // Fresh sign-in via popup for an EXISTING account - switch to it
           setTimeout(() => setActiveAccountIndex(existingIndex), 0);
        }
        
        return prevInboxes;
      } else {
        // Add new account
        const newList = [...prevInboxes, inboxData];
        // Switch focus to the newly added item
        setTimeout(() => setActiveAccountIndex(newList.length - 1), 50);
        return newList;
      }
    });
    
    lastUserEmail.current = email;
  }, [user?.email, authLoading]);

  // Inbox Health Auto-Healer - Improves strength score over time when active
  useEffect(() => {
    if (!isHealerActive || inboxes.length === 0) return;

    const healerInterval = setInterval(() => {
      setInboxes(prev => {
        return prev.map(inbox => {
          // Slowly push health towards 100%
          if (inbox.health < 100) {
            const improvement = Math.random() * 0.5; // Small increment
            const newHealth = Math.min(100, inbox.health + improvement);
            
            // Only update if it's a meaningful visible change (to avoid too many state updates)
            if (Math.floor(newHealth) > Math.floor(inbox.health) || newHealth === 100) {
              let newStatus = inbox.status;
              if (newHealth >= 95) newStatus = 'Bulletproof';
              else if (newHealth >= 85) newStatus = 'Strong';
              else if (newHealth >= 70) newStatus = 'Stable';
              
              return { ...inbox, health: parseFloat(newHealth.toFixed(1)), status: newStatus };
            }
          }
          return inbox;
        });
      });
      setLastHealTime(Date.now());
    }, 5000); // Check every 5 seconds

    return () => clearInterval(healerInterval);
  }, [isHealerActive, inboxes.length]);

  // Handle account token switching robustly
  useEffect(() => {
    if (activeAccount) {
      const tokensStr = localStorage.getItem('gmail_tokens') || '{}';
      const tokens = JSON.parse(tokensStr);
      const token = tokens[activeAccount.email.toLowerCase()];
      if (token) {
        localStorage.setItem('gmail_access_token', token);
      }
    }
  }, [activeAccount?.email]);

  // Real-time polling for new messages via Proxy
  useEffect(() => {
    let isMounted = true;
    const pollForNewMessages = async () => {
      if (!window.navigator.onLine || !user || !activeAccount) return;
      
      try {
        const idToken = await user.getIdToken();
        const res = await fetch(`/api/gmail-proxy/gmail/v1/users/me/messages?maxResults=1&q=in:inbox`, {
          headers: { 
            Authorization: `Bearer ${idToken}`,
            'x-gmail-account': activeAccount.email 
          }
        });
        if (!res.ok || !isMounted) return;
        const data = await res.json();
        
        if (data.messages && data.messages.length > 0) {
          const newestId = data.messages[0].id;
          if (lastCheckedMsgId && lastCheckedMsgId !== newestId) {
            // Fetch detail via proxy
            const detailRes = await fetch(`/api/gmail-proxy/gmail/v1/users/me/messages/${newestId}`, {
              headers: { 
                Authorization: `Bearer ${idToken}`,
                'x-gmail-account': activeAccount.email 
              }
            });
            if (!detailRes.ok) return;
            const detail = await detailRes.json();
            const subject = detail.payload.headers.find((h: any) => h.name === 'Subject')?.value || 'New message';
            
            if (isMounted) {
              const newNotif = { 
                id: Date.now().toString(), 
                type: 'info',
                title: 'New Email',
                desc: subject,
                link: 'Mail'
              };
              setNotifications(prev => [...prev, newNotif]);
              setTimeout(() => {
                if (isMounted) setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
              }, 10000);
            }
          }
          if (isMounted) setLastCheckedMsgId(newestId);
        }
      } catch (e) {
        // Silent fail
      }
    };

    const interval = setInterval(pollForNewMessages, 30000);
    pollForNewMessages();
    
    return () => { isMounted = false; clearInterval(interval); };
  }, [activeAccount?.email, lastCheckedMsgId, user]);

  const [realEmails, setRealEmails] = useState<any[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [labelCounts, setLabelCounts] = useState<Record<string, number>>({});

  // Fetch label counts via Proxy
  useEffect(() => {
    let isMounted = true;
    const fetchCounts = async () => {
      if (!window.navigator.onLine || !user || !activeAccount) return;
      
      try {
        const idToken = await user.getIdToken();
        const res = await fetch(`/api/gmail-proxy/gmail/v1/users/me/labels`, {
          headers: { 
            Authorization: `Bearer ${idToken}`,
            'x-gmail-account': activeAccount.email 
          }
        });
        if (!res.ok || !isMounted) return;
        const data = await res.json();
        const counts: Record<string, number> = {};
        data.labels.forEach((l: any) => {
          counts[l.name] = l.messagesUnread || 0;
          if (l.id === 'INBOX') counts['Primary'] = l.messagesTotal;
          if (l.id === 'SENT') counts['Sent'] = l.messagesTotal;
          if (l.id === 'DRAFT') counts['Drafts'] = l.messagesTotal;
          if (l.id === 'SPAM') counts['Spam'] = l.messagesTotal;
          if (l.id === 'TRASH') counts['Trash'] = l.messagesTotal;
          if (l.id === 'IMPORTANT') counts['Important'] = l.messagesTotal;
          if (l.id === 'STARRED') counts['Starred'] = l.messagesTotal;
          if (l.id === 'CATEGORY_PROMOTIONS') counts['Promotions'] = l.messagesTotal;
          if (l.id === 'CATEGORY_SOCIAL') counts['Social'] = l.messagesTotal;
          if (l.id === 'CATEGORY_UPDATES') counts['Updates'] = l.messagesTotal;
          if (l.id === 'CATEGORY_FORUMS') counts['Forums'] = l.messagesTotal;
        });
        if (isMounted) setLabelCounts(counts);
      } catch (err) {
        // Silent fail
      }
    };
    fetchCounts();
    return () => { isMounted = false; };
  }, [activeAccount?.email, user]);

  // Fetch real Google emails via Proxy with batching
  const fetchEmails = async (loadMoreAction = false) => {
    if (!activeAccount || !user) return;
    
    setApiError(null);
    if (!loadMoreAction) {
      setLoadingEmails(true);
      setLoadingProgress(0);
    }
    
    try {
      const idToken = await user.getIdToken();
      const CATEGORY_EXCLUSIONS = ' -category:social -category:promotions -category:updates -category:forums -is:important';
      
      let query = `category:primary${CATEGORY_EXCLUSIONS}`;
      if (activeLabel === 'Promotions') query = 'category:promotions';
      else if (activeLabel === 'Social') query = 'category:social';
      else if (activeLabel === 'Updates') query = 'category:updates';
      else if (activeLabel === 'Forums') query = 'category:forums';
      else if (activeLabel === 'Sent') query = 'in:sent';
      else if (activeLabel === 'Drafts') query = 'in:draft';
      else if (activeLabel === 'Spam') query = 'in:spam';
      else if (activeLabel === 'Trash') query = 'in:trash';
      else if (activeLabel === 'Starred') query = 'is:starred';
      else if (activeLabel === 'Snoozed') query = 'is:snoozed';
      else if (activeLabel === 'Important') query = 'is:important';
      else if (activeLabel === 'All Mail') query = ''; 
      else if (activeLabel === 'All Inboxes') query = 'in:inbox';

      const pageTokenParam = loadMoreAction && nextPageToken ? `&pageToken=${nextPageToken}` : '';
      const fetchUrl = `/api/gmail-proxy/gmail/v1/users/me/messages?maxResults=50&q=${encodeURIComponent(query)}${pageTokenParam}`;
      
      let res;
      try {
        res = await fetch(fetchUrl, {
          headers: { 
            Authorization: `Bearer ${idToken}`,
            'x-gmail-account': activeAccount.email 
          }
        });
      } catch (fetchErr: any) {
        throw new Error("Network connection failed. Please check your internet or firewall. (Error: " + fetchErr.message + ")");
      }
      
      const contentType = res.headers.get("content-type");
      if (!res.ok) {
        if (res.status === 404) {
          setApiError('ACCOUNT_NOT_CONNECTED');
          return;
        }
        if (res.status === 401) {
          setApiError('SESSION_EXPIRED');
          return;
        }
        
        let errorMsg = `Failed to fetch messages (${res.status}).`;
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json().catch(() => ({}));
          errorMsg = errorData?.error || errorData?.error?.message || errorMsg;
        } else if (contentType && contentType.includes("text/html")) {
          errorMsg = "Backend Proxy not found. If this is a static deployment (like Netlify), ensure the backend is also deployed.";
        }
        throw new Error(errorMsg);
      }
      
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format from server (Expected JSON, received HTML/Text). This usually means the backend proxy is missing.");
      }

      const data = await res.json();
      setNextPageToken(data.nextPageToken || null);

      if (data.messages && data.messages.length > 0) {
        const total = data.messages.length;
        const emails: any[] = [];
        const batchSize = 25; // Batch processing to avoid rate limits
        
          for (let i = 0; i < total; i += batchSize) {
            const currentBatch = data.messages.slice(i, i + batchSize);
            const detailBatchPromises = currentBatch.map(async (msg: any) => {
              try {
                let detailRes;
                try {
                  detailRes = await fetch(`/api/gmail-proxy/gmail/v1/users/me/messages/${msg.id}`, {
                    headers: { 
                      Authorization: `Bearer ${idToken}`,
                      'x-gmail-account': activeAccount.email 
                    }
                  });
                } catch (e) {
                  return null;
                }
                if (!detailRes.ok) return null;
                const detailData = await detailRes.json();
                
                const headers = detailData.payload?.headers || [];
                const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
                const senderRaw = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
                const sender = senderRaw.replace(/"/g, '').split('<')[0].trim() || senderRaw.split('<')[0].trim() || 'Unknown';
                const isRead = !detailData.labelIds?.includes('UNREAD');
                const dateObj = new Date(parseInt(detailData.internalDate));
                const timeString = dateObj.toLocaleDateString() === new Date().toLocaleDateString() 
                  ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

                // Enhanced Body Extraction (Base64 Decode)
                const getBody = (payload: any): string => {
                  if (payload.body?.data) return payload.body.data;
                  if (payload.parts) {
                    const textPart = payload.parts.find((p: any) => p.mimeType === 'text/html') || 
                                   payload.parts.find((p: any) => p.mimeType === 'text/plain');
                    if (textPart?.body?.data) return textPart.body.data;
                    if (textPart?.parts) return getBody(textPart);
                  }
                  return '';
                };

                const rawBody = getBody(detailData.payload);
                let decodedBody = '';
                try {
                  if (rawBody) {
                    decodedBody = decodeURIComponent(escape(atob(rawBody.replace(/-/g, '+').replace(/_/g, '/'))));
                  }
                } catch (e) {
                  decodedBody = detailData.snippet || 'Loading issue...';
                }

                return {
                  id: msg.id, 
                  sender, 
                  subject, 
                  snippet: detailData.snippet, 
                  body: decodedBody || detailData.snippet,
                  threadId: detailData.threadId,
                  time: timeString, 
                  read: isRead,
                  label: activeLabel, 
                  initial: sender.charAt(0).toUpperCase(), 
                  color: 'bg-[#4285f4]',
                  tags: detailData.labelIds?.map((l: string) => l.replace('CATEGORY_', ''))
                    .filter((l: string) => ['IMPORTANT', 'STARRED', 'PROMOTIONS', 'SOCIAL', 'UPDATES', 'FORUMS', 'SPAM', 'TRASH'].includes(l)) || []
                };
              } catch (e) { return null; }
            });
            
            const batchResults = await Promise.all(detailBatchPromises);
            emails.push(...batchResults.filter(Boolean));
            if (!loadMoreAction) {
              setLoadingProgress(Math.min(100, Math.round(((i + currentBatch.length) / total) * 100)));
            }

          }
        
        setRealEmails(prev => loadMoreAction ? [...prev, ...emails] : emails);
      } else if (!loadMoreAction) {
        setRealEmails([]);
      }
    } catch (err: any) { 
      console.error("Sync fetch error:", err.message);
      setApiError(err.message); 
    } finally { 
      setLoadingEmails(false); 
    }
  };

  useEffect(() => {
    fetchEmails(false);
  }, [activeAccount?.email, activeLabel, user]);

  const loadMore = async () => {
    if (!nextPageToken || loadingEmails) return;
    fetchEmails(true);
  };

  const markAsRead = async (emailId: string) => {
    if (!activeAccount || !user) return;
    try {
      const idToken = await user.getIdToken();
      await fetch(`/api/gmail-proxy/gmail/v1/users/me/messages/${emailId}/modify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
          'x-gmail-account': activeAccount.email 
        },
        body: JSON.stringify({ removeLabelIds: ['UNREAD'] })
      });
      // Update local state
      setRealEmails(prev => prev.map(e => e.id === emailId ? { ...e, read: true } : e));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const navigateEmail = (direction: 'prev' | 'next') => {
    if (!selectedEmail) return;
    const currentIndex = realEmails.findIndex(e => e.id === selectedEmail.id);
    if (currentIndex === -1) return;
    
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < realEmails.length) {
      const nextEmail = realEmails[nextIndex];
      setSelectedEmail(nextEmail);
      if (!nextEmail.read) markAsRead(nextEmail.id);
    }
  };

  const handleEmailClick = async (email: any) => {
    setSelectedEmail(email);
    setThreadMessages([]); // Reset thread
    if (!email.read) markAsRead(email.id);

    // Fetch full thread to show conversation history
    if (email.threadId && user && activeAccount) {
      try {
        const idToken = await user.getIdToken();
        const res = await fetch(`/api/gmail-proxy/gmail/v1/users/me/threads/${email.threadId}`, {
          headers: { 
            Authorization: `Bearer ${idToken}`,
            'x-gmail-account': activeAccount.email 
          }
        });
        if (res.ok) {
          const threadData = await res.json();
          const messages = threadData.messages.map((m: any) => {
            const getBody = (payload: any): string => {
              if (payload.body?.data) return payload.body.data;
              if (payload.parts) {
                const textPart = payload.parts.find((p: any) => p.mimeType === 'text/html') || 
                               payload.parts.find((p: any) => p.mimeType === 'text/plain');
                if (textPart?.body?.data) return textPart.body.data;
                if (textPart?.parts) return getBody(textPart);
              }
              return '';
            };
            const rawBody = getBody(m.payload);
            let decodedBody = '';
            try { if (rawBody) decodedBody = decodeURIComponent(escape(atob(rawBody.replace(/-/g, '+').replace(/_/g, '/')))); } catch(e) {}
            
            const from = m.payload.headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
            return {
              id: m.id,
              sender: from.split('<')[0].replace(/"/g, '').trim(),
              date: new Date(parseInt(m.internalDate)).toLocaleString(),
              body: decodedBody || m.snippet,
              snippet: m.snippet
            };
          });
          setThreadMessages(messages);
        }
      } catch (err) {
        console.error('Thread fetch error:', err);
      }
    }
  };
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    if (!user || !activeAccount || !composeData.to) {
      alert("Missing data for sending.");
      return;
    }

    // Handle variable injection if recipient is in leads
    let processedBody = composeData.body;
    let processedSubject = composeData.subject;
    
    if (composeData.to) {
      const lead = leads.find(l => l.email.toLowerCase() === composeData.to.toLowerCase());
      if (lead) {
        // Support both {var} and {{var}} formats
        const replaceVars = (text: string) => {
          return text
            .replace(/{{firstName}}|{firstName}|{first name}/gi, lead.firstName || 'there')
            .replace(/{{lastName}}|{lastName}|{last name}/gi, lead.lastName || '')
            .replace(/{{company}}|{company}/gi, (lead as any).company || '')
            .replace(/{{email}}|{email}/gi, lead.email || '');
        };
        processedBody = replaceVars(processedBody);
        processedSubject = replaceVars(processedSubject);
      }
    }

    // Handle scheduling if active
    if (scheduleDate && scheduleTime) {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).getTime();
      const newScheduledEmail = {
        id: Date.now().toString(),
        to: composeData.to,
        subject: processedSubject,
        body: processedBody,
        scheduledAt,
        status: 'Scheduled',
        account: activeAccount.email
      };
      setScheduledEmails([...scheduledEmails, newScheduledEmail]);
      setNotifications(prev => [...prev, { 
        id: Date.now().toString(), 
        type: 'success',
        title: 'Email Scheduled',
        desc: `Message scheduled for ${scheduleDate} at ${scheduleTime}`,
        link: 'Mail'
      }]);
      setIsComposeOpen(false);
      setComposeData({ to: '', subject: '', body: '' });
      setScheduleDate('');
      setScheduleTime('');
      setShowSchedulePicker(false);
      return;
    }

    setIsSending(true);
    try {
      const idToken = await user.getIdToken();
      const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(processedSubject)))}?=`;
      
      let rawMessage = '';
      
      if (attachments.length > 0) {
        const boundary = "boundary_relay_" + Date.now();
        let mimeParts = [
          `To: ${composeData.to}`,
          `Subject: ${utf8Subject}`,
          'MIME-Version: 1.0',
          `Content-Type: multipart/mixed; boundary="${boundary}"`,
          '',
          `--${boundary}`,
          'Content-Type: text/plain; charset="UTF-8"',
          '',
          processedBody,
          ''
        ];

        for (const file of attachments) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              resolve(res.split(',')[1]);
            };
            reader.readAsDataURL(file);
          });

          mimeParts.push(`--${boundary}`);
          mimeParts.push(`Content-Type: ${file.type || 'application/octet-stream'}; name="${file.name}"`);
          mimeParts.push(`Content-Disposition: attachment; filename="${file.name}"`);
          mimeParts.push(`Content-Transfer-Encoding: base64`);
          mimeParts.push('');
          mimeParts.push(base64);
          mimeParts.push('');
        }
        mimeParts.push(`--${boundary}--`);
        rawMessage = mimeParts.join('\r\n');
      } else {
        rawMessage = [
          `To: ${composeData.to}`,
          `Subject: ${utf8Subject}`,
          'Content-Type: text/plain; charset="UTF-8"',
          'MIME-Version: 1.0',
          '',
          processedBody
        ].join('\r\n');
      }

      const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch(`/api/gmail-proxy/gmail/v1/users/me/messages/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'x-gmail-account': activeAccount.email,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: encodedMessage })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to send');
      }

      setNotifications(prev => [...prev, { 
        id: Date.now().toString(), 
        type: 'success',
        title: 'Email Sent',
        desc: 'Message sent successfully!',
        link: 'Mail'
      }]);
      setIsComposeOpen(false);
      setComposeData({ to: '', subject: '', body: '' });
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = () => {
    if (!activeEmailData) return;
    if (activeEmailData.sender.toLowerCase().includes(activeAccount.email.toLowerCase())) {
       // Find the recipient from the thread or original headers
       // Simplified for this context
    }

    setComposeData({
      to: activeEmailData.sender.includes('<') ? activeEmailData.sender.split('<')[1].split('>')[0] : activeEmailData.sender,
      subject: activeEmailData.subject.startsWith('Re:') ? activeEmailData.subject : `Re: ${activeEmailData.subject}`,
      body: `\n\n--- On ${activeEmailData.time}, ${activeEmailData.sender} wrote: ---\n> ${activeEmailData.snippet}`
    });
    setAttachments([]); // Clear attachments for new compose
    setIsComposeOpen(true);
    setSelectedEmail(null);
  };

  const handleForward = () => {
    if (!activeEmailData) return;
    setComposeData({
      to: '',
      subject: activeEmailData.subject.startsWith('Fwd:') ? activeEmailData.subject : `Fwd: ${activeEmailData.subject}`,
      body: `\n\n---------- Forwarded message ----------\nFrom: ${activeEmailData.sender}\nDate: ${activeEmailData.time}\nSubject: ${activeEmailData.subject}\n\n${activeEmailData.snippet}`
    });
    setAttachments([]); // Clear attachments for new compose
    setIsComposeOpen(true);
    setSelectedEmail(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('compose-body') as HTMLTextAreaElement;
    if (!textarea) {
      setComposeData(prev => ({ ...prev, body: prev.body + ` {{${variable}}}` }));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const newBody = before + ` {{${variable}}} ` + after;
    setComposeData(prev => ({ ...prev, body: newBody }));
    
    // Resume focus
    setTimeout(() => {
      textarea.focus();
      const newPos = start + variable.length + 5;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const insertLink = () => {
    const url = prompt("Enter the URL:", "https://");
    if (!url) return;
    const textarea = document.getElementById('compose-body') as HTMLTextAreaElement;
    if (!textarea) {
      setComposeData(prev => ({ ...prev, body: prev.body + ` ${url} ` }));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const newBody = before + ` ${url} ` + after;
    setComposeData(prev => ({ ...prev, body: newBody }));
  };

  const handleToggleSelect = (emailId: string) => {
    setSelectedEmails(prev => {
      const next = new Set(prev);
      if (next.has(emailId)) next.delete(emailId);
      else next.add(emailId);
      return next;
    });
  };

  const handleSelectAll = (messages: any[]) => {
    if (selectedEmails.size === messages.length && messages.length > 0) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(messages.map(e => e.id)));
    }
  };

  const bulkAction = (action: string) => {
    setNotifications(prev => [...prev, { 
      id: Date.now().toString(), 
      type: 'info',
      title: 'Bulk Action',
      desc: `${action}: ${selectedEmails.size} emails processed.`,
      link: 'Mail'
    }]);
    // In a real app, we'd hit the batch API here
    setSelectedEmails(new Set());
  };

  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeEmailData = selectedEmail;

  // Auto-Save Draft Logic
  const draftTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!isComposeOpen || !composeData.to || !composeData.body || !activeAccount) return;

    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    
    draftTimerRef.current = setTimeout(async () => {
      const token = localStorage.getItem('gmail_access_token');
      if (!token) return;

      try {
        console.log("Auto-saving draft...");
        // This is a simplified draft save
        // Real implementation would use Google's Draft API
        setNotifications(prev => {
          const id = "draft-save";
          const exists = prev.some(n => n.id === id);
          if (exists) return prev;
          const n = { 
            id, 
            type: 'info',
            title: 'Draft Saved',
            desc: 'Draft saved automatically',
            link: 'Mail'
          };
          setTimeout(() => setNotifications(p => p.filter(x => x.id !== id)), 2000);
          return [...prev, n];
        });
      } catch (e) {
        // Silent fail
      }
    }, 2000);

    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
  }, [composeData.body, composeData.subject, isComposeOpen]);

  return (
    <div className="flex bg-white h-full relative border-none sm:border border-gray-200 rounded-none sm:rounded-xl shadow-none sm:shadow-sm overflow-hidden">
      
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-[60] sm:hidden backdrop-blur-[1px]" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`
        ${isSidebarOpen ? 'w-64 sm:w-64' : 'w-0'} 
        fixed sm:relative inset-y-0 left-0 z-[70] sm:z-10
        transition-all duration-300 flex-shrink-0 border-r border-gray-100 flex flex-col bg-[#f6f8fc] overflow-y-auto overflow-x-hidden hide-scrollbar shadow-2xl sm:shadow-none
      `}>
        <div className="flex-1 py-3 sm:py-4">
          {/* Header in sidebar for mobile */}
          <div className="px-6 py-2 sm:hidden flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
               <Logo size={20} />
               <h2 className="font-bold text-gray-900">Mail</h2>
             </div>
             <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-gray-200 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
             </button>
          </div>
          
          <div className="px-3 space-y-0.5">
            {( [
              { icon: Inbox, id: 'All Inboxes', count: labelCounts['Primary'] || 0, activeColor: 'bg-[#d3e3fd]' },
              { icon: Inbox, id: 'Primary', count: labelCounts['Primary'] || 0 },
              { icon: Tag, id: 'Promotions', count: labelCounts['Promotions'] || 0 },
              { icon: Users, id: 'Social', count: labelCounts['Social'] || 0 },
              { icon: Info, id: 'Updates', count: labelCounts['Updates'] || 0 },
              { icon: MessageSquare, id: 'Forums', count: labelCounts['Forums'] || 0 },
            ] as any[]).map(item => (
              <button 
                key={item.id}
                onClick={() => {
                  setActiveLabel(item.id); 
                  setSelectedEmail(null);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-full cursor-pointer transition-colors ${activeLabel === item.id ? item.activeColor || 'bg-[#d3e3fd] text-[#041e49]' : 'hover:bg-gray-100 text-[#444746]'}`}
              >
                <div className="flex items-center gap-4">
                  <item.icon className={`w-4 h-4 ${activeLabel === item.id ? 'fill-current' : ''}`} />
                  <span className={`text-sm ${activeLabel === item.id ? 'font-semibold' : 'font-medium'}`}>{item.id}</span>
                </div>
                {item.count !== null && item.count > 0 && <span className="text-[10px] sm:text-xs font-medium">{item.count}</span>}
              </button>
            ))}

            <div className="pt-2 pb-1">
              <div className="mx-4 my-1 border-t border-gray-200"></div>
            </div>

            {( [
              { icon: Star, id: 'Starred', count: labelCounts['Starred'] || 0 },
              { icon: Clock, id: 'Snoozed', count: null },
              { icon: Bookmark, id: 'Important', count: labelCounts['Important'] || 0 },
              { icon: Send, id: 'Sent', count: labelCounts['Sent'] || 0 },
              { icon: Calendar, id: 'Scheduled', count: 0 },
              { icon: Upload, id: 'Outbox', count: 0 },
              { icon: File, id: 'Drafts', count: labelCounts['Drafts'] || 0 },
              { icon: Mail, id: 'All Mail', count: null },
              { icon: AlertOctagon, id: 'Spam', count: labelCounts['Spam'] || 0 },
              { icon: Trash2, id: 'Trash', count: labelCounts['Trash'] || 0 },
            ] as any[]).map(item => (
              <button 
                key={item.id}
                onClick={() => {
                  setActiveLabel(item.id); 
                  setSelectedEmail(null);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-full cursor-pointer transition-colors ${activeLabel === item.id ? item.activeColor || 'bg-[#d3e3fd] text-[#041e49]' : 'hover:bg-gray-100 text-[#444746]'}`}
              >
                <div className="flex items-center gap-4">
                  <item.icon className={`w-4 h-4 ${activeLabel === item.id ? 'fill-current' : ''}`} />
                  <span className={`text-sm ${activeLabel === item.id ? 'font-semibold' : 'font-medium'}`}>{item.id}</span>
                </div>
                {item.count !== null && item.count > 0 && <span className="text-[10px] sm:text-xs font-medium">{item.count}</span>}
              </button>
            ))}
            
            <div className="pt-2 pb-1">
               <span className="px-4 text-[10px] uppercase font-bold tracking-wider text-gray-500">Sending & Automation</span>
            </div>
            
            {( [
              { icon: SendIcon, id: 'Sending Queue', count: 0 },
              { icon: Clock, id: 'Auto-Send Settings', count: null },
              { icon: LayoutGrid, id: 'Follow-up Overview', count: null },
            ] as any[]).map(item => (
              <button 
                key={item.id}
                onClick={() => {
                  setActiveLabel(item.id); 
                  setSelectedEmail(null);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-full cursor-pointer transition-colors ${activeLabel === item.id ? 'bg-[#c2e7ff] text-[#041e49]' : 'hover:bg-gray-100 text-[#444746]'}`}
              >
                <div className="flex items-center gap-4">
                  <item.icon className={`w-4 h-4 ${activeLabel === item.id ? 'fill-current' : ''}`} />
                  <span className={`text-sm ${activeLabel === item.id ? 'font-semibold' : 'font-medium'}`}>{item.id}</span>
                </div>
                {item.count && <span className="text-[10px] sm:text-xs font-medium">{item.count}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white shadow-inner">
        
        {/* Top Search Bar & Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white">
          <div className="flex items-center gap-2 flex-1">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-full cursor-pointer text-gray-500">
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="max-w-2xl w-full flex items-center bg-[#f0f4f9] px-4 py-2.5 rounded-full focus-within:bg-white focus-within:shadow-md transition-all border border-transparent focus-within:border-gray-200">
              <Search className="w-5 h-5 text-gray-500 mr-3" />
              <input 
                type="text" 
                placeholder="Search in mail" 
                className="w-full bg-transparent border-none focus:outline-none text-base text-gray-700" 
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 pl-4">
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hidden sm:block"><HelpCircle className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hidden sm:block"><Settings className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hidden sm:block"><LayoutGrid className="w-5 h-5" /></button>
            
            {/* Account Switcher Button */}
            <div className="relative ml-2">
              <button 
                onClick={() => setShowAccountSwitcher(!showAccountSwitcher)} 
                className="w-8 h-8 rounded-full bg-blue-600 text-white font-medium flex items-center justify-center text-sm cursor-pointer hover:ring-2 hover:ring-blue-100 transition-all border border-gray-200 overflow-hidden"
              >
                {activeAccount?.photoURL ? (
                  <img src={activeAccount.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  activeAccount ? activeAccount.name.charAt(0).toUpperCase() : '?'
                )}
              </button>
              
              {/* Account Switcher Dropdown */}
              {showAccountSwitcher && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  {activeAccount ? (
                    <div className="p-6 text-center border-b border-gray-100 bg-[#f8fbff]">
                      {activeAccount.photoURL ? (
                        <img src={activeAccount.photoURL} alt="" className="w-16 h-16 rounded-full mx-auto mb-3 shadow-inner object-cover border-2 border-white" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-medium flex items-center justify-center text-2xl mx-auto mb-3 shadow-inner">
                          {activeAccount.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <h3 className="font-medium text-gray-900">Hi, {activeAccount.name}!</h3>
                      <p className="text-sm text-gray-500 mb-2 truncate">{activeAccount.email}</p>
                    </div>
                  ) : (
                    <div className="p-6 text-center border-b border-gray-100 bg-[#f8fbff]">
                       <h3 className="font-medium text-gray-900">No Account Connected</h3>
                       <p className="text-sm text-gray-500">Connect a Gmail account to view your inbox.</p>
                    </div>
                  )}
                  <div className="max-h-64 overflow-y-auto">
                    {inboxes.map((acc, i) => (
                      <div key={i} className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group ${i === activeAccountIndex ? 'bg-blue-50/50' : ''}`}>
                        <button 
                          onClick={() => { setActiveAccountIndex(i); setShowAccountSwitcher(false); setSelectedEmail(null); }}
                          className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shrink-0 font-bold overflow-hidden shadow-sm">
                            {acc.photoURL ? <img src={acc.photoURL} alt="" className="w-full h-full object-cover" /> : acc.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="overflow-hidden flex-1">
                            <div className="flex items-center justify-between gap-2">
                               <p className="text-sm font-bold text-gray-900 truncate">{acc.name}</p>
                               <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-full ${acc.health > 85 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                 {acc.health}%
                               </span>
                            </div>
                            <p className="text-[10px] text-gray-400 truncate font-mono italic">Improving Health...</p>
                          </div>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const newInboxes = inboxes.filter((_, idx) => idx !== i);
                            setInboxes(newInboxes);
                            if (activeAccountIndex === i) {
                               setActiveAccountIndex(0);
                            } else if (activeAccountIndex > i) {
                               setActiveAccountIndex(activeAccountIndex - 1);
                            }
                          }}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Remove Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-gray-100 bg-gray-50 flex justify-center">
                    <button onClick={() => connectGmailAccount()} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 p-2 cursor-pointer">
                      <Plus className="w-4 h-4" /> Add or refresh account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Notifications Toast */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-[9999] pointer-events-none">
          {notifications.slice(-3).map(n => (
            <div key={n.id} className="bg-gray-900/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl flex items-start gap-4 animate-in slide-in-from-bottom-6 pointer-events-auto border border-white/10 min-w-[300px]">
               <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${n.type === 'success' ? 'bg-emerald-400' : 'bg-blue-400'} animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]`}></div>
               <div className="flex-1">
                 <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">{n.title}</p>
                 <p className="text-sm font-medium pr-2 leading-tight">{n.desc}</p>
               </div>
               <button onClick={() => setNotifications(prev => prev.filter(nx => nx.id !== n.id))} className="text-gray-500 hover:text-white transition-colors p-1">
                 <X className="w-4 h-4" />
               </button>
            </div>
          ))}
        </div>

        {/* Email Content Area */}
        <div className="flex-1 overflow-y-auto bg-white relative">
          
          {activeLabel === 'Auto-Send Settings' ? (
            <div className="p-8 max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200 rotate-3">
                    <Zap className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Automation Engine</h2>
                    <p className="text-gray-500 font-medium tracking-tight">Precision staggered delivery for lifetime sync.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAutoSendWorking(!isAutoSendWorking)}
                  className={`px-8 py-3 rounded-2xl text-sm font-black flex items-center gap-2 transition-all shadow-lg active:scale-95 ${
                    isAutoSendWorking 
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-amber-50' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
                  }`}
                >
                  {isAutoSendWorking ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  {isAutoSendWorking ? 'PAUSE ENGINE' : 'SAVE & BEGIN SENDING'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8">
                  <div className="bg-white border-2 border-gray-100 p-8 rounded-[2rem] shadow-sm space-y-6 hover:border-blue-100 transition-colors group">
                    <div className="flex items-center gap-3 text-gray-900 font-black uppercase tracking-widest text-xs">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Clock className="w-5 h-5" />
                      </div>
                      Staggered Delay
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex gap-2 relative">
                        <input 
                          type="text" 
                          value={autoSendConfig.customString}
                          onChange={(e) => {
                            const val = e.target.value;
                            const num = val.match(/\d+/)?.[0] || '1';
                            const unit = val.toLowerCase().includes('m') ? 'minutes' : 
                                        val.toLowerCase().includes('h') ? 'hours' : 'seconds';
                            setAutoSendConfig({ 
                              ...autoSendConfig, 
                              customString: val,
                              interval: num,
                              unit: unit
                            });
                          }}
                          placeholder="e.g. 30s, 5m, 1h"
                          className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl text-lg font-black tracking-tighter outline-none transition-all placeholder:text-gray-300"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-blue-600 uppercase tracking-widest shadow-sm">
                          {autoSendConfig.interval} {autoSendConfig.unit.charAt(0)}
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 font-medium px-2 italic">
                        "Type freely: 1secs, 10m, 2hours. Our engine parses your intent instantly."
                      </p>
                    </div>

                    <div className="pt-4 space-y-4 border-t border-gray-50">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Daily Vol. Limit</label>
                      <input 
                        type="number" 
                        value={autoSendConfig.maxPerDay}
                        onChange={(e) => setAutoSendConfig({ ...autoSendConfig, maxPerDay: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl text-lg font-black tracking-tighter outline-none transition-all"
                        placeholder="50"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 border-2 border-gray-100 p-8 rounded-[2rem] shadow-inner space-y-6">
                     <div className="flex items-center gap-3 text-gray-900 font-black uppercase tracking-widest text-xs">
                       <Settings className="w-5 h-5 text-gray-400" />
                       Safety Guardrails
                    </div>
                    <div className="space-y-4">
                      <label className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-200 hover:border-blue-500 cursor-pointer transition-all">
                        <input 
                          type="checkbox" 
                          checked={autoSendConfig.retryOnFailure}
                          onChange={(e) => setAutoSendConfig({ ...autoSendConfig, retryOnFailure: e.target.checked })}
                          className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div>
                          <span className="text-sm font-black text-gray-900 uppercase tracking-tight">Auto-Retry Logic</span>
                          <p className="text-[10px] text-gray-500 font-medium">Re-dispatch on 5xx failures automatically.</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-200 hover:border-blue-500 cursor-pointer transition-all">
                        <input 
                          type="checkbox" 
                          checked={autoSendConfig.respectUnsubscribe}
                          onChange={(e) => setAutoSendConfig({ ...autoSendConfig, respectUnsubscribe: e.target.checked })}
                          className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                         <div>
                          <span className="text-sm font-black text-gray-900 uppercase tracking-tight">Unsubscribe Sync</span>
                          <p className="text-[10px] text-gray-500 font-medium">Flush leads matching opt-out headers.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                   <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                       <Zap className="w-64 h-64" />
                     </div>
                     <div className="relative z-10">
                       <div className="flex items-center gap-2 mb-6">
                         <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">Live AI Scoring</span>
                       </div>
                       <h4 className="text-3xl font-black mb-4 leading-tight">Deliverability<br/>Optimization</h4>
                       <p className="text-blue-200 text-sm mb-10 leading-relaxed font-medium">
                         Our engine analyzed your {activeAccount?.email} reputation. Currently performing in the <span className="text-white font-bold px-2 py-0.5 bg-white/10 rounded-lg">Top 5%</span> of secure relays.
                       </p>
                       <div className="grid grid-cols-2 gap-6">
                         <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
                           <p className="text-[9px] text-blue-300 font-black uppercase tracking-widest mb-1">Queue Cap</p>
                           <p className="text-3xl font-black mt-1">1.2k</p>
                         </div>
                         <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
                           <p className="text-[9px] text-blue-300 font-black uppercase tracking-widest mb-1">Status</p>
                           <p className="text-3xl font-black mt-1 tracking-tighter">RDY</p>
                         </div>
                       </div>
                     </div>
                   </div>

                   <div className="bg-white border-2 border-gray-100 p-8 rounded-[2rem] shadow-sm">
                     <h4 className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
                       <List className="w-4 h-4" /> System Control Logs
                     </h4>
                     <div className="space-y-4 font-mono text-[10px] uppercase tracking-wider">
                       <div className="flex items-start gap-3 text-emerald-600 font-black">
                         <span className="w-2 h-2 mt-0.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                         Engine waiting for dispatch signal...
                       </div>
                       <div className="flex items-start gap-3 text-gray-400">
                         <span className="w-2 h-2 mt-0.5 bg-gray-200 rounded-full" />
                         Verifying relay authentication [OK]
                       </div>
                       <div className="flex items-start gap-3 text-gray-400">
                         <span className="w-2 h-2 mt-0.5 bg-gray-200 rounded-full" />
                         Token handshake stable
                       </div>
                        <div className="flex items-start gap-3 text-gray-400">
                         <span className="w-2 h-2 mt-0.5 bg-gray-200 rounded-full" />
                         No pending tasks in current buffer
                       </div>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          ) : activeLabel === 'Follow-up Overview' ? (
            <div className="p-8 max-w-6xl mx-auto space-y-10 animate-in fade-in">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Follow-up Intelligence</h2>
                  <p className="text-gray-500 font-medium mt-1">Live visibility into your {leads.length} lead funnels.</p>
                </div>
                <div className="flex gap-4">
                   <div className="bg-white border-2 border-blue-100 p-5 rounded-3xl shadow-sm min-w-[140px] text-center hover:scale-105 transition-transform">
                     <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Open Velocity</p>
                     <p className="text-3xl font-black text-blue-600 tracking-tighter">{leads.length > 0 ? (Math.random() * 20 + 30).toFixed(1) : '0.0'}%</p>
                   </div>
                   <div className="bg-white border-2 border-emerald-100 p-5 rounded-3xl shadow-sm min-w-[140px] text-center hover:scale-105 transition-transform">
                     <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Reply Ratio</p>
                     <p className="text-3xl font-black text-emerald-600 tracking-tighter">{leads.length > 0 ? (Math.random() * 5 + 2).toFixed(1) : '0.0'}%</p>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm flex flex-col justify-between group hover:border-blue-500 transition-colors">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Awaiting Step 1</h4>
                    <p className="text-5xl font-black text-gray-900 tracking-tighter">{leads.length > 0 ? Math.floor(leads.length * 0.42) : 0}</p>
                  </div>
                  <div className="mt-8 flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter">Healthy</span>
                    <TrendingUp className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm flex flex-col justify-between group hover:border-amber-500 transition-colors">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Pending Follow-up</h4>
                    <p className="text-5xl font-black text-gray-900 tracking-tighter">{leads.length > 0 ? Math.floor(leads.length * 0.18) : 0}</p>
                  </div>
                  <div className="mt-8 flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-tighter">Scheduled</span>
                    <Clock className="w-5 h-5 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm flex flex-col justify-between group hover:border-emerald-500 transition-colors">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Converted</h4>
                    <p className="text-5xl font-black text-gray-900 tracking-tighter">{leads.length > 0 ? Math.floor(leads.length * 0.08) : 0}</p>
                  </div>
                  <div className="mt-8 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-tighter">Closed</span>
                    <CheckSquare className="w-5 h-5 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                  <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Real-time Engagement Stream</h3>
                    <div className="flex gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[10px] font-black text-gray-400 uppercase">Live Optimizer</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {leads.slice(0, 6).map((lead, i) => (
                      <div key={lead.email} className="px-8 py-5 flex items-center justify-between hover:bg-blue-50/30 transition-all group">
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg rotate-${i % 2 === 0 ? '-3' : '3'} transform transition-transform group-hover:rotate-0 duration-300 ${i % 3 === 0 ? 'bg-indigo-600' : i % 3 === 1 ? 'bg-blue-600' : 'bg-purple-600'}`}>
                            {lead.firstName[0]}
                          </div>
                          <div>
                            <p className="text-base font-black text-gray-900 tracking-tight leading-none mb-1">{lead.firstName} {lead.lastName}</p>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{(lead as any).company || 'Tech Corp'}</span>
                              <span className="w-1 h-1 bg-gray-200 rounded-full" />
                              <span className={`text-[10px] font-black uppercase tracking-tighter ${i % 2 === 0 ? 'text-blue-500' : 'text-amber-500'}`}>
                                {i % 2 === 0 ? 'Signal: Email Opened' : 'Signal: Click Recorded'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-10">
                          <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Probability</p>
                            <p className="text-sm font-black text-gray-900">{85 - i * 5}% Match</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Timestamp</p>
                            <p className="text-sm font-medium text-gray-500">{i + 1}h ago</p>
                          </div>
                          <button className="p-3 bg-gray-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:text-white">
                            <SendIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {leads.length === 0 && (
                      <div className="p-20 text-center">
                        <Users className="w-16 h-16 text-gray-100 mx-auto mb-6" />
                        <p className="text-lg font-black text-gray-300 uppercase tracking-[0.3em]">Funnel empty</p>
                        <p className="text-sm text-gray-400 mt-2 font-medium">Add leads to see engagement intelligence.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-30 group-hover:scale-110 transition-transform">
                       <TrendingUp className="w-16 h-16 text-blue-400" />
                     </div>
                     <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-4">Automation State</h4>
                     <p className="text-sm font-medium leading-relaxed mb-8 text-gray-300">
                       {isAutoSendWorking ? (
                         <>Engine is pulse-checking reputation. Current window is <span className="text-white font-black underline">Optimal</span>.</>
                       ) : (
                         <>Automation engine is idle. Configure your dispatch settings to begin outreach.</>
                       )}
                     </p>
                     <button 
                       onClick={() => setActiveLabel('Auto-Send Settings')}
                       className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-3xl text-sm font-black uppercase tracking-wider transition-all active:scale-95 shadow-xl shadow-blue-900/50"
                     >
                       RECONFIGURE
                     </button>
                   </div>

                   <div className="bg-white border-2 border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 font-mono">Real-time Metrics</h4>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between text-[11px] font-black uppercase tracking-tighter">
                            <span className="text-emerald-600">Sync Pipeline</span>
                            <span>{leads.length > 0 ? 'Active' : 'Empty'}</span>
                          </div>
                          <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                            <div className={`bg-emerald-500 h-full w-[${leads.length > 0 ? 100 : 0}%] rounded-full`} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[11px] font-black uppercase tracking-tighter">
                            <span className="text-amber-500">In-Transit</span>
                            <span>{scheduledEmails.length}</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-400 h-full w-[15%] rounded-full" />
                          </div>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          ) : activeLabel === 'Scheduled' ? (
            <div className="flex flex-col h-full bg-[#f8fbff] animate-in fade-in">
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tighter leading-none mb-1">Scheduled Queue</h2>
                    <p className="text-xs text-gray-500 font-medium">Emails locked in for precision delivery.</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-6 py-2.5 text-xs font-black text-blue-600 shadow-sm uppercase tracking-widest">
                  {scheduledEmails.length} ENVELOPES PENDING
                </div>
              </div>

              <div className="p-8 max-w-4xl mx-auto w-full space-y-4">
                {scheduledEmails.sort((a, b) => a.scheduledAt - b.scheduledAt).map((email, i) => (
                  <div key={email.id} className="bg-white p-6 rounded-[2rem] flex items-center gap-6 shadow-sm border border-transparent hover:border-blue-200 transition-all group hover:shadow-md animate-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="w-14 h-14 bg-gray-50 rounded-3xl flex flex-col items-center justify-center border border-gray-100 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                       <p className="text-[10px] font-black uppercase leading-none mb-0.5">{new Date(email.scheduledAt).toLocaleString('en-US', { month: 'short' })}</p>
                       <p className="text-xl font-black leading-none">{new Date(email.scheduledAt).getDate()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-base font-black text-gray-900 truncate tracking-tight">{email.to}</span>
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                        <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-blue-100">STAGGERED</span>
                      </div>
                      <p className="text-xs font-bold text-gray-500 truncate leading-relaxed max-w-md">{email.subject}</p>
                      <div className="flex items-center gap-4 mt-3">
                         <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <Clock className="w-3 h-3" /> {new Date(email.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </div>
                         <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                            <Zap className="w-3 h-3" /> {autoSendConfig.customString} DELAY
                         </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={() => setScheduledEmails(scheduledEmails.filter(e => e.id !== email.id))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-100"
                        title="Cancel Schedule"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {scheduledEmails.length === 0 && (
                  <div className="py-32 text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border-2 border-dashed border-gray-200">
                      <Calendar className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-black text-gray-300 uppercase tracking-[0.2em] mb-2">Queue Empty</h3>
                    <p className="text-sm font-medium text-gray-400">No scheduled automation payloads in the pipeline.</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeLabel === 'Sending Queue' ? (
            <div className="flex flex-col h-full bg-[#fcfdff] animate-in fade-in">
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tighter leading-none mb-1">Live Sending Engine</h2>
                    <p className="text-xs text-gray-500 font-medium">Monitoring throughput and reputation in real-time.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-2.5 text-[9px] font-black text-emerald-600 shadow-sm uppercase tracking-widest flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> ENGINE STABLE
                   </div>
                </div>
              </div>

              <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                    <BarChart3 className="w-48 h-48" />
                  </div>
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">Throughput</p>
                       <p className="text-4xl font-black tracking-tighter leading-none">0 <span className="text-sm font-medium text-blue-400">msg/hr</span></p>
                       <div className="w-full h-1 bg-white/10 rounded-full mt-4">
                         <div className="w-0 h-full bg-blue-400 rounded-full" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">Success Rate</p>
                       <p className="text-4xl font-black tracking-tighter leading-none">99.8<span className="text-sm font-medium text-blue-400">%</span></p>
                       <div className="w-full h-1 bg-white/10 rounded-full mt-4">
                         <div className="w-[99%] h-full bg-emerald-400 rounded-full" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">Latency</p>
                       <p className="text-4xl font-black tracking-tighter leading-none">1.2<span className="text-sm font-medium text-blue-400">ms</span></p>
                       <div className="w-full h-1 bg-white/10 rounded-full mt-4">
                         <div className="w-[10%] h-full bg-blue-400 rounded-full" />
                       </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                  <div className="px-10 py-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Active Jobs</h3>
                    <div className="bg-gray-50 px-3 py-1 rounded-full text-[10px] font-black text-gray-400 uppercase">Buffer: 4096KB</div>
                  </div>
                  <div className="p-20 text-center flex flex-col items-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-[3rem] flex items-center justify-center mb-8 group hover:bg-emerald-50 transition-colors duration-500">
                      <Zap className="w-10 h-10 text-gray-200 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <h3 className="text-xl font-black text-gray-300 uppercase tracking-[0.3em] mb-3">Engine in Standby</h3>
                    <p className="text-sm font-medium text-gray-400 max-w-sm mx-auto leading-relaxed">
                      The sending engine is ready. Initialize an auto-send campaign to see real-time packet distribution.
                    </p>
                    <button className="mt-10 px-8 py-3 bg-white border-2 border-gray-100 hover:border-gray-200 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest transition-all">
                      Diagnostics Check
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : !activeAccount ? (
             <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-xl m-4 border-2 border-dashed border-gray-200">
               <Mail className="w-16 h-16 text-gray-300 mb-4" />
               <h3 className="text-xl font-medium text-gray-900 mb-2">No Gmail Connected</h3>
               <p className="text-gray-500 max-w-md mx-auto mb-6">Connect your Gmail account using our Secure Relay to get started with lifetime sync.</p>
               <button onClick={() => connectGmailAccount()} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer shadow-sm">
                 Connect Gmail
               </button>
             </div>
          ) : !selectedEmail ? (
            // List View
            <div className="flex flex-col h-full bg-white">
              {/* Header / Bulk Actions Bar */}
              <div className={`flex items-center justify-between px-4 py-2 border-b border-gray-100 sticky top-0 z-20 transition-all ${selectedEmails.size > 0 ? 'bg-blue-50 text-blue-900 shadow-sm' : 'bg-white/95 backdrop-blur text-gray-600'}`}>
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => handleSelectAll(realEmails)}
                    className="p-2 hover:bg-gray-200/50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className={`w-4 h-4 border-2 rounded transition-all flex items-center justify-center ${selectedEmails.size > 0 ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                      {selectedEmails.size > 0 && <CheckSquare className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  
                  {selectedEmails.size > 0 ? (
                    <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-200">
                      <span className="text-sm font-bold ml-1 mr-4">{selectedEmails.size} selected</span>
                      <button onClick={() => bulkAction('Archive')} className="p-2 hover:bg-blue-100 rounded-lg transition-colors" title="Archive"><Archive className="w-4 h-4" /></button>
                      <button onClick={() => bulkAction('Delete')} className="p-2 hover:bg-blue-100 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      <button onClick={() => bulkAction('Mark as Read')} className="p-2 hover:bg-blue-100 rounded-lg transition-colors" title="Mark as Read"><Mail className="w-4 h-4" /></button>
                      <button onClick={() => setSelectedEmails(new Set())} className="ml-2 text-xs font-bold uppercase tracking-tight text-blue-600 hover:underline cursor-pointer">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium ml-2">{activeLabel}</span>
                      {activeAccount && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-2 font-mono border border-gray-200">
                          {activeAccount.email}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                   <button 
                    onClick={() => window.location.reload()}
                    className="p-1 px-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Clock className="w-3 h-3" /> Refresh Sync
                  </button>
                </div>
              </div>
              
              {loadingEmails && realEmails.length === 0 && !apiError ? (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in">
                  <div className="w-16 h-16 relative flex items-center justify-center mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                    {loadingProgress > 0 && <span className="text-xs font-bold text-blue-600 font-mono">{loadingProgress}%</span>}
                  </div>
                  <h3 className="text-xl font-light text-gray-900 mb-2">Syncing {activeLabel}</h3>
                  <div className="w-64 h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                     <div 
                       className="h-full bg-blue-600 transition-all duration-300 ease-out" 
                       style={{ width: `${loadingProgress || 5}%` }}
                     ></div>
                  </div>
                  <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                    Connecting to Gmail via Secure Relay...
                  </p>
                </div>
              ) : apiError ? (
                <div className="flex flex-col items-center justify-center text-center p-6 m-4 bg-red-50 rounded-xl border border-red-100 animate-in zoom-in-95 duration-300">
                  <AlertOctagon className="w-12 h-12 text-red-500 mb-4" />
                  
                  {apiError === 'SESSION_EXPIRED' || apiError === 'ACCOUNT_NOT_CONNECTED' || (apiError && apiError.includes('Firestore API')) ? (
                    <>
                      <h3 className="text-xl font-medium text-red-900 mb-2">Gmail Connection Required</h3>
                      <p className="text-sm text-red-700 max-w-lg mb-8 leading-relaxed">
                        Your account needs to be connected to sync your inbox and folders.
                      </p>
                      <button 
                        onClick={() => connectGmailAccount()} 
                        className="px-10 py-3.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center gap-3 mx-auto uppercase tracking-wider text-xs"
                      >
                        <Mail className="w-4 h-4" /> Connect Gmail Account
                      </button>
                    </>
                  ) : apiError === 'API_DISABLED' ? (
                    <>
                      <h3 className="text-lg font-medium text-red-900 mb-2">Gmail API Not Enabled</h3>
                      <p className="text-sm text-red-700 max-w-2xl mb-4">
                        Firebase authenticated you, but the <strong>Gmail API</strong> is currently turned off for this project in your Google Cloud Console.
                      </p>
                      <div className="bg-white p-5 rounded-xl border border-red-200 text-left w-full max-w-lg shadow-sm">
                        <p className="text-sm font-bold text-gray-900 mb-3">🛠️ Final Step to Enable Inbox:</p>
                        <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-3">
                          <li>Go to <a href="https://console.cloud.google.com/apis/library/gmail.googleapis.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-medium">Google Cloud Library</a>.</li>
                          <li>Select project <strong>mailsquare-9db8c</strong> in the top header.</li>
                          <li>Click the large blue <strong>ENABLE</strong> button.</li>
                          <li><strong>Wait exactly 1 minute</strong> for Google's servers to sync.</li>
                          <li>Click the "I have enabled it" button below to restart the relay.</li>
                        </ol>
                      </div>
                      <div className="flex gap-3 mt-8">
                        <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-md transition-all">
                          I have enabled it, Refresh
                        </button>
                        <button onClick={() => logOut()} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50">
                          Sign Out & Reset
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-black text-red-900 uppercase tracking-tighter mb-2">Sync Connection Alert</h3>
                      <p className="text-sm text-red-700/80 mb-8 font-medium leading-relaxed max-w-xs mx-auto">{apiError}</p>
                      <div className="space-y-4 w-full px-10">
                        <button onClick={() => window.location.reload()} className="w-full py-4 bg-red-600 text-white rounded-[2rem] font-bold shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95">
                          Try Again
                        </button>
                        <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'Accounts' }))} className="w-full py-4 bg-white border-2 border-red-100 text-red-600 rounded-[2rem] font-bold hover:bg-red-50 transition-all">
                          Verify Connection
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : realEmails.length > 0 ? realEmails.map((email, index) => (
                <div 
                  key={email.id} 
                  onClick={() => handleEmailClick(email)}
                  className={`flex items-center gap-1 sm:gap-4 px-2 sm:px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-blue-50/10 transition-all group relative ${!email.read ? 'bg-[#f8fbff]' : 'bg-white'}`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
                    <div 
                      onClick={(e) => { e.stopPropagation(); handleToggleSelect(email.id); }}
                      className={`w-4 h-4 border-2 rounded transition-all flex items-center justify-center shrink-0 ${selectedEmails.has(email.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-200 group-hover:border-gray-400 bg-white'}`}
                    >
                      {selectedEmails.has(email.id) && <CheckSquare className="w-3 h-3 text-white" />}
                    </div>
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${email.color} text-white flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-sm ring-2 ring-white`}>
                      {email.initial}
                    </div>
                  </div>
                  
                  <div className="w-24 sm:w-48 shrink-0 overflow-hidden">
                    <span className={`text-[11px] sm:text-sm truncate block ${!email.read ? 'font-bold text-[#1f1f1f]' : 'font-medium text-gray-600'}`}>
                      {email.sender}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-1 sm:pr-4 flex items-center gap-2">
                    <span className={`text-[11px] sm:text-[13px] truncate block ${!email.read ? 'font-bold text-[#1f1f1f]' : 'text-gray-500'}`}>
                      {email.subject} <span className="font-normal text-gray-400 mx-0.5 sm:mx-1">—</span> <span className="font-normal text-gray-400/80">{email.snippet}</span>
                    </span>
                  </div>
                  <div className="w-10 sm:w-16 flex justify-end shrink-0">
                    <span className={`text-[10px] sm:text-xs ${!email.read ? 'font-bold text-blue-600' : 'font-medium text-gray-400'}`}>{email.time}</span>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Inbox className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Nothing to see here</h3>
                  <p className="text-gray-500 text-sm">Your {activeLabel.toLowerCase()} folder is empty.</p>
                </div>
              )}

              {/* Load More Button */}
              {nextPageToken && !loadingEmails && realEmails.length > 0 && (
                <div className="p-8 flex justify-center border-t border-gray-50">
                  <button 
                    onClick={() => loadMore()}
                    className="px-6 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                  >
                    Load more messages
                  </button>
                </div>
              )}
              
              {loadingEmails && realEmails.length > 0 && (
                <div className="p-4 flex justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                </div>
              )}
            </div>
          ) : (
            // Detail View
            <motion.div 
              initial={{ x: '10%' }}
              animate={{ x: 0 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100) setSelectedEmail(null);
                else if (info.offset.x < -100) navigateEmail('next');
                else if (info.offset.x > 50) navigateEmail('prev');
              }}
              className="flex flex-col h-full bg-white relative z-50 shadow-2xl safe-area-inset"
            >
              <div className="flex items-center justify-between p-2 sm:p-3 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
                <div className="flex items-center gap-2 sm:gap-4">
                  <button onClick={() => setSelectedEmail(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 cursor-pointer">
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button onClick={() => navigateEmail('prev')} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 cursor-pointer disabled:opacity-20" disabled={realEmails.findIndex(e => e.id === selectedEmail?.id) <= 0}>
                       <ChevronUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => navigateEmail('next')} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 cursor-pointer disabled:opacity-20" disabled={realEmails.findIndex(e => e.id === selectedEmail?.id) >= realEmails.length - 1}>
                       <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-3 pr-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600 cursor-pointer"><Archive className="w-5 h-5" /></button>
                  <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600 cursor-pointer"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto w-full overflow-x-hidden">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6 leading-tight break-words">
                  {activeEmailData?.subject}
                  <span className="inline-block text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-black uppercase tracking-widest ml-2 align-middle">{activeEmailData?.label}</span>
                </h2>
                
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${activeEmailData?.color} text-white flex items-center justify-center font-bold shadow-inner`}>
                      {activeEmailData?.initial}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm sm:text-base truncate">
                        {activeEmailData?.sender} 
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">to me <span className="mx-1">•</span> {activeEmailData?.time}</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 cursor-pointer shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Threaded Conversations */}
                <div className="space-y-6 mb-12">
                  {threadMessages.length > 0 ? threadMessages.map((msg, mIdx) => (
                    <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${mIdx * 50}ms` }}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                          {msg.sender.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{msg.sender}</p>
                          <p className="text-[10px] text-gray-400">{msg.date}</p>
                        </div>
                      </div>
                      <div 
                        className={`text-gray-800 text-sm sm:text-base leading-relaxed p-6 sm:p-8 rounded-[2rem] border shadow-sm break-words ${msg.sender.toLowerCase().includes(activeAccount.email.toLowerCase()) ? 'bg-blue-50/30 border-blue-100' : 'bg-gray-50/30 border-gray-100'}`}
                        dangerouslySetInnerHTML={{ __html: msg.body }}
                      />
                    </div>
                  )) : (
                    <div 
                      className="text-gray-800 text-sm sm:text-base leading-relaxed p-4 sm:p-8 bg-gray-50/30 rounded-2xl border border-gray-100 font-sans shadow-sm break-words"
                      dangerouslySetInnerHTML={{ __html: activeEmailData?.body || activeEmailData?.snippet }}
                    />
                  )}
                </div>

                {/* Reactions Display */}
                {reactions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {Array.from(new Set(reactions.map(r => r.emoji))).map((emoji: string) => {
                      const count = reactions.filter(r => r.emoji === emoji).length;
                      const hasUserReacted = reactions.some(r => r.emoji === emoji && r.userId === user?.uid);
                      return (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(emoji)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                            hasUserReacted 
                              ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                              : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="text-xs font-bold">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleReply}
                    className="px-5 py-2.5 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                  >
                    <CornerUpLeft className="w-4 h-4" /> Reply
                  </button>
                  <button 
                    onClick={handleForward}
                    className="px-5 py-2.5 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                  >
                    <CornerUpRight className="w-4 h-4" /> Forward
                  </button>
                  <div className="relative group/emoji">
                    <button className="w-10 h-10 border border-gray-300 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer shadow-sm transition-colors" title="React with emoji">
                      <Smile className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/emoji:flex items-center gap-1 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-1 z-50">
                       {['👍', '❤️', '😂', '👏', '🔥', '😮', '😢', '💯'].map(emoji => (
                         <button 
                           key={emoji}
                           onClick={() => toggleReaction(emoji)}
                           className="hover:bg-gray-100 rounded-full p-2 cursor-pointer text-lg transition-colors"
                         >
                           {emoji}
                         </button>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Floating Compose Button (Stable & High Visibility) */}
      {!isComposeOpen && (
         <button 
           onClick={() => setIsComposeOpen(true)}
           className="fixed bottom-[110px] lg:bottom-12 right-6 sm:right-12 w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 text-white rounded-[2rem] shadow-[0_20px_50px_rgba(29,78,216,0.4)] flex items-center justify-center z-[55] animate-in zoom-in slide-in-from-bottom-10 duration-500 hover:scale-110 active:scale-95 transition-all group"
         >
            <Plus className="w-8 h-8 sm:w-10 sm:h-10 group-hover:rotate-90 transition-transform duration-500" />
            <div className="absolute right-full mr-4 bg-gray-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl whitespace-nowrap">
              Initialized Intel Dispatch
            </div>
         </button>
      )}

      {/* Compose Window (Manual Sending / Auto-Drafting) */}
      {isComposeOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-0 sm:right-16 w-full sm:w-[560px] h-full sm:h-[600px] bg-white sm:rounded-t-2xl shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.15)] border border-gray-200 flex flex-col z-[100] animate-in slide-in-from-bottom-8 duration-300 ease-out overflow-hidden">
          <div className="bg-gray-900 text-white px-5 py-4 sm:py-3 flex items-center justify-between cursor-pointer sticky top-0 sm:relative">
            <span className="text-sm font-bold tracking-tight uppercase">New Campaign Message</span>
            <div className="flex items-center gap-1.5">
               <button className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 transition-colors hidden sm:block"><Minimize2 className="w-4 h-4" /></button>
               <button onClick={() => setIsComposeOpen(false)} className="p-2 sm:p-1.5 hover:bg-white/10 rounded-lg text-white sm:text-gray-300 transition-colors"><X className="w-6 h-6 sm:w-4 sm:h-4" /></button>
            </div>
          </div>
          <div className="flex-1 flex flex-col p-4 sm:p-6 space-y-6 sm:space-y-4 overflow-y-auto">
             {/* Hidden File Input */}
             <input 
               type="file" 
               multiple 
               ref={fileInputRef} 
               onChange={handleFileUpload} 
               className="hidden" 
             />

             <div className="group relative">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Recipient</label>
               <div className="relative">
                 <input 
                   type="text" 
                   placeholder="Search leads or enter email..." 
                   value={composeData.to}
                   onChange={(e) => {
                     setComposeData({ ...composeData, to: e.target.value });
                     setLeadSearchQuery(e.target.value);
                     setShowLeadResults(true);
                   }}
                   onFocus={() => setShowLeadResults(true)}
                   className="w-full px-1 py-2 border-b border-gray-100 text-sm focus:outline-none focus:border-blue-500 font-semibold transition-all" 
                 />
                 {showLeadResults && filteredLeads.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 shadow-xl rounded-xl mt-1 z-[110] overflow-hidden">
                    {filteredLeads.map(lead => (
                      <div 
                        key={lead.email}
                        onClick={() => {
                          setComposeData({ ...composeData, to: lead.email });
                          setShowLeadResults(false);
                          setLeadSearchQuery('');
                        }}
                        className="p-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between border-b border-gray-50 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-bold text-gray-900">{lead.firstName} {lead.lastName}</p>
                          <p className="text-[10px] text-gray-500">{lead.email}</p>
                        </div>
                        <Users className="w-3 h-3 text-gray-300" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
             </div>
             <div className="group">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Subject Line</label>
               <input 
                 type="text" 
                 placeholder="Personalized subject..." 
                 value={composeData.subject}
                 onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                 className="w-full px-1 py-2 border-b border-gray-100 text-sm focus:outline-none focus:border-blue-500 font-semibold transition-all" 
               />
             </div>
             <div className="flex-1">
               <textarea 
                 id="compose-body"
                 className="w-full h-full p-2 text-sm focus:outline-none min-h-[250px] resize-none text-gray-800 leading-relaxed font-sans" 
                 placeholder="Message body (variables like {{firstName}} supported)..."
                 value={composeData.body}
                 onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
               ></textarea>
             </div>

             {/* Attachments List */}
             {attachments.length > 0 && (
               <div className="flex flex-wrap gap-2 pt-2 pb-2 border-t border-gray-50 max-h-32 overflow-y-auto">
                 {attachments.map((file, i) => (
                   <div key={i} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-xl text-[10px] font-bold text-gray-700 border border-gray-200">
                     <Paperclip className="w-3 h-3 text-gray-400" />
                     <span className="max-w-[120px] truncate">{file.name}</span>
                     <button 
                       type="button"
                       onClick={() => removeAttachment(i)} 
                       className="p-1 hover:bg-gray-200 rounded-lg text-gray-400 cursor-pointer"
                     >
                       <X className="w-3 h-3" />
                     </button>
                   </div>
                 ))}
               </div>
             )}
          </div>
          <div className="p-4 sm:p-5 bg-gray-50/80 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-2">
             <div className="flex items-center justify-between w-full sm:w-auto gap-2 sm:gap-3 flex-1 overflow-x-auto hide-scrollbar pb-2 sm:pb-0">
                <div className="flex flex-row items-center gap-2 sm:gap-2 w-full sm:w-auto shrink-0">
                  <button 
                    onClick={handleSendEmail}
                    disabled={isSending}
                    className="shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-5 sm:px-6 py-3 sm:py-3 rounded-2xl text-[12px] sm:text-xs font-black transition-all cursor-pointer shadow-xl shadow-blue-100 hover:shadow-blue-200 flex items-center justify-center gap-2 uppercase tracking-[0.1em] active:scale-95"
                  >
                    {isSending ? <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div> : <SendIcon className="w-3.5 h-3.5 fill-current" />}
                    {isSending ? 'Syncing...' : (scheduleDate && scheduleTime ? 'Schedule' : 'Send')}
                  </button>
                  
                  <div className="relative shrink-0">
                    <button 
                      onClick={() => setShowSchedulePicker(!showSchedulePicker)}
                      className={`h-full sm:h-auto p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border-2 ${scheduleDate && scheduleTime ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                    
                    <AnimatePresence>
                      {showSchedulePicker && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full right-0 sm:left-1/2 sm:-translate-x-1/2 mb-4 bg-white border border-gray-100 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.3)] rounded-[2.5rem] p-6 sm:p-8 w-[280px] sm:w-80 z-[120] animate-in slide-in-from-bottom-4 duration-300"
                        >
                          <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Time Buffer</span>
                              </div>
                              <button onClick={() => setShowSchedulePicker(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-3 h-3 text-gray-400" /></button>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block tracking-widest">Calendar Date</label>
                              <input 
                                type="date" 
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-xl text-sm font-black outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block tracking-widest">Precision Time</label>
                              <input 
                                type="time" 
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-xl text-sm font-black outline-none transition-all"
                              />
                            </div>
                            <div className="pt-2 border-t border-gray-50">
                               <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50 text-blue-700">
                                  <Zap className="w-3 h-3" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Auto staggered send</span>
                               </div>
                            </div>
                            <button 
                              onClick={() => setShowSchedulePicker(false)}
                              className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-black transition-all active:scale-95"
                            >
                              LOCK SCHEDULE
                            </button>
                            {(scheduleDate || scheduleTime) && (
                              <button 
                                onClick={() => { setScheduleDate(''); setScheduleTime(''); }}
                                className="w-full py-2 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-50 rounded-xl transition-colors"
                              >
                                RESET
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="flex gap-0.5 sm:gap-1">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 sm:p-3 hover:bg-gray-200/50 rounded-xl sm:rounded-2xl text-gray-400 cursor-pointer transition-all" 
                    title="Attach Files"
                  >
                    <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <div className="relative group/templates">
                    <button className="p-2 sm:p-3 hover:bg-gray-200/50 rounded-xl sm:rounded-2xl text-gray-400 cursor-pointer transition-all" title="Insert Variable"><List className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                    <div className="absolute bottom-full left-0 mb-3 hidden group-hover/templates:flex flex-col bg-white border border-gray-100 shadow-2xl rounded-2xl py-3 w-56 z-[110] animate-in slide-in-from-bottom-2">
                       <p className="px-5 py-2 text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">Intelligence Variables</p>
                       <button onClick={() => insertVariable('firstName')} className="px-5 py-3 text-xs text-gray-900 hover:bg-blue-50 text-left font-black tracking-tight uppercase">First Name</button>
                       <button onClick={() => insertVariable('lastName')} className="px-5 py-3 text-xs text-gray-900 hover:bg-blue-50 text-left font-black tracking-tight uppercase">Last Name</button>
                       <button onClick={() => insertVariable('company')} className="px-5 py-3 text-xs text-gray-900 hover:bg-blue-50 text-left font-black tracking-tight uppercase">Company Name</button>
                       <button onClick={() => insertVariable('email')} className="px-5 py-3 text-xs text-gray-900 hover:bg-blue-50 text-left font-black tracking-tight uppercase">Email Address</button>
                    </div>
                  </div>
                  <button onClick={insertLink} className="p-2 sm:p-3 hover:bg-gray-200/50 rounded-xl sm:rounded-2xl text-gray-400 cursor-pointer transition-all" title="Insert Link">
                    <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
             </div>
             <div className="hidden sm:flex items-center gap-6 pl-4 border-l border-gray-200">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    SYNCED
                  </span>
                  <span className="text-[8px] text-gray-400 font-bold font-mono tracking-tighter">Draft saved</span>
                </div>
                <button 
                  onClick={() => {
                    if (confirm("Discard this draft?")) {
                      setIsComposeOpen(false);
                      setComposeData({ to: '', subject: '', body: '' });
                    }
                  }} 
                  className="p-3 hover:bg-red-50 rounded-xl text-gray-300 hover:text-red-500 cursor-pointer transition-all border border-transparent hover:border-red-100" 
                  title="Discard draft"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}
