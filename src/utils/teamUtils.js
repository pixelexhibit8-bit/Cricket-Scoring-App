export const makeTeamCode = (name = '') => {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
  return String(name).replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase() || 'TM';
};

export const getTeamShortCode = (team, fallbackName = '') => {
  const savedCode = String(team?.code || '').trim();
  return savedCode || makeTeamCode(team?.name || fallbackName);
};

export const getTeamLogoSource = (team) => {
  if (team?.logoUri) return { uri: team.logoUri };
  if (team?.logoKey === 'default-team-1') return require('../../assets/default_team_1.png');
  if (team?.logoKey === 'default-team-2') return require('../../assets/default_team_2.png');
  if (team?.logoKey === 'sadokan-a') return require('../../assets/sadokan_a.png');
  if (team?.logoKey === 'sadokan-b') return require('../../assets/sadokan_b.png');
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
    const overs = oversMatch ? oversMatch[1] : '';
    return { score, overs };
  }

  const directScoreMatch = raw.match(/^([0-9]+\s*-\s*[0-9]+)/);
  if (directScoreMatch) {
    const score = directScoreMatch[1].replace(/\s+/g, '');
    const oversMatch = raw.match(/([0-9]+\.[0-9]+)/);
    return { score, overs: oversMatch ? oversMatch[1] : '' };
  }

  return { score: raw, overs: '' };
};
