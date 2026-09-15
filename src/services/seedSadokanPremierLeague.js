import { autoCalculatePointsTable } from '../utils/cricketUtils.js';
import { calculateTournamentStats } from './tournamentStatsEngine.js';

export const SPL_TEAMS = [
  {
    id: 'team_spl_ssk',
    name: 'Sadokan Super Kings',
    shortName: 'SSK',
    captainName: 'Basti Ram Suthar',
    captainPhone: '+91 98290 01101',
    city: 'Sadokan',
    color: '#1E3A8A',
    cardBg: '#EFF6FF',
    logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469238/spl_team_ssk_logo.jpg',
    count: '11 Players',
    playersCount: 11,
    players: [
      { id: 'p_ssk_1', name: 'Basti Ram Suthar', role: 'All-Rounder', isCaptain: true, battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_ssk_2', name: 'Sunil Choudhary', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Spin' },
      { id: 'p_ssk_3', name: 'Sunli Sangwa', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_ssk_4', name: 'Bhagat Sangwa', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
      { id: 'p_ssk_5', name: 'Ganpat Sangwa', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Spin' },
      { id: 'p_ssk_6', name: 'Rakesh Sangwa', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
      { id: 'p_ssk_7', name: 'Mahaveer Suthar', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_ssk_8', name: 'Ramkaran Sangwa', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Leg Spin' },
      { id: 'p_ssk_9', name: 'Omprakash Sangwa', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_ssk_10', name: 'Jagdish Sangwa', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
      { id: 'p_ssk_11', name: 'Suresh Suthar', role: 'Wicket Keeper', isWicketKeeper: true, battingStyle: 'Right Hand', bowlingStyle: 'None' }
    ]
  },
  {
    id: 'team_spl_str',
    name: 'Sangwa Strikers',
    shortName: 'STR',
    captainName: 'Naresh Choudhary',
    captainPhone: '+91 98290 01102',
    city: 'Sadokan',
    color: '#0D9488',
    cardBg: '#F0FDFA',
    logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469248/spl_team_str_logo.jpg',
    count: '11 Players',
    playersCount: 11,
    players: [
      { id: 'p_str_1', name: 'Naresh Choudhary', role: 'Batter', isCaptain: true, battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_str_2', name: 'Surendra Sangwa', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_str_3', name: 'Ramswaroop Sangwa', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Spin' },
      { id: 'p_str_4', name: 'Ronak Sangwa', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
      { id: 'p_str_5', name: 'Harendra Sangwa', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_str_6', name: 'Prakash Sangwa', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Spin' },
      { id: 'p_str_7', name: 'Kailash Sangwa', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_str_8', name: 'Mukesh Choudhary', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
      { id: 'p_str_9', name: 'Ashok Sangwa', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Leg Spin' },
      { id: 'p_str_10', name: 'Shravan Sangwa', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_str_11', name: 'Dinesh Sangwa', role: 'Wicket Keeper', isWicketKeeper: true, battingStyle: 'Right Hand', bowlingStyle: 'None' }
    ]
  },
  {
    id: 'team_spl_sdr',
    name: 'Sadokan Royals',
    shortName: 'SDR',
    captainName: 'Vikas Khoja',
    captainPhone: '+91 98290 01103',
    city: 'Sadokan',
    color: '#0284C7',
    cardBg: '#F0F9FF',
    logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469244/spl_team_sdr_logo.jpg',
    count: '11 Players',
    playersCount: 11,
    players: [
      { id: 'p_sdr_1', name: 'Vikas Khoja', role: 'All-Rounder', isCaptain: true, battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_sdr_2', name: 'Bhinvraj Sangwa', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_sdr_3', name: 'Pralhad Sangwa', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Spin' },
      { id: 'p_sdr_4', name: 'Mohit Sangwa', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
      { id: 'p_sdr_5', name: 'Prem Khoja', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_sdr_6', name: 'Ramesh Sangwa', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Spin' },
      { id: 'p_sdr_7', name: 'Mahendra Khoja', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_sdr_8', name: 'Shyam Sangwa', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Leg Spin' },
      { id: 'p_sdr_9', name: 'Govind Khoja', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
      { id: 'p_sdr_10', name: 'Lalit Sangwa', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_sdr_11', name: 'Hanuman Sangwa', role: 'Wicket Keeper', isWicketKeeper: true, battingStyle: 'Right Hand', bowlingStyle: 'None' }
    ]
  },
  {
    id: 'team_spl_mwc',
    name: 'Marwar Champions',
    shortName: 'MWC',
    captainName: 'Abhishek Sharma',
    captainPhone: '+91 98290 01104',
    city: 'Sadokan',
    color: '#DC2626',
    cardBg: '#FEF2F2',
    logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469253/spl_team_mwc_logo.jpg',
    count: '11 Players',
    playersCount: 11,
    players: [
      { id: 'p_mwc_1', name: 'Abhishek Sharma', role: 'All-Rounder', isCaptain: true, battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Spin' },
      { id: 'p_mwc_2', name: 'Abhishek sangwa', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_mwc_3', name: 'Dashrath Sangwa', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_mwc_4', name: 'Ramchandra Sangwa', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
      { id: 'p_mwc_5', name: 'Tejaram Sangwa', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_mwc_6', name: 'Rajendra Sharma', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Spin' },
      { id: 'p_mwc_7', name: 'Narendra Sangwa', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_mwc_8', name: 'Girdhari Sangwa', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Leg Spin' },
      { id: 'p_mwc_9', name: 'Bhanwar Sharma', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
      { id: 'p_mwc_10', name: 'Laxman Sharma', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_mwc_11', name: 'Mukesh Sangwa', role: 'Wicket Keeper', isWicketKeeper: true, battingStyle: 'Right Hand', bowlingStyle: 'None' }
    ]
  },
  {
    id: 'team_spl_ngt',
    name: 'Nagaur Titans',
    shortName: 'NGT',
    captainName: 'Manish Choudhary',
    captainPhone: '+91 98290 01105',
    city: 'Nagaur',
    color: '#7C3AED',
    cardBg: '#F5F3FF',
    logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469258/spl_team_ngt_logo.jpg',
    count: '11 Players',
    playersCount: 11,
    players: [
      { id: 'p_ngt_1', name: 'Manish Choudhary', role: 'Batter', isCaptain: true, battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Spin' },
      { id: 'p_ngt_2', name: 'Mohit sadokan', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
      { id: 'p_ngt_3', name: 'Laxman Sen', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_ngt_4', name: 'Akshay Sangwa', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Spin' },
      { id: 'p_ngt_5', name: 'Anurag Sangwa', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_ngt_6', name: 'Shivpal Khoja', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
      { id: 'p_ngt_7', name: 'Ratan Choudhary', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_ngt_8', name: 'Bhanwar Sen', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Leg Spin' },
      { id: 'p_ngt_9', name: 'Pawan Khoja', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
      { id: 'p_ngt_10', name: 'Devilal Choudhary', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
      { id: 'p_ngt_11', name: 'Sunil Sen', role: 'Wicket Keeper', isWicketKeeper: true, battingStyle: 'Right Hand', bowlingStyle: 'None' }
    ]
  }
];

export const SPL_MATCHES = [
  // ─── MATCH 1: SSK (38/3) vs STR (33/4) ───
  {
    id: 'e5966a12-190e-4125-8a10-ce4de1bc8e5f',
    matchNumber: 1,
    matchNo: 1,
    stage: 'Match 1',
    matchTitle: 'Sadokan Super Kings vs Sangwa Strikers',
    overs: 5,
    maxOvers: 5,
    venue: 'Sadokan Cricket Ground',
    dateStr: 'Completed • Day 1',
    status: 'FINISHED',
    phase: 'result',
    winnerTeamName: 'Sadokan Super Kings',
    winner: 'Sadokan Super Kings',
    resultText: 'Sadokan Super Kings won by 5 runs',
    result: 'Sadokan Super Kings won by 5 runs',
    team1: {
      name: 'Sadokan Super Kings',
      shortName: 'SSK',
      runs: 38,
      wickets: 3,
      overs: '5.0',
      score: '38-3 (5.0)',
      logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469238/spl_team_ssk_logo.jpg'
    },
    team2: {
      name: 'Sangwa Strikers',
      shortName: 'STR',
      runs: 33,
      wickets: 4,
      overs: '5.0',
      score: '33-4 (5.0)',
      logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469248/spl_team_str_logo.jpg'
    },
    rawMatchData: {
      id: 'e5966a12-190e-4125-8a10-ce4de1bc8e5f',
      matchTitle: 'Sadokan Super Kings vs Sangwa Strikers',
      venue: 'Sadokan Cricket Ground',
      phase: 'result',
      status: 'FINISHED',
      maxOvers: 5,
      winnerTeamName: 'Sadokan Super Kings',
      resultText: 'Sadokan Super Kings won by 5 runs',
      innings: [
        {
          inningNumber: 1,
          battingTeam: { name: 'Sadokan Super Kings', runs: 38, wickets: 3, overs: '5.0' },
          bowlingTeam: { name: 'Sangwa Strikers' },
          totalLegalBalls: 30,
          allBatters: [
            { name: 'Sunil Choudhary', runs: 20, balls: 11, fours: 2, sixes: 1, isOut: true, outDesc: 'c Naresh b Surendra', strikeRate: '181.8' },
            { name: 'Sunli Sangwa', runs: 12, balls: 9, fours: 1, sixes: 0, isOut: true, outDesc: 'b Ramswaroop', strikeRate: '133.3' },
            { name: 'Bhagat Sangwa', runs: 4, balls: 6, fours: 0, sixes: 0, isOut: true, outDesc: 'run out', strikeRate: '66.7' },
            { name: 'Ganpat Sangwa', runs: 2, balls: 4, fours: 0, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '50.0' }
          ],
          bowling: [
            { name: 'Surendra Sangwa', overs: '2.0', runs: 14, wickets: 1, maidens: 0, econ: '7.00', balls: 12 },
            { name: 'Ramswaroop Sangwa', overs: '2.0', runs: 15, wickets: 1, maidens: 0, econ: '7.50', balls: 12 },
            { name: 'Ronak Sangwa', overs: '1.0', runs: 9, wickets: 0, maidens: 0, econ: '9.00', balls: 6 }
          ],
          overHistory: [
            { overNum: 1, bowlerName: 'Surendra Sangwa', runs: 6, wickets: 0, balls: ['1', '0', '4', '0', '1', '0'] },
            { overNum: 2, bowlerName: 'Ramswaroop Sangwa', runs: 7, wickets: 1, balls: ['1', '0', 'W', '4', '1', '1'] },
            { overNum: 3, bowlerName: 'Surendra Sangwa', runs: 8, wickets: 1, balls: ['0', '6', '1', 'W', '1', '0'] },
            { overNum: 4, bowlerName: 'Ronak Sangwa', runs: 9, wickets: 0, balls: ['1', '2', '4', '1', '1', '0'] },
            { overNum: 5, bowlerName: 'Ramswaroop Sangwa', runs: 8, wickets: 1, balls: ['1', '1', 'W', '2', '2', '2'] }
          ]
        },
        {
          inningNumber: 2,
          battingTeam: { name: 'Sangwa Strikers', runs: 33, wickets: 4, overs: '5.0' },
          bowlingTeam: { name: 'Sadokan Super Kings' },
          totalLegalBalls: 30,
          allBatters: [
            { name: 'Naresh Choudhary', runs: 16, balls: 12, fours: 2, sixes: 0, isOut: true, outDesc: 'b Sunil', strikeRate: '133.3' },
            { name: 'Surendra Sangwa', runs: 9, balls: 8, fours: 1, sixes: 0, isOut: true, outDesc: 'c Bhagat b Ganpat', strikeRate: '112.5' },
            { name: 'Ramswaroop Sangwa', runs: 5, balls: 6, fours: 0, sixes: 0, isOut: true, outDesc: 'b Rakesh', strikeRate: '83.3' },
            { name: 'Ronak Sangwa', runs: 2, balls: 3, fours: 0, sixes: 0, isOut: true, outDesc: 'c Sunli b Bhagat', strikeRate: '66.7' },
            { name: 'Harendra Sangwa', runs: 1, balls: 1, fours: 0, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '100.0' }
          ],
          bowling: [
            { name: 'Sunil Choudhary', overs: '2.0', runs: 12, wickets: 1, maidens: 0, econ: '6.00', balls: 12 },
            { name: 'Ganpat Sangwa', overs: '1.0', runs: 8, wickets: 1, maidens: 0, econ: '8.00', balls: 6 },
            { name: 'Rakesh Sangwa', overs: '1.0', runs: 6, wickets: 1, maidens: 0, econ: '6.00', balls: 6 },
            { name: 'Bhagat Sangwa', overs: '1.0', runs: 7, wickets: 1, maidens: 0, econ: '7.00', balls: 6 }
          ],
          overHistory: [
            { overNum: 1, bowlerName: 'Sunil Choudhary', runs: 5, wickets: 0, balls: ['1', '0', '4', '0', '0', '0'] },
            { overNum: 2, bowlerName: 'Ganpat Sangwa', runs: 8, wickets: 1, balls: ['1', '4', '1', 'W', '1', '1'] },
            { overNum: 3, bowlerName: 'Rakesh Sangwa', runs: 6, wickets: 1, balls: ['1', '0', 'W', '4', '0', '1'] },
            { overNum: 4, bowlerName: 'Bhagat Sangwa', runs: 7, wickets: 1, balls: ['2', '0', 'W', '1', '2', '2'] },
            { overNum: 5, bowlerName: 'Sunil Choudhary', runs: 7, wickets: 1, balls: ['1', '1', 'W', '1', '2', '2'] }
          ]
        }
      ]
    }
  },

  // ─── MATCH 2: SDR (44/3) vs MWC (45/2) ───
  {
    id: 'f1020002-190e-4125-8a10-ce4de1bc8e02',
    matchNumber: 2,
    matchNo: 2,
    stage: 'Match 2',
    matchTitle: 'Sadokan Royals vs Marwar Champions',
    overs: 5,
    maxOvers: 5,
    venue: 'Sadokan Cricket Ground',
    dateStr: 'Completed • Day 1',
    status: 'FINISHED',
    phase: 'result',
    winnerTeamName: 'Marwar Champions',
    winner: 'Marwar Champions',
    resultText: 'Marwar Champions won by 3 wickets',
    result: 'Marwar Champions won by 3 wickets',
    team1: {
      name: 'Sadokan Royals',
      shortName: 'SDR',
      runs: 44,
      wickets: 3,
      overs: '5.0',
      score: '44-3 (5.0)',
      logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469244/spl_team_sdr_logo.jpg'
    },
    team2: {
      name: 'Marwar Champions',
      shortName: 'MWC',
      runs: 45,
      wickets: 2,
      overs: '4.4',
      score: '45-2 (4.4)',
      logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469253/spl_team_mwc_logo.jpg'
    },
    rawMatchData: {
      id: 'f1020002-190e-4125-8a10-ce4de1bc8e02',
      matchTitle: 'Sadokan Royals vs Marwar Champions',
      venue: 'Sadokan Cricket Ground',
      phase: 'result',
      status: 'FINISHED',
      maxOvers: 5,
      winnerTeamName: 'Marwar Champions',
      resultText: 'Marwar Champions won by 3 wickets',
      innings: [
        {
          inningNumber: 1,
          battingTeam: { name: 'Sadokan Royals', runs: 44, wickets: 3, overs: '5.0' },
          bowlingTeam: { name: 'Marwar Champions' },
          totalLegalBalls: 30,
          allBatters: [
            { name: 'Vikas Khoja', runs: 22, balls: 12, fours: 2, sixes: 1, isOut: true, outDesc: 'c Abhishek S b Sharma', strikeRate: '183.3' },
            { name: 'Bhinvraj Sangwa', runs: 14, balls: 9, fours: 1, sixes: 1, isOut: true, outDesc: 'b Abhishek Sharma', strikeRate: '155.6' },
            { name: 'Pralhad Sangwa', runs: 5, balls: 5, fours: 0, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '100.0' },
            { name: 'Mohit Sangwa', runs: 2, balls: 4, fours: 0, sixes: 0, isOut: true, outDesc: 'run out', strikeRate: '50.0' }
          ],
          bowling: [
            { name: 'Abhishek Sharma', overs: '2.0', runs: 14, wickets: 2, maidens: 0, econ: '7.00', balls: 12 },
            { name: 'Ramchandra Sangwa', overs: '2.0', runs: 18, wickets: 0, maidens: 0, econ: '9.00', balls: 12 },
            { name: 'Dashrath Sangwa', overs: '1.0', runs: 12, wickets: 0, maidens: 0, econ: '12.00', balls: 6 }
          ],
          overHistory: [
            { overNum: 1, bowlerName: 'Abhishek Sharma', runs: 6, wickets: 1, balls: ['1', '4', 'W', '0', '1', '0'] },
            { overNum: 2, bowlerName: 'Ramchandra Sangwa', runs: 9, wickets: 0, balls: ['1', '6', '1', '0', '1', '0'] },
            { overNum: 3, bowlerName: 'Dashrath Sangwa', runs: 12, wickets: 0, balls: ['4', '1', '4', '1', '1', '1'] },
            { overNum: 4, bowlerName: 'Abhishek Sharma', runs: 8, wickets: 1, balls: ['0', '6', '1', 'W', '1', '0'] },
            { overNum: 5, bowlerName: 'Ramchandra Sangwa', runs: 9, wickets: 1, balls: ['1', '1', 'W', '2', '1', '4'] }
          ]
        },
        {
          inningNumber: 2,
          battingTeam: { name: 'Marwar Champions', runs: 45, wickets: 2, overs: '4.4' },
          bowlingTeam: { name: 'Sadokan Royals' },
          totalLegalBalls: 28,
          allBatters: [
            { name: 'Abhishek Sharma', runs: 26, balls: 14, fours: 3, sixes: 1, isOut: false, outDesc: 'not out', strikeRate: '185.7' },
            { name: 'Abhishek sangwa', runs: 12, balls: 8, fours: 1, sixes: 0, isOut: true, outDesc: 'c Vikas b Basti Ram', strikeRate: '150.0' },
            { name: 'Dashrath Sangwa', runs: 5, balls: 5, fours: 0, sixes: 0, isOut: true, outDesc: 'c Bhinvraj b Mohit', strikeRate: '100.0' },
            { name: 'Ramchandra Sangwa', runs: 2, balls: 1, fours: 0, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '200.0' }
          ],
          bowling: [
            { name: 'Basti Ram Suthar', overs: '2.0', runs: 16, wickets: 1, maidens: 0, econ: '8.00', balls: 12 },
            { name: 'Mohit Sangwa', overs: '1.4', runs: 15, wickets: 1, maidens: 0, econ: '9.00', balls: 10 },
            { name: 'Vikas Khoja', overs: '1.0', runs: 14, wickets: 0, maidens: 0, econ: '14.00', balls: 6 }
          ],
          overHistory: [
            { overNum: 1, bowlerName: 'Basti Ram Suthar', runs: 7, wickets: 1, balls: ['1', '4', 'W', '1', '1', '0'] },
            { overNum: 2, bowlerName: 'Mohit Sangwa', runs: 8, wickets: 0, balls: ['1', '1', '4', '1', '1', '0'] },
            { overNum: 3, bowlerName: 'Vikas Khoja', runs: 14, wickets: 0, balls: ['6', '1', '4', '1', '1', '1'] },
            { overNum: 4, bowlerName: 'Basti Ram Suthar', runs: 9, wickets: 0, balls: ['1', '4', '1', '1', '1', '1'] },
            { overNum: 5, bowlerName: 'Mohit Sangwa', runs: 7, wickets: 1, balls: ['1', 'W', '2', '4'] }
          ]
        }
      ]
    }
  },

  // ─── MATCH 3: SSK (52/2) vs SDR (41/4) ───
  {
    id: 'f1030003-190e-4125-8a10-ce4de1bc8e03',
    matchNumber: 3,
    matchNo: 3,
    stage: 'Match 3',
    matchTitle: 'Sadokan Super Kings vs Sadokan Royals',
    overs: 5,
    maxOvers: 5,
    venue: 'Sadokan Cricket Ground',
    dateStr: 'Completed • Day 2',
    status: 'FINISHED',
    phase: 'result',
    winnerTeamName: 'Sadokan Super Kings',
    winner: 'Sadokan Super Kings',
    resultText: 'Sadokan Super Kings won by 11 runs',
    result: 'Sadokan Super Kings won by 11 runs',
    team1: {
      name: 'Sadokan Super Kings',
      shortName: 'SSK',
      runs: 52,
      wickets: 2,
      overs: '5.0',
      score: '52-2 (5.0)',
      logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469238/spl_team_ssk_logo.jpg'
    },
    team2: {
      name: 'Sadokan Royals',
      shortName: 'SDR',
      runs: 41,
      wickets: 4,
      overs: '5.0',
      score: '41-4 (5.0)',
      logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469244/spl_team_sdr_logo.jpg'
    },
    rawMatchData: {
      id: 'f1030003-190e-4125-8a10-ce4de1bc8e03',
      matchTitle: 'Sadokan Super Kings vs Sadokan Royals',
      venue: 'Sadokan Cricket Ground',
      phase: 'result',
      status: 'FINISHED',
      maxOvers: 5,
      winnerTeamName: 'Sadokan Super Kings',
      resultText: 'Sadokan Super Kings won by 11 runs',
      innings: [
        {
          inningNumber: 1,
          battingTeam: { name: 'Sadokan Super Kings', runs: 52, wickets: 2, overs: '5.0' },
          bowlingTeam: { name: 'Sadokan Royals' },
          totalLegalBalls: 30,
          allBatters: [
            { name: 'Sunil Choudhary', runs: 31, balls: 16, fours: 3, sixes: 2, isOut: false, outDesc: 'not out', strikeRate: '193.8' },
            { name: 'Sunli Sangwa', runs: 16, balls: 10, fours: 2, sixes: 0, isOut: true, outDesc: 'c Pralhad b Vikas', strikeRate: '160.0' },
            { name: 'Bhagat Sangwa', runs: 3, balls: 4, fours: 0, sixes: 0, isOut: true, outDesc: 'b Basti Ram', strikeRate: '75.0' }
          ],
          bowling: [
            { name: 'Vikas Khoja', overs: '2.0', runs: 18, wickets: 1, maidens: 0, econ: '9.00', balls: 12 },
            { name: 'Basti Ram Suthar', overs: '2.0', runs: 20, wickets: 1, maidens: 0, econ: '10.00', balls: 12 },
            { name: 'Bhinvraj Sangwa', overs: '1.0', runs: 14, wickets: 0, maidens: 0, econ: '14.00', balls: 6 }
          ],
          overHistory: [
            { overNum: 1, bowlerName: 'Vikas Khoja', runs: 8, wickets: 0, balls: ['1', '4', '1', '1', '1', '0'] },
            { overNum: 2, bowlerName: 'Basti Ram Suthar', runs: 11, wickets: 1, balls: ['1', '6', 'W', '2', '1', '1'] },
            { overNum: 3, bowlerName: 'Bhinvraj Sangwa', runs: 14, wickets: 0, balls: ['6', '1', '4', '1', '1', '1'] },
            { overNum: 4, bowlerName: 'Vikas Khoja', runs: 10, wickets: 1, balls: ['0', '6', '1', 'W', '1', '2'] },
            { overNum: 5, bowlerName: 'Basti Ram Suthar', runs: 9, wickets: 0, balls: ['1', '4', '1', '1', '1', '1'] }
          ]
        },
        {
          inningNumber: 2,
          battingTeam: { name: 'Sadokan Royals', runs: 41, wickets: 4, overs: '5.0' },
          bowlingTeam: { name: 'Sadokan Super Kings' },
          totalLegalBalls: 30,
          allBatters: [
            { name: 'Pralhad Sangwa', runs: 18, balls: 11, fours: 2, sixes: 0, isOut: true, outDesc: 'c Sunil b Bhagat', strikeRate: '163.6' },
            { name: 'Vikas Khoja', runs: 11, balls: 8, fours: 1, sixes: 0, isOut: true, outDesc: 'b Ganpat', strikeRate: '137.5' },
            { name: 'Bhinvraj Sangwa', runs: 7, balls: 6, fours: 1, sixes: 0, isOut: true, outDesc: 'b Bhagat', strikeRate: '116.7' },
            { name: 'Mohit Sangwa', runs: 3, balls: 4, fours: 0, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '75.0' }
          ],
          bowling: [
            { name: 'Bhagat Sangwa', overs: '2.0', runs: 12, wickets: 2, maidens: 0, econ: '6.00', balls: 12 },
            { name: 'Ganpat Sangwa', overs: '2.0', runs: 16, wickets: 1, maidens: 0, econ: '8.00', balls: 12 },
            { name: 'Sunil Choudhary', overs: '1.0', runs: 13, wickets: 0, maidens: 0, econ: '13.00', balls: 6 }
          ],
          overHistory: [
            { overNum: 1, bowlerName: 'Bhagat Sangwa', runs: 5, wickets: 1, balls: ['1', '0', 'W', '1', '2', '1'] },
            { overNum: 2, bowlerName: 'Ganpat Sangwa', runs: 8, wickets: 1, balls: ['1', '4', '1', 'W', '1', '1'] },
            { overNum: 3, bowlerName: 'Sunil Choudhary', runs: 13, wickets: 0, balls: ['4', '1', '4', '2', '1', '1'] },
            { overNum: 4, bowlerName: 'Bhagat Sangwa', runs: 7, wickets: 1, balls: ['1', '1', 'W', '2', '2', '1'] },
            { overNum: 5, bowlerName: 'Ganpat Sangwa', runs: 8, wickets: 0, balls: ['1', '2', '1', '2', '1', '1'] }
          ]
        }
      ]
    }
  },

  // ─── MATCH 4: STR (40/4) vs NGT (41/3) ───
  {
    id: 'f1040004-190e-4125-8a10-ce4de1bc8e04',
    matchNumber: 4,
    matchNo: 4,
    stage: 'Match 4',
    matchTitle: 'Sangwa Strikers vs Nagaur Titans',
    overs: 5,
    maxOvers: 5,
    venue: 'Sadokan Cricket Ground',
    dateStr: 'Completed • Day 2',
    status: 'FINISHED',
    phase: 'result',
    winnerTeamName: 'Nagaur Titans',
    winner: 'Nagaur Titans',
    resultText: 'Nagaur Titans won by 2 wickets',
    result: 'Nagaur Titans won by 2 wickets',
    team1: {
      name: 'Sangwa Strikers',
      shortName: 'STR',
      runs: 40,
      wickets: 4,
      overs: '5.0',
      score: '40-4 (5.0)',
      logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469248/spl_team_str_logo.jpg'
    },
    team2: {
      name: 'Nagaur Titans',
      shortName: 'NGT',
      runs: 41,
      wickets: 3,
      overs: '4.3',
      score: '41-3 (4.3)',
      logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469258/spl_team_ngt_logo.jpg'
    },
    rawMatchData: {
      id: 'f1040004-190e-4125-8a10-ce4de1bc8e04',
      matchTitle: 'Sangwa Strikers vs Nagaur Titans',
      venue: 'Sadokan Cricket Ground',
      phase: 'result',
      status: 'FINISHED',
      maxOvers: 5,
      winnerTeamName: 'Nagaur Titans',
      resultText: 'Nagaur Titans won by 2 wickets',
      innings: [
        {
          inningNumber: 1,
          battingTeam: { name: 'Sangwa Strikers', runs: 40, wickets: 4, overs: '5.0' },
          bowlingTeam: { name: 'Nagaur Titans' },
          totalLegalBalls: 30,
          allBatters: [
            { name: 'Naresh Choudhary', runs: 20, balls: 13, fours: 2, sixes: 1, isOut: true, outDesc: 'c Mohit b Laxman', strikeRate: '153.8' },
            { name: 'Surendra Sangwa', runs: 10, balls: 7, fours: 1, sixes: 0, isOut: true, outDesc: 'b Laxman', strikeRate: '142.9' },
            { name: 'Ramswaroop Sangwa', runs: 6, balls: 6, fours: 0, sixes: 0, isOut: true, outDesc: 'b Mohit sadokan', strikeRate: '100.0' },
            { name: 'Ronak Sangwa', runs: 2, balls: 4, fours: 0, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '50.0' }
          ],
          bowling: [
            { name: 'Laxman Sen', overs: '2.0', runs: 12, wickets: 2, maidens: 0, econ: '6.00', balls: 12 },
            { name: 'Mohit sadokan', overs: '2.0', runs: 16, wickets: 1, maidens: 0, econ: '8.00', balls: 12 },
            { name: 'Shivpal Khoja', overs: '1.0', runs: 12, wickets: 0, maidens: 0, econ: '12.00', balls: 6 }
          ],
          overHistory: [
            { overNum: 1, bowlerName: 'Laxman Sen', runs: 5, wickets: 1, balls: ['1', '0', 'W', '2', '1', '1'] },
            { overNum: 2, bowlerName: 'Mohit sadokan', runs: 8, wickets: 1, balls: ['1', '4', '1', 'W', '1', '1'] },
            { overNum: 3, bowlerName: 'Shivpal Khoja', runs: 12, wickets: 0, balls: ['4', '1', '4', '1', '1', '1'] },
            { overNum: 4, bowlerName: 'Laxman Sen', runs: 7, wickets: 1, balls: ['1', '0', 'W', '2', '2', '2'] },
            { overNum: 5, bowlerName: 'Mohit sadokan', runs: 8, wickets: 0, balls: ['1', '2', '1', '2', '1', '1'] }
          ]
        },
        {
          inningNumber: 2,
          battingTeam: { name: 'Nagaur Titans', runs: 41, wickets: 3, overs: '4.3' },
          bowlingTeam: { name: 'Sangwa Strikers' },
          totalLegalBalls: 27,
          allBatters: [
            { name: 'Mohit sadokan', runs: 19, balls: 11, fours: 2, sixes: 1, isOut: true, outDesc: 'c Naresh b Surendra', strikeRate: '172.7' },
            { name: 'Akshay Sangwa', runs: 14, balls: 9, fours: 1, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '155.6' },
            { name: 'Anurag Sangwa', runs: 5, balls: 5, fours: 0, sixes: 0, isOut: true, outDesc: 'b Surendra', strikeRate: '100.0' },
            { name: 'Laxman Sen', runs: 2, balls: 2, fours: 0, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '100.0' }
          ],
          bowling: [
            { name: 'Surendra Sangwa', overs: '2.0', runs: 16, wickets: 2, maidens: 0, econ: '8.00', balls: 12 },
            { name: 'Ramswaroop Sangwa', overs: '1.3', runs: 14, wickets: 0, maidens: 0, econ: '9.33', balls: 9 },
            { name: 'Harendra Sangwa', overs: '1.0', runs: 11, wickets: 0, maidens: 0, econ: '11.00', balls: 6 }
          ],
          overHistory: [
            { overNum: 1, bowlerName: 'Surendra Sangwa', runs: 7, wickets: 1, balls: ['1', '4', 'W', '1', '1', '0'] },
            { overNum: 2, bowlerName: 'Ramswaroop Sangwa', runs: 8, wickets: 0, balls: ['1', '1', '4', '1', '1', '0'] },
            { overNum: 3, bowlerName: 'Harendra Sangwa', runs: 11, wickets: 0, balls: ['4', '1', '4', '1', '1', '0'] },
            { overNum: 4, bowlerName: 'Surendra Sangwa', runs: 9, wickets: 1, balls: ['1', '4', 'W', '2', '1', '1'] },
            { overNum: 5, bowlerName: 'Ramswaroop Sangwa', runs: 6, wickets: 0, balls: ['2', '0', '4'] }
          ]
        }
      ]
    }
  },

  // ─── MATCH 5: MWC (47/3) vs SSK (48/1) ───
  {
    id: 'f1050005-190e-4125-8a10-ce4de1bc8e05',
    matchNumber: 5,
    matchNo: 5,
    stage: 'Match 5',
    matchTitle: 'Marwar Champions vs Sadokan Super Kings',
    overs: 5,
    maxOvers: 5,
    venue: 'Sadokan Cricket Ground',
    dateStr: 'Completed • Day 3',
    status: 'FINISHED',
    phase: 'result',
    winnerTeamName: 'Sadokan Super Kings',
    winner: 'Sadokan Super Kings',
    resultText: 'Sadokan Super Kings won by 4 wickets',
    result: 'Sadokan Super Kings won by 4 wickets',
    team1: {
      name: 'Marwar Champions',
      shortName: 'MWC',
      runs: 47,
      wickets: 3,
      overs: '5.0',
      score: '47-3 (5.0)',
      logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469253/spl_team_mwc_logo.jpg'
    },
    team2: {
      name: 'Sadokan Super Kings',
      shortName: 'SSK',
      runs: 48,
      wickets: 1,
      overs: '4.2',
      score: '48-1 (4.2)',
      logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469238/spl_team_ssk_logo.jpg'
    },
    rawMatchData: {
      id: 'f1050005-190e-4125-8a10-ce4de1bc8e05',
      matchTitle: 'Marwar Champions vs Sadokan Super Kings',
      venue: 'Sadokan Cricket Ground',
      phase: 'result',
      status: 'FINISHED',
      maxOvers: 5,
      winnerTeamName: 'Sadokan Super Kings',
      resultText: 'Sadokan Super Kings won by 4 wickets',
      innings: [
        {
          inningNumber: 1,
          battingTeam: { name: 'Marwar Champions', runs: 47, wickets: 3, overs: '5.0' },
          bowlingTeam: { name: 'Sadokan Super Kings' },
          totalLegalBalls: 30,
          allBatters: [
            { name: 'Abhishek Sharma', runs: 24, balls: 13, fours: 3, sixes: 1, isOut: true, outDesc: 'c Ganpat b Sunil', strikeRate: '184.6' },
            { name: 'Dashrath Sangwa', runs: 15, balls: 9, fours: 2, sixes: 0, isOut: true, outDesc: 'b Bhagat', strikeRate: '166.7' },
            { name: 'Abhishek sangwa', runs: 6, balls: 5, fours: 0, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '120.0' },
            { name: 'Ramchandra Sangwa', runs: 1, balls: 3, fours: 0, sixes: 0, isOut: true, outDesc: 'b Rakesh', strikeRate: '33.3' }
          ],
          bowling: [
            { name: 'Sunil Choudhary', overs: '2.0', runs: 16, wickets: 1, maidens: 0, econ: '8.00', balls: 12 },
            { name: 'Bhagat Sangwa', overs: '1.0', runs: 8, wickets: 1, maidens: 0, econ: '8.00', balls: 6 },
            { name: 'Rakesh Sangwa', overs: '1.0', runs: 9, wickets: 1, maidens: 0, econ: '9.00', balls: 6 },
            { name: 'Ganpat Sangwa', overs: '1.0', runs: 14, wickets: 0, maidens: 0, econ: '14.00', balls: 6 }
          ],
          overHistory: [
            { overNum: 1, bowlerName: 'Sunil Choudhary', runs: 7, wickets: 0, balls: ['1', '4', '1', '0', '1', '0'] },
            { overNum: 2, bowlerName: 'Bhagat Sangwa', runs: 8, wickets: 1, balls: ['1', '4', 'W', '1', '1', '1'] },
            { overNum: 3, bowlerName: 'Ganpat Sangwa', runs: 14, wickets: 0, balls: ['6', '1', '4', '1', '1', '1'] },
            { overNum: 4, bowlerName: 'Rakesh Sangwa', runs: 9, wickets: 1, balls: ['1', '4', 'W', '2', '1', '1'] },
            { overNum: 5, bowlerName: 'Sunil Choudhary', runs: 9, wickets: 1, balls: ['1', '4', 'W', '2', '1', '1'] }
          ]
        },
        {
          inningNumber: 2,
          battingTeam: { name: 'Sadokan Super Kings', runs: 48, wickets: 1, overs: '4.2' },
          bowlingTeam: { name: 'Marwar Champions' },
          totalLegalBalls: 26,
          allBatters: [
            { name: 'Sunil Choudhary', runs: 28, balls: 13, fours: 3, sixes: 2, isOut: false, outDesc: 'not out', strikeRate: '215.4' },
            { name: 'Sunli Sangwa', runs: 18, balls: 11, fours: 2, sixes: 1, isOut: false, outDesc: 'not out', strikeRate: '163.6' },
            { name: 'Bhagat Sangwa', runs: 1, balls: 2, fours: 0, sixes: 0, isOut: true, outDesc: 'c Abhishek b Ramchandra', strikeRate: '50.0' }
          ],
          bowling: [
            { name: 'Ramchandra Sangwa', overs: '2.0', runs: 20, wickets: 1, maidens: 0, econ: '10.00', balls: 12 },
            { name: 'Abhishek Sharma', overs: '1.2', runs: 16, wickets: 0, maidens: 0, econ: '12.00', balls: 8 },
            { name: 'Dashrath Sangwa', overs: '1.0', runs: 12, wickets: 0, maidens: 0, econ: '12.00', balls: 6 }
          ],
          overHistory: [
            { overNum: 1, bowlerName: 'Ramchandra Sangwa', runs: 9, wickets: 1, balls: ['1', '4', 'W', '2', '1', '1'] },
            { overNum: 2, bowlerName: 'Abhishek Sharma', runs: 10, wickets: 0, balls: ['1', '6', '1', '1', '1', '0'] },
            { overNum: 3, bowlerName: 'Dashrath Sangwa', runs: 12, wickets: 0, balls: ['4', '1', '4', '1', '1', '1'] },
            { overNum: 4, bowlerName: 'Ramchandra Sangwa', runs: 11, wickets: 0, balls: ['6', '1', '1', '2', '1', '0'] },
            { overNum: 5, bowlerName: 'Abhishek Sharma', runs: 6, wickets: 0, balls: ['2', '4'] }
          ]
        }
      ]
    }
  },

  // ─── MATCH 6: SDR (46/2) vs NGT (38/4) ───
  {
    id: 'f1060006-190e-4125-8a10-ce4de1bc8e06',
    matchNumber: 6,
    matchNo: 6,
    stage: 'Match 6',
    matchTitle: 'Sadokan Royals vs Nagaur Titans',
    overs: 5,
    maxOvers: 5,
    venue: 'Sadokan Cricket Ground',
    dateStr: 'Completed • Day 3',
    status: 'FINISHED',
    phase: 'result',
    winnerTeamName: 'Sadokan Royals',
    winner: 'Sadokan Royals',
    resultText: 'Sadokan Royals won by 8 runs',
    result: 'Sadokan Royals won by 8 runs',
    team1: {
      name: 'Sadokan Royals',
      shortName: 'SDR',
      runs: 46,
      wickets: 2,
      overs: '5.0',
      score: '46-2 (5.0)',
      logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469244/spl_team_sdr_logo.jpg'
    },
    team2: {
      name: 'Nagaur Titans',
      shortName: 'NGT',
      runs: 38,
      wickets: 4,
      overs: '5.0',
      score: '38-4 (5.0)',
      logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469258/spl_team_ngt_logo.jpg'
    },
    rawMatchData: {
      id: 'f1060006-190e-4125-8a10-ce4de1bc8e06',
      matchTitle: 'Sadokan Royals vs Nagaur Titans',
      venue: 'Sadokan Cricket Ground',
      phase: 'result',
      status: 'FINISHED',
      maxOvers: 5,
      winnerTeamName: 'Sadokan Royals',
      resultText: 'Sadokan Royals won by 8 runs',
      innings: [
        {
          inningNumber: 1,
          battingTeam: { name: 'Sadokan Royals', runs: 46, wickets: 2, overs: '5.0' },
          bowlingTeam: { name: 'Nagaur Titans' },
          totalLegalBalls: 30,
          allBatters: [
            { name: 'Vikas Khoja', runs: 25, balls: 14, fours: 3, sixes: 1, isOut: true, outDesc: 'c Anurag b Laxman', strikeRate: '178.6' },
            { name: 'Mohit Sangwa', runs: 15, balls: 9, fours: 2, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '166.7' },
            { name: 'Bhinvraj Sangwa', runs: 5, balls: 7, fours: 0, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '71.4' }
          ],
          bowling: [
            { name: 'Laxman Sen', overs: '2.0', runs: 16, wickets: 1, maidens: 0, econ: '8.00', balls: 12 },
            { name: 'Mohit sadokan', overs: '2.0', runs: 18, wickets: 0, maidens: 0, econ: '9.00', balls: 12 },
            { name: 'Shivpal Khoja', overs: '1.0', runs: 12, wickets: 0, maidens: 0, econ: '12.00', balls: 6 }
          ],
          overHistory: [
            { overNum: 1, bowlerName: 'Laxman Sen', runs: 7, wickets: 0, balls: ['1', '4', '1', '0', '1', '0'] },
            { overNum: 2, bowlerName: 'Mohit sadokan', runs: 9, wickets: 0, balls: ['1', '4', '1', '1', '1', '1'] },
            { overNum: 3, bowlerName: 'Shivpal Khoja', runs: 12, wickets: 0, balls: ['4', '1', '4', '1', '1', '1'] },
            { overNum: 4, bowlerName: 'Laxman Sen', runs: 9, wickets: 1, balls: ['1', '6', 'W', '1', '1', '0'] },
            { overNum: 5, bowlerName: 'Mohit sadokan', runs: 9, wickets: 0, balls: ['1', '4', '1', '1', '1', '1'] }
          ]
        },
        {
          inningNumber: 2,
          battingTeam: { name: 'Nagaur Titans', runs: 38, wickets: 4, overs: '5.0' },
          bowlingTeam: { name: 'Sadokan Royals' },
          totalLegalBalls: 30,
          allBatters: [
            { name: 'Anurag Sangwa', runs: 16, balls: 10, fours: 2, sixes: 0, isOut: true, outDesc: 'b Basti Ram', strikeRate: '160.0' },
            { name: 'Mohit sadokan', runs: 11, balls: 8, fours: 1, sixes: 0, isOut: true, outDesc: 'c Vikas b Bhinvraj', strikeRate: '137.5' },
            { name: 'Akshay Sangwa', runs: 6, balls: 7, fours: 0, sixes: 0, isOut: true, outDesc: 'b Basti Ram', strikeRate: '85.7' },
            { name: 'Shivpal Khoja', runs: 3, balls: 3, fours: 0, sixes: 0, isOut: true, outDesc: 'b Bhinvraj', strikeRate: '100.0' },
            { name: 'Laxman Sen', runs: 1, balls: 2, fours: 0, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '50.0' }
          ],
          bowling: [
            { name: 'Basti Ram Suthar', overs: '2.0', runs: 14, wickets: 2, maidens: 0, econ: '7.00', balls: 12 },
            { name: 'Bhinvraj Sangwa', overs: '2.0', runs: 15, wickets: 2, maidens: 0, econ: '7.50', balls: 12 },
            { name: 'Pralhad Sangwa', overs: '1.0', runs: 9, wickets: 0, maidens: 0, econ: '9.00', balls: 6 }
          ],
          overHistory: [
            { overNum: 1, bowlerName: 'Basti Ram Suthar', runs: 6, wickets: 1, balls: ['1', '0', 'W', '4', '1', '0'] },
            { overNum: 2, bowlerName: 'Bhinvraj Sangwa', runs: 7, wickets: 1, balls: ['1', '4', 'W', '1', '1', '0'] },
            { overNum: 3, bowlerName: 'Pralhad Sangwa', runs: 9, wickets: 0, balls: ['4', '1', '1', '1', '1', '1'] },
            { overNum: 4, bowlerName: 'Basti Ram Suthar', runs: 8, wickets: 1, balls: ['1', '4', 'W', '1', '1', '1'] },
            { overNum: 5, bowlerName: 'Bhinvraj Sangwa', runs: 8, wickets: 1, balls: ['1', '1', 'W', '2', '2', '2'] }
          ]
        }
      ]
    }
  },

  // ─── MATCH 7: SSK (43/4) vs NGT (44/3) ───
  {
    id: 'f1070007-190e-4125-8a10-ce4de1bc8e07',
    matchNumber: 7,
    matchNo: 7,
    stage: 'Match 7',
    matchTitle: 'Sadokan Super Kings vs Nagaur Titans',
    overs: 5,
    maxOvers: 5,
    venue: 'Sadokan Cricket Ground',
    dateStr: 'Completed • Day 4',
    status: 'FINISHED',
    phase: 'result',
    winnerTeamName: 'Nagaur Titans',
    winner: 'Nagaur Titans',
    resultText: 'Nagaur Titans won by 2 wickets',
    result: 'Nagaur Titans won by 2 wickets',
    team1: {
      name: 'Sadokan Super Kings',
      shortName: 'SSK',
      runs: 43,
      wickets: 4,
      overs: '5.0',
      score: '43-4 (5.0)',
      logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469238/spl_team_ssk_logo.jpg'
    },
    team2: {
      name: 'Nagaur Titans',
      shortName: 'NGT',
      runs: 44,
      wickets: 3,
      overs: '4.5',
      score: '44-3 (4.5)',
      logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469258/spl_team_ngt_logo.jpg'
    },
    rawMatchData: {
      id: 'f1070007-190e-4125-8a10-ce4de1bc8e07',
      matchTitle: 'Sadokan Super Kings vs Nagaur Titans',
      venue: 'Sadokan Cricket Ground',
      phase: 'result',
      status: 'FINISHED',
      maxOvers: 5,
      winnerTeamName: 'Nagaur Titans',
      resultText: 'Nagaur Titans won by 2 wickets',
      innings: [
        {
          inningNumber: 1,
          battingTeam: { name: 'Sadokan Super Kings', runs: 43, wickets: 4, overs: '5.0' },
          bowlingTeam: { name: 'Nagaur Titans' },
          totalLegalBalls: 30,
          allBatters: [
            { name: 'Bhagat Sangwa', runs: 21, balls: 12, fours: 2, sixes: 1, isOut: true, outDesc: 'c Akshay b Laxman', strikeRate: '175.0' },
            { name: 'Sunil Choudhary', runs: 12, balls: 8, fours: 1, sixes: 0, isOut: true, outDesc: 'b Laxman', strikeRate: '150.0' },
            { name: 'Sunli Sangwa', runs: 7, balls: 6, fours: 1, sixes: 0, isOut: true, outDesc: 'c Mohit b Shivpal', strikeRate: '116.7' },
            { name: 'Ganpat Sangwa', runs: 2, balls: 4, fours: 0, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '50.0' }
          ],
          bowling: [
            { name: 'Laxman Sen', overs: '2.0', runs: 15, wickets: 2, maidens: 0, econ: '7.50', balls: 12 },
            { name: 'Shivpal Khoja', overs: '2.0', runs: 16, wickets: 1, maidens: 0, econ: '8.00', balls: 12 },
            { name: 'Mohit sadokan', overs: '1.0', runs: 12, wickets: 0, maidens: 0, econ: '12.00', balls: 6 }
          ],
          overHistory: [
            { overNum: 1, bowlerName: 'Laxman Sen', runs: 6, wickets: 1, balls: ['1', '4', 'W', '0', '1', '0'] },
            { overNum: 2, bowlerName: 'Shivpal Khoja', runs: 8, wickets: 1, balls: ['1', '4', 'W', '1', '1', '1'] },
            { overNum: 3, bowlerName: 'Mohit sadokan', runs: 12, wickets: 0, balls: ['6', '1', '1', '2', '1', '1'] },
            { overNum: 4, bowlerName: 'Laxman Sen', runs: 9, wickets: 1, balls: ['1', '4', 'W', '2', '1', '1'] },
            { overNum: 5, bowlerName: 'Shivpal Khoja', runs: 8, wickets: 0, balls: ['1', '2', '1', '2', '1', '1'] }
          ]
        },
        {
          inningNumber: 2,
          battingTeam: { name: 'Nagaur Titans', runs: 44, wickets: 3, overs: '4.5' },
          bowlingTeam: { name: 'Sadokan Super Kings' },
          totalLegalBalls: 29,
          allBatters: [
            { name: 'Mohit sadokan', runs: 22, balls: 14, fours: 3, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '157.1' },
            { name: 'Laxman Sen', runs: 12, balls: 8, fours: 1, sixes: 0, isOut: true, outDesc: 'b Ganpat', strikeRate: '150.0' },
            { name: 'Akshay Sangwa', runs: 6, balls: 5, fours: 1, sixes: 0, isOut: true, outDesc: 'c Sunli b Ganpat', strikeRate: '120.0' },
            { name: 'Anurag Sangwa', runs: 2, balls: 2, fours: 0, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '100.0' }
          ],
          bowling: [
            { name: 'Ganpat Sangwa', overs: '2.0', runs: 16, wickets: 2, maidens: 0, econ: '8.00', balls: 12 },
            { name: 'Sunil Choudhary', overs: '1.5', runs: 17, wickets: 0, maidens: 0, econ: '9.27', balls: 11 },
            { name: 'Bhagat Sangwa', overs: '1.0', runs: 11, wickets: 0, maidens: 0, econ: '11.00', balls: 6 }
          ],
          overHistory: [
            { overNum: 1, bowlerName: 'Ganpat Sangwa', runs: 7, wickets: 1, balls: ['1', '4', 'W', '1', '1', '0'] },
            { overNum: 2, bowlerName: 'Sunil Choudhary', runs: 9, wickets: 0, balls: ['1', '4', '1', '1', '1', '1'] },
            { overNum: 3, bowlerName: 'Bhagat Sangwa', runs: 11, wickets: 0, balls: ['4', '1', '4', '1', '1', '0'] },
            { overNum: 4, bowlerName: 'Ganpat Sangwa', runs: 9, wickets: 1, balls: ['1', '4', 'W', '2', '1', '1'] },
            { overNum: 5, bowlerName: 'Sunil Choudhary', runs: 8, wickets: 0, balls: ['1', '2', '1', '2', '2'] }
          ]
        }
      ]
    }
  },

  // ─── MATCH 8: STR (48/2) vs MWC (42/4) ───
  {
    id: 'f1080008-190e-4125-8a10-ce4de1bc8e08',
    matchNumber: 8,
    matchNo: 8,
    stage: 'Match 8',
    matchTitle: 'Sangwa Strikers vs Marwar Champions',
    overs: 5,
    maxOvers: 5,
    venue: 'Sadokan Cricket Ground',
    dateStr: 'Completed • Day 4',
    status: 'FINISHED',
    phase: 'result',
    winnerTeamName: 'Sangwa Strikers',
    winner: 'Sangwa Strikers',
    resultText: 'Sangwa Strikers won by 6 runs',
    result: 'Sangwa Strikers won by 6 runs',
    team1: {
      name: 'Sangwa Strikers',
      shortName: 'STR',
      runs: 48,
      wickets: 2,
      overs: '5.0',
      score: '48-2 (5.0)',
      logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469248/spl_team_str_logo.jpg'
    },
    team2: {
      name: 'Marwar Champions',
      shortName: 'MWC',
      runs: 42,
      wickets: 4,
      overs: '5.0',
      score: '42-4 (5.0)',
      logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469253/spl_team_mwc_logo.jpg'
    },
    rawMatchData: {
      id: 'f1080008-190e-4125-8a10-ce4de1bc8e08',
      matchTitle: 'Sangwa Strikers vs Marwar Champions',
      venue: 'Sadokan Cricket Ground',
      phase: 'result',
      status: 'FINISHED',
      maxOvers: 5,
      winnerTeamName: 'Sangwa Strikers',
      resultText: 'Sangwa Strikers won by 6 runs',
      innings: [
        {
          inningNumber: 1,
          battingTeam: { name: 'Sangwa Strikers', runs: 48, wickets: 2, overs: '5.0' },
          bowlingTeam: { name: 'Marwar Champions' },
          totalLegalBalls: 30,
          allBatters: [
            { name: 'Naresh Choudhary', runs: 27, balls: 15, fours: 3, sixes: 1, isOut: false, outDesc: 'not out', strikeRate: '180.0' },
            { name: 'Ramswaroop Sangwa', runs: 16, balls: 10, fours: 2, sixes: 0, isOut: true, outDesc: 'b Abhishek Sharma', strikeRate: '160.0' },
            { name: 'Surendra Sangwa', runs: 4, balls: 5, fours: 0, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '80.0' }
          ],
          bowling: [
            { name: 'Abhishek Sharma', overs: '2.0', runs: 17, wickets: 1, maidens: 0, econ: '8.50', balls: 12 },
            { name: 'Ramchandra Sangwa', overs: '2.0', runs: 19, wickets: 0, maidens: 0, econ: '9.50', balls: 12 },
            { name: 'Dashrath Sangwa', overs: '1.0', runs: 12, wickets: 0, maidens: 0, econ: '12.00', balls: 6 }
          ],
          overHistory: [
            { overNum: 1, bowlerName: 'Abhishek Sharma', runs: 7, wickets: 0, balls: ['1', '4', '1', '0', '1', '0'] },
            { overNum: 2, bowlerName: 'Ramchandra Sangwa', runs: 9, wickets: 0, balls: ['1', '4', '1', '1', '1', '1'] },
            { overNum: 3, bowlerName: 'Dashrath Sangwa', runs: 12, wickets: 0, balls: ['4', '1', '4', '1', '1', '1'] },
            { overNum: 4, bowlerName: 'Abhishek Sharma', runs: 10, wickets: 1, balls: ['1', '6', 'W', '1', '1', '1'] },
            { overNum: 5, bowlerName: 'Ramchandra Sangwa', runs: 10, wickets: 0, balls: ['1', '4', '1', '2', '1', '1'] }
          ]
        },
        {
          inningNumber: 2,
          battingTeam: { name: 'Marwar Champions', runs: 42, wickets: 4, overs: '5.0' },
          bowlingTeam: { name: 'Sangwa Strikers' },
          totalLegalBalls: 30,
          allBatters: [
            { name: 'Abhishek sangwa', runs: 19, balls: 12, fours: 2, sixes: 0, isOut: true, outDesc: 'c Naresh b Surendra', strikeRate: '158.3' },
            { name: 'Abhishek Sharma', runs: 12, balls: 8, fours: 1, sixes: 0, isOut: true, outDesc: 'b Surendra', strikeRate: '150.0' },
            { name: 'Dashrath Sangwa', runs: 7, balls: 6, fours: 1, sixes: 0, isOut: true, outDesc: 'b Harendra', strikeRate: '116.7' },
            { name: 'Ramchandra Sangwa', runs: 3, balls: 4, fours: 0, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '75.0' }
          ],
          bowling: [
            { name: 'Surendra Sangwa', overs: '2.0', runs: 14, wickets: 2, maidens: 0, econ: '7.00', balls: 12 },
            { name: 'Harendra Sangwa', overs: '2.0', runs: 16, wickets: 1, maidens: 0, econ: '8.00', balls: 12 },
            { name: 'Naresh Choudhary', overs: '1.0', runs: 12, wickets: 0, maidens: 0, econ: '12.00', balls: 6 }
          ],
          overHistory: [
            { overNum: 1, bowlerName: 'Surendra Sangwa', runs: 6, wickets: 1, balls: ['1', '0', 'W', '4', '1', '0'] },
            { overNum: 2, bowlerName: 'Harendra Sangwa', runs: 8, wickets: 1, balls: ['1', '4', 'W', '1', '1', '1'] },
            { overNum: 3, bowlerName: 'Naresh Choudhary', runs: 12, wickets: 0, balls: ['4', '1', '4', '1', '1', '1'] },
            { overNum: 4, bowlerName: 'Surendra Sangwa', runs: 8, wickets: 1, balls: ['1', '4', 'W', '1', '1', '1'] },
            { overNum: 5, bowlerName: 'Harendra Sangwa', runs: 8, wickets: 0, balls: ['1', '2', '1', '2', '1', '1'] }
          ]
        }
      ]
    }
  },

  // ─── MATCH 9: SDR (45/3) vs STR (46/3) ───
  {
    id: 'f1090009-190e-4125-8a10-ce4de1bc8e09',
    matchNumber: 9,
    matchNo: 9,
    stage: 'Match 9',
    matchTitle: 'Sadokan Royals vs Sangwa Strikers',
    overs: 5,
    maxOvers: 5,
    venue: 'Sadokan Cricket Ground',
    dateStr: 'Completed • Day 5',
    status: 'FINISHED',
    phase: 'result',
    winnerTeamName: 'Sangwa Strikers',
    winner: 'Sangwa Strikers',
    resultText: 'Sangwa Strikers won by 2 wickets',
    result: 'Sangwa Strikers won by 2 wickets',
    team1: {
      name: 'Sadokan Royals',
      shortName: 'SDR',
      runs: 45,
      wickets: 3,
      overs: '5.0',
      score: '45-3 (5.0)',
      logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469244/spl_team_sdr_logo.jpg'
    },
    team2: {
      name: 'Sangwa Strikers',
      shortName: 'STR',
      runs: 46,
      wickets: 3,
      overs: '4.4',
      score: '46-3 (4.4)',
      logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469248/spl_team_str_logo.jpg'
    },
    rawMatchData: {
      id: 'f1090009-190e-4125-8a10-ce4de1bc8e09',
      matchTitle: 'Sadokan Royals vs Sangwa Strikers',
      venue: 'Sadokan Cricket Ground',
      phase: 'result',
      status: 'FINISHED',
      maxOvers: 5,
      winnerTeamName: 'Sangwa Strikers',
      resultText: 'Sangwa Strikers won by 2 wickets',
      innings: [
        {
          inningNumber: 1,
          battingTeam: { name: 'Sadokan Royals', runs: 45, wickets: 3, overs: '5.0' },
          bowlingTeam: { name: 'Sangwa Strikers' },
          totalLegalBalls: 30,
          allBatters: [
            { name: 'Vikas Khoja', runs: 21, balls: 11, fours: 2, sixes: 1, isOut: true, outDesc: 'c Ronak b Naresh', strikeRate: '190.9' },
            { name: 'Pralhad Sangwa', runs: 17, balls: 10, fours: 2, sixes: 0, isOut: true, outDesc: 'b Naresh', strikeRate: '170.0' },
            { name: 'Bhinvraj Sangwa', runs: 5, balls: 5, fours: 0, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '100.0' },
            { name: 'Mohit Sangwa', runs: 1, balls: 4, fours: 0, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '25.0' }
          ],
          bowling: [
            { name: 'Naresh Choudhary', overs: '2.0', runs: 18, wickets: 2, maidens: 0, econ: '9.00', balls: 12 },
            { name: 'Surendra Sangwa', overs: '2.0', runs: 16, wickets: 0, maidens: 0, econ: '8.00', balls: 12 },
            { name: 'Ramswaroop Sangwa', overs: '1.0', runs: 11, wickets: 0, maidens: 0, econ: '11.00', balls: 6 }
          ],
          overHistory: [
            { overNum: 1, bowlerName: 'Naresh Choudhary', runs: 8, wickets: 0, balls: ['1', '4', '1', '1', '1', '0'] },
            { overNum: 2, bowlerName: 'Surendra Sangwa', runs: 8, wickets: 0, balls: ['1', '4', '1', '1', '1', '0'] },
            { overNum: 3, bowlerName: 'Ramswaroop Sangwa', runs: 11, wickets: 0, balls: ['4', '1', '4', '1', '1', '0'] },
            { overNum: 4, bowlerName: 'Naresh Choudhary', runs: 10, wickets: 2, balls: ['1', '6', 'W', 'W', '2', '1'] },
            { overNum: 5, bowlerName: 'Surendra Sangwa', runs: 8, wickets: 0, balls: ['1', '2', '1', '2', '1', '1'] }
          ]
        },
        {
          inningNumber: 2,
          battingTeam: { name: 'Sangwa Strikers', runs: 46, wickets: 3, overs: '4.4' },
          bowlingTeam: { name: 'Sadokan Royals' },
          totalLegalBalls: 28,
          allBatters: [
            { name: 'Surendra Sangwa', runs: 22, balls: 13, fours: 3, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '169.2' },
            { name: 'Ronak Sangwa', runs: 14, balls: 9, fours: 2, sixes: 0, isOut: true, outDesc: 'c Pralhad b Basti Ram', strikeRate: '155.6' },
            { name: 'Naresh Choudhary', runs: 7, balls: 4, fours: 1, sixes: 0, isOut: true, outDesc: 'b Vikas', strikeRate: '175.0' },
            { name: 'Ramswaroop Sangwa', runs: 2, balls: 2, fours: 0, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '100.0' }
          ],
          bowling: [
            { name: 'Basti Ram Suthar', overs: '2.0', runs: 18, wickets: 1, maidens: 0, econ: '9.00', balls: 12 },
            { name: 'Vikas Khoja', overs: '1.4', runs: 16, wickets: 1, maidens: 0, econ: '9.60', balls: 10 },
            { name: 'Bhinvraj Sangwa', overs: '1.0', runs: 12, wickets: 0, maidens: 0, econ: '12.00', balls: 6 }
          ],
          overHistory: [
            { overNum: 1, bowlerName: 'Basti Ram Suthar', runs: 8, wickets: 0, balls: ['1', '4', '1', '1', '1', '0'] },
            { overNum: 2, bowlerName: 'Vikas Khoja', runs: 9, wickets: 1, balls: ['1', '4', 'W', '1', '2', '1'] },
            { overNum: 3, bowlerName: 'Bhinvraj Sangwa', runs: 12, wickets: 0, balls: ['4', '1', '4', '1', '1', '1'] },
            { overNum: 4, bowlerName: 'Basti Ram Suthar', runs: 10, wickets: 1, balls: ['1', '4', 'W', '2', '2', '1'] },
            { overNum: 5, bowlerName: 'Vikas Khoja', runs: 7, wickets: 0, balls: ['1', '2', '2', '2'] }
          ]
        }
      ]
    }
  },

  // ─── UPCOMING MATCHES 10 to 13 ───
  {
    id: 'spl_match_10',
    matchNumber: 10,
    matchNo: 10,
    stage: 'Match 10',
    matchTitle: 'Marwar Champions vs Nagaur Titans',
    overs: 5,
    maxOvers: 5,
    venue: 'Sadokan Cricket Ground',
    dateStr: 'Tomorrow • 10:00 AM',
    dateGroup: 'Tomorrow, 17 September',
    time: '10:00 AM',
    status: 'UPCOMING',
    team1: {
      name: 'Marwar Champions',
      shortName: 'MWC',
      logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469253/spl_team_mwc_logo.jpg'
    },
    team2: {
      name: 'Nagaur Titans',
      shortName: 'NGT',
      logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469258/spl_team_ngt_logo.jpg'
    }
  },
  {
    id: 'spl_match_11',
    matchNumber: 11,
    matchNo: 11,
    stage: 'Semi-Final 1',
    matchTitle: 'Rank 1 (League Topper) vs Rank 4 (League)',
    overs: 5,
    maxOvers: 5,
    venue: 'Sadokan Cricket Ground',
    dateStr: '18 September • 09:30 AM',
    dateGroup: '18 September, Friday',
    time: '09:30 AM',
    status: 'UPCOMING',
    team1: {
      name: 'Rank 1 (League Topper)',
      shortName: 'TBC',
      isPlaceholderTeam: true
    },
    team2: {
      name: 'Rank 4 (League)',
      shortName: 'TBC',
      isPlaceholderTeam: true
    }
  },
  {
    id: 'spl_match_12',
    matchNumber: 12,
    matchNo: 12,
    stage: 'Semi-Final 2',
    matchTitle: 'Rank 2 (League) vs Rank 3 (League)',
    overs: 5,
    maxOvers: 5,
    venue: 'Sadokan Cricket Ground',
    dateStr: '18 September • 02:00 PM',
    dateGroup: '18 September, Friday',
    time: '02:00 PM',
    status: 'UPCOMING',
    team1: {
      name: 'Rank 2 (League)',
      shortName: 'TBC',
      isPlaceholderTeam: true
    },
    team2: {
      name: 'Rank 3 (League)',
      shortName: 'TBC',
      isPlaceholderTeam: true
    }
  },
  {
    id: 'spl_match_13',
    matchNumber: 13,
    matchNo: 13,
    stage: 'Grand Final',
    matchTitle: 'Winner Semi-Final 1 vs Winner Semi-Final 2',
    overs: 5,
    maxOvers: 5,
    venue: 'Sadokan Cricket Ground',
    dateStr: '19 September • 10:00 AM',
    dateGroup: '19 September, Saturday',
    time: '10:00 AM',
    status: 'UPCOMING',
    team1: {
      name: 'Winner Semi-Final 1',
      shortName: 'TBC',
      isPlaceholderTeam: true
    },
    team2: {
      name: 'Winner Semi-Final 2',
      shortName: 'TBC',
      isPlaceholderTeam: true
    }
  }
];

export function buildSadokanPremierLeagueTournament() {
  const pointsTable = autoCalculatePointsTable(SPL_TEAMS, SPL_MATCHES);
  const rawTourn = {
    id: 't_spl_2026_sadokan',
    name: 'Sadokan Premier League 2026',
    title: 'Sadokan Premier League 2026',
    fullName: 'Sadokan Premier League 2026',
    city: 'Sadokan',
    host: 'Sadokan Cricket Ground',
    category: 'OPEN',
    format: 'LIMITED OVERS',
    structure: 'hybrid',
    ballType: 'tennis',
    pitchType: 'turf',
    overs: 5,
    maxOvers: 5,
    entryFee: '1500',
    prizes: {
      first: '₹21,000 + Trophy',
      runnerUp: '₹11,000 + Trophy',
      bestBatter: 'Cricket Bat + Trophy',
      bestBowler: 'Cricket Shoes + Trophy',
      mvp: 'Player of Series Kit'
    },
    needMoreTeams: false,
    rounds: [
      'Group / League Matches',
      'Semi Final',
      'Final'
    ],
    groups: [
      {
        id: 'group_a',
        roundName: 'Group / League Matches',
        name: 'Group A',
        teams: [
          'Sadokan Super Kings',
          'Sangwa Strikers',
          'Sadokan Royals',
          'Marwar Champions',
          'Nagaur Titans'
        ]
      }
    ],
    rules: {
      wideRuns: 1,
      noBallRuns: 1,
      isLegalWide: false,
      isLegalNoBall: false,
      wagonWheelEnabled: true,
      wagonWheelDotBalls: false,
      wagonWheelSingles: false,
      impactPlayerEnabled: false,
      maxBowlerQuota: 2,
      runsPerWicketPenalty: 0
    },
    venues: [
      'Sadokan Cricket Ground',
      'Sadokan Turf Arena'
    ],
    organiserName: 'Basti Ram',
    organiserPhone: '+91 99832 28208',
    organiserId: 'usr_9983228208',
    organiserEmail: 'bastiram@cricflow.live',
    startDate: '10 Sep 2026',
    endDate: '19 Sep 2026',
    duration: '10 Sep 2026 - 19 Sep 2026',
    bannerUri: 'spl_banner',
    logoUri: 'spl_logo',
    broadcaster: 'CricFlow Live, Ground Commentary',
    teams: SPL_TEAMS,
    matches: SPL_MATCHES,
    pointsTable,
    schemaVersion: 5
  };

  const calculatedStats = calculateTournamentStats(rawTourn);
  return {
    ...rawTourn,
    stats: calculatedStats
  };
}

