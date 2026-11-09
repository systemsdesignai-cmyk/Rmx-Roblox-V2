import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Calendar, Target, Plus, User, Search, X, ArrowUpRight, Sparkles, AlertCircle, Network,
  Menu, Clock, ChevronLeft, Smartphone, Monitor
} from 'lucide-react';
import { ActiveTab, ViewState, CustomFolders, Contact, Event, Strategy, UserProfile } from './types';
import { initialContacts, initialEvents, initialStrategies, initialUserProfile } from './data/mockData';
import ContactsView from './components/ContactsView';
import EventsView from './components/EventsView';
import StrategyView from './components/StrategyView';
import NavButton from './components/NavButton';
import RelationshipVisualizer from './components/RelationshipVisualizer';
import UserProfileView from './components/UserProfileView';
import RelationshipMaintenanceDrawer from './components/RelationshipMaintenanceDrawer';
import { PlatformProvider, usePlatform, PlatformMode } from './context/PlatformContext';

function RolodoxApp() {
  const { platform, platformMode, setPlatformMode, isIOS, isAndroid, tokens } = usePlatform();
  const [activeTab, setActiveTab] = useState<ActiveTab>('contacts');
  
  // User Profile persistent local state
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('rolodox_user_profile_v1');
      return saved ? JSON.parse(saved) : initialUserProfile;
    } catch {
      return initialUserProfile;
    }
  });

  // Contacts persistent local state
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem('rolodox_contacts_v1');
      return saved ? JSON.parse(saved) : initialContacts;
    } catch {
      return initialContacts;
    }
  });

  // Events persistent local state
  const [events, setEvents] = useState<Event[]>(() => {
    try {
      const saved = localStorage.getItem('rolodox_events_v1');
      return saved ? JSON.parse(saved) : initialEvents;
    } catch {
      return initialEvents;
    }
  });

  // Strategies persistent local state
  const [strategies, setStrategies] = useState<Strategy[]>(() => {
    try {
      const saved = localStorage.getItem('rolodox_strategies_v1');
      return saved ? JSON.parse(saved) : initialStrategies;
    } catch {
      return initialStrategies;
    }
  });
  
  // Custom Folders persistent state
  const [customFolders, setCustomFolders] = useState<CustomFolders>(() => {
    const defaultFolders: CustomFolders = { 
      events: [], 
      skills: [], 
      tags: [], 
      network: [], 
      projects: [],
      categories: []
    };
    try {
      const saved = localStorage.getItem('rolodox_custom_folders_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.categories) {
          parsed.categories = [];
        }
        return parsed;
      }
      return defaultFolders;
    } catch {
      return defaultFolders;
    }
  });

  const [viewState, setViewState] = useState<ViewState>({ view: 'list', id: null });
  const [skipReset, setSkipReset] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const dueContactsCount = useMemo(() => {
    return contacts.filter(c => {
      if (c.nextFollowUpDate && c.nextFollowUpDate <= todayStr) return true;
      if (!c.lastMaintainedDate && (!c.conversations || c.conversations.length === 0)) return true;
      if (c.lastMaintainedDate) {
        const diffDays = Math.floor((new Date(todayStr).getTime() - new Date(c.lastMaintainedDate).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= (c.maintenanceCadenceDays || 14) && (!c.nextFollowUpDate || c.nextFollowUpDate <= todayStr)) {
          return true;
        }
      }
      return false;
    }).length;
  }, [contacts, todayStr]);

  // Handle hardware / escape back navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewState.view !== 'list') {
        goToList();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewState.view]);

  // Close search results dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navigateToContact = (id: number) => {
    setSkipReset(true);
    setActiveTab('contacts');
    setViewState({ view: 'detail', id });
  };

  const navigateToEvent = (id: number) => {
    setSkipReset(true);
    setActiveTab('events');
    setViewState({ view: 'detail', id });
  };

  const navigateToStrategy = (id: number) => {
    setSkipReset(true);
    setActiveTab('strategy');
    setTimeout(() => {
      const el = document.getElementById(`strategy-card-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Transient highlighting animation
        el.classList.add('ring-2', 'ring-indigo-500', 'shadow-[0_0_25px_rgba(99,102,241,0.35)]', 'border-indigo-500');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-indigo-500', 'shadow-[0_0_25px_rgba(99,102,241,0.35)]', 'border-indigo-500');
        }, 3000);
      }
    }, 150);
  };

  // High performance custom fuzzy search implementation matching multiple entities
  const searchResults = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return { contacts: [], events: [], strategies: [] };

    const fuzzySearch = (text: string, q: string) => {
      const cleanText = (text || '').toLowerCase();
      const cleanQuery = q.toLowerCase();
      
      if (cleanText === cleanQuery) return { matches: true, score: 1000 };
      
      const index = cleanText.indexOf(cleanQuery);
      if (index !== -1) {
        return { matches: true, score: 500 - index + cleanQuery.length * 5 };
      }
      
      let qIdx = 0;
      let tIdx = 0;
      let score = 0;
      let consecutive = 0;
      
      while (qIdx < cleanQuery.length && tIdx < cleanText.length) {
        if (cleanQuery[qIdx] === cleanText[tIdx]) {
          qIdx++;
          consecutive++;
          score += 10 + consecutive * 5;
        } else {
          consecutive = 0;
        }
        tIdx++;
      }
      
      if (qIdx === cleanQuery.length) {
        return { matches: true, score: score - (cleanText.length - cleanQuery.length) };
      }
      return { matches: false, score: 0 };
    };

    // 1. Match Contacts
    const matchedContacts = contacts
      .map(c => {
        let bestScore = 0;
        let matchedField = '';

        const nameRes = fuzzySearch(c.name, query);
        if (nameRes.matches && nameRes.score > bestScore) {
          bestScore = nameRes.score + 100;
          matchedField = 'Name';
        }

        const titleRes = fuzzySearch(c.title, query);
        if (titleRes.matches && titleRes.score > bestScore) {
          bestScore = titleRes.score + 50;
          matchedField = 'Title';
        }

        if (c.skills) {
          c.skills.forEach(s => {
            const skillRes = fuzzySearch(s.name, query);
            if (skillRes.matches && skillRes.score > bestScore) {
              bestScore = skillRes.score + 25;
              matchedField = `Skill: ${s.name}`;
            }
          });
        }

        if (c.tags) {
          c.tags.forEach(t => {
            const tagRes = fuzzySearch(t, query);
            if (tagRes.matches && tagRes.score > bestScore) {
              bestScore = tagRes.score + 30;
              matchedField = `Tag: #${t}`;
            }
          });
        }

        if (c.projects) {
          c.projects.forEach(p => {
            const projRes = fuzzySearch(p, query);
            if (projRes.matches && projRes.score > bestScore) {
              bestScore = projRes.score + 20;
              matchedField = `Project: ${p}`;
            }
          });
        }

        return { item: c, score: bestScore, matchedField };
      })
      .filter(res => res.score > 0)
      .sort((a, b) => b.score - a.score);

    // 2. Match Events
    const matchedEvents = events
      .map(e => {
        let bestScore = 0;
        let matchedField = '';

        const nameRes = fuzzySearch(e.name, query);
        if (nameRes.matches && nameRes.score > bestScore) {
          bestScore = nameRes.score + 100;
          matchedField = 'Event Name';
        }

        const locRes = fuzzySearch(e.location, query);
        if (locRes.matches && locRes.score > bestScore) {
          bestScore = locRes.score + 40;
          matchedField = 'Location';
        }

        if (e.goals) {
          const goalsRes = fuzzySearch(e.goals, query);
          if (goalsRes.matches && goalsRes.score > bestScore) {
            bestScore = goalsRes.score + 20;
            matchedField = 'Goals';
          }
        }

        return { item: e, score: bestScore, matchedField };
      })
      .filter(res => res.score > 0)
      .sort((a, b) => b.score - a.score);

    // 3. Match Strategies
    const matchedStrategies = strategies
      .map(s => {
        let bestScore = 0;
        let matchedField = '';

        const goalRes = fuzzySearch(s.goal, query);
        if (goalRes.matches && goalRes.score > bestScore) {
          bestScore = goalRes.score + 100;
          matchedField = 'Objective';
        }

        const targetRes = fuzzySearch(s.target, query);
        if (targetRes.matches && targetRes.score > bestScore) {
          bestScore = targetRes.score + 80;
          matchedField = 'Target Profile';
        }

        if (s.chain) {
          s.chain.forEach(link => {
            const linkNameRes = fuzzySearch(link.person, query);
            if (linkNameRes.matches && linkNameRes.score > bestScore) {
              bestScore = linkNameRes.score + 60;
              matchedField = `Pathway: ${link.person}`;
            }

            const linkRoleRes = fuzzySearch(link.role, query);
            if (linkRoleRes.matches && linkRoleRes.score > bestScore) {
              bestScore = linkRoleRes.score + 30;
              matchedField = `Pathway Role: ${link.role}`;
            }

            if (link.whyNeeded) {
              const whyRes = fuzzySearch(link.whyNeeded, query);
              if (whyRes.matches && whyRes.score > bestScore) {
                bestScore = whyRes.score + 15;
                matchedField = 'Pathway Context';
              }
            }
          });
        }

        return { item: s, score: bestScore, matchedField };
      })
      .filter(res => res.score > 0)
      .sort((a, b) => b.score - a.score);

    return {
      contacts: matchedContacts,
      events: matchedEvents,
      strategies: matchedStrategies
    };
  }, [searchQuery, contacts, events, strategies]);

  const goToList = () => setViewState({ view: 'list', id: null });
  const goToDetail = (id: number) => setViewState({ view: 'detail', id });
  const goToCreate = () => setViewState({ view: 'create', id: null });

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('rolodox_contacts_v1', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('rolodox_events_v1', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('rolodox_strategies_v1', JSON.stringify(strategies));
  }, [strategies]);

  useEffect(() => {
    localStorage.setItem('rolodox_custom_folders_v1', JSON.stringify(customFolders));
  }, [customFolders]);

  useEffect(() => {
    localStorage.setItem('rolodox_user_profile_v1', JSON.stringify(userProfile));
  }, [userProfile]);

  // Reset view state when changing navigation tabs
  useEffect(() => {
    if (skipReset) {
      setSkipReset(false);
      return;
    }
    goToList();
  }, [activeTab]);

  return (
    <div className={`flex flex-col h-screen bg-neutral-950 font-sans text-neutral-100 selection:bg-indigo-500/30 overflow-hidden ${
      isAndroid ? 'platform-android' : 'platform-ios'
    }`}>
      {/* Top Application Bar (Apple HIG Frosted Glass vs Material Design 3 Top App Bar) */}
      <header className={`text-white px-3 sm:px-6 z-20 flex justify-between items-center shrink-0 gap-2 sm:gap-3 transition-colors ${
        isAndroid 
          ? 'bg-neutral-900 border-b border-neutral-800/70 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3'
          : 'bg-neutral-950/85 backdrop-blur-2xl border-b border-white/[0.08] pt-[calc(0.6rem+env(safe-area-inset-top,0px))] pb-2.5'
      }`}>
        
        {/* Left Section: Back affordance or Hamburger drawer trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {viewState.view !== 'list' ? (
            <button
              id="header-back-btn"
              onClick={goToList}
              className={`text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center shrink-0 active:scale-95 ${
                isAndroid 
                  ? 'p-2 min-h-[48px] min-w-[48px] rounded-full hover:bg-neutral-800' 
                  : 'p-1.5 min-h-[44px] min-w-[44px] rounded-xl hover:bg-white/10'
              }`}
              title="Navigate Back"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
          ) : (
            <button
              id="sidebar-hamburger-menu-btn"
              onClick={() => setIsMaintenanceOpen(true)}
              className={`text-neutral-400 hover:text-white transition-colors relative cursor-pointer active:scale-95 shrink-0 flex items-center justify-center ${
                isAndroid 
                  ? 'p-2 min-h-[48px] min-w-[48px] rounded-full hover:bg-neutral-800' 
                  : 'p-1.5 min-h-[44px] min-w-[44px] rounded-xl hover:bg-white/10'
              }`}
              title="Open Relationship Maintenance & Reminders"
              aria-label="Open Maintenance Drawer"
            >
              <Menu className="w-5 h-5" />
              {dueContactsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-neutral-950" />
              )}
            </button>
          )}

          {/* App Wordmark */}
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg shrink-0 ${isAndroid ? 'bg-indigo-600 rounded-xl' : 'bg-indigo-600/90'}`}>
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className={`text-sm font-semibold tracking-tight text-neutral-100 hidden sm:inline ${tokens.titleTracking}`}>
              Rolodox
            </span>
          </div>
        </div>

        {/* Center: Global Fuzzy Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-[170px] sm:max-w-[260px] md:max-w-[340px] shrink-1">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="global-header-search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search contacts, skills, events..."
              className={`w-full text-neutral-100 pl-8 pr-7 py-1.5 text-xs outline-none transition-all placeholder:text-neutral-500 ${
                isAndroid 
                  ? 'bg-neutral-950 border border-neutral-800 rounded-2xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/40' 
                  : 'bg-neutral-900/60 hover:bg-neutral-900/90 border border-white/10 rounded-xl focus:ring-1 focus:ring-indigo-500/50'
              }`}
            />
            {searchQuery && (
              <button
                id="clear-global-search"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white hover:bg-neutral-800 p-0.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Search Dropdown Panel */}
          {showSearchResults && searchQuery.trim() && (
            <div className="absolute top-full mt-2.5 right-0 w-[280px] sm:w-[400px] md:w-[460px] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.65)] max-h-[440px] overflow-y-auto z-50 p-4 space-y-4 backdrop-blur-md animate-fade-in no-scrollbar">
              <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Fuzzy Search Results
                </span>
                <span className="text-[9px] font-mono text-neutral-500">
                  {searchResults.contacts.length + searchResults.events.length + searchResults.strategies.length} matches
                </span>
              </div>

              {/* Contacts Results */}
              {searchResults.contacts.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono flex items-center gap-1">
                    👥 Directory ({searchResults.contacts.length})
                  </h4>
                  <div className="space-y-1">
                    {searchResults.contacts.slice(0, 5).map(({ item, matchedField }) => (
                      <div
                        key={item.id}
                        id={`search-contact-result-${item.id}`}
                        onClick={() => {
                          navigateToContact(item.id);
                          setShowSearchResults(false);
                        }}
                        className="flex items-center justify-between bg-neutral-950 hover:bg-neutral-850 border border-neutral-850 hover:border-indigo-500/30 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-neutral-100 flex items-center gap-1.5 group-hover:text-indigo-400 transition-colors">
                            <span className="truncate">{item.name}</span>
                            <ArrowUpRight className="w-3 h-3 text-neutral-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                          </div>
                          <div className="text-[10px] text-neutral-400 truncate mt-0.5">{item.title}</div>
                        </div>
                        {matchedField && matchedField !== 'Name' && matchedField !== 'Title' && (
                          <span className="text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded font-mono shrink-0 select-none max-w-[120px] truncate">
                            {matchedField}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events Results */}
              {searchResults.events.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono flex items-center gap-1">
                    📅 Events ({searchResults.events.length})
                  </h4>
                  <div className="space-y-1">
                    {searchResults.events.slice(0, 5).map(({ item, matchedField }) => (
                      <div
                        key={item.id}
                        id={`search-event-result-${item.id}`}
                        onClick={() => {
                          navigateToEvent(item.id);
                          setShowSearchResults(false);
                        }}
                        className="flex items-center justify-between bg-neutral-950 hover:bg-neutral-850 border border-neutral-850 hover:border-indigo-500/30 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-neutral-100 flex items-center gap-1.5 group-hover:text-indigo-400 transition-colors">
                            <span className="truncate">{item.name}</span>
                            <ArrowUpRight className="w-3 h-3 text-neutral-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                          </div>
                          <div className="text-[10px] text-neutral-400 truncate mt-0.5 flex items-center gap-1.5">
                            <span className="shrink-0">{item.date}</span>
                            {item.location && <span className="truncate text-neutral-500">• {item.location}</span>}
                          </div>
                        </div>
                        {matchedField && matchedField !== 'Event Name' && (
                          <span className="text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded font-mono shrink-0 select-none max-w-[120px] truncate">
                            {matchedField}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategies Results */}
              {searchResults.strategies.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono flex items-center gap-1">
                    🎯 Strategies ({searchResults.strategies.length})
                  </h4>
                  <div className="space-y-1">
                    {searchResults.strategies.slice(0, 5).map(({ item, matchedField }) => (
                      <div
                        key={item.id}
                        id={`search-strategy-result-${item.id}`}
                        onClick={() => {
                          navigateToStrategy(item.id);
                          setShowSearchResults(false);
                        }}
                        className="flex items-center justify-between bg-neutral-950 hover:bg-neutral-850 border border-neutral-850 hover:border-indigo-500/30 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-neutral-100 flex items-center gap-1.5 group-hover:text-indigo-400 transition-colors">
                            <span className="truncate">{item.goal}</span>
                            <ArrowUpRight className="w-3 h-3 text-neutral-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-0.5 truncate flex items-center gap-1.5">
                            <span className="shrink-0 text-indigo-400 font-medium">Target: {item.target}</span>
                            <span className="shrink-0 bg-indigo-950 text-indigo-400 text-[8px] border border-indigo-900/30 px-1 py-0.2 rounded font-mono font-bold uppercase tracking-wider scale-90">{item.status}</span>
                          </div>
                        </div>
                        {matchedField && matchedField !== 'Objective' && matchedField !== 'Target Profile' && (
                          <span className="text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded font-mono shrink-0 select-none max-w-[120px] truncate" title={matchedField}>
                            {matchedField}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results Fallback */}
              {searchResults.contacts.length === 0 && searchResults.events.length === 0 && searchResults.strategies.length === 0 && (
                <div className="py-6 text-center text-neutral-500 space-y-2">
                  <AlertCircle className="w-8 h-8 text-neutral-600 mx-auto animate-pulse" />
                  <p className="text-xs">No matching contacts, events, or strategies found.</p>
                  <p className="text-[10px] text-neutral-600 italic">Try searching a name, skill, or objective</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Platform Preview Switcher, Maintenance Trigger, Actions & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Platform Preview Mode Switcher (Allows instant testing of iOS HIG vs Material Design 3) */}
          <div className="flex items-center bg-neutral-950/90 border border-neutral-800 rounded-full p-0.5 text-[10px] font-mono shrink-0">
            <button
              id="platform-switch-auto"
              onClick={() => setPlatformMode('auto')}
              className={`px-1.5 py-0.5 rounded-full transition-all cursor-pointer ${
                platformMode === 'auto'
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title={`Auto Device Mode (Detected: ${platform})`}
            >
              Auto
            </button>
            <button
              id="platform-switch-ios"
              onClick={() => setPlatformMode('ios')}
              className={`px-2 py-0.5 rounded-full transition-all cursor-pointer flex items-center gap-0.5 ${
                platformMode === 'ios'
                  ? 'bg-neutral-200 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Preview Apple Human Interface Guidelines (iOS Mode)"
            >
              <span>iOS</span>
            </button>
            <button
              id="platform-switch-android"
              onClick={() => setPlatformMode('android')}
              className={`px-2 py-0.5 rounded-full transition-all cursor-pointer flex items-center gap-0.5 ${
                platformMode === 'android'
                  ? 'bg-indigo-500 text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Preview Google Material Design 3 (Android Mode)"
            >
              <span>M3</span>
            </button>
          </div>

          {/* Maintenance Drawer Trigger */}
          <button
            id="header-maintain-btn"
            onClick={() => setIsMaintenanceOpen(true)}
            className={`border text-neutral-300 hover:text-white text-xs font-medium px-2 py-1.5 transition-all flex items-center gap-1.5 active:scale-95 shrink-0 cursor-pointer ${
              isAndroid 
                ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 rounded-full min-h-[44px]' 
                : 'bg-neutral-900/90 hover:bg-neutral-850 border-white/10 rounded-xl min-h-[40px]'
            }`}
            title="Relationship Maintenance To-Do"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Maintain</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              dueContactsCount > 0 
                ? 'bg-amber-500/20 text-amber-300 font-bold' 
                : 'text-neutral-500'
            }`}>
              {dueContactsCount}
            </span>
          </button>

          {/* iOS Header Action Button (In Apple HIG, creation actions reside in the Navigation Bar) */}
          {isIOS && viewState.view === 'list' && activeTab !== 'visualizer' && activeTab !== 'profile' && (
            <button 
              id="header-create-btn"
              onClick={goToCreate} 
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl transition-all shadow-sm active:scale-95 shrink-0 flex items-center justify-center border border-indigo-500/30 min-h-[40px] min-w-[40px]"
              title={`Create new item in ${activeTab}`}
            >
              <Plus className="w-4 h-4 stroke-[2.4]" />
            </button>
          )}

          {/* User Profile Avatar / Trigger */}
          <button
            id="header-profile-shortcut"
            onClick={() => setActiveTab('profile')}
            className={`shrink-0 p-0.5 border transition-all active:scale-95 flex items-center justify-center overflow-hidden ${
              isAndroid ? 'rounded-full' : 'rounded-xl'
            } ${
              activeTab === 'profile' 
                ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900'
            }`}
            title="Go to My Profile"
          >
            {userProfile.avatar ? (
              <img 
                src={userProfile.avatar} 
                alt={userProfile.name} 
                className={`w-7 h-7 object-cover ${isAndroid ? 'rounded-full' : 'rounded-lg'}`} 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`w-7 h-7 bg-neutral-850 flex items-center justify-center ${isAndroid ? 'rounded-full' : 'rounded-lg'}`}>
                <User className="w-3.5 h-3.5 text-neutral-400" />
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Main Scrollable Area */}
      <main className={`flex-1 overflow-y-auto w-full px-4 sm:px-6 pt-5 relative transition-all duration-300 ${
        isAndroid 
          ? 'pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]' 
          : 'pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]'
      } ${
        activeTab === 'visualizer' ? 'max-w-6xl mx-auto h-full flex flex-col' : 
        activeTab === 'profile' ? 'max-w-4xl mx-auto' : 'max-w-3xl mx-auto'
      }`}>
        {activeTab === 'contacts' && (
          <ContactsView 
            contacts={contacts} 
            setContacts={setContacts} 
            events={events} 
            setEvents={setEvents}
            customFolders={customFolders} 
            setCustomFolders={setCustomFolders}
            viewState={viewState} 
            goToList={goToList} 
            goToDetail={goToDetail} 
          />
        )}
        {activeTab === 'events' && (
          <EventsView 
            events={events} 
            setEvents={setEvents} 
            contacts={contacts}
            customFolders={customFolders}
            setCustomFolders={setCustomFolders}
            viewState={viewState} 
            goToList={goToList} 
            goToDetail={goToDetail} 
            goToCreate={goToCreate}
          />
        )}
        {activeTab === 'strategy' && (
          <StrategyView 
            strategies={strategies} 
            setStrategies={setStrategies} 
            viewState={viewState} 
            goToList={goToList} 
            goToDetail={goToDetail} 
            goToCreate={goToCreate}
            contacts={contacts}
            setContacts={setContacts}
            navigateToContact={navigateToContact}
          />
        )}
        {activeTab === 'visualizer' && (
          <div className="flex-1 min-h-[550px] h-full flex flex-col">
            <RelationshipVisualizer
              contacts={contacts}
              events={events}
              strategies={strategies}
              navigateToContact={navigateToContact}
              navigateToEvent={navigateToEvent}
              navigateToStrategy={navigateToStrategy}
            />
          </div>
        )}
        {activeTab === 'profile' && (
          <UserProfileView
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            contacts={contacts}
            navigateToContact={navigateToContact}
          />
        )}
      </main>

      {/* Material Design 3 Floating Action Button (FAB) on Android
          In M3, the FAB floats prominently above the bottom navigation bar for the screen's primary action */}
      {isAndroid && viewState.view === 'list' && activeTab !== 'visualizer' && activeTab !== 'profile' && (
        <button
          id="android-m3-fab-create"
          onClick={goToCreate}
          className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] right-5 sm:right-8 z-40 bg-indigo-600 hover:bg-indigo-500 text-white w-14 h-14 rounded-2xl shadow-2xl shadow-indigo-950 flex items-center justify-center active:scale-95 transition-all cursor-pointer border border-indigo-400/30 group"
          title={`Create new in ${activeTab}`}
          aria-label={`Create new in ${activeTab}`}
        >
          <Plus className="w-6 h-6 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
        </button>
      )}

      {/* Adaptive Bottom Navigation (Apple HIG Frosted Dock vs Material Design 3 Tonal Navigation Bar) */}
      {isAndroid ? (
        <nav 
          id="android-m3-bottom-nav"
          className="fixed bottom-0 left-0 right-0 sm:bottom-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[500px] sm:rounded-3xl z-30 bg-neutral-900 border-t sm:border border-neutral-800 shadow-2xl pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-1 px-3 flex justify-around items-center"
          role="navigation"
          aria-label="Bottom Navigation"
        >
          <NavButton 
            id="nav-tab-contacts"
            active={activeTab === 'contacts'} 
            icon={<Users />} 
            label="Directory" 
            onClick={() => setActiveTab('contacts')} 
          />
          <NavButton 
            id="nav-tab-events"
            active={activeTab === 'events'} 
            icon={<Calendar />} 
            label="Events" 
            onClick={() => setActiveTab('events')} 
          />
          <NavButton 
            id="nav-tab-strategy"
            active={activeTab === 'strategy'} 
            icon={<Target />} 
            label="Strategy" 
            onClick={() => setActiveTab('strategy')} 
          />
          <NavButton 
            id="nav-tab-visualizer"
            active={activeTab === 'visualizer'} 
            icon={<Network />} 
            label="Network" 
            onClick={() => setActiveTab('visualizer')} 
          />
          <NavButton 
            id="nav-tab-profile"
            active={activeTab === 'profile'} 
            icon={<User />} 
            label="Profile" 
            onClick={() => setActiveTab('profile')} 
          />
        </nav>
      ) : (
        <nav 
          id="ios-hig-tab-bar"
          className="bg-neutral-950/80 backdrop-blur-2xl border border-white/[0.12] flex justify-around items-center py-1.5 px-2 fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[480px] z-30 shadow-2xl rounded-2xl"
          role="navigation"
          aria-label="Tab Bar"
        >
          <NavButton 
            id="nav-tab-contacts"
            active={activeTab === 'contacts'} 
            icon={<Users />} 
            label="Directory" 
            onClick={() => setActiveTab('contacts')} 
          />
          <NavButton 
            id="nav-tab-events"
            active={activeTab === 'events'} 
            icon={<Calendar />} 
            label="Events" 
            onClick={() => setActiveTab('events')} 
          />
          <NavButton 
            id="nav-tab-strategy"
            active={activeTab === 'strategy'} 
            icon={<Target />} 
            label="Strategy" 
            onClick={() => setActiveTab('strategy')} 
          />
          <NavButton 
            id="nav-tab-visualizer"
            active={activeTab === 'visualizer'} 
            icon={<Network />} 
            label="Network" 
            onClick={() => setActiveTab('visualizer')} 
          />
          <NavButton 
            id="nav-tab-profile"
            active={activeTab === 'profile'} 
            icon={<User />} 
            label="Profile" 
            onClick={() => setActiveTab('profile')} 
          />
        </nav>
      )}

      {/* Relationship Maintenance Slide-out Drawer / Sheet */}
      <RelationshipMaintenanceDrawer
        isOpen={isMaintenanceOpen}
        onClose={() => setIsMaintenanceOpen(false)}
        contacts={contacts}
        setContacts={setContacts}
        navigateToContact={navigateToContact}
      />
    </div>
  );
}

export default function App() {
  return (
    <PlatformProvider>
      <RolodoxApp />
    </PlatformProvider>
  );
}
