import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Calendar, Plus, Search, MapPin, 
  ChevronRight, MessageCircle, Link as LinkIcon, 
  Lightbulb, AlertTriangle, Heart, Zap, UserPlus, X, User, Mic, Image,
  Folder, Briefcase, ChevronLeft, Trash2, ArrowUpRight, Sparkles, Loader2, CheckCircle, Upload,
  Edit2, Check, Clock, Phone
} from 'lucide-react';
import { Contact, Event, CustomFolders, ViewState, Skill, Conversation, Transcription, MaintenanceLog } from '../types';

interface ContactsViewProps {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  customFolders: CustomFolders;
  setCustomFolders: React.Dispatch<React.SetStateAction<CustomFolders>>;
  viewState: ViewState;
  goToList: () => void;
  goToDetail: (id: number) => void;
}

export default function ContactsView({
  contacts,
  setContacts,
  events,
  setEvents,
  customFolders,
  setCustomFolders,
  viewState,
  goToList,
  goToDetail
}: ContactsViewProps) {
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState<string>('all');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  const [customSortBys, setCustomSortBys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rolodox_custom_sortbys_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('rolodox_custom_sortbys_v1', JSON.stringify(customSortBys));
  }, [customSortBys]);

  // Filter contacts based on search input (name or tags)
  const searchFiltered = useMemo(() => {
    return (contacts || []).filter(c => {
      const nameMatch = (c.name || '').toLowerCase().includes(search.toLowerCase());
      const tagMatch = (c.tags || []).some(t => (t || '').toLowerCase().includes(search.toLowerCase()));
      const titleMatch = (c.title || '').toLowerCase().includes(search.toLowerCase());
      return nameMatch || tagMatch || titleMatch;
    });
  }, [contacts, search]);

  // Compute folders dynamically based on groupings
  const folders = useMemo(() => {
    if (groupBy === 'all') return [];
    const folderMap: Record<string, Contact[]> = {};

    // Initialize custom folders created by the user or default categories
    const currentCustomGroup = groupBy === 'category'
      ? ['Technology', 'Finances', 'Business', 'Personal Development', ...(customFolders.categories || [])]
      : groupBy.startsWith('custom_')
      ? (customFolders[groupBy] || [])
      : (customFolders[groupBy as keyof CustomFolders] || []);

    currentCustomGroup.forEach((fName: string) => {
      if (!folderMap[fName]) {
        folderMap[fName] = [];
      }
    });

    // Populate contacts based on the grouping selection
    searchFiltered.forEach(c => {
      let keys: string[] = [];
      if (groupBy === 'events' && c.source) {
        keys = c.source.split(',').map(s => s.trim());
      }
      if (groupBy === 'skills' && c.skills) {
        keys = c.skills.map(s => s.name);
      }
      if (groupBy === 'tags' && c.tags) {
        keys = c.tags;
      }
      if (groupBy === 'network' && c.whoTheyKnow) {
        keys = c.whoTheyKnow;
      }
      if (groupBy === 'projects' && c.projects) {
        keys = c.projects;
      }
      if (groupBy === 'category') {
        keys = [...(c.categories || [])];
        if (c.eventId) {
          const linkedEvt = events.find(e => e.id === c.eventId);
          if (linkedEvt && linkedEvt.category) {
            keys.push(linkedEvt.category);
          }
        }
        if (c.source) {
          const linkedEvt = events.find(e => e.name === c.source);
          if (linkedEvt && linkedEvt.category) {
            keys.push(linkedEvt.category);
          }
        }
      }
      if (groupBy.startsWith('custom_')) {
        keys = c.customGroupings?.[groupBy] || [];
      }

      const uniqueKeys = Array.from(new Set(keys));
      uniqueKeys.forEach(key => {
        if (!key) return;
        const k = key.trim();
        if (!folderMap[k]) {
          folderMap[k] = [];
        }
        if (!folderMap[k].some(item => item.id === c.id)) {
          folderMap[k].push(c);
        }
      });
    });

    return Object.entries(folderMap).map(([name, items]) => ({
      name,
      items,
      count: items.length
    })).sort((a, b) => b.count - a.count);
  }, [searchFiltered, groupBy, customFolders, events]);

  let displayContacts = searchFiltered;
  if (groupBy !== 'all' && activeFolder) {
    displayContacts = folders.find(f => f.name === activeFolder)?.items || [];
  }

  // Linked events for projects grouping
  const linkedEvents = useMemo(() => {
    if (groupBy === 'projects' && activeFolder) {
      return (events || []).filter(e => (e.projects || []).includes(activeFolder));
    }
    return [];
  }, [events, groupBy, activeFolder]);

  const handleCreateFolder = () => {
    const isCustom = groupBy.startsWith('custom_');
    const folderLabel = isCustom ? groupBy.replace(/^custom_/, '') : (groupBy === 'category' ? 'category' : groupBy.replace(/s$/, ''));
    const folderName = prompt(`Enter new ${folderLabel} name:`);
    if (folderName && folderName.trim()) {
      const trimmedName = folderName.trim();
      if (isCustom) {
        setCustomFolders(prev => ({
          ...prev,
          [groupBy]: [...new Set([...(prev[groupBy] || []), trimmedName])]
        }));
      } else {
        const targetKey = groupBy === 'category' ? 'categories' : (groupBy as keyof CustomFolders);
        setCustomFolders(prev => ({
          ...prev,
          [targetKey]: [...new Set([...((prev[targetKey] || []) as string[]), trimmedName])]
        }));
      }
    }
  };

  const handleRenameFolder = (oldName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isCustom = groupBy.startsWith('custom_');
    const folderLabel = isCustom ? groupBy.replace(/^custom_/, '') : (groupBy === 'category' ? 'category' : groupBy.replace(/s$/, ''));
    const newName = prompt(`Rename ${folderLabel} "${oldName}" to:`, oldName);
    if (!newName || !newName.trim() || newName.trim() === oldName) return;
    const trimmed = newName.trim();

    if (isCustom) {
      setCustomFolders(prev => ({
        ...prev,
        [groupBy]: (prev[groupBy] || []).map(f => f === oldName ? trimmed : f)
      }));
    } else {
      const targetKey = groupBy === 'category' ? 'categories' : (groupBy as keyof CustomFolders);
      setCustomFolders(prev => ({
        ...prev,
        [targetKey]: ((prev[targetKey] || []) as string[]).map(f => f === oldName ? trimmed : f)
      }));
    }

    // Update contacts referencing this folder
    setContacts(prev => prev.map(c => {
      const updated = { ...c };
      if (groupBy === 'tags') {
        updated.tags = (c.tags || []).map(t => t === oldName ? trimmed : t);
      }
      if (groupBy === 'events') {
        updated.source = (c.source || '').split(',').map(s => s.trim()).map(s => s === oldName ? trimmed : s).join(', ') || undefined;
      }
      if (groupBy === 'projects') {
        updated.projects = (c.projects || []).map(p => p === oldName ? trimmed : p);
      }
      if (groupBy === 'network') {
        updated.whoTheyKnow = (c.whoTheyKnow || []).map(w => w === oldName ? trimmed : w);
      }
      if (groupBy === 'skills') {
        updated.skills = (c.skills || []).map(s => s.name === oldName ? { ...s, name: trimmed } : s);
      }
      if (groupBy === 'category') {
        updated.categories = (c.categories || []).map(cat => cat === oldName ? trimmed : cat);
      }
      if (isCustom) {
        const customGroupings = { ...(c.customGroupings || {}) };
        if (customGroupings[groupBy]) {
          customGroupings[groupBy] = customGroupings[groupBy].map(f => f === oldName ? trimmed : f);
        }
        updated.customGroupings = customGroupings;
      }
      return updated;
    }));

    // Update events if project or event grouping
    if (groupBy === 'projects') {
      setEvents(prev => prev.map(evt => ({
        ...evt,
        projects: (evt.projects || []).map(p => p === oldName ? trimmed : p)
      })));
    }
    if (groupBy === 'events') {
      setEvents(prev => prev.map(evt => evt.name === oldName ? { ...evt, name: trimmed } : evt));
    }

    if (activeFolder === oldName) {
      setActiveFolder(trimmed);
    }
  };

  const handleDeleteFolder = (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the folder "${folderName}"? Contacts inside will not be deleted, they will just be removed from this folder.`)) {
      const isCustom = groupBy.startsWith('custom_');
      if (isCustom) {
        setCustomFolders(prev => ({
          ...prev,
          [groupBy]: (prev[groupBy] || []).filter(f => f !== folderName)
        }));
      } else {
        const targetKey = groupBy === 'category' ? 'categories' : (groupBy as keyof CustomFolders);
        setCustomFolders(prev => ({
          ...prev,
          [targetKey]: ((prev[targetKey] || []) as string[]).filter(f => f !== folderName)
        }));
      }

      setContacts(prev => prev.map(c => {
        const updated = { ...c };
        if (groupBy === 'tags') {
          updated.tags = (c.tags || []).filter(t => t !== folderName);
        }
        if (groupBy === 'events') {
          updated.source = (c.source || '').split(',').map(s => s.trim()).filter(s => s !== folderName).join(', ') || undefined;
        }
        if (groupBy === 'projects') {
          updated.projects = (c.projects || []).filter(p => p !== folderName);
        }
        if (groupBy === 'network') {
          updated.whoTheyKnow = (c.whoTheyKnow || []).filter(w => w !== folderName);
        }
        if (groupBy === 'skills') {
          updated.skills = (c.skills || []).filter(s => s.name !== folderName);
        }
        if (groupBy === 'category') {
          updated.categories = (c.categories || []).filter(cat => cat !== folderName);
        }
        if (isCustom) {
          const customGroupings = { ...(c.customGroupings || {}) };
          if (customGroupings[groupBy]) {
            customGroupings[groupBy] = customGroupings[groupBy].filter(f => f !== folderName);
          }
          updated.customGroupings = customGroupings;
        }
        return updated;
      }));
    }
  };

  const getIsFolderDeletable = (folderName: string) => {
    if (groupBy.startsWith('custom_')) return true;
    if (groupBy === 'category') return (customFolders.categories || []).includes(folderName);
    if (groupBy === 'projects') return (customFolders.projects || []).includes(folderName);
    if (groupBy === 'skills') return (customFolders.skills || []).includes(folderName);
    if (groupBy === 'tags') return (customFolders.tags || []).includes(folderName);
    if (groupBy === 'network') return (customFolders.network || []).includes(folderName);
    return false;
  };

  const handleAddContactToFolder = (contactId: number) => {
    if (!contactId || !activeFolder) return;
    setContacts(prev => prev.map(c => {
      if (c.id !== contactId) return c;
      const updated = { ...c };
      if (groupBy === 'tags') {
        updated.tags = [...new Set([...(c.tags || []), activeFolder])];
      }
      if (groupBy === 'events') {
        const currentSources = (c.source || '').split(',').map(s => s.trim()).filter(Boolean);
        if (!currentSources.includes(activeFolder)) {
          updated.source = c.source ? `${c.source}, ${activeFolder}` : activeFolder;
        }
      }
      if (groupBy === 'projects') {
        updated.projects = [...new Set([...(c.projects || []), activeFolder])];
      }
      if (groupBy === 'network') {
        updated.whoTheyKnow = [...new Set([...(c.whoTheyKnow || []), activeFolder])];
      }
      if (groupBy === 'skills') {
        if (!(c.skills || []).some(s => s.name === activeFolder)) {
          updated.skills = [...(c.skills || []), { id: Date.now(), name: activeFolder, leverage: '' }];
        }
      }
      if (groupBy === 'category') {
        updated.categories = [...new Set([...(c.categories || []), activeFolder])];
      }
      if (groupBy.startsWith('custom_')) {
        const customGroupings = { ...(c.customGroupings || {}) };
        customGroupings[groupBy] = [...new Set([...(customGroupings[groupBy] || []), activeFolder])];
        updated.customGroupings = customGroupings;
      }
      return updated;
    }));
    setIsAddingContact(false);
  };

  const handleRemoveContactFromFolder = (contactId: number) => {
    if (!contactId || !activeFolder) return;
    setContacts(prev => prev.map(c => {
      if (c.id !== contactId) return c;
      const updated = { ...c };
      if (groupBy === 'tags') {
        updated.tags = (c.tags || []).filter(t => t !== activeFolder);
      }
      if (groupBy === 'events') {
        updated.source = (c.source || '').split(',').map(s => s.trim()).filter(s => s !== activeFolder).join(', ') || undefined;
      }
      if (groupBy === 'projects') {
        updated.projects = (c.projects || []).filter(p => p !== activeFolder);
      }
      if (groupBy === 'network') {
        updated.whoTheyKnow = (c.whoTheyKnow || []).filter(w => w !== activeFolder);
      }
      if (groupBy === 'skills') {
        updated.skills = (c.skills || []).filter(s => s.name !== activeFolder);
      }
      if (groupBy === 'category') {
        updated.categories = (c.categories || []).filter(cat => cat !== activeFolder);
      }
      if (groupBy.startsWith('custom_')) {
        const customGroupings = { ...(c.customGroupings || {}) };
        if (customGroupings[groupBy]) {
          customGroupings[groupBy] = customGroupings[groupBy].filter(f => f !== activeFolder);
        }
        updated.customGroupings = customGroupings;
      }
      return updated;
    }));
  };

  const handleAddEventToProject = (eventId: number) => {
    if (!eventId || !activeFolder) return;
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, projects: [...(e.projects || []), activeFolder] } : e));
    setIsAddingEvent(false);
  };

  if (viewState.view === 'create') {
    return <ContactForm goToList={goToList} setContacts={setContacts} events={events} />;
  }

  if (viewState.view === 'detail' && viewState.id !== null) {
    const contact = contacts.find(c => c.id === viewState.id);
    return <ContactDetail contact={contact} goToList={goToList} setContacts={setContacts} />;
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
        <input 
          id="search-input"
          type="text" 
          placeholder="Search contacts by name, tag, or headline..." 
          className="w-full bg-neutral-900/90 border border-neutral-800 text-neutral-100 text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/60 transition-all placeholder:text-neutral-500 font-sans"
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grouping Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar items-center border-b border-neutral-800/60">
        {[
          { id: 'all', label: 'All Contacts' }, 
          { id: 'category', label: 'By Category' },
          { id: 'projects', label: 'By Project' },
          { id: 'events', label: 'By Event' }, 
          { id: 'skills', label: 'By Skill' },
          { id: 'tags', label: 'By Tag' }, 
          { id: 'network', label: 'By Network' },
          ...customSortBys.map(name => ({
            id: `custom_${name}`,
            label: `By ${name}`,
            isCustom: true,
            name: name
          }))
        ].map(group => {
          const isSelected = groupBy === group.id;
          return (
            <div key={group.id} className="relative shrink-0 flex items-center group">
              <button 
                id={`group-tab-${group.id}`}
                onClick={() => { 
                  setGroupBy(group.id); 
                  setActiveFolder(null); 
                  setIsAddingContact(false); 
                  setIsAddingEvent(false); 
                }}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${group.isCustom ? 'pr-7' : ''} ${
                  isSelected 
                    ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-sm' 
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
                }`}
              >
                {group.label}
              </button>
              {group.isCustom && (
                <button
                  id={`delete-custom-sort-${group.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete custom Sort By category "By ${group.name}"? This won't delete the folders or contacts, but will remove this dynamic grouping.`)) {
                      setCustomSortBys(prev => prev.filter(n => n !== group.name));
                      if (isSelected) {
                        setGroupBy('all');
                        setActiveFolder(null);
                      }
                    }
                  }}
                  className="absolute right-2 text-neutral-400 hover:text-red-400 p-0.5 rounded-full transition-colors hover:bg-black/20"
                  title={`Delete Sort By ${group.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Inline input for custom Sort By option */}
        <div className="relative shrink-0 flex items-center">
          <input
            id="new-custom-sort-input"
            type="text"
            placeholder="+ Custom Sort..."
            className="bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-700 focus:border-indigo-500 focus:text-white rounded-full px-4 py-2 text-xs font-bold outline-none transition-all w-32 placeholder:text-neutral-600 focus:w-44"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.currentTarget;
                const value = target.value.trim();
                if (value) {
                  const cleanedValue = value.charAt(0).toUpperCase() + value.slice(1);
                  if (!customSortBys.includes(cleanedValue)) {
                    setCustomSortBys(prev => [...prev, cleanedValue]);
                    setGroupBy(`custom_${cleanedValue}`);
                    setActiveFolder(null);
                  }
                  target.value = '';
                }
              }
            }}
          />
        </div>
      </div>

      {/* Folders View (When grouped & no folder is open) */}
      {groupBy !== 'all' && !activeFolder && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in">
          {folders.map(folder => (
            <div 
              id={`folder-${folder.name.replace(/\s+/g, '-')}`}
              key={folder.name} 
              onClick={() => setActiveFolder(folder.name)} 
              className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800/90 cursor-pointer hover:border-neutral-700 hover:bg-neutral-850/80 transition-all flex flex-col justify-between text-left group min-h-[120px] relative"
            >
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-900/30 text-indigo-400 group-hover:text-indigo-300 transition-colors">
                  <Folder className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    id={`rename-folder-${folder.name.replace(/\s+/g, '-')}`}
                    onClick={(e) => handleRenameFolder(folder.name, e)}
                    className="p-1 text-neutral-400 hover:text-indigo-300 hover:bg-neutral-800 rounded transition-all cursor-pointer"
                    title="Rename Directory / Folder"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {getIsFolderDeletable(folder.name) && (
                    <button
                      id={`delete-folder-${folder.name.replace(/\s+/g, '-')}`}
                      onClick={(e) => handleDeleteFolder(folder.name, e)}
                      className="p-1 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-all cursor-pointer"
                      title="Delete Folder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <h4 className="font-semibold text-xs sm:text-sm text-neutral-200 line-clamp-1 group-hover:text-white transition-colors">{folder.name}</h4>
                <span className="text-[11px] text-neutral-500 font-mono mt-0.5 block">{folder.count} {folder.count === 1 ? 'contact' : 'contacts'}</span>
              </div>
            </div>
          ))}
          <div 
            id="new-folder-btn"
            onClick={handleCreateFolder} 
            className="bg-neutral-900/30 p-4 rounded-xl border border-dashed border-neutral-800 cursor-pointer hover:border-neutral-700 hover:bg-neutral-900/60 transition-all flex flex-col items-center justify-center text-center group min-h-[120px]"
          >
            <div className="p-2 rounded-lg bg-neutral-800/50 text-neutral-500 group-hover:text-neutral-300 transition-colors mb-2">
              <Plus className="w-4 h-4" />
            </div>
            <h4 className="font-medium text-xs text-neutral-400 group-hover:text-neutral-200">New Folder</h4>
          </div>
        </div>
      )}

      {/* Directory / Open Folder Contacts list */}
      {(groupBy === 'all' || activeFolder) && (
        <div className="space-y-4 animate-fade-in">
          {activeFolder && (
            <div className="flex flex-col gap-4 mb-6 bg-indigo-950/10 p-5 rounded-2xl border border-indigo-500/15">
              <div className="flex items-center justify-between min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <button 
                    id="back-folder-btn"
                    onClick={() => { 
                      setActiveFolder(null); 
                      setIsAddingContact(false); 
                      setIsAddingEvent(false); 
                    }} 
                    className="p-1.5 hover:bg-indigo-500/20 rounded-lg text-indigo-400 transition-colors shrink-0"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <Folder className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span className="font-bold text-indigo-200 text-base sm:text-lg truncate font-display">{activeFolder}</span>
                  <button
                    id="rename-active-folder-btn"
                    onClick={(e) => handleRenameFolder(activeFolder, e)}
                    className="p-1.5 text-neutral-400 hover:text-indigo-300 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    title="Rename this directory"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-xs bg-indigo-900/30 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-full font-mono font-semibold">{displayContacts.length} total</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button 
                  id="assign-contact-btn"
                  onClick={() => { 
                    setIsAddingContact(!isAddingContact); 
                    setIsAddingEvent(false); 
                  }} 
                  className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-bold px-3 py-2.5 rounded-xl hover:bg-neutral-800 hover:text-white transition-all flex items-center gap-1.5 flex-1 sm:flex-none justify-center active:scale-95"
                >
                  <UserPlus className="w-4 h-4 text-indigo-400 shrink-0" /> Assign Contact
                </button>
                {groupBy === 'projects' && (
                  <button 
                    id="link-event-btn"
                    onClick={() => { 
                      setIsAddingEvent(!isAddingEvent); 
                      setIsAddingContact(false); 
                    }} 
                    className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-bold px-3 py-2.5 rounded-xl hover:bg-neutral-800 hover:text-white transition-all flex items-center gap-1.5 flex-1 sm:flex-none justify-center active:scale-95"
                  >
                    <Calendar className="w-4 h-4 text-indigo-400 shrink-0" /> Link Event
                  </button>
                )}
              </div>

              {/* Assignment Selectors */}
              <AnimatePresence>
                {isAddingContact && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="pt-1"
                  >
                    <select 
                      id="assign-contact-select"
                      className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none" 
                      onChange={(e) => handleAddContactToFolder(Number(e.target.value))} 
                      defaultValue=""
                    >
                      <option value="" disabled>Select contact to assign...</option>
                      {contacts.filter(c => !displayContacts.some(dc => dc.id === c.id)).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </motion.div>
                )}

                {isAddingEvent && groupBy === 'projects' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="pt-1"
                  >
                    <select 
                      id="link-event-select"
                      className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none" 
                      onChange={(e) => handleAddEventToProject(Number(e.target.value))} 
                      defaultValue=""
                    >
                      <option value="" disabled>Select event to link...</option>
                      {events.filter(e => !(e.projects || []).includes(activeFolder)).map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({e.date})</option>
                      ))}
                    </select>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Linked Events (For active Projects) */}
          {groupBy === 'projects' && activeFolder && linkedEvents.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider pl-1 flex items-center gap-1.5 font-mono">
                <Calendar className="w-4 h-4 text-neutral-500" /> Linked Events
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {linkedEvents.map(event => (
                  <div key={event.id} className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 flex justify-between items-center shadow-md">
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-semibold text-white text-sm truncate font-display">{event.name}</span>
                      <span className="text-xs text-neutral-500 mt-1 font-mono">{event.date}</span>
                    </div>
                    <div className="bg-indigo-950 border border-indigo-900/30 p-2 rounded-xl shrink-0">
                       <Calendar className="w-4 h-4 text-indigo-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contacts Directory Listing */}
          {activeFolder && displayContacts.length > 0 && (
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider pl-1 flex items-center gap-1.5 font-mono">
              <Users className="w-4 h-4 text-neutral-500" /> Contacts in Folder
            </h3>
          )}

          <div className="space-y-2">
            {displayContacts.map(contact => (
              <div 
                id={`contact-row-${contact.id}`}
                key={contact.id} 
                onClick={() => goToDetail(contact.id)} 
                className="bg-neutral-900/70 p-3.5 rounded-xl border border-neutral-800/80 flex justify-between items-center cursor-pointer hover:bg-neutral-850 hover:border-neutral-700/80 transition-all active:scale-[0.995] group"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm sm:text-base text-neutral-100 group-hover:text-white transition-colors truncate leading-snug">{contact.name}</h3>
                  </div>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">{contact.title}</p>
                  
                  {/* Maintenance status indicator & Tags Row */}
                  <div className="flex gap-1.5 mt-2 flex-wrap items-center">
                    {contact.nextFollowUpDate && (
                      <span className="bg-amber-950/40 text-amber-300 border border-amber-800/40 text-[10px] px-2 py-0.5 rounded font-mono flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> Due {contact.nextFollowUpDate}
                      </span>
                    )}
                    {contact.lastMaintainedDate && !contact.nextFollowUpDate && (
                      <span className="bg-emerald-950/30 text-emerald-400 border border-emerald-800/40 text-[10px] px-2 py-0.5 rounded font-mono flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Maintained {contact.lastMaintainedDate}
                      </span>
                    )}
                    {(contact.tags || []).map(tag => (
                      <span key={tag} className="bg-neutral-800/80 text-neutral-300 border border-neutral-700/50 text-[10px] px-2 py-0.5 rounded font-mono truncate max-w-[120px]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {activeFolder && (
                    <button
                      id={`remove-contact-from-folder-${contact.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to remove ${contact.name} from this folder?`)) {
                          handleRemoveContactFromFolder(contact.id);
                        }
                      }}
                      className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                      title="Remove from Folder"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <div className="p-1.5 text-neutral-500 group-hover:text-neutral-300 transition-colors shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}

            {displayContacts.length === 0 && (
              <div className="text-center text-neutral-500 py-16 bg-neutral-900/30 rounded-3xl border-2 border-dashed border-neutral-800/80 flex flex-col items-center">
                <Users className="w-12 h-12 mb-3 text-neutral-700" />
                <p className="text-sm font-medium">No contacts assigned to this group yet.</p>
                {activeFolder && (
                  <p className="text-xs text-neutral-600 mt-1">Click "Assign Contact" above to populate it.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- CONTACT DETAIL COMPONENT ---
interface ContactDetailProps {
  contact: Contact | undefined;
  goToList: () => void;
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}

function ContactDetail({ contact, goToList, setContacts }: ContactDetailProps) {
  const [newInsight, setNewInsight] = useState('');
  const [newTranscription, setNewTranscription] = useState('');
  const [transcriptionTag, setTranscriptionTag] = useState('Direct Voice Note');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [localSummarizingId, setLocalSummarizingId] = useState<number | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // AI Chat Links state
  const [newChatTitle, setNewChatTitle] = useState('');
  const [newChatUrl, setNewChatUrl] = useState('');
  const [copiedLinkPromptId, setCopiedLinkPromptId] = useState<number | null>(null);
  const [whatsAppUrlInput, setWhatsAppUrlInput] = useState(contact?.whatsAppUrl || '');

  // Contact profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingProfileData, setEditingProfileData] = useState({
    name: contact?.name || '',
    title: contact?.title || '',
    avatar: contact?.avatar || '',
    whatsapp: contact?.socials?.whatsapp || '',
    linkedin: contact?.socials?.linkedin || '',
    source: contact?.source || '',
    tags: (contact?.tags || []).join(', ')
  });

  // Keep editingProfileData synced when contact changes
  React.useEffect(() => {
    if (contact) {
      setEditingProfileData({
        name: contact.name || '',
        title: contact.title || '',
        avatar: contact.avatar || '',
        whatsapp: contact.socials?.whatsapp || '',
        linkedin: contact.socials?.linkedin || '',
        source: contact.source || '',
        tags: (contact.tags || []).join(', ')
      });
    }
  }, [contact?.id, contact?.name, contact?.title, contact?.avatar, contact?.source, contact?.tags]);

  // Inline conversation editing state
  const [editingConvId, setEditingConvId] = useState<number | null>(null);
  const [editingConvText, setEditingConvText] = useState('');

  // Contact Maintenance Modal / Inline Form State
  const [isLoggingMaint, setIsLoggingMaint] = useState(false);
  const [maintType, setMaintType] = useState<MaintenanceLog['type']>('whatsapp');
  const [maintDate, setMaintDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [maintNotes, setMaintNotes] = useState('');
  const [maintNextDate, setMaintNextDate] = useState('');
  const [maintNextNotes, setMaintNextNotes] = useState('');
  const [maintScreenshot, setMaintScreenshot] = useState('');

  if (!contact) return <div className="text-center text-neutral-500 py-12 bg-neutral-900 rounded-3xl border border-neutral-800">Contact not found.</div>;

  const handleSaveProfileEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfileData.name.trim()) return;
    setContacts(prev => prev.map(c => {
      if (c.id === contact.id) {
        return {
          ...c,
          name: editingProfileData.name.trim(),
          title: editingProfileData.title.trim() || 'Networking Connection',
          avatar: editingProfileData.avatar.trim() || undefined,
          socials: {
            ...c.socials,
            whatsapp: editingProfileData.whatsapp.trim() || undefined,
            linkedin: editingProfileData.linkedin.trim() || undefined
          },
          source: editingProfileData.source.trim() || undefined,
          tags: editingProfileData.tags.split(',').map(t => t.trim()).filter(Boolean)
        };
      }
      return c;
    }));
    setIsEditingProfile(false);
  };

  const handleSaveContactMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: MaintenanceLog = {
      id: Date.now(),
      date: maintDate,
      type: maintType,
      notes: maintNotes.trim() || `Maintained relationship via ${maintType}.`,
      nextFollowUpDate: maintNextDate || undefined,
      nextFollowUpNotes: maintNextNotes.trim() || undefined,
      screenshotUrl: maintScreenshot || undefined
    };

    const newConversation = {
      id: Date.now(),
      date: maintDate,
      notes: `[Maintained via ${maintType.toUpperCase()}] ${maintNotes.trim() || 'Checked in & followed up.'}`
    };

    setContacts(prev => prev.map(c => {
      if (c.id === contact.id) {
        return {
          ...c,
          lastMaintainedDate: maintDate,
          nextFollowUpDate: maintNextDate || undefined,
          followUpReminderNotes: maintNextNotes.trim() || undefined,
          maintenanceLogs: [newLog, ...(c.maintenanceLogs || [])],
          conversations: [...(c.conversations || []), newConversation]
        };
      }
      return c;
    }));

    setIsLoggingMaint(false);
    setMaintNotes('');
    setMaintNextNotes('');
    setMaintScreenshot('');
  };

  const setContactPresetNextDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setMaintNextDate(d.toISOString().split('T')[0]);
  };

  const addAIChatLink = () => {
    if (!newChatTitle.trim() || !newChatUrl.trim()) return;
    
    let url = newChatUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    const newLink = {
      id: Date.now(),
      title: newChatTitle.trim(),
      url: url,
      date: new Date().toISOString().split('T')[0]
    };

    setContacts(prev => prev.map(c => {
      if (c.id === contact.id) {
        return {
          ...c,
          aiChatLinks: [...(c.aiChatLinks || []), newLink]
        };
      }
      return c;
    }));

    setNewChatTitle('');
    setNewChatUrl('');
  };

  const removeAIChatLink = (linkId: number) => {
    setContacts(prev => prev.map(c => {
      if (c.id === contact.id) {
        return {
          ...c,
          aiChatLinks: (c.aiChatLinks || []).filter(link => link.id !== linkId)
        };
      }
      return c;
    }));
  };

  const saveWhatsAppUrlInline = () => {
    let formatted = whatsAppUrlInput.trim();
    if (formatted) {
      const digitsOnly = formatted.replace(/[\s+()\-]/g, '');
      if (/^\d+$/.test(digitsOnly)) {
        formatted = `https://wa.me/${digitsOnly}`;
      } else if (/^wa\.me\//i.test(formatted)) {
        formatted = `https://${formatted}`;
      } else if (!/^https?:\/\//i.test(formatted)) {
        const numbersOnly = formatted.replace(/\D/g, '');
        if (numbersOnly.length > 0) {
          formatted = `https://wa.me/${numbersOnly}`;
        }
      }
    }

    setWhatsAppUrlInput(formatted);

    setContacts(prev => prev.map(c => {
      if (c.id === contact.id) {
        return {
          ...c,
          whatsAppUrl: formatted || undefined
        };
      }
      return c;
    }));
    alert('WhatsApp communication link updated successfully!');
  };

  React.useEffect(() => {
    setWhatsAppUrlInput(contact?.whatsAppUrl || '');
  }, [contact?.whatsAppUrl]);

  const updateContactList = (field: keyof Contact, updater: (arr: any[]) => any[]) => {
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, [field]: updater(c[field] as any[] || []) } : c));
  };
  
  const addInsight = () => {
    if (!newInsight.trim()) return;
    updateContactList('conversations', arr => [
      ...arr, 
      { id: Date.now(), date: new Date().toISOString().split('T')[0], notes: newInsight.trim() }
    ]);
    setNewInsight('');
  };

  const addItemToList = (field: keyof Contact, value: string) => {
    if (value.trim()) {
      updateContactList(field, arr => [...arr, value.trim()]);
    }
  };

  const editItemInList = (field: keyof Contact, idx: number, newValue: string) => {
    updateContactList(field, arr => arr.map((item, i) => i === idx ? newValue : item));
  };

  const addTranscription = () => {
    if (!newTranscription.trim()) return;
    updateContactList('transcriptions', arr => [
      ...arr, 
      { id: Date.now(), date: new Date().toISOString().split('T')[0], tag: transcriptionTag, content: newTranscription.trim() }
    ]);
    setNewTranscription('');
    setApiError(null);
  };

  const addTranscriptionWithAI = async () => {
    if (!newTranscription.trim()) return;
    setIsSummarizing(true);
    setApiError(null);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcription: newTranscription.trim() }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to summarize transcription');
      }
      const data = await response.json();
      
      updateContactList('transcriptions', arr => [
        ...arr, 
        { 
          id: Date.now(), 
          date: new Date().toISOString().split('T')[0], 
          tag: transcriptionTag, 
          content: newTranscription.trim(),
          summary: data.summary
        }
      ]);
      setNewTranscription('');
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'Error generating summary. Please make sure GEMINI_API_KEY is configured.');
      
      if (confirm('AI summary generation failed. Would you like to save the transcription without an AI summary?')) {
        updateContactList('transcriptions', arr => [
          ...arr, 
          { 
            id: Date.now(), 
            date: new Date().toISOString().split('T')[0], 
            tag: transcriptionTag, 
            content: newTranscription.trim()
          }
        ]);
        setNewTranscription('');
        setApiError(null);
      }
    } finally {
      setIsSummarizing(false);
    }
  };

  const summarizeExistingTranscription = async (id: number, content: string) => {
    setLocalSummarizingId(id);
    setApiError(null);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcription: content }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to summarize transcription');
      }
      const data = await response.json();
      
      setContacts(prev => prev.map(c => {
        if (c.id === contact.id) {
          const updatedTranscriptions = (c.transcriptions || []).map(t => 
            t.id === id ? { ...t, summary: data.summary } : t
          );
          return { ...c, transcriptions: updatedTranscriptions };
        }
        return c;
      }));
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'Error generating summary. Please make sure GEMINI_API_KEY is configured.');
    } finally {
      setLocalSummarizingId(null);
    }
  };

  const removeItemFromList = (field: keyof Contact, idx: number) => {
    updateContactList(field, arr => arr.filter((_, i) => i !== idx));
  };

  const handleDeleteContact = () => {
    if (confirm(`Are you sure you want to delete ${contact.name}?`)) {
      setContacts(prev => prev.filter(c => c.id !== contact.id));
      goToList();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Back Button & Actions */}
      <div className="flex justify-between items-center">
        <button onClick={goToList} className="flex items-center text-indigo-400 hover:text-indigo-300 font-semibold transition-colors text-sm">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back to Rolodox Directory
        </button>
        <div className="flex items-center gap-2">
          <button 
            id="edit-contact-profile-btn"
            onClick={() => setIsEditingProfile(!isEditingProfile)} 
            className="text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-xl hover:bg-indigo-500/10 transition-all text-xs flex items-center gap-1.5 font-bold border border-indigo-500/30 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" /> {isEditingProfile ? 'Close Edit' : 'Edit Contact'}
          </button>
          <button 
            id="delete-contact-btn"
            onClick={handleDeleteContact} 
            className="text-neutral-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition-all text-xs flex items-center gap-1.5 font-bold cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Delete Profile
          </button>
        </div>
      </div>

      {/* Inline Profile Editor Form */}
      {isEditingProfile && (
        <form onSubmit={handleSaveProfileEdit} className="bg-neutral-900 p-6 rounded-3xl border border-indigo-500/40 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="font-bold text-sm text-indigo-400 uppercase font-mono flex items-center gap-2">
              <Edit2 className="w-4 h-4" /> Edit Contact Profile
            </h3>
            <span className="text-[10px] text-neutral-500 font-mono">Modifying #{contact.id}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase font-mono mb-1">Full Name *</label>
              <input 
                type="text" 
                required
                value={editingProfileData.name}
                onChange={e => setEditingProfileData({ ...editingProfileData, name: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase font-mono mb-1">Headline / Title</label>
              <input 
                type="text" 
                value={editingProfileData.title}
                onChange={e => setEditingProfileData({ ...editingProfileData, title: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase font-mono mb-1">Profile Avatar (URL or Upload Image)</label>
            <div className="flex gap-2 items-center">
              <input 
                type="text" 
                placeholder="https://... or choose file"
                value={editingProfileData.avatar}
                onChange={e => setEditingProfileData({ ...editingProfileData, avatar: e.target.value })}
                className="flex-1 bg-neutral-950 border border-neutral-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
              />
              <label className="bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 font-semibold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer select-none flex items-center gap-1.5 shrink-0">
                <Upload className="w-3.5 h-3.5" />
                Upload
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
                          setEditingProfileData({ ...editingProfileData, avatar: reader.result });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase font-mono mb-1">WhatsApp Phone Number</label>
              <input 
                type="text" 
                value={editingProfileData.whatsapp}
                onChange={e => setEditingProfileData({ ...editingProfileData, whatsapp: e.target.value })}
                placeholder="+1 555 019 2834"
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase font-mono mb-1">LinkedIn Handle</label>
              <input 
                type="text" 
                value={editingProfileData.linkedin}
                onChange={e => setEditingProfileData({ ...editingProfileData, linkedin: e.target.value })}
                placeholder="sarah-jenkins"
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase font-mono mb-1">Relationship Origin (Where met)</label>
              <input 
                type="text" 
                value={editingProfileData.source}
                onChange={e => setEditingProfileData({ ...editingProfileData, source: e.target.value })}
                placeholder="Tech Startup Mixer 2026"
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase font-mono mb-1">Tags (comma separated)</label>
              <input 
                type="text" 
                value={editingProfileData.tags}
                onChange={e => setEditingProfileData({ ...editingProfileData, tags: e.target.value })}
                placeholder="Product, SaaS, Mentor"
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              type="submit" 
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Save Profile Details
            </button>
            <button 
              type="button" 
              onClick={() => setIsEditingProfile(false)} 
              className="px-4 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs py-2.5 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Main Avatar & Hero Card */}
      <div className="bg-neutral-900/90 p-6 rounded-2xl border border-neutral-800 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10 text-center sm:text-left">
          {contact.avatar ? (
            <img 
              id="contact-detail-avatar"
              src={contact.avatar} 
              alt={contact.name} 
              className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl border border-neutral-700/80 object-cover shadow-sm"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center">
              <User className="w-9 h-9 sm:w-10 sm:h-10 text-neutral-600" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{contact.name}</h2>
              <button
                onClick={() => setIsEditingProfile(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center justify-center sm:justify-start gap-1 font-mono font-medium cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            </div>
            <p className="text-neutral-400 font-normal text-sm mt-0.5 break-words">{contact.title}</p>

            {/* Social Links */}
            <div className="mt-3.5 flex flex-wrap justify-center sm:justify-start gap-2">
              {contact.socials?.whatsapp && (
                <span className="text-xs bg-neutral-950 text-emerald-400 px-2.5 py-1 rounded-lg border border-neutral-800 font-mono flex items-center gap-1.5">
                  <span className="text-neutral-500">WhatsApp:</span> <strong className="text-neutral-200 font-medium">{contact.socials.whatsapp}</strong>
                </span>
              )}
              {contact.socials?.linkedin && (
                <span className="text-xs bg-neutral-950 text-blue-400 px-2.5 py-1 rounded-lg border border-neutral-800 font-mono flex items-center gap-1.5">
                  <span className="text-neutral-500">LinkedIn:</span> <strong className="text-neutral-200 font-medium">{contact.socials.linkedin}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
        
        {contact.source && (
          <div className="mt-5 text-xs text-neutral-300 bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800/80 flex items-center gap-2.5 relative z-10">
            <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="min-w-0">
              <span className="text-neutral-500">Origin:</span> <strong className="text-neutral-200 font-medium">{contact.source}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Relationship Maintenance & Cadence Card */}
      <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-800/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider font-mono">
                Relationship Maintenance & Cadence
              </h3>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Maintain relationship with regular check-ins, record conversation screenshots, and schedule follow-ups.
            </p>
          </div>
          <button
            id="open-log-maintenance-btn"
            onClick={() => setIsLoggingMaint(!isLoggingMaint)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            {isLoggingMaint ? 'Hide Form' : 'Log Touchpoint & Schedule'}
          </button>
        </div>

        {/* Current status indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850">
            <span className="text-[10px] text-neutral-500 font-mono uppercase block mb-1">Last Maintained</span>
            <span className="font-bold text-neutral-200 font-mono">
              {contact.lastMaintainedDate ? contact.lastMaintainedDate : 'No touchpoint logged yet'}
            </span>
          </div>
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850">
            <span className="text-[10px] text-neutral-500 font-mono uppercase block mb-1">Next Follow-Up Due</span>
            <div className="flex items-center gap-1.5">
              <span className={`font-bold font-mono ${contact.nextFollowUpDate ? 'text-amber-400' : 'text-neutral-500'}`}>
                {contact.nextFollowUpDate ? contact.nextFollowUpDate : 'None scheduled'}
              </span>
              {contact.followUpReminderNotes && (
                <span className="text-[11px] text-neutral-400 truncate">• {contact.followUpReminderNotes}</span>
              )}
            </div>
          </div>
        </div>

        {/* Maintenance Logging Form */}
        {isLoggingMaint && (
          <form onSubmit={handleSaveContactMaintenance} className="bg-neutral-950 p-4 rounded-2xl border border-indigo-500/30 space-y-3.5 animate-fade-in">
            <h4 className="text-xs font-bold text-indigo-400 uppercase font-mono">New Relationship Touchpoint</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase font-mono mb-1">Date</label>
                <input 
                  type="date"
                  value={maintDate}
                  onChange={e => setMaintDate(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase font-mono mb-1">Channel</label>
                <select
                  value={maintType}
                  onChange={e => setMaintType(e.target.value as any)}
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
              <label className="block text-[10px] font-bold text-neutral-400 uppercase font-mono mb-1">What was discussed / Touchpoint Notes</label>
              <textarea
                rows={2}
                required
                placeholder="What did you chat about? What was the last thing the interaction was about?"
                value={maintNotes}
                onChange={e => setMaintNotes(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl p-3 text-xs outline-none focus:border-indigo-500 resize-y placeholder:text-neutral-600"
              />
            </div>

            {/* Screenshot attachment */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase font-mono mb-1">
                Screenshot / Conversation Photo (Optional)
              </label>
              <div className="flex gap-2 items-center">
                <label className="bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 font-semibold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer select-none flex items-center gap-1.5">
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
                            setMaintScreenshot(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                {maintScreenshot && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-400 font-mono">Image attached</span>
                    <button type="button" onClick={() => setMaintScreenshot('')} className="text-[10px] text-red-400 hover:underline">Remove</button>
                  </div>
                )}
              </div>
            </div>

            {/* Next Reminder Scheduling */}
            <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-indigo-400 uppercase font-mono flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Next Follow-Up Schedule
                </label>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setContactPresetNextDate(3)} className="text-[9px] bg-neutral-800 hover:bg-neutral-750 text-neutral-300 px-2 py-0.5 rounded font-mono">+3d</button>
                  <button type="button" onClick={() => setContactPresetNextDate(7)} className="text-[9px] bg-neutral-800 hover:bg-neutral-750 text-neutral-300 px-2 py-0.5 rounded font-mono">+1w</button>
                  <button type="button" onClick={() => setContactPresetNextDate(14)} className="text-[9px] bg-neutral-800 hover:bg-neutral-750 text-neutral-300 px-2 py-0.5 rounded font-mono">+2w</button>
                  <button type="button" onClick={() => setContactPresetNextDate(30)} className="text-[9px] bg-neutral-800 hover:bg-neutral-750 text-neutral-300 px-2 py-0.5 rounded font-mono">+1m</button>
                </div>
              </div>
              <input 
                type="date"
                value={maintNextDate}
                onChange={e => setMaintNextDate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500"
              />
              <input 
                type="text"
                placeholder="Next time note / follow-up reminder topic..."
                value={maintNextNotes}
                onChange={e => setMaintNextNotes(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 placeholder:text-neutral-600"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button 
                type="submit" 
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" /> Save & Tick as Maintained
              </button>
              <button 
                type="button" 
                onClick={() => setIsLoggingMaint(false)} 
                className="px-4 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs py-2.5 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Previous maintenance logs */}
        {contact.maintenanceLogs && contact.maintenanceLogs.length > 0 && (
          <div className="pt-2 border-t border-neutral-800/60 space-y-2">
            <h5 className="text-[10px] font-bold text-neutral-400 uppercase font-mono">Touchpoint History ({contact.maintenanceLogs.length})</h5>
            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
              {contact.maintenanceLogs.map(log => (
                <div key={log.id} className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono text-indigo-400 font-bold uppercase">{log.type}</span>
                    <span className="font-mono text-neutral-500">{log.date}</span>
                  </div>
                  <p className="text-neutral-300 text-xs">{log.notes}</p>
                  {log.screenshotUrl && (
                    <img src={log.screenshotUrl} alt="Touchpoint screenshot" className="max-h-24 rounded-lg object-cover border border-neutral-800 mt-1" />
                  )}
                  {log.nextFollowUpDate && (
                    <div className="text-[10px] font-mono text-neutral-400 pt-1">
                      Reminder set: {log.nextFollowUpDate} {log.nextFollowUpNotes ? `(${log.nextFollowUpNotes})` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp Communication Context Card */}
      <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-800/60 pb-3">
          <div>
            <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-400" /> Direct Communication Link
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Store a direct chat link to stay in touch with {contact.name} without having to exit your workspace to find their chat.
            </p>
          </div>
          {contact.whatsAppUrl ? (
            <a 
              href={contact.whatsAppUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-2 shadow-sm"
            >
              <MessageCircle className="w-4 h-4 text-white" />
              Launch WhatsApp Chat
            </a>
          ) : (
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2.5 py-1 rounded-lg">
              No Active Chat Link
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="w-full">
            <label className="block text-[10px] font-mono font-bold text-neutral-500 uppercase mb-1.5">Saved Chat Link / wa.me URL</label>
            <input 
              type="text" 
              placeholder="Paste raw phone number (e.g. +1 555 019 2834) or direct wa.me link..."
              value={whatsAppUrlInput}
              onChange={e => setWhatsAppUrlInput(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-850 text-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 font-mono placeholder:text-neutral-600"
            />
            {whatsAppUrlInput.trim() && (
              <div className="mt-2 p-1.5 px-2 bg-indigo-950/20 border border-indigo-900/20 rounded-lg flex items-center justify-between gap-2 text-[10px]">
                <div className="text-neutral-400 font-mono flex items-center gap-1 truncate">
                  <span className="text-indigo-400 font-bold">⚡ Live Target:</span>
                  <span className="text-neutral-300 font-medium truncate select-all">
                    {(() => {
                      const val = whatsAppUrlInput.trim();
                      const digitsOnly = val.replace(/[\s+()\-]/g, '');
                      if (/^\d+$/.test(digitsOnly)) {
                        return `https://wa.me/${digitsOnly}`;
                      } else if (/^wa\.me\//i.test(val)) {
                        return `https://${val}`;
                      } else if (!/^https?:\/\//i.test(val)) {
                        const numbersOnly = val.replace(/\D/g, '');
                        if (numbersOnly.length > 0) {
                          return `https://wa.me/${numbersOnly}`;
                        }
                      }
                      return val;
                    })()}
                  </span>
                </div>
                <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">Auto-formatted</span>
              </div>
            )}
          </div>
          <button 
            onClick={saveWhatsAppUrlInline}
            className="bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-semibold text-xs px-4 py-2 rounded-xl border border-neutral-700/50 transition-all active:scale-95 shrink-0"
          >
            Save Link
          </button>
        </div>
      </div>

      {/* Grid of qualitative relationship inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ListSection 
          title="Problems & Constraints" 
          icon={<AlertTriangle className="w-5 h-5 text-red-400" />} 
          items={contact.problems || []} 
          onAdd={(v) => addItemToList('problems', v)} 
          onRemove={(idx) => removeItemFromList('problems', idx)} 
          onEdit={(idx, val) => editItemInList('problems', idx, val)}
        />
        <ListSection 
          title="Desires & Personal Goals" 
          icon={<Zap className="w-5 h-5 text-amber-400" />} 
          items={contact.desires || []} 
          onAdd={(v) => addItemToList('desires', v)} 
          onRemove={(idx) => removeItemFromList('desires', idx)} 
          onEdit={(idx, val) => editItemInList('desires', idx, val)}
        />
        <ListSection 
          title="Commonalities" 
          icon={<Heart className="w-5 h-5 text-pink-400" />} 
          items={contact.commonalities || []} 
          onAdd={(v) => addItemToList('commonalities', v)} 
          onRemove={(idx) => removeItemFromList('commonalities', idx)} 
          onEdit={(idx, val) => editItemInList('commonalities', idx, val)}
        />
        <ListSection 
          title="Who They Know" 
          icon={<UserPlus className="w-5 h-5 text-indigo-400" />} 
          items={contact.whoTheyKnow || []} 
          onAdd={(v) => addItemToList('whoTheyKnow', v)} 
          onRemove={(idx) => removeItemFromList('whoTheyKnow', idx)} 
          onEdit={(idx, val) => editItemInList('whoTheyKnow', idx, val)}
        />
      </div>

      {/* Skill list management */}
      <SkillSection 
        skills={contact.skills || []} 
        onAdd={(skill) => updateContactList('skills', arr => [...arr, skill])}
        onRemove={(idx) => updateContactList('skills', arr => arr.filter((_, i) => i !== idx))}
      />

      {/* Dynamic Value Exchange Module */}
      <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden shadow-lg">
        <div className="bg-neutral-800/40 px-5 py-4 border-b border-neutral-800 font-semibold flex items-center gap-2 text-white font-display">
          <LinkIcon className="w-5 h-5 text-indigo-400 shrink-0" /> Value Leverage Matrix
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block font-mono">Value I Can Give Them</label>
            <textarea 
              className="w-full text-sm text-neutral-200 bg-neutral-950 p-3.5 rounded-xl border border-neutral-850 focus:border-indigo-500/50 outline-none resize-y min-h-[90px] transition-colors"
              value={contact.valueIGive || ''}
              onChange={(e) => setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, valueIGive: e.target.value } : c))}
              placeholder="What unique value, connection, advice, or skill can you share with them?"
            />
          </div>
          <div className="h-px bg-neutral-800/60"></div>
          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block font-mono">Value They Can Give Me</label>
            <textarea 
              className="w-full text-sm text-neutral-200 bg-neutral-950 p-3.5 rounded-xl border border-neutral-850 focus:border-indigo-500/50 outline-none resize-y min-h-[90px] transition-colors"
              value={contact.valueTheyGive || ''}
              onChange={(e) => setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, valueTheyGive: e.target.value } : c))}
              placeholder="What knowledge, resources, network access, or insight could they leverage for your benefit?"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Conversational prompts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ListSection 
          title="Things to Mention" 
          icon={<Lightbulb className="w-5 h-5 text-yellow-400" />} 
          items={contact.thingsToMention || []} 
          onAdd={(v) => addItemToList('thingsToMention', v)} 
          onRemove={(idx) => removeItemFromList('thingsToMention', idx)} 
          onEdit={(idx, val) => editItemInList('thingsToMention', idx, val)}
        />
        <ListSection 
          title="Questions to Ask" 
          icon={<MessageCircle className="w-5 h-5 text-blue-400" />} 
          items={contact.questionsToAsk || []} 
          onAdd={(v) => addItemToList('questionsToAsk', v)} 
          onRemove={(idx) => removeItemFromList('questionsToAsk', idx)} 
          onEdit={(idx, val) => editItemInList('questionsToAsk', idx, val)}
        />
      </div>

      {/* Transcription Upload / Input module */}
      <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden shadow-lg">
        <div className="bg-neutral-800/40 px-5 py-4 border-b border-neutral-800 font-semibold flex items-center gap-2 text-white font-display">
          <Mic className="w-5 h-5 text-indigo-400 shrink-0" /> Voice Note Transcriptions
        </div>
        <div className="p-5 space-y-5">
          {(!contact.transcriptions || contact.transcriptions.length === 0) && (
            <p className="text-sm text-neutral-500 italic">No audio transcripts recorded. Dictate notes after meeting them and paste here.</p>
          )}
          
          <div className="space-y-4">
            {(contact.transcriptions || []).map((trans) => (
              <div key={trans.id} className="bg-neutral-950 border border-neutral-850 rounded-2xl p-4 relative group">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border shrink-0 ${
                    trans.tag === 'Direct Voice Note' ? 'bg-blue-950/40 text-blue-400 border-blue-900/30' : 
                    trans.tag === 'Indirect Reflection' ? 'bg-purple-950/40 text-purple-400 border-purple-900/30' :
                    'bg-amber-950/40 text-amber-400 border-amber-900/30'
                  }`}>{trans.tag}</span>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="text-xs text-neutral-500 font-mono">{trans.date}</span>
                    <button 
                      onClick={() => removeItemFromList('transcriptions', (contact.transcriptions || []).findIndex(t => t.id === trans.id))} 
                      className="text-neutral-600 hover:text-red-400 p-1 rounded-lg transition-colors ml-1 active:scale-90"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap break-words">{trans.content}</p>
                
                {trans.summary ? (
                  <div className="mt-4 pt-4 border-t border-neutral-850 bg-indigo-950/5 rounded-xl p-3.5 border border-indigo-950/30">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> AI Summary & Insights
                    </div>
                    <div className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap break-words font-sans">
                      {trans.summary}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-900/60">
                  <div className="flex flex-wrap gap-2">
                    {!trans.summary && (
                      <button
                        onClick={() => summarizeExistingTranscription(trans.id, trans.content)}
                        disabled={localSummarizingId !== null}
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold bg-indigo-950/20 border border-indigo-900/30 px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                      >
                        {localSummarizingId === trans.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                            Summarizing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            Summarize with Gemini AI
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        const fallbackPrompt = `Based on this transcription, extract the person's problems, constraints, desires, personal goals, commonalities, relationships, and other important insights.\n\nTranscription:\n"${trans.content}"`;
                        navigator.clipboard.writeText(fallbackPrompt);
                        setCopiedLinkPromptId(trans.id);
                        setTimeout(() => setCopiedLinkPromptId(null), 3000);
                      }}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 border ${
                        copiedLinkPromptId === trans.id 
                          ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' 
                          : 'bg-amber-950/20 text-amber-400 border-amber-900/30 hover:bg-amber-900/30'
                      }`}
                    >
                      {copiedLinkPromptId === trans.id ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          Prompt + Transcript Copied!
                        </>
                      ) : (
                        <>
                          <span>📋 Copy Fail-Safe LLM Prompt</span>
                        </>
                      )}
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 italic">
                    Fail-safe prompt helper
                  </span>
                </div>
              </div>
            ))}
          </div>

          {apiError && (
            <div className="bg-red-950/20 border border-red-900/40 text-red-400 rounded-xl p-3.5 text-xs flex items-start gap-2 animate-fade-in font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-neutral-800/50 flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block font-mono">Note Type</label>
                <select 
                  className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-3 py-2.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none" 
                  value={transcriptionTag} 
                  onChange={(e) => setTranscriptionTag(e.target.value)}
                >
                  <option value="Direct Voice Note">Direct Voice Note</option>
                  <option value="Indirect Reflection">Indirect Reflection</option>
                  <option value="Event Session Summary">Event Session Summary</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block font-mono">Audio dictation text</label>
                <textarea 
                  rows={3} 
                  placeholder="Paste dictated speech / transcripts from meeting Sarah..." 
                  className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500/50 outline-none resize-y" 
                  value={newTranscription} 
                  onChange={(e) => setNewTranscription(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end items-center gap-3 mt-2">
              <button 
                onClick={addTranscription}
                disabled={isSummarizing || !newTranscription.trim()}
                className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 px-5 py-3 rounded-xl text-sm font-bold transition-all w-full sm:w-auto flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                Save Text Only
              </button>
              <button 
                onClick={addTranscriptionWithAI} 
                disabled={isSummarizing || !newTranscription.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl text-sm font-bold transition-all w-full sm:w-auto flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isSummarizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                    Generating AI Summary...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    Save & Summarize with AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation logs timeline */}
      <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden shadow-lg">
        <div className="bg-neutral-800/40 px-5 py-4 border-b border-neutral-800 font-semibold flex items-center gap-2 text-white font-display">
          <MessageCircle className="w-5 h-5 text-indigo-400 shrink-0" /> Interaction Timeline
        </div>
        <div className="p-5 space-y-5">
          {(!contact.conversations || contact.conversations.length === 0) && (
            <p className="text-sm text-neutral-500 italic">No historical timeline logs found. Track conversations below.</p>
          )}
          
          <div className="space-y-4">
            {(contact.conversations || []).map((conv, idx) => (
              <div key={conv.id} className="border-l-2 border-indigo-500/30 pl-4 py-1 relative group">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-indigo-500 -left-[6px] top-2 border border-neutral-900"></div>
                {editingConvId === conv.id ? (
                  <div className="space-y-2 mt-1">
                    <textarea
                      value={editingConvText}
                      onChange={e => setEditingConvText(e.target.value)}
                      rows={2}
                      className="w-full bg-neutral-950 border border-indigo-500 text-white rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (editingConvText.trim()) {
                            updateContactList('conversations', arr => arr.map(c => c.id === conv.id ? { ...c, notes: editingConvText.trim() } : c));
                          }
                          setEditingConvId(null);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg text-xs font-bold active:scale-95 cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Save Note
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingConvId(null)}
                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-400 px-3 py-1 rounded-lg text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-400 font-mono">{conv.date}</span>
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingConvId(conv.id);
                            setEditingConvText(conv.notes);
                          }}
                          className="text-neutral-400 hover:text-indigo-400 p-1 rounded hover:bg-indigo-500/10 transition-colors cursor-pointer"
                          title="Edit note"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => removeItemFromList('conversations', idx)}
                          className="text-neutral-600 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm mt-1.5 text-neutral-300 leading-relaxed break-words">{conv.notes}</p>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-800/50">
            <input 
              type="text" 
              placeholder="E.g., Caught up at coffee, she requested developer resources..." 
              className="flex-1 bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none min-w-0" 
              value={newInsight} 
              onChange={(e) => setNewInsight(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && addInsight()} 
            />
            <button 
              onClick={addInsight} 
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl text-sm font-bold transition-all w-full sm:w-auto shrink-0 active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Log Note
            </button>
          </div>
        </div>
      </div>

      {/* AI Strategy Chat History Section */}
      <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden shadow-lg">
        <div className="bg-neutral-800/40 px-5 py-4 border-b border-neutral-800 font-semibold flex items-center gap-2 text-white font-display">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" /> AI Strategy Chat History
        </div>
        <div className="p-5 space-y-5">
          <p className="text-xs text-neutral-400 leading-relaxed">
            Save shareable URLs to your AI brainstorms (e.g., ChatGPT, Claude, or Gemini) regarding {contact.name}. Return to tailored scripts, pitch angles, or relationship planning threads instantly.
          </p>

          {(!contact.aiChatLinks || contact.aiChatLinks.length === 0) ? (
            <div className="text-center py-8 bg-neutral-950/40 border border-neutral-850 rounded-2xl text-neutral-600 text-xs italic">
              No custom AI strategy threads saved yet. Add one below!
            </div>
          ) : (
            <div className="space-y-3">
              {(contact.aiChatLinks || []).map((link) => (
                <div 
                  key={link.id} 
                  className="bg-neutral-950 border border-neutral-850 hover:border-indigo-950/40 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all group"
                >
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-neutral-200 truncate font-display">{link.title}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-mono text-neutral-500">{link.date}</span>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[10px] text-indigo-400 hover:underline truncate font-mono block max-w-[250px]"
                        title={link.url}
                      >
                        {link.url}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-indigo-950/40 border border-indigo-900/30 text-indigo-400 hover:bg-indigo-900 hover:text-white transition-all text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 active:scale-95"
                    >
                      Resume Chat <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                    <button 
                      onClick={() => removeAIChatLink(link.id)}
                      className="text-neutral-600 hover:text-red-400 p-1.5 rounded-xl hover:bg-neutral-900 transition-colors"
                      title="Remove Link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inline Form to add a link */}
          <div className="bg-neutral-950/60 p-4 rounded-2xl border border-neutral-850/60 space-y-3">
            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest font-mono">Link New AI Chat Thread</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-mono font-bold text-neutral-500 uppercase mb-1">Thread Title / Purpose</label>
                <input 
                  type="text" 
                  placeholder="e.g. Cold Pitch Script for Stripe CTO"
                  value={newChatTitle}
                  onChange={e => setNewChatTitle(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono font-bold text-neutral-500 uppercase mb-1">AI Shareable URL / Chat Link</label>
                <input 
                  type="url" 
                  placeholder="e.g. https://chatgpt.com/share/..."
                  value={newChatUrl}
                  onChange={e => setNewChatUrl(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={addAIChatLink}
                disabled={!newChatTitle.trim() || !newChatUrl.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Save Strategy Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- HELPER GENERIC LIST SECTION ---
interface ListSectionProps {
  title: string;
  icon: React.ReactElement;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (idx: number) => void;
  onEdit?: (idx: number, newValue: string) => void;
}

function ListSection({ title, icon, items = [], onAdd, onRemove, onEdit }: ListSectionProps) {
  const [newItem, setNewItem] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const safeItems = Array.isArray(items) ? items : [];

  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem);
      setNewItem('');
    }
  };

  const startEdit = (idx: number, val: string) => {
    setEditingIdx(idx);
    setEditValue(val);
  };

  const saveEdit = (idx: number) => {
    if (onEdit && editValue.trim()) {
      onEdit(idx, editValue.trim());
    }
    setEditingIdx(null);
    setEditValue('');
  };

  return (
    <div className="bg-neutral-900 p-5 rounded-3xl border border-neutral-800 flex flex-col h-full shadow-lg">
      <div className="flex items-center gap-2 font-semibold mb-4 text-white font-display">
        {React.cloneElement(icon, { className: 'w-5 h-5 shrink-0' })} 
        <span className="truncate leading-tight">{title}</span>
      </div>
      
      <ul className="flex-1 space-y-2.5 mb-4 max-h-[220px] overflow-y-auto no-scrollbar">
        {safeItems.length === 0 && (
          <li className="text-xs text-neutral-500 italic py-2">None logged.</li>
        )}
        {safeItems.map((item, i) => (
          <li key={i} className="text-xs sm:text-sm flex items-start justify-between gap-2 group p-1.5 hover:bg-neutral-950/40 rounded-lg">
            {editingIdx === i ? (
              <div className="flex items-center gap-1.5 w-full">
                <input
                  type="text"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveEdit(i)}
                  autoFocus
                  className="flex-1 bg-neutral-950 border border-indigo-500 text-white rounded-lg px-2.5 py-1 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => saveEdit(i)}
                  className="p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md shrink-0 active:scale-95 cursor-pointer"
                  title="Save edit"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingIdx(null)}
                  className="p-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-md shrink-0 cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-600 mt-2 shrink-0"></div>
                  <span className="text-neutral-300 leading-relaxed break-words min-w-0 flex-1">{item}</span>
                </div>
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {onEdit && (
                    <button 
                      onClick={() => startEdit(i, item)} 
                      className="text-neutral-400 hover:text-indigo-400 p-1 rounded hover:bg-indigo-500/10 active:scale-90 cursor-pointer"
                      title="Edit item"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                  <button 
                    onClick={() => onRemove(i)} 
                    className="text-neutral-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 active:scale-90 cursor-pointer"
                    title="Remove item"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      
      <div className="flex gap-2 mt-auto pt-4 border-t border-neutral-800/50">
        <input 
          type="text" 
          placeholder="Log new item..." 
          className="flex-1 bg-neutral-950 border border-neutral-800 text-white rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-1 focus:ring-indigo-500 outline-none min-w-0 placeholder:text-neutral-600" 
          value={newItem} 
          onChange={(e) => setNewItem(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()} 
        />
        <button 
          onClick={handleAdd} 
          className="bg-neutral-800 text-neutral-300 p-2.5 rounded-xl hover:bg-neutral-700 hover:text-white transition-colors border border-neutral-700 shrink-0 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// --- HELPER SKILL SECTION ---
interface SkillSectionProps {
  skills: Skill[];
  onAdd: (skill: Skill) => void;
  onRemove: (idx: number) => void;
}

function SkillSection({ skills = [], onAdd, onRemove }: SkillSectionProps) {
  const [name, setName] = useState('');
  const [leverage, setLeverage] = useState('');
  const safeSkills = Array.isArray(skills) ? skills : [];

  const handleAdd = () => {
    if (name.trim()) {
      onAdd({
        id: Date.now(),
        name: name.trim(),
        leverage: leverage.trim()
      });
      setName('');
      setLeverage('');
    }
  };

  return (
    <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden shadow-lg mt-6">
      <div className="bg-neutral-800/40 px-5 py-4 border-b border-neutral-800 font-semibold flex items-center gap-2 text-white font-display">
        <Briefcase className="w-5 h-5 text-indigo-400 shrink-0" /> Skills & Leverage Assets
      </div>
      <div className="p-5 space-y-4">
        {safeSkills.length === 0 && (
          <p className="text-sm text-neutral-500 italic">No core professional skills logged yet.</p>
        )}
        <div className="space-y-3">
          {safeSkills.map((skill, i) => (
            <div key={skill.id || i} className="bg-neutral-950 border border-neutral-850 rounded-2xl p-4 flex justify-between items-start group relative">
              <div className="min-w-0 flex-1 pr-4">
                <span className="text-sm font-bold text-indigo-400 block mb-1 break-words font-display">{skill.name}</span>
                <span className="text-xs text-neutral-400 leading-relaxed block break-words">{skill.leverage || 'No specific leverage or expertise notes.'}</span>
              </div>
              <button 
                onClick={() => onRemove(i)} 
                className="text-neutral-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/5 transition-colors shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-5 border-t border-neutral-800/50 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1 block font-mono">Skill Name</label>
              <input 
                type="text" 
                placeholder="E.g., Venture Capital raising" 
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-1 focus:ring-indigo-500 outline-none" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1 block font-mono">Leverage / Experience Detail</label>
              <input 
                type="text" 
                placeholder="E.g., Raised Series B, deep ties to high net worth angels" 
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-1 focus:ring-indigo-500 outline-none" 
                value={leverage} 
                onChange={(e) => setLeverage(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()} 
              />
            </div>
          </div>
          <button 
            onClick={handleAdd} 
            className="mt-1 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 text-xs sm:text-sm font-bold py-2.5 rounded-xl transition-all border border-neutral-700 flex items-center justify-center gap-1.5 w-full active:scale-95"
          >
            <Plus className="w-4 h-4 shrink-0" /> Add Professional Skill
          </button>
        </div>
      </div>
    </div>
  );
}

// --- NEW CONTACT FORM COMPONENT ---
interface ContactFormProps {
  goToList: () => void;
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  events: Event[];
}

function ContactForm({ goToList, setContacts, events }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    avatar: '',
    whatsapp: '',
    linkedin: '',
    whatsAppUrl: '',
    source: '',
    tags: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    let whatsAppUrlFormatted = formData.whatsAppUrl.trim();
    if (!whatsAppUrlFormatted && formData.whatsapp.trim()) {
      const digitsOnly = formData.whatsapp.trim().replace(/[\s+()\-]/g, '');
      if (/^\d+$/.test(digitsOnly)) {
        whatsAppUrlFormatted = `https://wa.me/${digitsOnly}`;
      } else {
        const numbersOnly = formData.whatsapp.trim().replace(/\D/g, '');
        if (numbersOnly.length > 0) {
          whatsAppUrlFormatted = `https://wa.me/${numbersOnly}`;
        }
      }
    } else if (whatsAppUrlFormatted) {
      const digitsOnly = whatsAppUrlFormatted.replace(/[\s+()\-]/g, '');
      if (/^\d+$/.test(digitsOnly)) {
        whatsAppUrlFormatted = `https://wa.me/${digitsOnly}`;
      } else if (/^wa\.me\//i.test(whatsAppUrlFormatted)) {
        whatsAppUrlFormatted = `https://${whatsAppUrlFormatted}`;
      } else if (!/^https?:\/\//i.test(whatsAppUrlFormatted)) {
        const numbersOnly = whatsAppUrlFormatted.replace(/\D/g, '');
        if (numbersOnly.length > 0) {
          whatsAppUrlFormatted = `https://wa.me/${numbersOnly}`;
        }
      }
    }

    const newContact: Contact = {
      id: Date.now(),
      name: formData.name.trim(),
      title: formData.title.trim() || 'Networking Connection',
      avatar: formData.avatar.trim() || undefined,
      socials: {
        whatsapp: formData.whatsapp.trim() || undefined,
        linkedin: formData.linkedin.trim() || undefined
      },
      whatsAppUrl: whatsAppUrlFormatted || undefined,
      aiChatLinks: [],
      source: formData.source.trim() || undefined,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      skills: [],
      projects: [],
      problems: [],
      desires: [],
      commonalities: [],
      thingsToMention: [],
      questionsToAsk: [],
      whoTheyKnow: [],
      conversations: [],
      transcriptions: []
    };

    setContacts(prev => [newContact, ...prev]);
    goToList();
  };

  return (
    <div className="animate-fade-in pb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white font-display">New Networking Contact</h2>
        <button 
          onClick={goToList} 
          className="p-2 hover:bg-neutral-800 rounded-xl transition-colors shrink-0"
        >
          <X className="text-neutral-400 w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-neutral-900 p-5 sm:p-6 rounded-3xl border border-neutral-800 space-y-4 shadow-xl">
          <div className="flex flex-col-reverse sm:flex-row gap-5 sm:items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider font-mono">Full Name *</label>
              <input 
                id="contact-form-name"
                required 
                type="text" 
                placeholder="E.g., David Wallace"
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-3 focus:ring-1 focus:ring-indigo-500 outline-none text-sm placeholder:text-neutral-600" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            <div className="relative w-20 h-20 sm:w-20 sm:h-20 shrink-0 rounded-2xl border-2 border-dashed border-neutral-800 bg-neutral-950 flex items-center justify-center overflow-hidden self-center sm:self-auto group hover:border-indigo-500/50 transition-colors cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      if (typeof reader.result === 'string') {
                        setFormData({...formData, avatar: reader.result});
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {formData.avatar ? (
                <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover relative z-10" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-center px-1">
                  <Upload className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                  <span className="text-[9px] text-neutral-500 uppercase font-mono font-bold tracking-wider">Upload</span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider font-mono">Profile Photo (Upload from Gallery)</label>
            <div className="flex gap-2">
              <label className="bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700/60 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Choose Image
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
                          setFormData({...formData, avatar: reader.result});
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              {formData.avatar && (
                <button
                  type="button"
                  onClick={() => setFormData({...formData, avatar: ''})}
                  className="bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 text-neutral-500 hover:text-red-400 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
                >
                  Clear Image
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider font-mono">Headline / Professional Title</label>
            <input 
              type="text" 
              placeholder="E.g., Chief Technology Officer at Stripe"
              className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-neutral-600" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider font-mono">WhatsApp Chat Link / Conversation URL</label>
            <input 
              type="text" 
              placeholder="Paste raw phone number (e.g. +1 555 019 2834) or direct wa.me link..."
              className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-3 text-xs sm:text-sm focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-neutral-600 font-mono" 
              value={formData.whatsAppUrl} 
              onChange={e => setFormData({...formData, whatsAppUrl: e.target.value})} 
            />
            {formData.whatsAppUrl.trim() ? (
              <div className="mt-2 p-2 px-3 bg-indigo-950/30 border border-indigo-900/30 rounded-xl flex items-center justify-between gap-2 text-[11px]">
                <div className="text-neutral-400 font-mono flex items-center gap-1.5 truncate">
                  <span className="text-indigo-400">⚡ Live Target:</span>
                  <span className="text-neutral-300 font-bold truncate select-all">
                    {(() => {
                      const val = formData.whatsAppUrl.trim();
                      const digitsOnly = val.replace(/[\s+()\-]/g, '');
                      if (/^\d+$/.test(digitsOnly)) {
                        return `https://wa.me/${digitsOnly}`;
                      } else if (/^wa\.me\//i.test(val)) {
                        return `https://${val}`;
                      } else if (!/^https?:\/\//i.test(val)) {
                        const numbersOnly = val.replace(/\D/g, '');
                        if (numbersOnly.length > 0) {
                          return `https://wa.me/${numbersOnly}`;
                        }
                      }
                      return val;
                    })()}
                  </span>
                </div>
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">Auto-formatted</span>
              </div>
            ) : formData.whatsapp.trim() ? (
              <div className="mt-2 p-2 px-3 bg-emerald-950/30 border border-emerald-900/30 rounded-xl flex items-center justify-between gap-2 text-[11px]">
                <div className="text-neutral-400 font-mono flex items-center gap-1.5 truncate">
                  <span className="text-emerald-400">⚡ Inherited wa.me Link:</span>
                  <span className="text-neutral-300 font-bold truncate select-all">
                    {(() => {
                      const val = formData.whatsapp.trim();
                      const digitsOnly = val.replace(/[\s+()\-]/g, '');
                      if (/^\d+$/.test(digitsOnly)) {
                        return `https://wa.me/${digitsOnly}`;
                      }
                      const numbersOnly = val.replace(/\D/g, '');
                      if (numbersOnly.length > 0) {
                        return `https://wa.me/${numbersOnly}`;
                      }
                      return 'https://wa.me/...';
                    })()}
                  </span>
                </div>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">From Number</span>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider font-mono">WhatsApp Number</label>
              <input 
                type="text" 
                placeholder="+1 (555) 019-2834"
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-neutral-600" 
                value={formData.whatsapp} 
                onChange={e => setFormData({...formData, whatsapp: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider font-mono">LinkedIn Handle</label>
              <input 
                type="text" 
                placeholder="david-wallace-stripe"
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-neutral-600" 
                value={formData.linkedin} 
                onChange={e => setFormData({...formData, linkedin: e.target.value})} 
              />
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 p-5 sm:p-6 rounded-3xl border border-neutral-800 space-y-4 shadow-xl">
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider font-mono">Where did you meet them?</label>
            <input 
              type="text" 
              placeholder="E.g., Tech Startup Mixer 2026, London Coffee Shop"
              className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-neutral-600" 
              value={formData.source} 
              onChange={e => setFormData({...formData, source: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider font-mono">Tags (comma separated)</label>
            <input 
              type="text" 
              placeholder="E.g., SaaS, Mentor, Investor, Web3"
              className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-neutral-600" 
              value={formData.tags} 
              onChange={e => setFormData({...formData, tags: e.target.value})} 
            />
          </div>
        </div>

        <button 
          id="save-contact-profile-btn"
          type="submit" 
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-indigo-500/10 transition-all active:scale-[0.98]"
        >
          Create Contact Profile
        </button>
      </form>
    </div>
  );
}
