import { capitalizeWords } from './textUtils.js';

/**
 * Smart WhatsApp & Raw Text Cricket Squad Parser
 * 
 * Accurately parses squad text copied from WhatsApp groups, notes, or SMS:
 * - Numbered: "1. Bastiram (C)", "2) Virender (WK)", "3 - Ramesh"
 * - Comma separated: "Bastiram (C), Virender (WK), Ramesh (Bowler), Suresh"
 * - Bulleted: "* Bastiram (C)", "- Virender", "• Rahul"
 * - Role tags: (C), (c), (Capt), (Captain), [C], (WK), (W.K), (Wicket Keeper), [WK], (VC), (Vice Captain)
 * - Specific roles: Batter, Batsman, Bowler, All-Rounder, All Rounder, AR, Allrounder
 * - Phone numbers: 10-digit mobile numbers attached to player names
 */
export function parseSquadText(rawText = '') {
  if (!rawText || typeof rawText !== 'string') return [];

  const text = rawText.trim();
  if (!text) return [];

  // Split lines
  let lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // If all text is on a single line with commas, split by commas
  if (lines.length === 1 && lines[0].includes(',')) {
    lines = lines[0].split(',').map(l => l.trim()).filter(Boolean);
  }

  const parsedPlayers = [];
  const seenNames = new Set();

  // Common noise headers to skip
  const NOISE_HEADER_REGEX = /^(team|squad|playing\s*11|playing\s*xi|squad\s*list|players|substitutes|bench|captains?|vs|match|tournament|season|date|time|ground|entry\s*fee|rules?):/i;

  for (let line of lines) {
    let cleanLine = line.trim();

    // Skip empty lines or pure punctuation lines
    if (!cleanLine || /^[-=_*#~]+$/.test(cleanLine)) continue;

    // Skip noise headers
    if (NOISE_HEADER_REGEX.test(cleanLine)) continue;
    if (cleanLine.toLowerCase().startsWith('team name:') || cleanLine.toLowerCase().startsWith('captain:')) continue;

    // Extract 10-digit phone number if present
    let phone = '';
    const phoneMatch = cleanLine.match(/(?:\+91[\-\s]?)?[6-9]\d{9}/);
    if (phoneMatch) {
      phone = phoneMatch[0].replace(/\D/g, '').slice(-10);
      cleanLine = cleanLine.replace(phoneMatch[0], ' ');
    }

    // Detect Captaincy: (C), [C], (Captain), (Capt), - C, etc.
    let isCaptain = false;
    if (
      /\b(\(c\)|\(capt\)|\(captain\)|\(c\.\)|\[c\]|\bcapt:|\bcapt\b|\bc\b)/i.test(cleanLine)
    ) {
      isCaptain = true;
      cleanLine = cleanLine.replace(/\b(\(c\)|\(capt\)|\(captain\)|\(c\.\)|\[c\]|\bcapt:|\bcapt\b|\bc\b)/gi, ' ');
    }

    // Detect Wicketkeeper: (WK), (W.K), (Wicket Keeper), (wk), [WK]
    let isWicketKeeper = false;
    if (
      /\b(\(wk\)|\(w\.k\)|\(w\.k\.\)|\[wk\]|\(wicket\s*keeper\)|\bwk\b)/i.test(cleanLine)
    ) {
      isWicketKeeper = true;
      cleanLine = cleanLine.replace(/\b(\(wk\)|\(w\.k\)|\(w\.k\.\)|\[wk\]|\(wicket\s*keeper\)|\bwk\b)/gi, ' ');
    }

    // Detect Vice Captain: (VC), (V.C), (Vice Captain), [VC]
    let isViceCaptain = false;
    if (
      /\b(\(vc\)|\(v\.c\)|\(v\.c\.\)|\[vc\]|\(vice\s*captain\)|\bvc\b)/i.test(cleanLine)
    ) {
      isViceCaptain = true;
      cleanLine = cleanLine.replace(/\b(\(vc\)|\(v\.c\)|\(v\.c\.\)|\[vc\]|\(vice\s*captain\)|\bvc\b)/gi, ' ');
    }

    // Detect Specific Role
    let role = isWicketKeeper ? 'Wicket Keeper' : 'All-Rounder';
    if (/\b(all[\s-]?rounder|allrounder|ar)\b/i.test(cleanLine)) {
      role = 'All-Rounder';
      cleanLine = cleanLine.replace(/\b(\(all[\s-]?rounder\)|\(allrounder\)|\(ar\)|all[\s-]?rounder|allrounder|ar)\b/gi, ' ');
    } else if (/\b(batsman|batter|batting|bat)\b/i.test(cleanLine)) {
      role = 'Batter';
      cleanLine = cleanLine.replace(/\b(\(batsman\)|\(batter\)|\(batting\)|\(bat\)|batsman|batter|batting|bat)\b/gi, ' ');
    } else if (/\b(bowler|bowling|bowl|fast|spin|spinner)\b/i.test(cleanLine)) {
      role = 'Bowler';
      cleanLine = cleanLine.replace(/\b(\(bowler\)|\(bowling\)|\(bowl\)|bowler|bowling|bowl|fast|spin|spinner)\b/gi, ' ');
    }

    // Strip leading numbering, bullets, dashes, periods (e.g. "1.", "1)", "01.", "•", "-", "*")
    cleanLine = cleanLine.replace(/^[\s\d]+[.)\-\s]+/, '');
    cleanLine = cleanLine.replace(/^[*•\-–—►>+~]+\s*/, '');

    // Strip trailing punctuation & extra brackets
    cleanLine = cleanLine.replace(/[()[\]{}.,:;!?'"`~@#$%^&*+=|\\/<>_-]/g, ' ').replace(/\s+/g, ' ').trim();

    if (!cleanLine || cleanLine.length < 2) continue;

    // Capitalize properly
    const finalName = capitalizeWords(cleanLine);
    const normalizedKey = finalName.toLowerCase();

    // Prevent duplicate entries within the same pasted text
    if (seenNames.has(normalizedKey)) continue;
    seenNames.add(normalizedKey);

    parsedPlayers.push({
      id: `p_${Date.now()}_${parsedPlayers.length + 1}`,
      name: finalName,
      role: role,
      isCaptain: isCaptain,
      isWicketKeeper: isWicketKeeper,
      isViceCaptain: isViceCaptain,
      phone: phone
    });
  }

  return parsedPlayers;
}
