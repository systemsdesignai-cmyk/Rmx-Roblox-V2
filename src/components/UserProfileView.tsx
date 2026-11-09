import React, { useState } from 'react';
import { 
  User, Sparkles, Plus, Trash2, Edit2, Target, 
  TrendingUp, CheckCircle, ArrowUpRight, Search, 
  HelpCircle, Check, X, ShieldAlert, Award, Briefcase, Network, Info, Upload,
  Globe, Share2
} from 'lucide-react';
import { UserProfile, Contact, LifeGoal } from '../types';

interface UserProfileViewProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  contacts: Contact[];
  navigateToContact: (id: number) => void;
}

export default function UserProfileView({ 
  userProfile, 
  setUserProfile, 
  contacts, 
  navigateToContact 
}: UserProfileViewProps) {
  
  // Editing state for main profile
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState(userProfile.name);
  const [editedTitle, setEditedTitle] = useState(userProfile.title);
  const [editedBio, setEditedBio] = useState(userProfile.bio || '');
  const [editedAvatar, setEditedAvatar] = useState(userProfile.avatar || '');

  // State for adding lists
  const [newValue, setNewValue] = useState('');
  const [newStrength, setNewStrength] = useState('');
  const [newGrowthArea, setNewGrowthArea] = useState('');
  
  // Life goals state
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('Personal');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');
  
  // Search state for linking helpers
  const [activeLinkingGoalId, setActiveLinkingGoalId] = useState<number | null>(null);
  const [helperSearchQuery, setHelperSearchQuery] = useState('');

  // Search state for linking contacts to growth areas
  const [activeLinkingAreaIndex, setActiveLinkingAreaIndex] = useState<number | null>(null);
  const [areaSearchQuery, setAreaSearchQuery] = useState('');

  // Context Cards state
  const [activeContextId, setActiveContextId] = useState<string>('professional');
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [newCardContext, setNewCardContext] = useState('Professional or work-related');
  const [newCardAnswer, setNewCardAnswer] = useState('');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  
  // Customizing prompt template state
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(userProfile.pitchRefiningPrompt || 'Act as a master brand strategist and copywriter. Given my background as a [My Title] with core strengths in [My Strengths], optimize a brief, highly compelling answer to the question "What do you do?" that is tailored specifically for a [Target Audience] context. Keep it engaging, concise (1-2 sentences), conversational, and focused on the high-value problems I solve.');
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Custom Social Platform Cards state
  const [newSocialPlatform, setNewSocialPlatform] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');

  const STANDARD_CONTEXTS = [
    'Professional or work-related',
    'Hobbies',
    'Personal projects',
    'Health and wellness',
    'Media or content creation',
    'Side projects',
    'Other relevant contexts'
  ];

  const handleSaveContextCard = () => {
    if (!newCardAnswer.trim()) return;
    
    const existingCards = userProfile.whatIDoCards || [];
    let updatedCards;
    
    if (editingCardId) {
      updatedCards = existingCards.map(c => 
        c.id === editingCardId ? { ...c, context: newCardContext, answer: newCardAnswer.trim() } : c
      );
    } else {
      const newCard = {
        id: Date.now().toString(),
        context: newCardContext,
        answer: newCardAnswer.trim()
      };
      updatedCards = [...existingCards, newCard];
    }

    setUserProfile(prev => ({
      ...prev,
      whatIDoCards: updatedCards
    }));

    setNewCardAnswer('');
    setEditingCardId(null);
    setIsCreatingCard(false);
  };

  const handleRemoveContextCard = (id: string) => {
    setUserProfile(prev => ({
      ...prev,
      whatIDoCards: (prev.whatIDoCards || []).filter(c => c.id !== id)
    }));
  };

  const handleEditContextCard = (card: any) => {
    setEditingCardId(card.id);
    setNewCardContext(card.context);
    setNewCardAnswer(card.answer);
    setIsCreatingCard(true);
  };

  const handleCopyCard = (cardId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCardId(cardId);
    setTimeout(() => setCopiedCardId(null), 2000);
  };

  const handleCopyPrompt = () => {
    const promptText = userProfile.pitchRefiningPrompt || 'Act as a master brand strategist and copywriter. Given my background as a [My Title] with core strengths in [My Strengths], optimize a brief, highly compelling answer to the question "What do you do?" that is tailored specifically for a [Target Audience] context. Keep it engaging, concise (1-2 sentences), conversational, and focused on the high-value problems I solve.';
    const activeStrengths = userProfile.strengths.join(', ') || '[My Strengths]';
    const activeTitle = userProfile.title || '[My Title]';
    const filledPrompt = promptText
      .replace('[My Title]', activeTitle)
      .replace('[My Strengths]', activeStrengths);
      
    navigator.clipboard.writeText(filledPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleSavePromptTemplate = () => {
    setUserProfile(prev => ({
      ...prev,
      pitchRefiningPrompt: editedPrompt
    }));
    setIsEditingPrompt(false);
  };

  // Save general profile info
  const handleSaveProfile = () => {
    setUserProfile(prev => ({
      ...prev,
      name: editedName.trim() || prev.name,
      title: editedTitle.trim() || prev.title,
      bio: editedBio.trim(),
      avatar: editedAvatar.trim()
    }));
    setIsEditingProfile(false);
  };

  // Add list item helpers
  const handleAddValue = () => {
    if (!newValue.trim()) return;
    setUserProfile(prev => ({
      ...prev,
      valueToGive: [...prev.valueToGive, newValue.trim()]
    }));
    setNewValue('');
  };

  const handleRemoveValue = (index: number) => {
    setUserProfile(prev => ({
      ...prev,
      valueToGive: prev.valueToGive.filter((_, i) => i !== index)
    }));
  };

  const handleAddStrength = () => {
    if (!newStrength.trim()) return;
    setUserProfile(prev => ({
      ...prev,
      strengths: [...prev.strengths, newStrength.trim()]
    }));
    setNewStrength('');
  };

  const handleRemoveStrength = (index: number) => {
    setUserProfile(prev => ({
      ...prev,
      strengths: prev.strengths.filter((_, i) => i !== index)
    }));
  };

  // Helper to normalize growth area structure
  const normalizeGrowthArea = (area: any) => {
    if (typeof area === 'string') {
      return { name: area, links: [] };
    }
    return { name: area.name || '', links: area.links || [] };
  };

  const handleAddGrowthArea = () => {
    if (!newGrowthArea.trim()) return;
    setUserProfile(prev => ({
      ...prev,
      growthAreas: [...prev.growthAreas, { name: newGrowthArea.trim(), links: [] }]
    }));
    setNewGrowthArea('');
  };

  const handleRemoveGrowthArea = (index: number) => {
    setUserProfile(prev => ({
      ...prev,
      growthAreas: prev.growthAreas.filter((_, i) => i !== index)
    }));
    if (activeLinkingAreaIndex === index) {
      setActiveLinkingAreaIndex(null);
    }
  };

  const handleLinkContactToGrowthArea = (areaIndex: number, contactId: number, type: 'help' | 'delegate') => {
    setUserProfile(prev => {
      const updatedAreas = [...prev.growthAreas];
      const currentArea = normalizeGrowthArea(updatedAreas[areaIndex]);
      
      // Check if already linked
      if (currentArea.links?.some(l => l.contactId === contactId)) return prev;
      
      const newLink = { contactId, type };
      currentArea.links = [...(currentArea.links || []), newLink];
      updatedAreas[areaIndex] = currentArea;
      
      return {
        ...prev,
        growthAreas: updatedAreas
      };
    });
  };

  const handleUnlinkContactFromGrowthArea = (areaIndex: number, contactId: number) => {
    setUserProfile(prev => {
      const updatedAreas = [...prev.growthAreas];
      const currentArea = normalizeGrowthArea(updatedAreas[areaIndex]);
      
      currentArea.links = (currentArea.links || []).filter(l => l.contactId !== contactId);
      updatedAreas[areaIndex] = currentArea;
      
      return {
        ...prev,
        growthAreas: updatedAreas
      };
    });
  };

  const handleUpdateLinkTypeInGrowthArea = (areaIndex: number, contactId: number, type: 'help' | 'delegate') => {
    setUserProfile(prev => {
      const updatedAreas = [...prev.growthAreas];
      const currentArea = normalizeGrowthArea(updatedAreas[areaIndex]);
      
      currentArea.links = (currentArea.links || []).map(l => 
        l.contactId === contactId ? { ...l, type } : l
      );
      updatedAreas[areaIndex] = currentArea;
      
      return {
        ...prev,
        growthAreas: updatedAreas
      };
    });
  };

  // Add life goal
  const handleAddLifeGoal = () => {
    if (!newGoalText.trim()) return;
    const newGoal: LifeGoal = {
      id: Date.now(),
      goal: newGoalText.trim(),
      category: newGoalCategory,
      targetDate: newGoalTargetDate || undefined,
      linkedContactIds: [],
      status: 'active'
    };
    setUserProfile(prev => ({
      ...prev,
      lifeGoals: [...prev.lifeGoals, newGoal]
    }));
    setNewGoalText('');
    setNewGoalTargetDate('');
    setIsCreatingGoal(false);
  };

  const handleRemoveLifeGoal = (id: number) => {
    setUserProfile(prev => ({
      ...prev,
      lifeGoals: prev.lifeGoals.filter(goal => goal.id !== id)
    }));
  };

  const handleToggleGoalStatus = (id: number) => {
    setUserProfile(prev => ({
      ...prev,
      lifeGoals: prev.lifeGoals.map(goal => 
        goal.id === id 
          ? { ...goal, status: goal.status === 'achieved' ? 'active' : 'achieved' } 
          : goal
      )
    }));
  };

  // Link/unlink contacts to life goals
  const handleLinkContactToGoal = (goalId: number, contactId: number) => {
    setUserProfile(prev => ({
      ...prev,
      lifeGoals: prev.lifeGoals.map(goal => {
        if (goal.id === goalId) {
          if (goal.linkedContactIds.includes(contactId)) return goal;
          return { ...goal, linkedContactIds: [...goal.linkedContactIds, contactId] };
        }
        return goal;
      })
    }));
    setHelperSearchQuery('');
    setActiveLinkingGoalId(null);
  };

  const handleUnlinkContactFromGoal = (goalId: number, contactId: number) => {
    setUserProfile(prev => ({
      ...prev,
      lifeGoals: prev.lifeGoals.map(goal => 
        goal.id === goalId 
          ? { ...goal, linkedContactIds: goal.linkedContactIds.filter(id => id !== contactId) } 
          : goal
      )
    }));
  };

  const handleAddSocialCard = () => {
    if (!newSocialPlatform.trim() || !newSocialUrl.trim()) return;
    
    let formattedUrl = newSocialUrl.trim();
    const platformLower = newSocialPlatform.trim().toLowerCase();

    if (platformLower.includes('whatsapp') || platformLower.includes('wa.me')) {
      const digitsOnly = formattedUrl.replace(/[\s+()\-]/g, '');
      if (/^\d+$/.test(digitsOnly)) {
        formattedUrl = `https://wa.me/${digitsOnly}`;
      } else if (/^wa\.me\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      } else if (!/^https?:\/\//i.test(formattedUrl)) {
        const numbersOnly = formattedUrl.replace(/\D/g, '');
        if (numbersOnly.length > 0) {
          formattedUrl = `https://wa.me/${numbersOnly}`;
        }
      }
    } else {
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
    }

    const newCard = {
      id: Date.now().toString(),
      platform: newSocialPlatform.trim(),
      url: formattedUrl
    };

    setUserProfile(prev => ({
      ...prev,
      socialCards: [...(prev.socialCards || []), newCard]
    }));

    setNewSocialPlatform('');
    setNewSocialUrl('');
  };

  const handleRemoveSocialCard = (id: string) => {
    setUserProfile(prev => ({
      ...prev,
      socialCards: (prev.socialCards || []).filter(card => card.id !== id)
    }));
  };

  // Match contacts dynamically based on growth areas (Not Strong Parts) keywords
  const findMatchesForGrowthArea = (area: string | any) => {
    const areaName = typeof area === 'string' ? area : area?.name || '';
    if (!areaName) return [];
    
    // Simple text parsing for keywords
    const ignoreWords = ['and', 'or', 'the', 'of', 'to', 'in', 'for', 'with', 'on', 'at', 'by', 'an', 'a', 'about', 'is', 'development', 'management', 'polish', 'designing', 'marketing', 'awareness'];
    const keywords = areaName.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !ignoreWords.includes(w));
      
    if (keywords.length === 0) return [];

    return contacts.filter(contact => {
      // Check if contact title, tags, or skills match any keyword
      const contactText = [
        contact.name,
        contact.title,
        ...(contact.tags || []),
        ...(contact.skills || []).map(s => s.name),
        ...(contact.projects || [])
      ].join(' ').toLowerCase();

      return keywords.some(keyword => contactText.includes(keyword));
    }).slice(0, 3); // Max 3 recommendations
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Profile Box */}
      <div className="bg-neutral-900/80 rounded-2xl border border-neutral-800 p-5 sm:p-6 shadow-sm relative overflow-hidden">
        
        {isEditingProfile ? (
          <div className="space-y-4 relative z-10 animate-fade-in">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest font-mono">Edit Profile Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase font-mono mb-1.5">My Full Name</label>
                <input 
                  type="text" 
                  value={editedName}
                  onChange={e => setEditedName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase font-mono mb-1.5">Primary Title / Profession</label>
                <input 
                  type="text" 
                  value={editedTitle}
                  onChange={e => setEditedTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase font-mono mb-1.5">Profile Photo (Upload from Gallery)</label>
                <div className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 rounded-xl p-2 h-[46px]">
                  <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
                    {editedAvatar ? (
                      <img src={editedAvatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-neutral-600" />
                    )}
                  </div>
                  <label className="bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700/60 font-semibold text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1">
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
                              setEditedAvatar(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {editedAvatar && (
                    <button
                      type="button"
                      onClick={() => setEditedAvatar('')}
                      className="text-neutral-500 hover:text-red-400 text-xs font-semibold ml-auto pr-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase font-mono mb-1.5">One-line Bio</label>
                <input 
                  type="text" 
                  value={editedBio}
                  onChange={e => setEditedBio(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2.5 pt-2">
              <button 
                onClick={handleSaveProfile}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Save Changes
              </button>
              <button 
                onClick={() => {
                  setEditedName(userProfile.name);
                  setEditedTitle(userProfile.title);
                  setEditedBio(userProfile.bio || '');
                  setEditedAvatar(userProfile.avatar || '');
                  setIsEditingProfile(false);
                }}
                className="bg-neutral-800 hover:bg-neutral-750 text-neutral-400 font-semibold text-xs px-4 py-2 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 relative z-10 text-center sm:text-left">
            <div className="shrink-0">
              {userProfile.avatar ? (
                <img 
                  src={userProfile.avatar} 
                  alt={userProfile.name} 
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border border-neutral-700/80 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center">
                  <User className="w-8 h-8 text-neutral-500" />
                </div>
              )}
            </div>
            
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
                    {userProfile.name} 
                    <span className="text-neutral-400 bg-neutral-950 border border-neutral-800 text-[10px] font-mono font-medium px-2 py-0.5 rounded-md">
                      Profile
                    </span>
                  </h2>
                  <p className="text-xs text-neutral-400 font-normal mt-0.5">{userProfile.title}</p>
                </div>
                
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="self-center sm:self-start inline-flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 px-3 py-1.5 rounded-xl transition-all font-medium active:scale-95 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                </button>
              </div>

              {userProfile.bio && (
                <p className="text-xs text-neutral-400 leading-relaxed max-w-xl pt-1">
                  {userProfile.bio}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Bento Grid: My Value to Give & My Strengths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Value to Give */}
        <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" /> My Value Proposition
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded-full font-bold">
              Give to Others
            </span>
          </div>
          <p className="text-[11px] text-neutral-400">
            Define high-leverage assets, expertise, introductions, or specific resources you can provide to elevate your network contacts.
          </p>

          <div className="flex-1 space-y-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
            {userProfile.valueToGive.length === 0 ? (
              <div className="text-center py-6 text-neutral-600 text-xs italic">
                No values defined. Add some below to ready your leverage.
              </div>
            ) : (
              userProfile.valueToGive.map((val, idx) => (
                <div key={idx} className="flex items-start justify-between bg-neutral-950 border border-neutral-850 px-3.5 py-2.5 rounded-2xl group transition-all hover:border-emerald-900/30">
                  <div className="flex gap-2 min-w-0">
                    <span className="text-emerald-400 text-xs mt-0.5">✦</span>
                    <span className="text-xs text-neutral-200 leading-relaxed">{val}</span>
                  </div>
                  <button 
                    onClick={() => handleRemoveValue(idx)}
                    className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-400 p-1 rounded-lg transition-all ml-1 cursor-pointer"
                    title="Remove value"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="e.g. Free scalability consults..."
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddValue()}
              className="flex-1 bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder:text-neutral-600 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleAddValue}
              className="bg-neutral-800 hover:bg-emerald-900 hover:text-white text-neutral-300 p-2 rounded-xl transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* My Strengths */}
        <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" /> Core Superpowers
            </h3>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/40 border border-indigo-900/40 px-2 py-0.5 rounded-full font-bold">
              My Strengths
            </span>
          </div>
          <p className="text-[11px] text-neutral-400">
            Keep track of your absolute zones of genius, validated skills, and areas where you require zero delegation.
          </p>

          <div className="flex-1 space-y-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
            {userProfile.strengths.length === 0 ? (
              <div className="text-center py-6 text-neutral-600 text-xs italic">
                No strengths listed. Record what you excel at.
              </div>
            ) : (
              userProfile.strengths.map((str, idx) => (
                <div key={idx} className="flex items-start justify-between bg-neutral-950 border border-neutral-850 px-3.5 py-2.5 rounded-2xl group transition-all hover:border-indigo-900/30">
                  <div className="flex gap-2 min-w-0">
                    <span className="text-indigo-400 text-xs mt-0.5">⚡</span>
                    <span className="text-xs text-neutral-200 leading-relaxed">{str}</span>
                  </div>
                  <button 
                    onClick={() => handleRemoveStrength(idx)}
                    className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-400 p-1 rounded-lg transition-all ml-1 cursor-pointer"
                    title="Remove strength"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="e.g. Architecting high-scale backends..."
              value={newStrength}
              onChange={e => setNewStrength(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddStrength()}
              className="flex-1 bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder:text-neutral-600 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleAddStrength}
              className="bg-neutral-800 hover:bg-indigo-900 hover:text-white text-neutral-300 p-2 rounded-xl transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Custom Social Platform Cards Section */}
      <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800/60 pb-3 gap-2">
          <div>
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Share2 className="w-4 h-4 text-violet-400" /> Custom Social Platform Cards
            </h3>
            <p className="text-[10px] text-neutral-500 mt-1">
              Create and customize custom cards for your social profiles (e.g., TikTok, LinkedIn, Twitter/X, GitHub) to instantly share and launch.
            </p>
          </div>
        </div>

        {/* Inline addition form */}
        <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-2xl space-y-3">
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
            ⚡ Create Custom Card Holder
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-1">Platform Name</label>
              <input 
                type="text" 
                placeholder="e.g. TikTok, GitHub, Medium, Substack..."
                value={newSocialPlatform}
                onChange={e => setNewSocialPlatform(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-violet-500 placeholder:text-neutral-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-1">Profile Link (URL)</label>
              <input 
                type="text" 
                placeholder="e.g. tiktok.com/@username or https://..."
                value={newSocialUrl}
                onChange={e => setNewSocialUrl(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-violet-500 placeholder:text-neutral-600"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button 
              onClick={handleAddSocialCard}
              disabled={!newSocialPlatform.trim() || !newSocialUrl.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Save Social Card
            </button>
          </div>
        </div>

        {/* Cards List Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(!userProfile.socialCards || userProfile.socialCards.length === 0) ? (
            <div className="col-span-full text-center py-8 text-neutral-600 text-xs italic bg-neutral-950/20 rounded-2xl border border-neutral-850/60">
              No custom social platform cards created yet. Fill the builder above to instantiate one!
            </div>
          ) : (
            userProfile.socialCards.map(card => {
              // Find corresponding icon / colors based on platform string
              const platformLower = card.platform.toLowerCase();
              let platformColor = 'from-neutral-800 to-neutral-950 hover:border-neutral-700 text-neutral-200';
              let badgeColor = 'bg-neutral-950 text-neutral-400 border-neutral-800';
              
              if (platformLower.includes('tiktok')) {
                platformColor = 'from-neutral-900 via-neutral-950 to-pink-950/20 hover:border-pink-500/40 text-neutral-100';
                badgeColor = 'bg-pink-950/40 text-pink-400 border-pink-900/30';
              } else if (platformLower.includes('github')) {
                platformColor = 'from-neutral-900 via-neutral-950 to-indigo-950/20 hover:border-indigo-500/40 text-neutral-100';
                badgeColor = 'bg-indigo-950/40 text-indigo-400 border-indigo-900/30';
              } else if (platformLower.includes('linkedin')) {
                platformColor = 'from-neutral-900 via-neutral-950 to-blue-950/20 hover:border-blue-500/40 text-neutral-100';
                badgeColor = 'bg-blue-950/40 text-blue-400 border-blue-900/30';
              } else if (platformLower.includes('youtube')) {
                platformColor = 'from-neutral-900 via-neutral-950 to-red-950/20 hover:border-red-500/40 text-neutral-100';
                badgeColor = 'bg-red-950/40 text-red-400 border-red-900/30';
              } else if (platformLower.includes('twitter') || platformLower.includes(' x ') || platformLower === 'x') {
                platformColor = 'from-neutral-900 via-neutral-950 to-slate-900 hover:border-sky-500/40 text-neutral-100';
                badgeColor = 'bg-slate-950 text-neutral-300 border-neutral-800';
              } else if (platformLower.includes('instagram')) {
                platformColor = 'from-neutral-900 via-neutral-950 to-fuchsia-950/20 hover:border-fuchsia-500/40 text-neutral-100';
                badgeColor = 'bg-fuchsia-950/40 text-fuchsia-400 border-fuchsia-900/30';
              } else if (platformLower.includes('substack')) {
                platformColor = 'from-neutral-900 via-neutral-950 to-amber-950/20 hover:border-amber-500/40 text-neutral-100';
                badgeColor = 'bg-amber-950/40 text-amber-400 border-amber-900/30';
              }

              return (
                <div 
                  key={card.id}
                  className={`group/card bg-gradient-to-br ${platformColor} border border-neutral-850 p-4 rounded-2xl flex flex-col justify-between transition-all hover:shadow-lg relative overflow-hidden h-[120px]`}
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-neutral-100/[0.02] rounded-full blur-xl pointer-events-none -mr-4 -mt-4 group-hover/card:bg-indigo-500/[0.05] transition-all"></div>
                  
                  <div className="flex justify-between items-start">
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-widest border px-2 py-0.5 rounded-full ${badgeColor}`}>
                      {card.platform}
                    </span>
                    
                    <button
                      onClick={() => handleRemoveSocialCard(card.id)}
                      className="opacity-0 group-hover/card:opacity-100 text-neutral-500 hover:text-red-400 p-1 rounded-lg transition-all cursor-pointer z-10"
                      title={`Delete ${card.platform} Card`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="space-y-1 mt-2">
                    <div className="text-[10px] text-neutral-500 truncate font-mono select-all">
                      {card.url.replace(/^https?:\/\/(www\.)?/, '')}
                    </div>
                    <a 
                      href={card.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors group/link"
                    >
                      Launch Profile
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2.5. Tailored Context Cards ("What do you do?") & AI Prompt Refiner */}
      <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-800/65 pb-3">
          <div>
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Contextual Pitch Engine ("What do you do?")
            </h3>
            <p className="text-[10px] text-neutral-500 mt-1">
              Maintain dynamic, tailored answers to "What do you do?" categorized by conversation context, and use the AI prompt to optimize them.
            </p>
          </div>
          <button
            onClick={() => {
              setIsCreatingCard(true);
              setEditingCardId(null);
              setNewCardAnswer('');
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all active:scale-95 flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add Card
          </button>
        </div>

        {/* Create/Edit Card Pane */}
        {isCreatingCard && (
          <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-2xl space-y-3.5 animate-fade-in">
            <div className="flex justify-between items-center">
              <h4 className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                {editingCardId ? 'Edit Context Card' : 'Create Context Card'}
              </h4>
              <button 
                onClick={() => setIsCreatingCard(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-1.5">Context Category</label>
                <select
                  value={newCardContext}
                  onChange={e => setNewCardContext(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
                >
                  {STANDARD_CONTEXTS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-1.5">Custom Context (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Speed networking, family gatherings..."
                  value={STANDARD_CONTEXTS.includes(newCardContext) ? '' : newCardContext}
                  onChange={e => {
                    if (e.target.value.trim()) {
                      setNewCardContext(e.target.value);
                    }
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 placeholder:text-neutral-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-1.5">Tailored Pitch Answer</label>
              <textarea
                rows={3}
                placeholder="Paste your tailored version of what you do here..."
                value={newCardAnswer}
                onChange={e => setNewCardAnswer(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 placeholder:text-neutral-600"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={handleSaveContextCard}
                disabled={!newCardAnswer.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all"
              >
                {editingCardId ? 'Update Card' : 'Save Pitch Card'}
              </button>
              <button
                onClick={() => {
                  setIsCreatingCard(false);
                  setEditingCardId(null);
                }}
                className="bg-neutral-850 hover:bg-neutral-800 text-neutral-400 font-semibold text-xs px-3 py-1.5 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Context Cards Section */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest font-mono">Saved Context Cards</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
              {(!userProfile.whatIDoCards || userProfile.whatIDoCards.length === 0) ? (
                <div className="sm:col-span-2 text-center py-10 bg-neutral-950/40 border border-neutral-850 rounded-2xl text-neutral-600 text-xs italic">
                  No tailored pitch cards saved yet. Use the tool on the right to refine one!
                </div>
              ) : (
                (userProfile.whatIDoCards || []).map(card => (
                  <div 
                    key={card.id}
                    className="bg-neutral-950 border border-neutral-850 p-4 rounded-2xl flex flex-col justify-between group hover:border-indigo-900/35 transition-all shadow-md relative"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-indigo-950/40 text-indigo-400 border border-indigo-900/30 px-2 py-0.5 rounded-md truncate max-w-[170px]" title={card.context}>
                          {card.context}
                        </span>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEditContextCard(card)}
                            className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-white p-1 rounded-md transition-all cursor-pointer"
                            title="Edit Card"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleRemoveContextCard(card.id)}
                            className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 p-1 rounded-md transition-all cursor-pointer"
                            title="Delete Card"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-200 leading-relaxed font-sans min-h-[48px] line-clamp-4 select-text">
                        "{card.answer}"
                      </p>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-neutral-900 flex justify-end">
                      <button
                        onClick={() => handleCopyCard(card.id, card.answer)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 active:scale-95 ${
                          copiedCardId === card.id 
                            ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' 
                            : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:text-white hover:border-neutral-700'
                        }`}
                      >
                        {copiedCardId === card.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 text-neutral-500 group-hover:text-neutral-300" /> Copy Answer
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Prompt Refiner Section */}
          <div className="bg-neutral-950/40 border border-neutral-850 rounded-2xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> AI Pitch Refinement Tool
              </h4>
              <p className="text-[10px] text-neutral-500 leading-relaxed">
                Copy this pre-written prompt into ChatGPT or another LLM, provide your circumstances, and receive an optimized pitch answer tailored specifically for your target audience.
              </p>

              {isEditingPrompt ? (
                <div className="space-y-2 pt-1">
                  <textarea
                    rows={6}
                    value={editedPrompt}
                    onChange={e => setEditedPrompt(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl p-2.5 text-xs outline-none focus:border-indigo-500"
                  />
                  <div className="flex gap-1.5 justify-end">
                    <button
                      onClick={handleSavePromptTemplate}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-2.5 py-1 rounded"
                    >
                      Save Template
                    </button>
                    <button
                      onClick={() => {
                        setEditedPrompt(userProfile.pitchRefiningPrompt || '');
                        setIsEditingPrompt(false);
                      }}
                      className="bg-neutral-850 text-neutral-400 text-[10px] px-2.5 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-900/60 border border-neutral-850 rounded-xl p-3 text-[10.5px] text-neutral-400 leading-relaxed font-mono relative group select-text">
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setIsEditingPrompt(true)}
                      className="text-[9px] font-mono text-neutral-500 hover:text-indigo-400"
                    >
                      [Edit template]
                    </button>
                  </div>
                  "{userProfile.pitchRefiningPrompt || 'Act as a master brand strategist and copywriter. Given my background as a [My Title] with core strengths in [My Strengths], optimize a brief, highly compelling answer to the question \"What do you do?\" that is tailored specifically for a [Target Audience] context. Keep it engaging, concise (1-2 sentences), conversational, and focused on the high-value problems I solve.'}"
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-[9px] text-neutral-500 font-sans italic">
                * Automatically substitutes your Title ({userProfile.title || 'none'}) & Core Strengths into the prompt for perfect custom copywriting.
              </div>

              <button
                onClick={handleCopyPrompt}
                className={`w-full font-bold text-xs py-2.5 rounded-xl border transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                  copiedPrompt 
                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent shadow-lg shadow-indigo-500/10'
                }`}
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Custom Prompt!
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-200" /> Copy AI Prompt Template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Growth Areas (Not Strong Parts) & Network Match Recommendations */}
      <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800/60 pb-3">
          <div>
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Network className="w-4 h-4 text-violet-400" /> Delegate & Leverage Network
            </h3>
            <p className="text-[10px] text-neutral-500 mt-1">
              List the skills or operations where you are weak, so the Rolodox can match nodes from your Directory to fill the gaps!
            </p>
          </div>
          <span className="text-[10px] font-mono text-violet-400 bg-violet-950/40 border border-violet-900/40 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
            Network Alignment
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          {/* Input & List of Not Strong Parts */}
          <div className="space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest font-mono">My Not-Strong Parts (Areas to Delegate)</h4>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 no-scrollbar">
                {userProfile.growthAreas.length === 0 ? (
                  <div className="text-center py-10 text-neutral-600 text-xs italic bg-neutral-950/50 rounded-2xl border border-neutral-850">
                    No delegation areas registered yet. Add some to reveal recommended nodes!
                  </div>
                ) : (
                  userProfile.growthAreas.map((areaRaw, idx) => {
                    const area = normalizeGrowthArea(areaRaw);
                    const linkedLinks = area.links || [];
                    
                    return (
                      <div key={idx} className="bg-neutral-950 border border-neutral-850 p-3.5 rounded-2xl space-y-3 hover:border-violet-900/30 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex gap-2 min-w-0">
                            <span className="text-violet-400 text-xs mt-0.5">⚙</span>
                            <span className="text-xs font-bold text-neutral-200 leading-snug">{area.name}</span>
                          </div>
                          <button 
                            onClick={() => handleRemoveGrowthArea(idx)}
                            className="text-neutral-600 hover:text-red-400 p-1 rounded-lg transition-all"
                            title="Remove Area"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        {/* Display linked contacts for this growth area */}
                        <div className="space-y-2 pt-2 border-t border-neutral-900/60">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                              Linked Support Nodes ({linkedLinks.length})
                            </span>
                            <button
                              onClick={() => {
                                setActiveLinkingAreaIndex(activeLinkingAreaIndex === idx ? null : idx);
                                setAreaSearchQuery('');
                              }}
                              className="text-[9px] text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-0.5"
                            >
                              {activeLinkingAreaIndex === idx ? 'Close' : '+ Link Profile'}
                            </button>
                          </div>
                          
                          {/* Search / selector dropdown for contacts to link */}
                          {activeLinkingAreaIndex === idx && (
                            <div className="bg-neutral-900 border border-neutral-800 p-2 rounded-xl space-y-2 animate-slide-up mt-1">
                              <div className="relative">
                                <Search className="w-3 h-3 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                  type="text"
                                  placeholder="Search node to leverage..."
                                  value={areaSearchQuery}
                                  onChange={e => setAreaSearchQuery(e.target.value)}
                                  className="w-full bg-neutral-950 border border-neutral-850 text-neutral-200 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:border-violet-500"
                                />
                              </div>
                              
                              <div className="max-h-[140px] overflow-y-auto space-y-1 no-scrollbar">
                                {contacts
                                  .filter(c => !linkedLinks.some(l => l.contactId === c.id))
                                  .filter(c => c.name.toLowerCase().includes(areaSearchQuery.toLowerCase()))
                                  .map(c => (
                                    <div
                                      key={c.id}
                                      className="bg-neutral-950/40 border border-neutral-850 p-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-between gap-2"
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        {c.avatar ? (
                                          <img src={c.avatar} alt={c.name} className="w-4 h-4 rounded-md object-cover" />
                                        ) : (
                                          <div className="w-4 h-4 bg-neutral-800 rounded-md flex items-center justify-center text-[8px] text-neutral-400">
                                            {c.name[0]}
                                          </div>
                                        )}
                                        <span className="truncate text-neutral-300">{c.name}</span>
                                      </div>
                                      
                                      <div className="flex gap-1 shrink-0">
                                        <button
                                          onClick={() => handleLinkContactToGrowthArea(idx, c.id, 'help')}
                                          className="bg-indigo-950/40 text-indigo-400 hover:bg-indigo-900 hover:text-white border border-indigo-900/30 px-1.5 py-0.5 rounded text-[9px] font-bold"
                                        >
                                          Ask Help
                                        </button>
                                        <button
                                          onClick={() => handleLinkContactToGrowthArea(idx, c.id, 'delegate')}
                                          className="bg-violet-950/40 text-violet-400 hover:bg-violet-900 hover:text-white border border-violet-900/30 px-1.5 py-0.5 rounded text-[9px] font-bold"
                                        >
                                          Delegate
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                {contacts.filter(c => !linkedLinks.some(l => l.contactId === c.id)).filter(c => c.name.toLowerCase().includes(areaSearchQuery.toLowerCase())).length === 0 && (
                                  <div className="text-center py-2 text-[10px] text-neutral-600 italic">
                                    No other contacts to link.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* List of currently linked contacts with help/delegate role toggles */}
                          {linkedLinks.length === 0 ? (
                            <div className="text-[10px] text-neutral-600 italic">
                              No support nodes linked yet. Add experts or mentors!
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {linkedLinks.map(link => {
                                const contact = contacts.find(c => c.id === link.contactId);
                                if (!contact) return null;
                                return (
                                  <div 
                                    key={link.contactId}
                                    className="flex items-center justify-between bg-neutral-900/40 border border-neutral-850 px-2 py-1 rounded-xl text-xs gap-2"
                                  >
                                    <div 
                                      className="flex items-center gap-1.5 min-w-0 cursor-pointer hover:opacity-80"
                                      onClick={() => navigateToContact(contact.id)}
                                    >
                                      {contact.avatar ? (
                                        <img src={contact.avatar} alt={contact.name} className="w-4 h-4 rounded-md object-cover" />
                                      ) : (
                                        <div className="w-4 h-4 bg-neutral-800 rounded-md flex items-center justify-center text-[8px] text-neutral-400">
                                          {contact.name[0]}
                                        </div>
                                      )}
                                      <span className="font-semibold text-neutral-300 truncate">{contact.name}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {/* Help / Delegate Selector toggle button */}
                                      <button
                                        onClick={() => handleUpdateLinkTypeInGrowthArea(idx, contact.id, link.type === 'help' ? 'delegate' : 'help')}
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all ${
                                          link.type === 'help'
                                            ? 'bg-indigo-950/40 text-indigo-400 border-indigo-900/30 hover:bg-indigo-900/20'
                                            : 'bg-violet-950/40 text-violet-400 border-violet-900/30 hover:bg-violet-900/20'
                                        }`}
                                        title="Click to toggle role"
                                      >
                                        {link.type === 'help' ? '🙋 Ask Help' : '🤝 Delegate'}
                                      </button>
                                      
                                      <button
                                        onClick={() => handleUnlinkContactFromGrowthArea(idx, contact.id)}
                                        className="text-neutral-500 hover:text-red-400 p-0.5 rounded transition-colors"
                                        title="Unlink Contact"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <input 
                type="text"
                placeholder="e.g. Enterprise Legal drafting, UI Design..."
                value={newGrowthArea}
                onChange={e => setNewGrowthArea(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddGrowthArea()}
                className="flex-1 bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder:text-neutral-600 rounded-xl px-3 py-2 text-xs outline-none focus:border-violet-500"
              />
              <button
                onClick={handleAddGrowthArea}
                className="bg-neutral-800 hover:bg-violet-900 hover:text-white text-neutral-300 p-2 rounded-xl transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dynamic Correlation Recommendation Panel */}
          <div className="bg-neutral-950/50 rounded-2xl p-4 border border-neutral-850 space-y-3.5">
            <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" /> Relational Leverage Engine
            </h4>
            
            {userProfile.growthAreas.length === 0 ? (
              <div className="text-neutral-600 text-[11px] leading-relaxed italic py-8 text-center">
                List areas of growth/weakness on the left, and the engine will query your database of contacts to recommend perfect candidates for delegation!
              </div>
            ) : (
              <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1 no-scrollbar">
                {userProfile.growthAreas.map((area, idx) => {
                  const areaObj = normalizeGrowthArea(area);
                  const recommendations = findMatchesForGrowthArea(areaObj);
                  return (
                    <div key={idx} className="space-y-1.5 border-b border-neutral-850 last:border-0 pb-3 last:pb-0">
                      <div className="text-[10px] text-neutral-400 font-mono flex items-center justify-between">
                        <span className="truncate max-w-[170px]">Gaps: <strong className="text-neutral-200 font-sans">{areaObj.name}</strong></span>
                        <span className="text-[9px] bg-violet-950/40 text-violet-400 px-1.5 py-0.2 rounded font-mono font-bold scale-90">{recommendations.length} matched</span>
                      </div>
                      
                      {recommendations.length === 0 ? (
                        <div className="text-[10px] text-neutral-600 italic pl-2.5">
                          No matching expert found in Directory. Try adding tags or skills to contacts!
                        </div>
                      ) : (
                        <div className="space-y-1 pl-1">
                          {recommendations.map(contact => (
                            <div 
                              key={contact.id}
                              onClick={() => navigateToContact(contact.id)}
                              className="flex items-center justify-between bg-neutral-900/60 hover:bg-indigo-950/20 border border-neutral-850 hover:border-indigo-500/30 rounded-lg px-2 py-1.5 cursor-pointer transition-all group"
                            >
                              <div className="min-w-0 flex-1 flex items-center gap-2">
                                {contact.avatar ? (
                                  <img src={contact.avatar} alt={contact.name} className="w-5 h-5 rounded-md object-cover" />
                                ) : (
                                  <div className="w-5 h-5 bg-neutral-800 rounded-md flex items-center justify-center text-[9px] font-bold text-neutral-400">
                                    {contact.name[0]}
                                  </div>
                                )}
                                <div className="truncate">
                                  <div className="text-[11px] font-bold text-neutral-200 group-hover:text-indigo-400 transition-colors truncate">
                                    {contact.name}
                                  </div>
                                  <div className="text-[9px] text-neutral-400 truncate scale-95 origin-left">
                                    {contact.title}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-[8px] bg-neutral-800 group-hover:bg-indigo-900/40 text-neutral-400 group-hover:text-indigo-300 font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 ml-1.5">
                                Delegate <ArrowUpRight className="w-2 h-2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Life Goals & Network Alignment */}
      <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800/60 pb-3">
          <div>
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-400" /> Life Goals & Network Sponsors
            </h3>
            <p className="text-[10px] text-neutral-500 mt-1">
              Document your major personal/business checkpoints and align people in your network who can help facilitate them.
            </p>
          </div>
          
          <button 
            onClick={() => setIsCreatingGoal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all active:scale-95 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Goal
          </button>
        </div>

        {/* Create goal sub-pane */}
        {isCreatingGoal && (
          <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-2xl space-y-3 animate-fade-in relative">
            <h4 className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider font-mono">Create New Life Goal</h4>
            
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono">Goal Statement</label>
              <input 
                type="text" 
                placeholder="e.g. Raise first $250k seed investment..."
                value={newGoalText}
                onChange={e => setNewGoalText(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-1">Category</label>
                <select 
                  value={newGoalCategory}
                  onChange={e => setNewGoalCategory(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
                >
                  <option value="Personal">Personal</option>
                  <option value="Business">Business</option>
                  <option value="Career">Career</option>
                  <option value="Health">Health</option>
                  <option value="Financial">Financial</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-1">Target Date</label>
                <input 
                  type="date" 
                  value={newGoalTargetDate}
                  onChange={e => setNewGoalTargetDate(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1.5">
              <button 
                onClick={handleAddLifeGoal}
                disabled={!newGoalText.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
              >
                Add Goal
              </button>
              <button 
                onClick={() => setIsCreatingGoal(false)}
                className="bg-neutral-800 hover:bg-neutral-750 text-neutral-400 font-semibold text-xs px-3 py-1.5 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Goals List */}
        <div className="space-y-4">
          {userProfile.lifeGoals.length === 0 ? (
            <div className="text-center py-8 text-neutral-600 text-xs italic">
              No life goals listed yet. Set your target milestones!
            </div>
          ) : (
            userProfile.lifeGoals.map(goal => (
              <div 
                key={goal.id} 
                className={`bg-neutral-950/60 rounded-2xl border p-4 transition-all ${
                  goal.status === 'achieved' 
                    ? 'border-neutral-850/40 opacity-75' 
                    : 'border-neutral-850 hover:border-neutral-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-2.5 min-w-0">
                    <button 
                      onClick={() => handleToggleGoalStatus(goal.id)}
                      className="mt-0.5 shrink-0 text-neutral-500 hover:text-indigo-400 transition-colors"
                      title={goal.status === 'achieved' ? "Mark active" : "Mark achieved"}
                    >
                      <CheckCircle className={`w-5 h-5 ${goal.status === 'achieved' ? 'text-indigo-500 fill-indigo-500/10' : 'text-neutral-700'}`} />
                    </button>
                    
                    <div className="min-w-0">
                      <h4 className={`text-sm font-bold leading-snug text-neutral-100 ${goal.status === 'achieved' ? 'line-through text-neutral-500' : ''}`}>
                        {goal.goal}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[9px] font-mono text-neutral-500">
                        <span className="bg-rose-950/20 text-rose-400 px-2 py-0.2 rounded border border-rose-900/30 uppercase font-bold font-mono">
                          {goal.category || 'Life'}
                        </span>
                        {goal.targetDate && (
                          <span>Target: <b className="text-neutral-400">{goal.targetDate}</b></span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleRemoveLifeGoal(goal.id)}
                    className="text-neutral-700 hover:text-red-400 p-1 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Linked contacts list (Helpers/Sponsors) */}
                <div className="mt-4 pt-3.5 border-t border-neutral-900/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-1">
                      👥 Sponsors & Helpers ({goal.linkedContactIds.length})
                    </span>
                    
                    <button
                      onClick={() => {
                        setActiveLinkingGoalId(activeLinkingGoalId === goal.id ? null : goal.id);
                        setHelperSearchQuery('');
                      }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5"
                    >
                      {activeLinkingGoalId === goal.id ? 'Close' : '+ Link Contact'}
                    </button>
                  </div>

                  {/* Contact selector search panel */}
                  {activeLinkingGoalId === goal.id && (
                    <div className="bg-neutral-900 border border-neutral-800 p-2 rounded-xl space-y-2 animate-slide-up">
                      <div className="relative">
                        <Search className="w-3 h-3 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search contact to link..."
                          value={helperSearchQuery}
                          onChange={e => setHelperSearchQuery(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                        />
                      </div>
                      
                      <div className="max-h-[140px] overflow-y-auto space-y-1 no-scrollbar">
                        {contacts
                          .filter(c => !goal.linkedContactIds.includes(c.id))
                          .filter(c => c.name.toLowerCase().includes(helperSearchQuery.toLowerCase()))
                          .map(c => (
                            <button
                              key={c.id}
                              onClick={() => handleLinkContactToGoal(goal.id, c.id)}
                              className="w-full text-left bg-neutral-950/40 hover:bg-indigo-950/20 border border-neutral-850 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2"
                            >
                              {c.avatar ? (
                                <img src={c.avatar} alt={c.name} className="w-4 h-4 rounded-md object-cover" />
                              ) : (
                                <div className="w-4 h-4 bg-neutral-800 rounded-md flex items-center justify-center text-[8px] text-neutral-400">
                                  {c.name[0]}
                                </div>
                              )}
                              <span>{c.name}</span>
                            </button>
                          ))}
                        {contacts.filter(c => !goal.linkedContactIds.includes(c.id)).filter(c => c.name.toLowerCase().includes(helperSearchQuery.toLowerCase())).length === 0 && (
                          <div className="text-center py-2 text-[10px] text-neutral-600 italic">
                            No other contacts to link.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {goal.linkedContactIds.length === 0 ? (
                    <div className="text-[10px] text-neutral-600 italic flex items-center gap-1.5 py-1.5 bg-neutral-950/20 border border-neutral-900 rounded-xl px-2.5">
                      <Info className="w-3.5 h-3.5 text-neutral-600" />
                      No contacts linked to this goal. Link directory nodes who can provide leverage!
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {goal.linkedContactIds.map(id => {
                        const person = contacts.find(c => c.id === id);
                        if (!person) return null;
                        return (
                          <div 
                            key={id}
                            className="inline-flex items-center gap-1.5 bg-indigo-950/40 hover:bg-indigo-950/80 border border-indigo-900/30 px-2.5 py-1 rounded-full text-xs font-semibold text-neutral-200 transition-all cursor-pointer group"
                          >
                            <span 
                              onClick={() => navigateToContact(id)}
                              className="group-hover:text-indigo-300 transition-colors"
                            >
                              {person.name}
                            </span>
                            <button
                              onClick={() => handleUnlinkContactFromGoal(goal.id, id)}
                              className="text-neutral-500 hover:text-rose-400 transition-colors rounded p-0.5"
                              title="Unlink"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
