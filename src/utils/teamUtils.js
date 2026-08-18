export const makeTeamCode = (name = '') => {
  const clean = String(name || '').trim();
  if (!clean) return 'TM';
  // If team name is up to 4 characters (e.g. CSK, GT, LSG, MI, SRH, DC, PBKS, RR, RCB, KKR, IND, AUS), DO NOT shorten it!
  if (clean.length <= 4) return clean.toUpperCase();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return words.slice(0, 3).map(word => word[0]).join('').toUpperCase();
  return clean.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase() || 'TM';
};

export const getTeamShortCode = (team, fallbackName = '') => {
  const savedCode = String(team?.code || '').trim();
  return savedCode || makeTeamCode(team?.name || fallbackName);
};

export const DEFAULT_TEAM_1_LOGO_URL = 'https://res.cloudinary.com/aov9a8tl/image/upload/v1786749090/cricflow_default_team_1.png';
export const DEFAULT_TEAM_2_LOGO_URL = 'https://res.cloudinary.com/aov9a8tl/image/upload/v1786749091/cricflow_default_team_2.png';
export const DEFAULT_APP_LOGO_URL = 'https://res.cloudinary.com/aov9a8tl/image/upload/v1786749092/cricflow_app_logo.png';

// 10 Cloudinary Hosted High-Res Team Logos
export const PRESET_TEAM_LOGOS = [
  { id: 'csk', label: 'CSK', name: 'CSK', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085714/cricflow_team_logos/csk.png', color: '#FACC15' },
  { id: 'gt', label: 'GT', name: 'GT', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085716/cricflow_team_logos/gt.jpg', color: '#1E293B' },
  { id: 'lsg', label: 'LSG', name: 'LSG', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085718/cricflow_team_logos/lsg.jpg', color: '#0284C7' },
  { id: 'mi', label: 'MI', name: 'MI', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085718/cricflow_team_logos/mi.jpg', color: '#0284C7' },
  { id: 'srh', label: 'SRH', name: 'SRH', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085721/cricflow_team_logos/srh.jpg', color: '#F97316' },
  { id: 'dc', label: 'DC', name: 'DC', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085715/cricflow_team_logos/dc.jpg', color: '#1E3A8A' },
  { id: 'pbks', label: 'PBKS', name: 'PBKS', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085719/cricflow_team_logos/pbks.jpg', color: '#DC2626' },
  { id: 'rcb', label: 'RCB', name: 'RCB', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085720/cricflow_team_logos/rcb.jpg', color: '#B45309' },
  { id: 'rr', label: 'RR', name: 'RR', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085720/cricflow_team_logos/rr.jpg', color: '#EC4899' },
  { id: 'kkr', label: 'KKR', name: 'KKR', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085717/cricflow_team_logos/kkr.jpg', color: '#581C87' }
];

export const getTeamLogoSource = (team) => {
  if (team?.logoUri) return { uri: team.logoUri };
  if (team?.logoUrl) return { uri: team.logoUrl };
  const rawKey = String(team?.logoKey || '').toLowerCase().trim();
  const rawName = String(team?.name || '').toLowerCase().trim();
  const key = rawKey || rawName;

  // Direct ID or Label match from Cloudinary Presets
  const foundPreset = PRESET_TEAM_LOGOS.find(p => p.id === key || p.label.toLowerCase() === key || p.name.toLowerCase() === key);
  if (foundPreset) return { uri: foundPreset.url };

  // Name keyword matching to Cloudinary URLs
  if (key.includes('csk') || key.includes('chennai') || key.includes('super king')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085714/cricflow_team_logos/csk.png' };
  if (key.includes('rcb') || key.includes('bangalore') || key.includes('bengaluru') || key.includes('challenger')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085720/cricflow_team_logos/rcb.jpg' };
  if (key.includes('mi') || key.includes('mumbai') || key.includes('indian')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085718/cricflow_team_logos/mi.jpg' };
  if (key.includes('gt') || key.includes('gujarat') || key.includes('titan')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085716/cricflow_team_logos/gt.jpg' };
  if (key.includes('lsg') || key.includes('lucknow') || key.includes('giant')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085718/cricflow_team_logos/lsg.jpg' };
  if (key.includes('srh') || key.includes('hyderabad') || key.includes('sunriser')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085721/cricflow_team_logos/srh.jpg' };
  if (key.includes('dc') || key.includes('delhi') || key.includes('capital')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085715/cricflow_team_logos/dc.jpg' };
  if (key.includes('pbks') || key.includes('punjab') || key.includes('king')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085719/cricflow_team_logos/pbks.jpg' };
  if (key.includes('rr') || key.includes('rajasthan') || key.includes('royal')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085720/cricflow_team_logos/rr.jpg' };
  if (key.includes('kkr') || key.includes('kolkata') || key.includes('knight')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085717/cricflow_team_logos/kkr.jpg' };

  if (key === 'default-team-1' || key === 'logo_team_1') return require('../../assets/default_team_1.png');
  if (key === 'default-team-2' || key === 'logo_team_2') return require('../../assets/default_team_2.png');
  return require('../../assets/default_team_1.png');
};

export const getScorePartsFromText = (scoreText = '') => {
  const raw = String(scoreText || '').trim();
  if (!raw) return { score: '', overs: '' };

  const match = raw.match(/^([0-9]+\s*-\s*[0-9]+)\s*(?:\(([^)]+)\))?$/);
  if (match) {
    const score = match[1].replace(/\s+/g, '');
    const oversStr = (match[2] || '').trim();
    const oversMatch = oversStr.match(/([0-9]+(?:\.[0-9]+)?)\s*ov(?:s)?/i) || oversStr.match(/([0-9]+(?:\.[0-9]+)?)/);
    const ovNum = oversMatch ? oversMatch[1] : oversStr;
    const overs = ovNum ? (ovNum.toLowerCase().includes('ov') ? `(${ovNum})` : `(${ovNum} ov)`) : '';
    return { score, overs };
  }

  const directScoreMatch = raw.match(/^([0-9]+\s*-\s*[0-9]+)/);
  if (directScoreMatch) {
    const score = directScoreMatch[1].replace(/\s+/g, '');
    const oversMatch = raw.match(/([0-9]+\.[0-9]+)/);
    const overs = oversMatch ? `(${oversMatch[1]} ov)` : '';
    return { score, overs };
  }

  return { score: raw, overs: '' };
};
