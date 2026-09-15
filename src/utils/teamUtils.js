export const makeTeamCode = (name = '') => {
  const clean = String(name || '').trim();
  if (!clean) return 'TM';
  if (isPlaceholderTeam(clean)) return 'TBC';
  // Strip all punctuation, parentheses, brackets, special chars
  const sanitized = clean.replace(/[()[\]{}.,:;!?'"`~@#$%^&*+=|\\/<>_-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!sanitized) return 'TM';
  // If team name is up to 4 characters (e.g. CSK, GT, LSG, MI, SRH, DC, PBKS, RR, RCB, KKR, IND, AUS, TBC), DO NOT shorten it!
  if (sanitized.length <= 4) return sanitized.toUpperCase();
  const words = sanitized.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return words.slice(0, 3).map(word => word[0]).join('').toUpperCase();
  return sanitized.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase() || 'TM';
};

export const getTeamShortCode = (team, fallbackName = '') => {
  if (isPlaceholderTeam(team)) return 'TBC';
  const savedCode = String(team?.shortName || team?.code || '').trim();
  if (savedCode) {
    if (isPlaceholderTeam(savedCode)) return 'TBC';
    return savedCode;
  }
  return makeTeamCode(typeof team === 'string' ? team : (team?.name || fallbackName));
};

export const DEFAULT_TEAM_1_LOGO_URL = 'https://res.cloudinary.com/aov9a8tl/image/upload/v1786749090/cricflow_default_team_1.png';
export const DEFAULT_TEAM_2_LOGO_URL = 'https://res.cloudinary.com/aov9a8tl/image/upload/v1786749091/cricflow_default_team_2.png';
export const DEFAULT_APP_LOGO_URL = 'https://res.cloudinary.com/aov9a8tl/image/upload/v1786749092/cricflow_app_logo.png';

// 25+ Cloudinary Hosted High-Res Team Logos
export const PRESET_TEAM_LOGOS = [
  // Sadokan Premier League Official Teams
  { id: 'team_spl_ssk', label: 'SSK', name: 'Sadokan Super Kings', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469238/spl_team_ssk_logo.jpg', color: '#1E3A8A' },
  { id: 'team_spl_str', label: 'STR', name: 'Sangwa Strikers', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469248/spl_team_str_logo.jpg', color: '#0D9488' },
  { id: 'team_spl_sdr', label: 'SDR', name: 'Sadokan Royals', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469244/spl_team_sdr_logo.jpg', color: '#0284C7' },
  { id: 'team_spl_mwc', label: 'MWC', name: 'Marwar Champions', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469253/spl_team_mwc_logo.jpg', color: '#DC2626' },
  { id: 'team_spl_ngt', label: 'NGT', name: 'Nagaur Titans', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469258/spl_team_ngt_logo.jpg', color: '#7C3AED' },

  // CPL & Women's CPL (WCPL) Official Teams
  { id: 'gaw', label: 'GAW', name: 'Guyana Amazon Warriors', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085716/cricflow_team_logos/gt.jpg', color: '#15803D' },
  { id: 'gaw_w', label: 'GAW-W', name: 'Guyana Amazon Warriors Women', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085716/cricflow_team_logos/gt.jpg', color: '#15803D' },
  { id: 'br', label: 'BR', name: 'Barbados Royals', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085720/cricflow_team_logos/rr.jpg', color: '#0284C7' },
  { id: 'br_w', label: 'BR-W', name: 'Barbados Royals Women', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085720/cricflow_team_logos/rr.jpg', color: '#0284C7' },
  { id: 'bt_w', label: 'BT-W', name: 'Barbados Tridents Women', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085720/cricflow_team_logos/rr.jpg', color: '#0284C7' },
  { id: 'tkr', label: 'TKR', name: 'Trinbago Knight Riders', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085717/cricflow_team_logos/kkr.jpg', color: '#DC2626' },
  { id: 'tkr_w', label: 'TKR-W', name: 'Trinbago Knight Riders Women', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085717/cricflow_team_logos/kkr.jpg', color: '#DC2626' },
  { id: 'je_w', label: 'JE-W', name: 'Jamaica Empress Women', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085714/cricflow_team_logos/csk.png', color: '#FACC15' },
  { id: 'sknp', label: 'SKNP', name: 'St Kitts & Nevis Patriots', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085719/cricflow_team_logos/pbks.jpg', color: '#0D9488' },
  { id: 'slk', label: 'SLK', name: 'Saint Lucia Kings', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085718/cricflow_team_logos/lsg.jpg', color: '#0284C7' },
  { id: 'abf', label: 'ABF', name: 'Antigua & Barbuda Falcons', url: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085721/cricflow_team_logos/srh.jpg', color: '#D97706' },

  // Standard IPL & Major League Presets
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

/**
 * Identify if a team name or object represents a TBC / Playoff placeholder
 */
export const isPlaceholderTeam = (team) => {
  if (!team) return false;
  if (typeof team === 'object' && team.isPlaceholder) return true;
  const str = String(typeof team === 'string' ? team : (team.name || team.shortName || team.code || '')).trim().toLowerCase();
  if (!str) return false;
  return (
    str === 'tbc' ||
    str === 'tbd' ||
    str.includes('to be decide') ||
    str.includes('winner semi') ||
    str.includes('winner match') ||
    str.includes('winner q') ||
    str.includes('rank 1') ||
    str.includes('rank 2') ||
    str.includes('rank 3') ||
    str.includes('rank 4') ||
    str.startsWith('r1') ||
    str.startsWith('r2') ||
    str.startsWith('r3') ||
    str.startsWith('r4') ||
    str.includes('qualifier') ||
    str.includes('eliminator') ||
    str.includes('semi-final') ||
    str.includes('final') ||
    str.includes('playoff')
  );
};

/**
 * Dynamically resolve a match team against the tournament roster (tournament.teams)
 */
export const resolveTeamWithRoster = (team, tournamentTeams = []) => {
  if (!team) return { name: 'Team' };

  const rawName = String(typeof team === 'string' ? team : (team.name || team.shortName || '')).trim();
  const rawObj = typeof team === 'object' ? team : { name: rawName };

  if (isPlaceholderTeam(team)) {
    return {
      ...rawObj,
      name: rawName || 'TBC',
      shortName: 'TBC',
      isPlaceholder: true
    };
  }

  // 1. Direct logo already attached on the team object
  if (rawObj.logoUri || rawObj.logoUrl || (rawObj.logo && typeof rawObj.logo === 'string')) {
    return rawObj;
  }

  // 2. Lookup against parent tournament roster
  if (Array.isArray(tournamentTeams) && tournamentTeams.length > 0) {
    const cleanName = rawName.toLowerCase();
    const cleanShort = String(rawObj.shortName || rawObj.code || makeTeamCode(rawName)).toLowerCase();

    const matched = tournamentTeams.find(t => {
      if (!t) return false;
      if (rawObj.id && t.id && String(t.id) === String(rawObj.id)) return true;
      const tName = String(t.name || '').trim().toLowerCase();
      const tShort = String(t.shortName || t.shortCode || t.code || makeTeamCode(tName)).trim().toLowerCase();
      return (
        tName === cleanName ||
        tShort === cleanShort ||
        tShort === cleanName ||
        tName === cleanShort ||
        (cleanName.length >= 4 && tName.includes(cleanName)) ||
        (tName.length >= 4 && cleanName.includes(tName))
      );
    });

    if (matched) {
      return {
        ...rawObj,
        name: matched.name || rawName,
        shortName: matched.shortName || rawObj.shortName || makeTeamCode(matched.name || rawName),
        logoUri: matched.logoUri || matched.logoUrl || rawObj.logoUri,
        logoUrl: matched.logoUrl || matched.logoUri || rawObj.logoUrl,
        logoKey: matched.logoKey || rawObj.logoKey,
        color: matched.color || rawObj.color,
        cardBg: matched.cardBg || rawObj.cardBg
      };
    }
  }

  return rawObj;
};

export const getTeamLogoSource = (team, tournamentTeams = []) => {
  const resolved = resolveTeamWithRoster(team, tournamentTeams);

  if (resolved?.isPlaceholder) {
    return null; // Signals component to render clean placeholder shield
  }

  if (resolved?.logoUri) return { uri: resolved.logoUri };
  if (resolved?.logoUrl) return { uri: resolved.logoUrl };
  if (resolved?.logo && typeof resolved.logo === 'string') return { uri: resolved.logo };

  const rawKey = String(resolved?.logoKey || resolved?.id || '').toLowerCase().trim();
  const rawName = String(resolved?.name || '').toLowerCase().trim();
  const rawShort = String(resolved?.shortName || resolved?.code || '').toLowerCase().trim();
  const key = rawKey || rawShort || rawName;

  // 1. Direct ID, Label, or Name match from Cloudinary Presets
  const foundPreset = PRESET_TEAM_LOGOS.find(p => (
    p.id.toLowerCase() === key ||
    p.label.toLowerCase() === key ||
    p.label.toLowerCase() === rawShort ||
    p.name.toLowerCase() === key ||
    p.name.toLowerCase() === rawName
  ));
  if (foundPreset) return { uri: foundPreset.url };

  // 1.5. Rajasthan League 2026 Official Team Logos
  if (key === 'jpr' || key.includes('jaipur royal') || key.includes('jaipur')) return require('../../assets/team_logos/rpl/jpr.jpg');
  if (key === 'jsr' || key.includes('jodhpur sun') || key.includes('jodhpur')) return require('../../assets/team_logos/rpl/jsr.jpg');
  if (key === 'ngt' || key.includes('nagaur titan') || key.includes('nagaur')) return require('../../assets/team_logos/rpl/ngt.jpg');
  if (key === 'bkr' || key.includes('bikaner king') || key.includes('bikaner')) return require('../../assets/team_logos/rpl/bkr.jpg');
  if (key === 'udw' || key.includes('udaipur warrior') || key.includes('udaipur')) return require('../../assets/team_logos/rpl/udw.jpg');
  if (key === 'kts' || key.includes('kota striker') || key.includes('kota')) return require('../../assets/team_logos/rpl/kts.jpg');
  if (key === 'ssg' || key.includes('sikar super') || key.includes('sikar')) return require('../../assets/team_logos/rpl/ssg.jpg');
  if (key === 'ajb' || key.includes('ajmer blaster') || key.includes('ajmer')) return require('../../assets/team_logos/rpl/ajb.jpg');
  if (key === 'bms' || key.includes('barmer super') || key.includes('barmer')) return require('../../assets/team_logos/rpl/bms.jpg');
  if (key === 'mwc' || key.includes('marwar champion') || key.includes('marwar')) return require('../../assets/team_logos/rpl/mwc.jpg');

  // 2. Sadokan Premier League Keyword matching
  if (key.includes('super king') || key.includes('sadokan super') || key.includes('ssk')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469238/spl_team_ssk_logo.jpg' };
  if (key.includes('sangwa') || key.includes('striker') || key.includes('str')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469248/spl_team_str_logo.jpg' };
  if (key.includes('sadokan royal') || key.includes('sdr')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469244/spl_team_sdr_logo.jpg' };
  if (key.includes('marwar') || key.includes('champion') || key.includes('mwc')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469253/spl_team_mwc_logo.jpg' };
  if (key.includes('nagaur') || key.includes('titan') || key.includes('ngt')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469258/spl_team_ngt_logo.jpg' };

  // 3. CPL & WCPL Keyword matching
  if (key.includes('guyana') || key.includes('amazon warrior') || key.includes('gaw')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085716/cricflow_team_logos/gt.jpg' };
  if (key.includes('barbados') || key.includes('trident') || key.includes('br-w') || key.includes('bt-w') || key.includes('barbados royal')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085720/cricflow_team_logos/rr.jpg' };
  if (key.includes('trinbago') || key.includes('knight rider') || key.includes('tkr')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085717/cricflow_team_logos/kkr.jpg' };
  if (key.includes('jamaica') || key.includes('empress') || key.includes('tallawah') || key.includes('je-w')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085714/cricflow_team_logos/csk.png' };
  if (key.includes('kitts') || key.includes('patriot') || key.includes('sknp')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085719/cricflow_team_logos/pbks.jpg' };
  if (key.includes('lucia') || key.includes('slk')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085718/cricflow_team_logos/lsg.jpg' };
  if (key.includes('antigua') || key.includes('falcon') || key.includes('abf')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085721/cricflow_team_logos/srh.jpg' };

  // 4. IPL Name keyword matching to Cloudinary URLs
  if (key.includes('csk') || key.includes('chennai')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085714/cricflow_team_logos/csk.png' };
  if (key.includes('rcb') || key.includes('bangalore') || key.includes('bengaluru') || key.includes('challenger')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085720/cricflow_team_logos/rcb.jpg' };
  if (key.includes('mi') || key.includes('mumbai') || key.includes('indian')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085718/cricflow_team_logos/mi.jpg' };
  if (key.includes('gt') || key.includes('gujarat')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085716/cricflow_team_logos/gt.jpg' };
  if (key.includes('lsg') || key.includes('lucknow') || key.includes('giant')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085718/cricflow_team_logos/lsg.jpg' };
  if (key.includes('srh') || key.includes('hyderabad') || key.includes('sunriser')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085721/cricflow_team_logos/srh.jpg' };
  if (key.includes('dc') || key.includes('delhi') || key.includes('capital')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085715/cricflow_team_logos/dc.jpg' };
  if (key.includes('pbks') || key.includes('punjab')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085719/cricflow_team_logos/pbks.jpg' };
  if (key.includes('rajasthan') || key.includes('royal')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085720/cricflow_team_logos/rr.jpg' };
  if (key.includes('kkr') || key.includes('kolkata') || key.includes('knight')) return { uri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1787085717/cricflow_team_logos/kkr.jpg' };

  if (key === 'default-team-1' || key === 'logo_team_1') return require('../../assets/default_team_1.png');
  if (key === 'default-team-2' || key === 'logo_team_2') return require('../../assets/default_team_2.png');
  return require('../../assets/default_team_1.png');
};

export const getScorePartsFromText = (scoreText = '') => {
  const raw = String(scoreText || '').trim();
  if (!raw) return { score: '', overs: '' };

  const match = raw.match(/^([0-9]+\s*[-/]\s*[0-9]+)\s*(?:\(([^)]+)\))?$/);
  if (match) {
    const score = match[1].replace(/\s+/g, '');
    const oversStr = (match[2] || '').trim();
    const oversMatch = oversStr.match(/([0-9]+(?:\.[0-9]+)?)\s*ov(?:s)?/i) || oversStr.match(/([0-9]+(?:\.[0-9]+)?)/);
    const ovNum = oversMatch ? oversMatch[1] : oversStr;
    const overs = ovNum ? ovNum.replace(/\s*ov(?:s)?/i, '').replace(/[()]/g, '').trim() : '';
    return { score, overs };
  }

  const directScoreMatch = raw.match(/^([0-9]+\s*[-/]\s*[0-9]+)/);
  if (directScoreMatch) {
    const score = directScoreMatch[1].replace(/\s+/g, '');
    const oversMatch = raw.match(/([0-9]+\.[0-9]+)/);
    const overs = oversMatch ? oversMatch[1] : '';
    return { score, overs };
  }

  return { score: raw, overs: '' };
};

/**
 * Format match winner short headline and margin cleanly (e.g. "GAW-W Won", "by 5 wickets")
 */
export const formatMatchResult = (match, t1Resolved, t2Resolved, teams = []) => {
  if (!match) return { winnerHeadline: 'Completed', marginText: '' };

  const rawWinner = String(match.winnerTeamName || match.winner || match.resultText || match.result || '').trim();
  const rawResult = String(match.resultText || match.result || match.winner || '').trim();

  // If match was tied
  if (rawResult.toLowerCase().includes('tied') || rawResult.toLowerCase().includes('tie')) {
    return {
      winnerHeadline: 'Match Tied',
      marginText: rawResult.toLowerCase().includes('super') ? 'Super Over' : 'Tied'
    };
  }

  // If match had no result or was abandoned
  if (rawResult.toLowerCase().includes('no result') || rawResult.toLowerCase().includes('abandoned') || rawResult.toLowerCase().includes('rain')) {
    return {
      winnerHeadline: 'No Result',
      marginText: 'Abandoned'
    };
  }

  const t1Code = t1Resolved?.shortName || (t1Resolved?.name ? makeTeamCode(t1Resolved.name) : 'T1');
  const t2Code = t2Resolved?.shortName || (t2Resolved?.name ? makeTeamCode(t2Resolved.name) : 'T2');

  const wNorm = rawWinner.toLowerCase();
  const t1Norm = String(t1Resolved?.name || '').toLowerCase();
  const t2Norm = String(t2Resolved?.name || '').toLowerCase();
  const t1CodeNorm = String(t1Code).toLowerCase();
  const t2CodeNorm = String(t2Code).toLowerCase();

  let winnerShortCode = t2Code;

  if (wNorm.includes(t1CodeNorm) || (t1Norm && wNorm.includes(t1Norm)) || (t1Norm.length >= 4 && wNorm.includes(t1Norm.slice(0, 4)))) {
    winnerShortCode = t1Code;
  } else if (wNorm.includes(t2CodeNorm) || (t2Norm && wNorm.includes(t2Norm)) || (t2Norm.length >= 4 && wNorm.includes(t2Norm.slice(0, 4)))) {
    winnerShortCode = t2Code;
  } else if (match.winnerTeamName) {
    const matched = teams.find(t => 
      t.name?.toLowerCase() === match.winnerTeamName.toLowerCase() ||
      t.shortName?.toLowerCase() === match.winnerTeamName.toLowerCase()
    );
    winnerShortCode = matched?.shortName || makeTeamCode(match.winnerTeamName);
  }

  // Extract clean margin (e.g. "by 5 wickets", "by 24 runs")
  let marginText = 'by 5 wickets';
  if (rawResult) {
    const byMatch = rawResult.match(/by\s+\d+\s+(?:wickets?|runs?|wkts?)/i) || rawResult.match(/by\s+[\w\s]+/i);
    if (byMatch) {
      marginText = byMatch[0].trim();
    } else if (!rawResult.toLowerCase().includes('won') && !rawResult.toLowerCase().includes('win')) {
      marginText = rawResult;
    }
  }

  return {
    winnerHeadline: `${winnerShortCode} Won`,
    marginText
  };
};

/**
 * Resolve high-res Tournament Banner image source (supports local assets & remote URLs)
 */
export const getTournamentBannerSource = (tournament) => {
  if (!tournament) return require('../../assets/rpl_banner.jpg');
  const rawBanner = tournament.bannerUri || tournament.bannerUrl || tournament.banner;
  const id = String(tournament.id || '').toLowerCase();
  const name = String(tournament.fullName || tournament.name || tournament.title || '').toLowerCase();
  const rawStr = String(rawBanner || '').toLowerCase();

  // 1. Prioritize bundled local assets for known tournament identities
  if (id.includes('sadokan') || name.includes('sadokan') || rawStr.includes('spl') || rawBanner === 'spl_banner') {
    return require('../../assets/spl_banner.jpg');
  }

  if (id.includes('rajasthan') || name.includes('rajasthan') || rawStr.includes('rpl') || rawBanner === 'rpl_banner') {
    return require('../../assets/rpl_banner.jpg');
  }

  // 2. Explicit custom URLs uploaded by organizers
  if (typeof rawBanner === 'string' && (rawBanner.startsWith('http://') || rawBanner.startsWith('https://') || rawBanner.startsWith('data:') || rawBanner.startsWith('file:'))) {
    return { uri: rawBanner };
  }

  if (typeof rawBanner === 'string' && rawBanner.length > 5) {
    return { uri: rawBanner };
  }

  return require('../../assets/rpl_banner.jpg');
};

/**
 * Resolve high-res Tournament Brand Logo image source (supports local assets & remote URLs)
 */
export const getTournamentLogoSource = (tournament) => {
  if (!tournament) return require('../../assets/rpl_logo.jpg');
  const rawLogo = tournament.logoUri || tournament.logoUrl || tournament.logo;
  const id = String(tournament.id || '').toLowerCase();
  const name = String(tournament.fullName || tournament.name || tournament.title || '').toLowerCase();
  const rawStr = String(rawLogo || '').toLowerCase();

  // 1. Prioritize bundled local assets for known tournament identities
  if (id.includes('sadokan') || name.includes('sadokan') || rawStr.includes('spl') || rawLogo === 'spl_logo') {
    return require('../../assets/spl_logo.jpg');
  }

  if (id.includes('rajasthan') || name.includes('rajasthan') || rawStr.includes('rpl') || rawLogo === 'rpl_logo') {
    return require('../../assets/rpl_logo.jpg');
  }

  // 2. Explicit custom URLs uploaded by organizers
  if (typeof rawLogo === 'string' && (rawLogo.startsWith('http://') || rawLogo.startsWith('https://') || rawLogo.startsWith('data:') || rawLogo.startsWith('file:'))) {
    return { uri: rawLogo };
  }

  if (typeof rawLogo === 'string' && rawLogo.length > 5) {
    return { uri: rawLogo };
  }

  return require('../../assets/rpl_logo.jpg');
};

/**
 * Safely clean match date string from invalid/NaN formats
 */
export const cleanMatchDate = (dateStr, fallback = 'Tomorrow') => {
  if (!dateStr || typeof dateStr !== 'string') return fallback;
  const trimmed = dateStr.trim();
  if (trimmed.includes('NaN') || trimmed.includes('Invalid') || trimmed === 'null' || trimmed === 'undefined') {
    return fallback;
  }
  return trimmed;
};
