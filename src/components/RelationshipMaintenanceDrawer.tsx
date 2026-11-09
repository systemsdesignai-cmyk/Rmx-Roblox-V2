import React, { useState, useMemo } from 'react';
import { 
  X, CheckCircle, Clock, Calendar, MessageCircle, Phone, 
  Coffee, Mail, ArrowUpRight, Plus, Upload, Trash2, 
  AlertCircle, ChevronRight, Sparkles, Filter, Image as ImageIcon,
  Users, History
} from 'lucide-react';
import { Contact, MaintenanceLog } from '../types';
import { usePlatform } from '../context/PlatformContext';

interface RelationshipMaintenanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  navigateToContact: (id: number) => void;
}

export default function RelationshipMaintenanceDrawer({
  isOpen,
  onClose,
  contacts,
  setContacts,
  navigateToContact
}: RelationshipMaintenanceDrawerProps) {
  const { isIOS, isAndroid } = usePlatform();
  const [activeTab, setActiveTab] = useState<'todo' | 'scheduled' | 'all' | 'history'>('todo');
  const [selectedContactForMaintenance, setSelectedContactForMaintenance] = useState<Contact | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  
  // Maintenance logging form state
  const [logType, setLogType] = useState<MaintenanceLog['type']>('whatsapp');
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [logNotes, setLogNotes] = useState('');
  const [logNextDate, setLogNextDate] = useState('');
  const [logNextNotes, setLogNextNotes] = useState('');
  const [logScreenshot, setLogScreenshot] = useState('');
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Categorize contacts based on maintenance urgency
  const categorized = useMemo(() => {
    const todo: { contact: Contact; reason: string; urgency: 'overdue' | 'today' | 'unmaintained' | 'cadence' }[] = [];
    const scheduled: { contact: Contact; nextDate: string }[] = [];

    contacts.forEach(c => {
      if (c.nextFollowUpDate) {
        if (c.nextFollowUpDate < todayStr) {
          todo.push({
            contact: c,
            reason: `Follow-up overdue (${c.nextFollowUpDate})`,
            urgency: 'overdue'
          });
        } else if (c.nextFollowUpDate === todayStr) {
          todo.push({
            contact: c,
            reason: 'Follow-up reminder due today',
            urgency: 'today'
          });
        } else {
          scheduled.push({
            contact: c,
            nextDate: c.nextFollowUpDate
          });
        }
      } else if (!c.lastMaintainedDate) {
        // No maintenance ever recorded
        const hasConvs = c.conversations && c.conversations.length > 0;
        const lastConvDate = hasConvs ? c.conversations![c.conversations!.length - 1].date : null;
        if (!lastConvDate) {
          todo.push({
            contact: c,
            reason: 'New relationship – no touchpoints logged yet',
            urgency: 'unmaintained'
          });
        } else {
          const diffDays = Math.floor((new Date(todayStr).getTime() - new Date(lastConvDate).getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 14) {
            todo.push({
              contact: c,
              reason: `Last conversation was ${diffDays} days ago`,
              urgency: 'cadence'
            });
          }
        }
      } else {
        const diffDays = Math.floor((new Date(todayStr).getTime() - new Date(c.lastMaintainedDate).getTime()) / (1000 * 60 * 60 * 24));
        const cadence = c.maintenanceCadenceDays || 14;
        if (diffDays >= cadence) {
          todo.push({
            contact: c,
            reason: `Maintained ${diffDays} days ago (target cadence: ${cadence}d)`,
            urgency: 'cadence'
          });
        }
      }
    });

    return { todo, scheduled };
  }, [contacts, todayStr]);

  // Aggregate all historical logs across contacts
  const allHistory = useMemo(() => {
    const list: { contact: Contact; log: MaintenanceLog }[] = [];
    contacts.forEach(c => {
      (c.maintenanceLogs || []).forEach(log => {
        list.push({ contact: c, log });
      });
    });
    return list.sort((a, b) => new Date(b.log.date).getTime() - new Date(a.log.date).getTime());
  }, [contacts]);

  // Filtered contacts based on search
  const filteredContacts = useMemo(() => {
    if (!searchFilter.trim()) return contacts;
    const q = searchFilter.toLowerCase();
    return contacts.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.title.toLowerCase().includes(q) ||
      (c.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }, [contacts, searchFilter]);

  const openMaintenanceFormForContact = (contact: Contact) => {
    setSelectedContactForMaintenance(contact);
    setLogDate(new Date().toISOString().split('T')[0]);
    setLogType(contact.whatsAppUrl ? 'whatsapp' : 'call');
    setLogNotes('');
    setLogNextNotes('');
    setLogScreenshot('');

    // Default next follow-up to 2 weeks from now
    const defaultNext = new Date();
    defaultNext.setDate(defaultNext.getDate() + 14);
    setLogNextDate(defaultNext.toISOString().split('T')[0]);
  };

  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactForMaintenance) return;

    const newLog: MaintenanceLog = {
      id: Date.now(),
      date: logDate,
      type: logType,
      notes: logNotes.trim() || `Maintained relationship via ${logType}.`,
      nextFollowUpDate: logNextDate || undefined,
      nextFollowUpNotes: logNextNotes.trim() || undefined,
      screenshotUrl: logScreenshot || undefined
    };

    setContacts(prev => prev.map(c => {
      if (c.id === selectedContactForMaintenance.id) {
        // Also append to conversation history so it automatically reflects everywhere
        const newConversation = {
          id: Date.now(),
          date: logDate,
          notes: `[Maintained via ${logType.toUpperCase()}] ${logNotes.trim() || 'Checked in & followed up.'}`
        };

        return {
          ...c,
          lastMaintainedDate: logDate,
          nextFollowUpDate: logNextDate || undefined,
          followUpReminderNotes: logNextNotes.trim() || undefined,
          maintenanceLogs: [newLog, ...(c.maintenanceLogs || [])],
          conversations: [...(c.conversations || []), newConversation]
        };
      }
      return c;
    }));

    setSelectedContactForMaintenance(null);
  };

  const setPresetNextDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setLogNextDate(d.toISOString().split('T')[0]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className={`relative w-full max-w-xl bg-neutral-900 border-l border-neutral-800 h-full flex flex-col shadow-2xl z-10 animate-slide-in-right overflow-hidden ${
        isAndroid 
          ? 'sm:rounded-l-[28px] border-neutral-800/60' 
          : 'sm:rounded-l-2xl backdrop-blur-xl border-white/[0.08]'
      }`}>
        
        {/* Mobile Drag Indicator Handle */}
        <div className="pt-2 sm:hidden flex justify-center shrink-0">
          <div className={`rounded-full ${
            isAndroid 
              ? 'w-8 h-1 bg-neutral-600' 
              : 'w-10 h-1 bg-neutral-600/80'
          }`} />
        </div>

        {/* Header */}
        <div className="pt-[calc(0.75rem+env(safe-area-inset-top,0px))] px-5 pb-4 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur-xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              isAndroid 
                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20 rounded-2xl' 
                : 'bg-indigo-600/15 text-indigo-400 border-indigo-500/20'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">Relationship Maintenance</h3>
                <span className={`text-[10px] px-2 py-0.5 font-mono font-medium border ${
                  isAndroid 
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 rounded-full' 
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30 rounded'
                }`}>
                  {categorized.todo.length} To-Do
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Keep key contacts warm with timely check-ins & next-step reminders
              </p>
            </div>
          </div>
          <button 
            id="close-maintenance-drawer-btn"
            onClick={onClose}
            className={`text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer flex items-center justify-center ${
              isAndroid 
                ? 'min-h-[48px] min-w-[48px] rounded-full' 
                : 'min-h-[44px] min-w-[44px] rounded-xl'
            }`}
            aria-label="Close Maintenance Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filter Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-4 pt-1 gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            id="maintenance-tab-todo"
            onClick={() => { setActiveTab('todo'); setSelectedContactForMaintenance(null); }}
            className={`pb-2.5 px-3 text-xs font-medium font-mono transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'todo'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>To-Do</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium ${
              categorized.todo.length > 0 ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40' : 'bg-neutral-800/80 text-neutral-500'
            }`}>
              {categorized.todo.length}
            </span>
          </button>

          <button
            id="maintenance-tab-scheduled"
            onClick={() => { setActiveTab('scheduled'); setSelectedContactForMaintenance(null); }}
            className={`pb-2.5 px-3 text-xs font-medium font-mono transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'scheduled'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Scheduled</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800/80 text-neutral-400 font-mono">
              {categorized.scheduled.length}
            </span>
          </button>

          <button
            id="maintenance-tab-all"
            onClick={() => { setActiveTab('all'); setSelectedContactForMaintenance(null); }}
            className={`pb-2.5 px-3 text-xs font-medium font-mono transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All Contacts</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800/80 text-neutral-400 font-mono">
              {contacts.length}
            </span>
          </button>

          <button
            id="maintenance-tab-history"
            onClick={() => { setActiveTab('history'); setSelectedContactForMaintenance(null); }}
            className={`pb-2.5 px-3 text-xs font-medium font-mono transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800/80 text-neutral-400 font-mono">
              {allHistory.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Active Maintenance Logging Modal / Form */}
          {selectedContactForMaintenance && (
            <div className="bg-neutral-950 border border-indigo-500/40 rounded-2xl p-5 shadow-2xl mb-4 animate-fade-in relative">
              <button 
                onClick={() => setSelectedContactForMaintenance(null)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-850"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                {selectedContactForMaintenance.avatar ? (
                  <img 
                    src={selectedContactForMaintenance.avatar} 
                    alt={selectedContactForMaintenance.name} 
                    className="w-10 h-10 rounded-xl object-cover border border-indigo-500/30"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-neutral-850 flex items-center justify-center font-bold text-neutral-400 font-display">
                    {selectedContactForMaintenance.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-white font-display">Log Touchpoint: {selectedContactForMaintenance.name}</h4>
                  <p className="text-[10px] text-neutral-400 truncate">{selectedContactForMaintenance.title}</p>
                </div>
              </div>

              {/* Direct context prompt if any */}
              {selectedContactForMaintenance.thingsToMention && selectedContactForMaintenance.thingsToMention.length > 0 && (
                <div className="mb-4 p-2.5 bg-indigo-950/20 border border-indigo-900/30 rounded-xl text-xs">
                  <span className="text-indigo-400 font-bold block mb-1 font-mono text-[10px] uppercase">💡 Context Point to Remember:</span>
                  <p className="text-neutral-300 italic">"{selectedContactForMaintenance.thingsToMention[0]}"</p>
                </div>
              )}

              <form onSubmit={handleSaveMaintenance} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase font-mono mb-1">Date of Touchpoint</label>
                    <input 
                      type="date" 
                      value={logDate} 
                      onChange={e => setLogDate(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase font-mono mb-1">Channel / Medium</label>
                    <select
                      value={logType}
                      onChange={e => setLogType(e.target.value as any)}
                      className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    >
                      <option value="whatsapp">WhatsApp Message</option>
                      <option value="call">Phone / Voice Call</option>
                      <option value="in-person">Coffee / In-Person</option>
                      <option value="message">Direct Message / SMS</option>
                      <option value="email">Email</option>
                      <option value="other">Other Touchpoint</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase font-mono mb-1">
                    What was discussed / Operation Notes
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Sent article on Series B benchmarks, she responded saying thanks and asked to grab coffee next week..."
                    value={logNotes}
                    onChange={e => setLogNotes(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl p-3 text-xs outline-none focus:border-indigo-500 resize-y placeholder:text-neutral-600"
                  />
                </div>

                {/* Screenshot / Image Context Upload */}
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase font-mono mb-1">
                    Screenshot / Image Note (Optional Proof or Context)
                  </label>
                  <div className="flex gap-2 items-center">
                    <label className="bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 hover:border-neutral-700 font-semibold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer select-none flex items-center gap-1.5 shrink-0">
                      <Upload className="w-3.5 h-3.5 text-indigo-400" />
                      Attach Screenshot
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setLogScreenshot(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {logScreenshot && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Image attached
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setLogScreenshot('')}
                          className="text-[10px] text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Next Follow-Up Schedule */}
                <div className="p-3.5 bg-neutral-900/60 rounded-xl border border-neutral-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-indigo-400 uppercase font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Next Follow-Up Schedule
                    </label>
                    <div className="flex gap-1">
                      <button 
                        type="button" 
                        onClick={() => setPresetNextDate(3)} 
                        className="text-[9px] bg-neutral-800 hover:bg-neutral-750 text-neutral-300 px-2 py-0.5 rounded font-mono"
                      >
                        +3d
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setPresetNextDate(7)} 
                        className="text-[9px] bg-neutral-800 hover:bg-neutral-750 text-neutral-300 px-2 py-0.5 rounded font-mono"
                      >
                        +1w
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setPresetNextDate(14)} 
                        className="text-[9px] bg-neutral-800 hover:bg-neutral-750 text-neutral-300 px-2 py-0.5 rounded font-mono"
                      >
                        +2w
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setPresetNextDate(30)} 
                        className="text-[9px] bg-neutral-800 hover:bg-neutral-750 text-neutral-300 px-2 py-0.5 rounded font-mono"
                      >
                        +1m
                      </button>
                    </div>
                  </div>

                  <input 
                    type="date" 
                    value={logNextDate} 
                    onChange={e => setLogNextDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500"
                  />

                  <input 
                    type="text" 
                    placeholder="Note for next time (e.g. Ask how the product launch went)..." 
                    value={logNextNotes} 
                    onChange={e => setLogNextNotes(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 placeholder:text-neutral-600"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Save & Tick as Maintained
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedContactForMaintenance(null)}
                    className="px-4 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs py-3 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 1: Due / To-Do */}
          {activeTab === 'todo' && (
            <div className="space-y-3">
              {categorized.todo.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 space-y-2 bg-neutral-950/40 rounded-2xl border border-neutral-850">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-neutral-300">All Relationships Up to Date!</p>
                  <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                    You have maintained all scheduled follow-ups and active connections for today.
                  </p>
                </div>
              ) : (
                categorized.todo.map(({ contact, reason, urgency }) => (
                  <div 
                    key={contact.id}
                    className="bg-neutral-950 border border-neutral-850 hover:border-indigo-500/30 rounded-2xl p-4 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {contact.avatar ? (
                          <img 
                            src={contact.avatar} 
                            alt={contact.name} 
                            className="w-10 h-10 rounded-xl object-cover shrink-0 border border-neutral-800"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-neutral-400 shrink-0 font-display">
                            {contact.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 
                            onClick={() => { navigateToContact(contact.id); onClose(); }}
                            className="font-bold text-sm text-neutral-100 hover:text-indigo-400 transition-colors cursor-pointer truncate font-display"
                          >
                            {contact.name}
                          </h4>
                          <p className="text-[10px] text-neutral-400 truncate">{contact.title}</p>
                        </div>
                      </div>

                      <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-bold shrink-0 border ${
                        urgency === 'overdue' 
                          ? 'bg-red-950/30 text-red-400 border-red-900/40' 
                          : urgency === 'today'
                          ? 'bg-amber-950/30 text-amber-300 border-amber-900/40'
                          : 'bg-indigo-950/30 text-indigo-400 border-indigo-900/40'
                      }`}>
                        {reason}
                      </span>
                    </div>

                    {/* Context Points & Last Interaction */}
                    <div className="bg-neutral-900/80 rounded-xl p-2.5 text-xs text-neutral-300 space-y-1 border border-neutral-850">
                      {contact.followUpReminderNotes && (
                        <div className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
                          <span>🔔 Reminder Note:</span>
                          <span className="truncate">{contact.followUpReminderNotes}</span>
                        </div>
                      )}
                      
                      {contact.thingsToMention && contact.thingsToMention.length > 0 && (
                        <div className="text-[11px] text-neutral-400 flex items-center gap-1 truncate">
                          <span className="text-indigo-400 font-bold shrink-0">💬 Point of Context:</span>
                          <span className="truncate italic">"{contact.thingsToMention[0]}"</span>
                        </div>
                      )}

                      {(!contact.thingsToMention || contact.thingsToMention.length === 0) && contact.conversations && contact.conversations.length > 0 && (
                        <div className="text-[11px] text-neutral-400 flex items-center gap-1 truncate">
                          <span className="text-neutral-500 font-mono shrink-0">Last note:</span>
                          <span className="truncate">{contact.conversations[contact.conversations.length - 1].notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        {contact.whatsAppUrl && (
                          <a 
                            href={contact.whatsAppUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-emerald-950/30 hover:bg-emerald-900 text-emerald-400 border border-emerald-900/30 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 active:scale-95"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                        )}
                        <button 
                          onClick={() => { navigateToContact(contact.id); onClose(); }}
                          className="text-[11px] text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-neutral-900 transition-colors"
                        >
                          View Profile
                        </button>
                      </div>

                      <button
                        onClick={() => openMaintenanceFormForContact(contact)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Maintain & Tick
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Scheduled */}
          {activeTab === 'scheduled' && (
            <div className="space-y-3">
              {categorized.scheduled.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 space-y-2 bg-neutral-950/40 rounded-2xl border border-neutral-850">
                  <Calendar className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-xs">No upcoming scheduled reminders yet.</p>
                  <p className="text-[11px] text-neutral-600">
                    Maintain contacts and set a future reminder date to schedule upcoming touchpoints.
                  </p>
                </div>
              ) : (
                categorized.scheduled.map(({ contact, nextDate }) => (
                  <div 
                    key={contact.id}
                    className="bg-neutral-950 border border-neutral-850 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-neutral-750 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {contact.avatar ? (
                        <img 
                          src={contact.avatar} 
                          alt={contact.name} 
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-neutral-400 shrink-0 font-display">
                          {contact.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 
                          onClick={() => { navigateToContact(contact.id); onClose(); }}
                          className="font-bold text-sm text-neutral-100 hover:text-indigo-400 transition-colors cursor-pointer truncate font-display"
                        >
                          {contact.name}
                        </h4>
                        <div className="text-[10px] text-neutral-400 flex items-center gap-2 mt-0.5">
                          <span className="text-indigo-400 font-mono font-medium">Scheduled: {nextDate}</span>
                          {contact.followUpReminderNotes && (
                            <span className="truncate text-neutral-500">• {contact.followUpReminderNotes}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => openMaintenanceFormForContact(contact)}
                      className="bg-neutral-850 hover:bg-neutral-800 text-neutral-200 font-bold text-xs px-3 py-1.5 rounded-xl transition-all shrink-0 active:scale-95"
                    >
                      Update
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: All Contacts */}
          {activeTab === 'all' && (
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Search contact to maintain..." 
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 placeholder:text-neutral-600"
              />

              <div className="space-y-2">
                {filteredContacts.map(contact => (
                  <div 
                    key={contact.id}
                    className="bg-neutral-950 border border-neutral-850 rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-neutral-750 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {contact.avatar ? (
                        <img 
                          src={contact.avatar} 
                          alt={contact.name} 
                          className="w-9 h-9 rounded-xl object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-neutral-400 shrink-0 font-display">
                          {contact.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 
                          onClick={() => { navigateToContact(contact.id); onClose(); }}
                          className="font-bold text-xs text-neutral-100 hover:text-indigo-400 transition-colors cursor-pointer truncate font-display"
                        >
                          {contact.name}
                        </h4>
                        <div className="text-[10px] text-neutral-500 truncate">
                          {contact.lastMaintainedDate ? `Last maintained: ${contact.lastMaintainedDate}` : 'Never maintained'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => openMaintenanceFormForContact(contact)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl transition-all shrink-0 active:scale-95"
                    >
                      Log Check-in
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: History */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {allHistory.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 space-y-2 bg-neutral-950/40 rounded-2xl border border-neutral-850">
                  <Clock className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-xs">No maintenance history recorded yet.</p>
                </div>
              ) : (
                allHistory.map(({ contact, log }) => (
                  <div 
                    key={log.id}
                    className="bg-neutral-950 border border-neutral-850 rounded-2xl p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-xs text-white truncate font-display">{contact.name}</span>
                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-950/40 text-indigo-400 border border-indigo-900/30">
                          {log.type}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono shrink-0">{log.date}</span>
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">{log.notes}</p>

                    {/* Screenshot thumbnail */}
                    {log.screenshotUrl && (
                      <div className="mt-2">
                        <button 
                          onClick={() => setSelectedImagePreview(log.screenshotUrl!)}
                          className="group relative rounded-xl overflow-hidden border border-neutral-800 hover:border-indigo-500/50 transition-all block"
                        >
                          <img 
                            src={log.screenshotUrl} 
                            alt="Maintenance Screenshot" 
                            className="max-h-36 w-auto rounded-lg object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                            Click to View Full
                          </div>
                        </button>
                      </div>
                    )}

                    {log.nextFollowUpDate && (
                      <div className="text-[10px] text-indigo-400/90 font-mono pt-1 border-t border-neutral-900 flex items-center gap-1">
                        <span>🗓️ Next scheduled: {log.nextFollowUpDate}</span>
                        {log.nextFollowUpNotes && <span className="text-neutral-400 truncate">({log.nextFollowUpNotes})</span>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>

      {/* Image Preview Modal */}
      {selectedImagePreview && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImagePreview(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img 
              src={selectedImagePreview} 
              alt="Screenshot Preview" 
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" 
            />
            <button 
              onClick={() => setSelectedImagePreview(null)}
              className="absolute top-2 right-2 p-2 bg-neutral-900/80 text-white rounded-full hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
