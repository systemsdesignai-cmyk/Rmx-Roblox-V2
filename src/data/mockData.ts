import { Contact, Event, Strategy } from '../types';

export const initialContacts: Contact[] = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    title: 'Product Manager at TechFlow',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    socials: { whatsapp: '+1234567890', linkedin: 'sarah-j' },
    source: 'Tech Startup Mixer 2026',
    eventId: 1,
    tags: ['Product', 'SaaS', 'Mentor'],
    skills: [{ id: 1, name: 'Product Management', leverage: 'VP level, knows enterprise sales cycles deeply' }],
    projects: ['Q3 Fundraising'],
    problems: ['Struggles with aligning remote engineering teams', 'Finding good UX designers'],
    desires: ['Wants to transition to VC in 2 years', 'Looking for indie hacker projects to advise'],
    commonalities: ['Both love rock climbing', 'Both reading "The Lean Startup"'],
    valueIGive: 'Can introduce her to my freelance UX designer network.',
    valueTheyGive: 'Insight into enterprise SaaS sales cycles.',
    thingsToMention: ['Ask how the new remote policy rollout went', 'Mention the climbing gym opening downtown'],
    questionsToAsk: ['What is the biggest bottleneck in your current sprint?'],
    whoTheyKnow: ['Mark (CTO at BuildKite)', 'Lisa (Angel Investor)'],
    conversations: [
      { id: 101, date: '2026-07-10', notes: 'Met by the bar. Chatted about remote work. She seems stressed but ambitious.' },
      { id: 102, date: '2026-07-12', notes: 'Follow-up call. Agreed to swap contacts for UX designers.' }
    ],
    transcriptions: [
      { id: 201, date: '2026-07-10', tag: 'Direct Voice Note', content: 'Hey Sarah, it was great meeting you today. I really liked your thoughts on SaaS trends...' }
    ]
  }
];

export const initialEvents: Event[] = [
  {
    id: 1,
    name: 'Tech Startup Mixer 2026',
    date: '2026-07-10',
    location: 'Downtown Hub',
    gpsLink: 'https://maps.google.com/',
    photo: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
    category: 'Technology',
    projects: [],
    goals: 'Find a technical co-founder, learn about current SaaS trends.',
    targetAudience: 'Software Engineers, Product Managers, Angel Investors',
    specificPeople: [],
    status: 'past'
  },
  {
    id: 2,
    name: 'Fintech Founders Breakfast',
    date: '2026-08-01',
    location: 'Blue Bottle Coffee',
    gpsLink: '',
    photo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800',
    category: 'Finances',
    projects: ['Q3 Fundraising'],
    goals: 'Understand payment gateway regulations.',
    targetAudience: 'Fintech founders, Compliance experts',
    specificPeople: ['David (Stripe VP)', 'Sarah (Angel Investor)'],
    status: 'upcoming'
  }
];

export const initialStrategies: Strategy[] = [
  {
    id: 1,
    goal: 'Meet VP of Engineering at Stripe',
    target: 'David Wallace',
    chain: [
      { id: 1001, person: 'Me', role: 'Origin' },
      { id: 1002, person: 'Sarah Jenkins', role: 'Worked with David at previous company' },
      { id: 1003, person: 'David Wallace', role: 'Target' }
    ],
    status: 'In Progress'
  }
];

export const initialUserProfile = {
  name: 'Alex Mercer',
  title: 'Lead Systems Architect & Founder',
  bio: 'Building resilient distributed networks. Passionate about linking human talent with impactful opportunities. Relentless problem solver.',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  valueToGive: [
    'Distributed Architecture Reviews & Performance Audits',
    'Introduction to early-stage SaaS startup mentors',
    'Go-to-market scaling playbooks & engineering setup'
  ],
  strengths: [
    'High-performance backend engineering (Rust, Go, Node.js)',
    'Strategic node-mapping & referral optimization',
    'Technical leadership & vision development'
  ],
  growthAreas: [
    'Product UI/UX Designing & Visual Polish',
    'Enterprise Legal & Compliance advisory',
    'Social Media Marketing & Brand awareness'
  ],
  lifeGoals: [
    {
      id: 1,
      goal: 'Secure Seed Funding for Relational Engine Startup',
      category: 'Business',
      targetDate: '2026-11-01',
      linkedContactIds: [1],
      status: 'active'
    },
    {
      id: 2,
      goal: 'Transition into venture advisory or venture capital',
      category: 'Career',
      targetDate: '2027-06-30',
      linkedContactIds: [],
      status: 'active'
    }
  ],
  whatIDoCards: [
    {
      id: 'professional',
      context: 'Professional or work-related',
      answer: 'I architect highly scalable systems and data pipes for fast-growing startups, ensuring they do not crash when scaling from zero to millions of daily active nodes.'
    },
    {
      id: 'hobbies',
      context: 'Hobbies',
      answer: 'I am an ultra-marathon running enthusiast who applies systems engineering principles to human endurance, recovery cycles, and metabolic pacing.'
    },
    {
      id: 'personal_projects',
      context: 'Personal projects',
      answer: 'I am currently designing a visual graph database tool that maps relational social capital in real-time to find high-leverage introduction nodes.'
    }
  ],
  pitchRefiningPrompt: 'Act as a master brand strategist and copywriter. Given my background as a [My Title] with core strengths in [My Strengths], optimize a brief, highly compelling answer to the question "What do you do?" that is tailored specifically for a [Target Audience] context. Keep it engaging, concise (1-2 sentences), conversational, and focused on the high-value problems I solve.',
  socialCards: [
    { id: '1', platform: 'GitHub', url: 'https://github.com' },
    { id: '2', platform: 'LinkedIn', url: 'https://linkedin.com' }
  ]
};
