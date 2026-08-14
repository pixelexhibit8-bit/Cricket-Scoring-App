export const getTokenNumber = (token) => {
  const value = parseInt(String(token || '').replace(/[^\d]/g, '') || '0', 10);
  return Number.isFinite(value) ? value : 0;
};

export const isWideToken = (token) => /Wd$/i.test(String(token || ''));
export const isNoBallToken = (token) => /Nb$/i.test(String(token || ''));
export const isPenaltyToken = (token) => /Pen$/i.test(String(token || ''));
export const isByeToken = (token) => /\d+B$/i.test(String(token || ''));
export const isLegByeToken = (token) => /\d+LB$/i.test(String(token || ''));
export const isWicketToken = (token) => /^(\d+)?W$/i.test(String(token || ''));
export const isLegalToken = (token) => !isWideToken(token) && !isNoBallToken(token) && !isPenaltyToken(token);

export const getTokenTeamRuns = (token) => {
  if (!token) return 0;
  if (isPenaltyToken(token)) return 5;
  if (isWideToken(token) || isNoBallToken(token)) return getTokenNumber(token) + 1;
  if (isByeToken(token) || isLegByeToken(token)) return getTokenNumber(token) || 1;
  return getTokenNumber(token);
};

export const getTokenBowlerRuns = (token) => {
  if (isByeToken(token) || isLegByeToken(token) || isPenaltyToken(token)) return 0;
  return getTokenTeamRuns(token);
};

export const sumDeliveryTokens = (tokens = [], runResolver = getTokenTeamRuns) =>
  tokens.reduce((total, token) => total + runResolver(token), 0);

export const countWicketTokens = (tokens = []) =>
  tokens.filter(token => isWicketToken(token)).length;

export const countLegalTokens = (tokens = []) =>
  tokens.filter(token => isLegalToken(token)).length;

export const getCurrentOverNumber = (inning) => {
  const legalBalls = inning?.totalLegalBalls || 0;
  if (inning?.isOverComplete && legalBalls > 0) return Math.ceil(legalBalls / 6);
  return Math.floor(legalBalls / 6) + 1;
};

export const getDisplayOverHistory = (inning) => {
  const completed = inning?.overHistory || [];
  const currentBalls = inning?.currentOverBalls || [];
  if (!inning || inning.isOverComplete || currentBalls.length === 0) return completed;
  return [
    ...completed,
    {
      overNum: Math.floor((inning.totalLegalBalls || 0) / 6) + 1,
      runs: sumDeliveryTokens(currentBalls),
      wickets: countWicketTokens(currentBalls),
      bowlerName: inning.bowler?.name || 'Bowler',
      balls: currentBalls,
      partial: true
    }
  ];
};

export const formatOvers = (legalBalls) => {
  const ov = Math.floor(legalBalls / 6);
  const b = legalBalls % 6;
  return `${ov}.${b}`;
};
