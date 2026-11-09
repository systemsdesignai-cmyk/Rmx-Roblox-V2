import React, { useState, useMemo } from 'react';
import { 
  Calendar, MapPin, Plus, X, LayoutList, Kanban, ExternalLink, Image, Users, ChevronRight, Trash2, Star, Upload
} from 'lucide-react';
import { Event, Contact, ViewState, CustomFolders } from '../types';

interface EventsViewProps {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  contacts: Contact[];
  customFolders: CustomFolders;
  setCustomFolders: React.Dispatch<React.SetStateAction<CustomFolders>>;
  viewState: ViewState;
  goToList: () => void;
  goToDetail: (id: number) => void;
  goToCreate: () => void;
}

export default function EventsView({
  events,
  setEvents,
  contacts,
  customFolders,
  setCustomFolders,
  viewState,
  goToList,
  goToDetail,
  goToCreate
}: EventsViewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban'); 
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const categoryInputRef = React.useRef<HTMLInputElement>(null);

  const handleCategoryInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = newCategoryName.trim();
      if (trimmed) {
        setCustomFolders(prev => ({
          ...prev,
          categories: [...new Set([...(prev.categories || []), trimmed])]
        }));
        setFilterCategory(trimmed);
        setIsCreatingCategory(false);
        setNewCategoryName('');
      }
    } else if (e.key === 'Escape') {
      setIsCreatingCategory(false);
      setNewCategoryName('');
    }
  };

  // Compute all unique categories safely
  const allCategories = useMemo(() => {
    const categories = (events || [])
      .map(e => e.category)
      .filter((cat): cat is string => Boolean(cat));
    return Array.from(new Set([
      'Technology', 
      'Finances', 
      'Business', 
      'Personal Development', 
      ...(customFolders?.categories || []),
      ...categories
    ]));
  }, [events, customFolders]);

  // Filtered list of events sorted to pin high priority to the top
  const displayEvents = useMemo(() => {
    const filtered = (events || []).filter(e => filterCategory === 'All' || e.category === filterCategory);
    return [...filtered].sort((a, b) => {
      const aPri = a.isHighPriority ? 1 : 0;
      const bPri = b.isHighPriority ? 1 : 0;
      return bPri - aPri;
    });
  }, [events, filterCategory]);

  const handleTogglePriority = (id: number) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, isHighPriority: !e.isHighPriority } : e));
  };

  if (viewState.view === 'create') {
    return <EventForm goToList={goToList} setEvents={setEvents} customFolders={customFolders} />;
  }

  if (viewState.view === 'detail' && viewState.id !== null) {
    const currentEvent = events.find(e => e.id === viewState.id);
    return <EventDetail event={currentEvent} goToList={goToList} contacts={contacts} setEvents={setEvents} />;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header with View Swapper */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Networking Events</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Plan meetups, target people, and log connections.</p>
        </div>
        <div className="flex bg-neutral-900/90 border border-neutral-800/90 rounded-xl p-0.5 shrink-0 w-full sm:w-auto justify-end shadow-sm">
          <button 
            id="view-list-btn"
            onClick={() => setViewMode('list')} 
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium ${
              viewMode === 'list' 
                ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/70' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" /> List
          </button>
          <button 
            id="view-kanban-btn"
            onClick={() => setViewMode('kanban')} 
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium ${
              viewMode === 'kanban' 
                ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/70' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" /> Board
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar items-center border-b border-neutral-800/60">
        <button 
          id="cat-pill-all"
          onClick={() => setFilterCategory('All')} 
          className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
            filterCategory === 'All' 
              ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-sm' 
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
          }`}
        >
          All Categories
        </button>
        {allCategories.map(cat => (
          <button 
            id={`cat-pill-${cat.replace(/\s+/g, '-')}`}
            key={cat} 
            onClick={() => setFilterCategory(cat)} 
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              filterCategory === cat 
                ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-sm' 
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
            }`}
          >
            {cat}
          </button>
        ))}
        {!isCreatingCategory ? (
          <button 
            id="create-custom-category-btn"
            onClick={() => setIsCreatingCategory(true)} 
            className="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/20 border border-transparent flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Category
          </button>
        ) : (
          <div className="flex items-center gap-1.5 shrink-0 bg-neutral-900 border border-indigo-500/40 rounded-lg px-2.5 py-1 transition-all">
            <input
              id="new-category-input"
              ref={categoryInputRef}
              type="text"
              placeholder="New category..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={handleCategoryInputKeyDown}
              className="bg-transparent text-white text-xs outline-none border-none placeholder:text-neutral-600 w-28 sm:w-36 font-medium"
              autoFocus
            />
            <button
              id="cancel-new-category"
              onClick={() => {
                setIsCreatingCategory(false);
                setNewCategoryName('');
              }}
              className="text-neutral-500 hover:text-red-400 p-0.5 rounded-full hover:bg-neutral-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      
      {/* View Mode Router */}
      {viewMode === 'list' ? (
        <div className="space-y-4 pb-12">
          {displayEvents.map(event => (
            <EventCard key={event.id} event={event} onClick={() => goToDetail(event.id)} onTogglePriority={handleTogglePriority} />
          ))}
          {displayEvents.length === 0 && (
            <div className="text-center text-neutral-500 py-16 bg-neutral-900/30 rounded-3xl border-2 border-dashed border-neutral-800/85">
              No events found under this category.
            </div>
          )}
          <button 
            id="list-add-event-btn"
            onClick={goToCreate} 
            className="w-full bg-neutral-900 border-2 border-dashed border-neutral-800 text-neutral-400 py-5 rounded-2xl hover:text-indigo-400 hover:border-indigo-500/30 transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-md active:scale-[0.99]"
          >
            <Plus className="w-5 h-5" /> Schedule New Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-12">
          {['upcoming', 'past'].map(status => {
            const colEvents = displayEvents.filter(e => e.status === status);
            return (
              <div key={status} className="bg-neutral-900/40 rounded-3xl p-4 sm:p-5 border border-neutral-800/80 flex flex-col min-h-[350px]">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-800/40">
                  <h3 className="font-bold text-white uppercase tracking-wider text-xs font-mono flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${status === 'upcoming' ? 'bg-amber-400' : 'bg-neutral-500'}`}></span>
                    {status} Events
                  </h3>
                  <span className="bg-neutral-950 text-neutral-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-neutral-800">
                    {colEvents.length} total
                  </span>
                </div>
                
                <div className="space-y-4 flex-1">
                  {colEvents.map(event => (
                    <EventCard key={event.id} event={event} onClick={() => goToDetail(event.id)} compact onTogglePriority={handleTogglePriority} />
                  ))}
                  {colEvents.length === 0 && (
                    <div className="text-center text-neutral-600 text-xs py-12 border border-dashed border-neutral-800/40 rounded-2xl bg-neutral-950/20 flex flex-col items-center justify-center">
                      <Calendar className="w-8 h-8 mb-2 text-neutral-800" />
                      No {status} events scheduled.
                    </div>
                  )}
                  {status === 'upcoming' && (
                    <button 
                      id="kanban-add-event-btn"
                      onClick={goToCreate} 
                      className="w-full bg-neutral-900 border border-dashed border-neutral-800 text-neutral-400 py-3.5 rounded-2xl hover:text-indigo-400 hover:border-indigo-500/20 transition-all flex items-center justify-center gap-1.5 mt-2 text-xs font-bold active:scale-[0.98]"
                    >
                      <Plus className="w-4 h-4 shrink-0" /> Add Upcoming Event
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- EVENT CARD COMPONENT ---
interface EventCardProps {
  key?: any;
  event: Event;
  onClick: () => void;
  compact?: boolean;
  onTogglePriority?: (id: number) => void;
}

function EventCard({ event, onClick, compact = false, onTogglePriority }: EventCardProps) {
  if (!event) return null;
  const isPriority = !!event.isHighPriority;
  return (
    <div 
      onClick={onClick} 
      className={`rounded-xl border cursor-pointer hover:bg-neutral-850/80 transition-all active:scale-[0.995] flex flex-col overflow-hidden group relative ${
        isPriority 
          ? 'bg-neutral-900/90 border-indigo-500/40 shadow-sm' 
          : 'bg-neutral-900/70 border-neutral-800/80 hover:border-neutral-700'
      }`}
    >
      <button
        id={`toggle-priority-btn-${event.id}`}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePriority?.(event.id);
        }}
        className={`absolute top-2.5 right-2.5 z-10 p-1 rounded-lg border transition-all ${
          isPriority 
            ? 'bg-neutral-900/90 text-amber-300 border-amber-500/30 shadow-sm' 
            : 'bg-neutral-950/70 hover:bg-neutral-900 text-neutral-400 hover:text-white border-neutral-800'
        }`}
        title={isPriority ? "Remove from high priority" : "Mark as high priority"}
      >
        <Star className={`w-3.5 h-3.5 ${isPriority ? 'fill-amber-300 stroke-amber-300' : ''}`} />
      </button>

      {event.photo ? (
        <img 
          src={event.photo} 
          alt={event.name} 
          className={`w-full object-cover shrink-0 transition-transform duration-300 group-hover:scale-[1.02] ${
            compact ? 'aspect-[21/9]' : 'aspect-video sm:h-40'
          }`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className={`w-full bg-neutral-950/80 flex items-center justify-center border-b border-neutral-850 shrink-0 ${
          compact ? 'aspect-[21/9]' : 'aspect-video sm:h-40'
        }`}>
          <Calendar className="w-8 h-8 text-neutral-700 group-hover:text-indigo-400/30 transition-colors shrink-0" />
        </div>
      )}
      
      <div className="p-4 flex flex-col flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1.5 gap-2">
          <h3 className="font-semibold text-sm sm:text-base text-white leading-snug line-clamp-2 break-words group-hover:text-indigo-300 transition-colors">
            {event.name}
          </h3>
          <span className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider border shrink-0 ${
            event.status === 'upcoming' 
              ? 'bg-amber-950/40 text-amber-300 border-amber-800/40' 
              : 'bg-neutral-800/80 text-neutral-400 border-neutral-700/60'
          }`}>
            {event.status}
          </span>
        </div>
        
        {event.category && (
          <div className="mb-2.5">
            <span className="inline-block bg-neutral-950 text-neutral-400 text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-800/80 truncate max-w-full">
              {event.category}
            </span>
          </div>
        )}
        
        <div className={`text-xs text-neutral-400 flex flex-col gap-1.5 ${compact ? 'mb-1' : 'mb-4'}`}>
          <span className="flex items-center gap-2 font-medium shrink-0">
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" /> {event.date}
          </span>
          <span className="flex items-center gap-2 font-medium min-w-0">
            <MapPin className="w-4 h-4 text-indigo-400 shrink-0" /> 
            <span className="truncate">{event.location}</span>
          </span>
        </div>
        
        {!compact && (
          <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-850 mt-auto min-w-0">
            <span className="font-semibold text-neutral-500 block mb-1 uppercase tracking-wider text-[9px] font-mono">Target Network Profile:</span>
            <span className="text-neutral-300 line-clamp-2 break-words text-xs leading-relaxed">{event.targetAudience || 'Open networking'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// --- EVENT DETAIL VIEW COMPONENT ---
interface EventDetailProps {
  event: Event | undefined;
  goToList: () => void;
  contacts: Contact[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
}

function EventDetail({ event, goToList, contacts, setEvents }: EventDetailProps) {
  if (!event) return <div className="text-center text-neutral-500 py-12 bg-neutral-900 rounded-3xl border border-neutral-800">Event not found.</div>;

  // Filter contacts whose source matches this event's name
  const contactsMet = useMemo(() => {
    return (contacts || []).filter(c => {
      const sourceStr = (c.source || '').toLowerCase();
      const eventNameStr = (event.name || '').toLowerCase();
      return sourceStr.includes(eventNameStr) || eventNameStr.includes(sourceStr);
    });
  }, [contacts, event]);

  const handleDeleteEvent = () => {
    if (confirm(`Are you sure you want to delete ${event.name}?`)) {
      setEvents(prev => prev.filter(e => e.id !== event.id));
      goToList();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Back Button & Delete */}
      <div className="flex justify-between items-center">
        <button onClick={goToList} className="flex items-center text-indigo-400 hover:text-indigo-300 font-semibold transition-colors text-sm">
          <ChevronRight className="w-5 h-5 rotate-180 mr-1" /> Back to Events Directory
        </button>
        <button 
          id="delete-event-btn"
          onClick={handleDeleteEvent} 
          className="text-neutral-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition-all text-xs flex items-center gap-1.5 font-bold"
        >
          <Trash2 className="w-4 h-4" /> Delete Event
        </button>
      </div>

      <div className={`rounded-3xl border shadow-xl relative overflow-hidden flex flex-col transition-all duration-300 ${
        event.isHighPriority 
          ? 'border-indigo-500/50 shadow-[0_0_25px_rgba(99,102,241,0.15)] bg-gradient-to-b from-neutral-900 to-indigo-950/15' 
          : 'bg-neutral-900 border-neutral-800'
      }`}>
        {event.photo ? (
          <img 
            src={event.photo} 
            alt={event.name} 
            className="w-full aspect-video sm:max-h-64 object-cover border-b border-neutral-850 shrink-0" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute top-[-20px] right-[-20px] opacity-[0.015] pointer-events-none">
            <Calendar className="w-48 h-48 text-neutral-100" />
          </div>
        )}
        
        <div className="p-6 relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-block px-3 py-1 bg-indigo-950 text-indigo-300 border border-indigo-900/30 text-xs font-bold font-mono rounded-lg uppercase tracking-wider shrink-0">
              {event.status}
            </span>
            {event.category && (
              <span className="inline-block px-3 py-1 bg-neutral-950 text-neutral-400 border border-neutral-850 text-xs font-bold font-mono rounded-lg uppercase tracking-wider truncate max-w-[150px]">
                {event.category}
              </span>
            )}
            <button
              id={`detail-toggle-priority-${event.id}`}
              type="button"
              onClick={() => {
                setEvents(prev => prev.map(e => e.id === event.id ? { ...e, isHighPriority: !e.isHighPriority } : e));
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold font-mono rounded-lg border transition-all ${
                event.isHighPriority
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-850 hover:text-white hover:border-neutral-700'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${event.isHighPriority ? 'fill-amber-300 text-amber-300' : ''}`} />
              {event.isHighPriority ? 'High Priority' : 'Mark High Priority'}
            </button>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight font-display">{event.name}</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm text-neutral-400 mb-6 font-medium">
            <span className="flex items-center gap-2 shrink-0">
              <Calendar className="w-4.5 h-4.5 text-indigo-400 shrink-0" /> {event.date}
            </span>
            <span className="flex items-start sm:items-center gap-2 min-w-0">
              <MapPin className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5 sm:mt-0" /> 
              <span className="break-words min-w-0 flex-1">{event.location}</span>
              {event.gpsLink && (
                <a 
                  id="event-gps-link"
                  href={event.gpsLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-indigo-400 p-1 hover:bg-indigo-950 rounded-lg border border-neutral-800 hover:border-indigo-500/20 transition-all shrink-0 ml-1.5 flex items-center justify-center"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </span>
          </div>

          <div className="space-y-5">
            <div>
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 font-mono">My Strategic Goals & Intentions</h4>
              <p className="text-sm text-neutral-200 bg-neutral-950 p-4 rounded-2xl border border-neutral-850 leading-relaxed whitespace-pre-wrap break-words">
                {event.goals || 'No strategic goals documented for this event yet.'}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 font-mono">Target Demographic / Crowd Profile</h4>
              <p className="text-sm text-neutral-200 bg-neutral-950 p-4 rounded-2xl border border-neutral-850 leading-relaxed break-words">
                {event.targetAudience || 'General Networking / Mixed Demographic'}
              </p>
            </div>
            
            {(event.specificPeople || []).length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2.5 font-mono">Key Targets To Coordinate With</h4>
                <div className="flex flex-wrap gap-2">
                  {(event.specificPeople || []).map((person, idx) => (
                    <span key={idx} className="bg-indigo-950 text-indigo-300 border border-indigo-900/20 text-xs px-3.5 py-2 rounded-xl font-medium break-words max-w-full font-display flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                      {person}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contacts met at this specific event list */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2 font-display">
          <Users className="w-5 h-5 text-indigo-400" /> Contacts Acquired At This Event
        </h3>
        
        {contactsMet.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {contactsMet.map(c => (
              <div 
                key={c.id} 
                className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 flex items-center justify-between shadow-md"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="font-semibold text-white truncate font-display text-sm">{c.name}</div>
                  <div className="text-xs text-neutral-400 mt-1 truncate">{c.title}</div>
                </div>
                <div className="bg-neutral-950 text-indigo-400 border border-neutral-800 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shrink-0 font-mono">
                  Active
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-neutral-900 border border-neutral-800 rounded-3xl text-neutral-500 text-sm flex flex-col items-center">
            <Users className="w-10 h-10 mb-3 text-neutral-700" />
            <p className="font-medium px-4">No contacts linked with this event's origin.</p>
            <p className="text-xs text-neutral-600 mt-1">Add a new Contact and set their origin location to: "{event.name}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- NEW EVENT FORM COMPONENT ---
interface EventFormProps {
  goToList: () => void;
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  customFolders?: CustomFolders;
}

function EventForm({ goToList, setEvents, customFolders }: EventFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    gpsLink: '',
    photo: '',
    category: '',
    goals: '',
    targetAudience: '',
    specificPeople: '',
    isHighPriority: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.date) return;

    const eventDate = new Date(formData.date);
    const currentDate = new Date();
    currentDate.setHours(0,0,0,0);
    const status = eventDate >= currentDate ? 'upcoming' : 'past';

    const newEvent: Event = {
      id: Date.now(),
      name: formData.name.trim(),
      date: formData.date,
      location: formData.location.trim() || 'Undisclosed Venue',
      gpsLink: formData.gpsLink.trim() || undefined,
      photo: formData.photo.trim() || undefined,
      category: formData.category.trim() || 'Uncategorized',
      goals: formData.goals.trim() || undefined,
      targetAudience: formData.targetAudience.trim() || undefined,
      specificPeople: formData.specificPeople 
        ? formData.specificPeople.split(',').map(p => p.trim()).filter(Boolean) 
        : [],
      status,
      projects: [],
      isHighPriority: formData.isHighPriority
    };

    setEvents(prev => [newEvent, ...prev]);
    goToList();
  };

  return (
    <div className="animate-fade-in pb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white font-display">Schedule Networking Event</h2>
        <button 
          onClick={goToList} 
          className="p-2 hover:bg-neutral-800 rounded-xl transition-colors shrink-0"
        >
          <X className="text-neutral-400 w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core details */}
        <div className="bg-neutral-900 p-5 sm:p-6 rounded-3xl border border-neutral-800 space-y-4 shadow-xl">
          <div className="flex flex-col-reverse sm:flex-row gap-5 sm:items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider font-mono">Event Name *</label>
              <input 
                id="event-form-name"
                required 
                type="text" 
                placeholder="E.g., London Fintech Summit 2026"
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-3 focus:ring-1 focus:ring-indigo-500 outline-none text-sm placeholder:text-neutral-600" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            <div className="relative w-full sm:w-20 aspect-video sm:aspect-square shrink-0 rounded-2xl border-2 border-dashed border-neutral-800 bg-neutral-950 flex items-center justify-center overflow-hidden group hover:border-indigo-500/50 transition-colors cursor-pointer">
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
                        setFormData({...formData, photo: reader.result});
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {formData.photo ? (
                <img src={formData.photo} alt="Cover" className="w-full h-full object-cover relative z-10" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex flex-col items-center text-neutral-600 gap-1.5 px-1 text-center">
                  <Upload className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                  <span className="text-[9px] font-bold uppercase font-mono tracking-wider">Upload</span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider font-mono">Banner Image (Upload from Gallery)</label>
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
                          setFormData({...formData, photo: reader.result});
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              {formData.photo && (
                <button
                  type="button"
                  onClick={() => setFormData({...formData, photo: ''})}
                  className="bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 text-neutral-500 hover:text-red-400 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
                >
                  Clear Image
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider font-mono">Calendar Date *</label>
            <input 
              required 
              type="date" 
              className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-3 focus:ring-1 focus:ring-indigo-500 outline-none [color-scheme:dark] text-sm" 
              value={formData.date} 
              onChange={e => setFormData({...formData, date: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider font-mono">Venue Location</label>
              <input 
                type="text" 
                placeholder="E.g., Excel Centre London or Blue Bottle Coffee"
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-neutral-600" 
                value={formData.location} 
                onChange={e => setFormData({...formData, location: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider font-mono">Maps URL link</label>
              <input 
                type="url" 
                placeholder="https://maps.google.com/?q=..."
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-neutral-600" 
                value={formData.gpsLink} 
                onChange={e => setFormData({...formData, gpsLink: e.target.value})} 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider font-mono">Category Tag</label>
            <input 
              list="evtCategories" 
              placeholder="E.g., Business, Technology, Web3"
              className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-neutral-600" 
              value={formData.category} 
              onChange={e => setFormData({...formData, category: e.target.value})} 
            />
            <datalist id="evtCategories">
              <option value="Technology" />
              <option value="Finances" />
              <option value="Business" />
              <option value="Personal Development" />
              {(customFolders?.categories || []).map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div className="flex items-center gap-3 pt-2.5 border-t border-neutral-850">
            <input 
              type="checkbox" 
              id="event-form-high-priority"
              className="w-4.5 h-4.5 rounded border-neutral-800 bg-neutral-950 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
              checked={formData.isHighPriority}
              onChange={e => setFormData({...formData, isHighPriority: e.target.checked})}
            />
            <label htmlFor="event-form-high-priority" className="text-xs font-bold text-neutral-300 cursor-pointer select-none uppercase tracking-wider font-mono">
              Mark as High Priority Event
            </label>
          </div>
        </div>

        {/* Goals & Strategies */}
        <div className="bg-neutral-900 p-5 sm:p-6 rounded-3xl border border-neutral-800 space-y-4 shadow-xl">
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider font-mono">My Goals / Targets for Event</label>
            <textarea 
              rows={3} 
              placeholder="What specifically do you want to accomplish at this event? (E.g., find co-founder, secure Series A leads)"
              className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-y placeholder:text-neutral-600" 
              value={formData.goals} 
              onChange={e => setFormData({...formData, goals: e.target.value})} 
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider font-mono">Target Demographic Profiles</label>
            <input 
              type="text" 
              placeholder="E.g., Solidity developers, Web3 Founders, Tech Angels"
              className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-neutral-600" 
              value={formData.targetAudience} 
              onChange={e => setFormData({...formData, targetAudience: e.target.value})} 
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider font-mono">Key Target Persons (comma separated)</label>
            <input 
              type="text" 
              placeholder="E.g., Sarah Jenkins, Mark (CTO), David Wallace"
              className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-neutral-600" 
              value={formData.specificPeople} 
              onChange={e => setFormData({...formData, specificPeople: e.target.value})} 
            />
          </div>
        </div>

        <button 
          id="save-event-btn"
          type="submit" 
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-indigo-500/10 transition-all active:scale-[0.98]"
        >
          Create Event Schedule
        </button>
      </form>
    </div>
  );
}
