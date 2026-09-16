import { autoCalculatePointsTable } from './tournamentService.js';
import { calculateTournamentStats } from './tournamentStatsEngine.js';

/**
 * Rajasthan League 2026 - Comprehensive Tournament Seed Data
 * 10 Franchise Teams, 110 Unique Players (11 per team), 48 Fixtures (45 Round-Robin + 3 Playoffs), 3 Grounds
 */

export const RAJASTHAN_LEAGUE_2026 = {
  id: 'tour_rajasthan_league_2026',
  name: 'Rajasthan League 2026',
  title: 'Rajasthan League 2026',
  fullName: 'Rajasthan League 2026',
  city: 'Rajasthan',
  host: 'Rajasthan',
  category: 'LIMITED OVERS',
  format: 'LIMITED OVERS',
  structure: 'league',
  ballType: 'tennis',
  pitchType: 'turf',
  overs: 10,
  maxOvers: 10,
  entryFee: '2000',
  prizes: {
    first: '₹51,000 + Trophy',
    runnerUp: '₹25,000 + Trophy',
    bestBatter: 'English Willow Bat + Trophy',
    bestBowler: 'Cricket Spikes + Trophy',
    mvp: 'Complete Cricket Kit'
  },
  needMoreTeams: false,
  rounds: [
    'Group / League Matches',
    'Semi Final',
    'Final'
  ],
  groups: [
    {
      id: 'grp_rpl_a',
      roundName: 'Group / League Matches',
      name: 'Group A',
      teams: [
        'Jaipur Royals',
        'Jodhpur Sunrisers',
        'Nagaur Titans',
        'Bikaner Blasters',
        'Udaipur Warriors'
      ]
    },
    {
      id: 'grp_rpl_b',
      roundName: 'Group / League Matches',
      name: 'Group B',
      teams: [
        'Kota Challengers',
        'Ajmer Super Giants',
        'Sikar Panthers',
        'Alwar Tigers',
        'Barmer Knights'
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
  organiserName: 'Basti Ram',
  organiserPhone: '+91 99832 28208',
  organiserId: 'usr_9983228208',
  organiserEmail: 'bastiram@cricflow.live',
  startDate: '16 Sep 2026',
  endDate: '15 Oct 2026',
  duration: '16 Sep 2026 - 15 Oct 2026',
  bannerUri: 'rpl_banner',
  logoUri: 'rpl_logo',
  broadcaster: 'CricFlow Live, YouTube, Ground Bulletin',
  schemaVersion: 5,
  venues: [
    'Deh Cricket Ground',
    'Sadokan Cricket Club',
    'Manasar Garden'
  ],
  teams: [
    {
      id: 'team_rpl_jpr',
      name: 'Jaipur Royals',
      shortName: 'JPR',
      code: 'JPR',
      color: '#1E3A8A',
      cardBg: '#0F2744',
      logoKey: 'jpr',
      city: 'Jaipur',
      captainName: 'Sanjay Rathore',
      wicketKeeperName: 'Pooja Bishnoi',
      players: [
        { id: 'p_jpr_1', name: 'Sanjay Rathore', role: 'Batter', isCaptain: true, battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
        { id: 'p_jpr_2', name: 'Pooja Bishnoi', role: 'Wicket-Keeper', isWicketKeeper: true, battingStyle: 'Right Hand', bowlingStyle: 'None' },
        { id: 'p_jpr_3', name: 'Kishan Shekhawat', role: 'Batter', battingStyle: 'Left Hand', bowlingStyle: 'Right Arm Off Break' },
        { id: 'p_jpr_4', name: 'Mohit Sharma', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Leg Break' },
        { id: 'p_jpr_5', name: 'Devendra Jodha', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
        { id: 'p_jpr_6', name: 'Harshit Chouhan', role: 'All-Rounder', battingStyle: 'Left Hand', bowlingStyle: 'Left Arm Orthodox' },
        { id: 'p_jpr_7', name: 'Abhishek Tanwar', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium Fast' },
        { id: 'p_jpr_8', name: 'Ravi Meena', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
        { id: 'p_jpr_9', name: 'Kuldeep Bhati', role: 'Bowler', battingStyle: 'Left Hand', bowlingStyle: 'Left Arm Fast' },
        { id: 'p_jpr_10', name: 'Gaurav Yadav', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Leg Break' },
        { id: 'p_jpr_11', name: 'Naveen Saini', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Break' }
      ]
    },
    {
      id: 'team_rpl_jsr',
      name: 'Jodhpur Sunrisers',
      shortName: 'JSR',
      code: 'JSR',
      color: '#EA580C',
      cardBg: '#7C2D12',
      logoKey: 'jsr',
      city: 'Jodhpur',
      captainName: 'Ravi Bishnoi',
      wicketKeeperName: 'Om Prakash',
      players: [
        { id: 'p_jsr_1', name: 'Ravi Bishnoi', role: 'All-Rounder', isCaptain: true, battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Leg Break' },
        { id: 'p_jsr_2', name: 'Om Prakash', role: 'Wicket-Keeper', isWicketKeeper: true, battingStyle: 'Right Hand', bowlingStyle: 'None' },
        { id: 'p_jsr_3', name: 'Vikash Gehlot', role: 'Batter', battingStyle: 'Left Hand', bowlingStyle: 'None' },
        { id: 'p_jsr_4', name: 'Ashok Parihar', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
        { id: 'p_jsr_5', name: 'Narendra Singh', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Break' },
        { id: 'p_jsr_6', name: 'Sunil Panwar', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
        { id: 'p_jsr_7', name: 'Tarun Dewasi', role: 'All-Rounder', battingStyle: 'Left Hand', bowlingStyle: 'Left Arm Orthodox' },
        { id: 'p_jsr_8', name: 'Mukesh Prajapat', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast Medium' },
        { id: 'p_jsr_9', name: 'Kailash Suthar', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Break' },
        { id: 'p_jsr_10', name: 'Bharat Sen', role: 'Bowler', battingStyle: 'Left Hand', bowlingStyle: 'Left Arm Fast' },
        { id: 'p_jsr_11', name: 'Dharmendra Jani', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Leg Break' }
      ]
    },
    {
      id: 'team_rpl_ngt',
      name: 'Nagaur Titans',
      shortName: 'NGT',
      code: 'NGT',
      color: '#0D9488',
      cardBg: '#134E4A',
      logoKey: 'ngt',
      city: 'Nagaur',
      captainName: 'Manish Choudhary',
      wicketKeeperName: 'Ramkishan Inaniyan',
      players: [
        { id: 'p_ngt_1', name: 'Manish Choudhary', role: 'Batter', isCaptain: true, battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
        { id: 'p_ngt_2', name: 'Ramkishan Inaniyan', role: 'Wicket-Keeper', isWicketKeeper: true, battingStyle: 'Right Hand', bowlingStyle: 'None' },
        { id: 'p_ngt_3', name: 'Dharmveer Godara', role: 'Batter', battingStyle: 'Left Hand', bowlingStyle: 'Right Arm Off Break' },
        { id: 'p_ngt_4', name: 'Shrawan Bhakar', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'None' },
        { id: 'p_ngt_5', name: 'Om Prakash Dudi', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
        { id: 'p_ngt_6', name: 'Praveen Karwasra', role: 'All-Rounder', battingStyle: 'Left Hand', bowlingStyle: 'Left Arm Orthodox' },
        { id: 'p_ngt_7', name: 'Surendra Mirdha', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
        { id: 'p_ngt_8', name: 'Ghanshyam Jangu', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
        { id: 'p_ngt_9', name: 'Babulal Kaswan', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Break' },
        { id: 'p_ngt_10', name: 'Tejaram Beniwal', role: 'Bowler', battingStyle: 'Left Hand', bowlingStyle: 'Left Arm Fast' },
        { id: 'p_ngt_11', name: 'Rameshwar Potaliya', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Leg Break' }
      ]
    },
    {
      id: 'team_rpl_bkr',
      name: 'Bikaner Kings',
      shortName: 'BKR',
      code: 'BKR',
      color: '#DC2626',
      cardBg: '#7F1D1D',
      logoKey: 'bkr',
      city: 'Bikaner',
      captainName: 'Dinesh Bhati',
      wicketKeeperName: 'Chetan Purohit',
      players: [
        { id: 'p_bkr_1', name: 'Dinesh Bhati', role: 'Batter', isCaptain: true, battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Break' },
        { id: 'p_bkr_2', name: 'Chetan Purohit', role: 'Wicket-Keeper', isWicketKeeper: true, battingStyle: 'Right Hand', bowlingStyle: 'None' },
        { id: 'p_bkr_3', name: 'Mahaveer Moond', role: 'Batter', battingStyle: 'Left Hand', bowlingStyle: 'None' },
        { id: 'p_bkr_4', name: 'Rakesh Rathi', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
        { id: 'p_bkr_5', name: 'Gopal Joshi', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
        { id: 'p_bkr_6', name: 'Anil Soni', role: 'All-Rounder', battingStyle: 'Left Hand', bowlingStyle: 'Left Arm Orthodox' },
        { id: 'p_bkr_7', name: 'Vinod Acharya', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium Fast' },
        { id: 'p_bkr_8', name: 'Sunil Ojha', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
        { id: 'p_bkr_9', name: 'Jagdish Vyas', role: 'Bowler', battingStyle: 'Left Hand', bowlingStyle: 'Left Arm Fast' },
        { id: 'p_bkr_10', name: 'Rajendra Solanki', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Leg Break' },
        { id: 'p_bkr_11', name: 'Pankaj Bishnoi', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Break' }
      ]
    },
    {
      id: 'team_rpl_udw',
      name: 'Udaipur Warriors',
      shortName: 'UDW',
      code: 'UDW',
      color: '#0284C7',
      cardBg: '#0C4A6E',
      logoKey: 'udw',
      city: 'Udaipur',
      captainName: 'Vikram Shekhawat',
      wicketKeeperName: 'Lalit Menaria',
      players: [
        { id: 'p_udw_1', name: 'Vikram Shekhawat', role: 'Batter', isCaptain: true, battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
        { id: 'p_udw_2', name: 'Lalit Menaria', role: 'Wicket-Keeper', isWicketKeeper: true, battingStyle: 'Left Hand', bowlingStyle: 'None' },
        { id: 'p_udw_3', name: 'Ajay Pratap Singh', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Break' },
        { id: 'p_udw_4', name: 'Bhupendra Chouhan', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'None' },
        { id: 'p_udw_5', name: 'Chandan Sharma', role: 'All-Rounder', battingStyle: 'Left Hand', bowlingStyle: 'Left Arm Fast' },
        { id: 'p_udw_6', name: 'Deepak Audichya', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Leg Break' },
        { id: 'p_udw_7', name: 'Harish Mali', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
        { id: 'p_udw_8', name: 'Kamlesh Meghwal', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
        { id: 'p_udw_9', name: 'Mahendra Gameti', role: 'Bowler', battingStyle: 'Left Hand', bowlingStyle: 'Left Arm Orthodox' },
        { id: 'p_udw_10', name: 'Nitesh Dangi', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast Medium' },
        { id: 'p_udw_11', name: 'Pappu Rawat', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Break' }
      ]
    },
    {
      id: 'team_rpl_kts',
      name: 'Kota Strikers',
      shortName: 'KTS',
      code: 'KTS',
      color: '#F97316',
      cardBg: '#7C2D12',
      logoKey: 'kts',
      city: 'Kota',
      captainName: 'Deepak Gurjar',
      wicketKeeperName: 'Rahul Nagar',
      players: [
        { id: 'p_kts_1', name: 'Deepak Gurjar', role: 'All-Rounder', isCaptain: true, battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
        { id: 'p_kts_2', name: 'Rahul Nagar', role: 'Wicket-Keeper', isWicketKeeper: true, battingStyle: 'Right Hand', bowlingStyle: 'None' },
        { id: 'p_kts_3', name: 'Shivam Hada', role: 'Batter', battingStyle: 'Left Hand', bowlingStyle: 'Right Arm Off Break' },
        { id: 'p_kts_4', name: 'Rohit Meena', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'None' },
        { id: 'p_kts_5', name: 'Sourabh Gautam', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
        { id: 'p_kts_6', name: 'Ankit Dhakar', role: 'All-Rounder', battingStyle: 'Left Hand', bowlingStyle: 'Left Arm Orthodox' },
        { id: 'p_kts_7', name: 'Hemant Bairwa', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast Medium' },
        { id: 'p_kts_8', name: 'Pawan Suman', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
        { id: 'p_kts_9', name: 'Mukesh Sain', role: 'Bowler', battingStyle: 'Left Hand', bowlingStyle: 'Left Arm Fast' },
        { id: 'p_kts_10', name: 'Ravi Malav', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Leg Break' },
        { id: 'p_kts_11', name: 'Vijay Patidar', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Break' }
      ]
    },
    {
      id: 'team_rpl_ssg',
      name: 'Sikar Super Giants',
      shortName: 'SSG',
      code: 'SSG',
      color: '#7C3AED',
      cardBg: '#4C1D95',
      logoKey: 'ssg',
      city: 'Sikar',
      captainName: 'Amit Dhaka',
      wicketKeeperName: 'Pankaj Nehra',
      players: [
        { id: 'p_ssg_1', name: 'Amit Dhaka', role: 'Batter', isCaptain: true, battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
        { id: 'p_ssg_2', name: 'Pankaj Nehra', role: 'Wicket-Keeper', isWicketKeeper: true, battingStyle: 'Right Hand', bowlingStyle: 'None' },
        { id: 'p_ssg_3', name: 'Vikas Sunda', role: 'Batter', battingStyle: 'Left Hand', bowlingStyle: 'None' },
        { id: 'p_ssg_4', name: 'Sandeep Khichar', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Break' },
        { id: 'p_ssg_5', name: 'Suresh Bijarnia', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
        { id: 'p_ssg_6', name: 'Naresh Bajia', role: 'All-Rounder', battingStyle: 'Left Hand', bowlingStyle: 'Left Arm Orthodox' },
        { id: 'p_ssg_7', name: 'Kuldeep Ranwa', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
        { id: 'p_ssg_8', name: 'Manoj Burdak', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
        { id: 'p_ssg_9', name: 'Devendra Kaler', role: 'Bowler', battingStyle: 'Left Hand', bowlingStyle: 'Left Arm Fast' },
        { id: 'p_ssg_10', name: 'Rameshwar Doot', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Leg Break' },
        { id: 'p_ssg_11', name: 'Ashok Mahala', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Break' }
      ]
    },
    {
      id: 'team_rpl_ajb',
      name: 'Ajmer Blasters',
      shortName: 'AJB',
      code: 'AJB',
      color: '#D97706',
      cardBg: '#78350F',
      logoKey: 'ajb',
      city: 'Ajmer',
      captainName: 'Praveen Meena',
      wicketKeeperName: 'Imran Khan',
      players: [
        { id: 'p_ajb_1', name: 'Praveen Meena', role: 'Batter', isCaptain: true, battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
        { id: 'p_ajb_2', name: 'Imran Khan', role: 'Wicket-Keeper', isWicketKeeper: true, battingStyle: 'Right Hand', bowlingStyle: 'None' },
        { id: 'p_ajb_3', name: 'Gaurav Rawat', role: 'Batter', battingStyle: 'Left Hand', bowlingStyle: 'None' },
        { id: 'p_ajb_4', name: 'Naveen Vaishnav', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Break' },
        { id: 'p_ajb_5', name: 'Salim Chishti', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
        { id: 'p_ajb_6', name: 'Manish Kumawat', role: 'All-Rounder', battingStyle: 'Left Hand', bowlingStyle: 'Left Arm Orthodox' },
        { id: 'p_ajb_7', name: 'Ajay Tak', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium Fast' },
        { id: 'p_ajb_8', name: 'Shakir Ali', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
        { id: 'p_ajb_9', name: 'Sunil Gurjar', role: 'Bowler', battingStyle: 'Left Hand', bowlingStyle: 'Left Arm Fast' },
        { id: 'p_ajb_10', name: 'Dharmendra Bhati', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Leg Break' },
        { id: 'p_ajb_11', name: 'Rohit Verma', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Break' }
      ]
    },
    {
      id: 'team_rpl_bms',
      name: 'Barmer Superstars',
      shortName: 'BMS',
      code: 'BMS',
      color: '#2563EB',
      cardBg: '#1E3A8A',
      logoKey: 'bms',
      city: 'Barmer',
      captainName: 'Kailash Meghwal',
      wicketKeeperName: 'Sawai Singh',
      players: [
        { id: 'p_bms_1', name: 'Kailash Meghwal', role: 'All-Rounder', isCaptain: true, battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
        { id: 'p_bms_2', name: 'Sawai Singh', role: 'Wicket-Keeper', isWicketKeeper: true, battingStyle: 'Right Hand', bowlingStyle: 'None' },
        { id: 'p_bms_3', name: 'Hanuman Godara', role: 'Batter', battingStyle: 'Left Hand', bowlingStyle: 'Right Arm Off Break' },
        { id: 'p_bms_4', name: 'Bhawani Singh', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'None' },
        { id: 'p_bms_5', name: 'Shaitan Singh', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
        { id: 'p_bms_6', name: 'Kamlesh Suthar', role: 'All-Rounder', battingStyle: 'Left Hand', bowlingStyle: 'Left Arm Orthodox' },
        { id: 'p_bms_7', name: 'Maganaram Jat', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium Fast' },
        { id: 'p_bms_8', name: 'Prithvi Singh', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
        { id: 'p_bms_9', name: 'Govind Ram', role: 'Bowler', battingStyle: 'Left Hand', bowlingStyle: 'Left Arm Fast' },
        { id: 'p_bms_10', name: 'Praveen Charan', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Leg Break' },
        { id: 'p_bms_11', name: 'Jetharam Bhil', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Break' }
      ]
    },
    {
      id: 'team_rpl_mwc',
      name: 'Marwar Champions',
      shortName: 'MWC',
      code: 'MWC',
      color: '#991B1B',
      cardBg: '#450A0A',
      logoKey: 'mwc',
      city: 'Marwar',
      captainName: 'Devendra Sankhla',
      wicketKeeperName: 'Prakash Bhati',
      players: [
        { id: 'p_mwc_1', name: 'Devendra Sankhla', role: 'Batter', isCaptain: true, battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
        { id: 'p_mwc_2', name: 'Prakash Bhati', role: 'Wicket-Keeper', isWicketKeeper: true, battingStyle: 'Right Hand', bowlingStyle: 'None' },
        { id: 'p_mwc_3', name: 'Kalu Ram Dewasi', role: 'Batter', battingStyle: 'Left Hand', bowlingStyle: 'None' },
        { id: 'p_mwc_4', name: 'Hemant Chouhan', role: 'Batter', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Break' },
        { id: 'p_mwc_5', name: 'Umesh Solanki', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
        { id: 'p_mwc_6', name: 'Suraj Panwar', role: 'All-Rounder', battingStyle: 'Left Hand', bowlingStyle: 'Left Arm Orthodox' },
        { id: 'p_mwc_7', name: 'Gopal Singh Rathore', role: 'All-Rounder', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Medium' },
        { id: 'p_mwc_8', name: 'Naresh Gehlot', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Fast' },
        { id: 'p_mwc_9', name: 'Ashok Parihar', role: 'Bowler', battingStyle: 'Left Hand', bowlingStyle: 'Left Arm Fast' },
        { id: 'p_mwc_10', name: 'Mukesh Vaishnav', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Leg Break' },
        { id: 'p_mwc_11', name: 'Gautam Mali', role: 'Bowler', battingStyle: 'Right Hand', bowlingStyle: 'Right Arm Off Break' }
      ]
    }
  ]
};

// Deterministic Pseudo-Random Generator (LCG)
function createRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function() {
    return (s = s * 16807 % 2147483647) / 2147483647;
  };
}

/**
 * Simulate an authentic 10-Over Limited Overs Cricket Match Ball-by-Ball
 */
export function simulateTenOverMatch(t1, t2, matchIndex, stage, dateStr, timeStr, venue) {
  const rng = createRng(matchIndex * 7919 + 42);
  const t1BatsFirst = rng() > 0.45;
  const batTeam = t1BatsFirst ? t1 : t2;
  const bowlTeam = t1BatsFirst ? t2 : t1;

  const inn1Overs = 10;
  const bat1Roster = batTeam.players || [];
  const bowl1Roster = bowlTeam.players || [];

  const bowlers1 = bowl1Roster.slice(5, 11).length >= 5
    ? bowl1Roster.slice(5, 11)
    : (bowl1Roster.length >= 5 ? bowl1Roster.slice(-5) : bowl1Roster);

  let inn1Runs = 0;
  let inn1Wickets = 0;
  const maxWickets = Math.min(bat1Roster.length - 1, 8);

  const batter1Stats = {};
  let strikerIdx = 0;
  let nonStrikerIdx = 1;

  const initBatter = (name) => {
    if (!batter1Stats[name]) {
      batter1Stats[name] = { name, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '0.0' };
    }
  };

  initBatter(bat1Roster[strikerIdx]?.name || 'Batter 1');
  initBatter(bat1Roster[nonStrikerIdx]?.name || 'Batter 2');

  const overHistory1 = [];
  const bowler1Stats = {};

  for (let o = 1; o <= inn1Overs; o++) {
    if (inn1Wickets >= maxWickets) break;
    const bowlerObj = bowlers1[(o - 1) % bowlers1.length] || { name: `Bowler ${(o % 5) + 1}` };
    const bowlerName = bowlerObj.name;
    if (!bowler1Stats[bowlerName]) {
      bowler1Stats[bowlerName] = { name: bowlerName, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0, econ: '0.00' };
    }

    const overBalls = [];
    let overRuns = 0;
    let overWkts = 0;

    for (let b = 1; b <= 6; b++) {
      if (inn1Wickets >= maxWickets) break;
      const currentStriker = bat1Roster[strikerIdx]?.name || `Batter ${strikerIdx + 1}`;
      initBatter(currentStriker);

      const roll = rng();
      let ballOutcome = '0';
      let ballRuns = 0;

      if (roll < 0.08 && inn1Wickets < maxWickets) {
        inn1Wickets++;
        overWkts++;
        bowler1Stats[bowlerName].wickets++;
        const fielderObj = bowl1Roster[Math.floor(rng() * bowl1Roster.length)]?.name || 'Fielder';
        const isCaught = rng() > 0.35;
        const dismissal = isCaught ? `c ${fielderObj} b ${bowlerName}` : (rng() > 0.5 ? `b ${bowlerName}` : `lbw b ${bowlerName}`);
        batter1Stats[currentStriker].isOut = true;
        batter1Stats[currentStriker].outDesc = dismissal;
        batter1Stats[currentStriker].balls++;
        ballOutcome = 'W';

        strikerIdx = Math.max(strikerIdx, nonStrikerIdx) + 1;
        if (strikerIdx < bat1Roster.length) {
          initBatter(bat1Roster[strikerIdx].name);
        }
      } else if (roll < 0.35) {
        ballOutcome = '0';
        batter1Stats[currentStriker].balls++;
      } else if (roll < 0.65) {
        ballOutcome = '1';
        ballRuns = 1;
        batter1Stats[currentStriker].runs += 1;
        batter1Stats[currentStriker].balls++;
        const tmp = strikerIdx; strikerIdx = nonStrikerIdx; nonStrikerIdx = tmp;
      } else if (roll < 0.80) {
        ballOutcome = '2';
        ballRuns = 2;
        batter1Stats[currentStriker].runs += 2;
        batter1Stats[currentStriker].balls++;
      } else if (roll < 0.93) {
        ballOutcome = '4';
        ballRuns = 4;
        batter1Stats[currentStriker].runs += 4;
        batter1Stats[currentStriker].fours++;
        batter1Stats[currentStriker].balls++;
      } else {
        ballOutcome = '6';
        ballRuns = 6;
        batter1Stats[currentStriker].runs += 6;
        batter1Stats[currentStriker].sixes++;
        batter1Stats[currentStriker].balls++;
      }

      inn1Runs += ballRuns;
      overRuns += ballRuns;
      overBalls.push(ballOutcome);
      bowler1Stats[bowlerName].runs += ballRuns;
      bowler1Stats[bowlerName].balls++;
    }

    if (overBalls.length > 0) {
      if (overRuns === 0) bowler1Stats[bowlerName].maidens++;
      overHistory1.push({ overNum: o, bowlerName, runs: overRuns, wickets: overWkts, balls: overBalls });
      const tmp = strikerIdx; strikerIdx = nonStrikerIdx; nonStrikerIdx = tmp;
    }
  }

  Object.values(batter1Stats).forEach(b => {
    b.strikeRate = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
  });
  Object.values(bowler1Stats).forEach(b => {
    const oFull = Math.floor(b.balls / 6);
    const oPart = b.balls % 6;
    b.overs = `${oFull}.${oPart}`;
    const totalOversDec = oFull + oPart / 6;
    b.econ = totalOversDec > 0 ? (b.runs / totalOversDec).toFixed(2) : '0.00';
  });

  const totalLegalBalls1 = overHistory1.reduce((sum, ov) => sum + ov.balls.length, 0);
  const inn1OversStr = `${Math.floor(totalLegalBalls1 / 6)}.${totalLegalBalls1 % 6}`;

  // ── INNINGS 2 (CHASE) ──
  const target = inn1Runs + 1;
  const bat2Roster = bowlTeam.players || [];
  const bowl2Roster = batTeam.players || [];
  const bowlers2 = bowl2Roster.slice(5, 11).length >= 5
    ? bowl2Roster.slice(5, 11)
    : (bowl2Roster.length >= 5 ? bowl2Roster.slice(-5) : bowl2Roster);

  let inn2Runs = 0;
  let inn2Wickets = 0;
  let chaseComplete = false;

  const batter2Stats = {};
  let striker2Idx = 0;
  let nonStriker2Idx = 1;

  const initBatter2 = (name) => {
    if (!batter2Stats[name]) {
      batter2Stats[name] = { name, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, outDesc: 'not out', strikeRate: '0.0' };
    }
  };

  initBatter2(bat2Roster[striker2Idx]?.name || 'Batter 1');
  initBatter2(bat2Roster[nonStriker2Idx]?.name || 'Batter 2');

  const overHistory2 = [];
  const bowler2Stats = {};

  for (let o = 1; o <= 10; o++) {
    if (chaseComplete || inn2Wickets >= maxWickets) break;
    const bowlerObj = bowlers2[(o - 1) % bowlers2.length] || { name: `Bowler ${(o % 5) + 1}` };
    const bowlerName = bowlerObj.name;
    if (!bowler2Stats[bowlerName]) {
      bowler2Stats[bowlerName] = { name: bowlerName, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0, econ: '0.00' };
    }

    const overBalls = [];
    let overRuns = 0;
    let overWkts = 0;

    for (let b = 1; b <= 6; b++) {
      if (chaseComplete || inn2Wickets >= maxWickets) break;
      const currentStriker = bat2Roster[striker2Idx]?.name || `Batter ${striker2Idx + 1}`;
      initBatter2(currentStriker);

      const roll = rng();
      let ballOutcome = '0';
      let ballRuns = 0;

      if (roll < 0.09 && inn2Wickets < maxWickets) {
        inn2Wickets++;
        overWkts++;
        bowler2Stats[bowlerName].wickets++;
        const fielderObj = bowl2Roster[Math.floor(rng() * bowl2Roster.length)]?.name || 'Fielder';
        const isCaught = rng() > 0.35;
        const dismissal = isCaught ? `c ${fielderObj} b ${bowlerName}` : (rng() > 0.5 ? `b ${bowlerName}` : `lbw b ${bowlerName}`);
        batter2Stats[currentStriker].isOut = true;
        batter2Stats[currentStriker].outDesc = dismissal;
        batter2Stats[currentStriker].balls++;
        ballOutcome = 'W';

        striker2Idx = Math.max(striker2Idx, nonStriker2Idx) + 1;
        if (striker2Idx < bat2Roster.length) {
          initBatter2(bat2Roster[striker2Idx].name);
        }
      } else if (roll < 0.35) {
        ballOutcome = '0';
        batter2Stats[currentStriker].balls++;
      } else if (roll < 0.65) {
        ballOutcome = '1';
        ballRuns = 1;
        batter2Stats[currentStriker].runs += 1;
        batter2Stats[currentStriker].balls++;
        const tmp = striker2Idx; striker2Idx = nonStriker2Idx; nonStriker2Idx = tmp;
      } else if (roll < 0.80) {
        ballOutcome = '2';
        ballRuns = 2;
        batter2Stats[currentStriker].runs += 2;
        batter2Stats[currentStriker].balls++;
      } else if (roll < 0.92) {
        ballOutcome = '4';
        ballRuns = 4;
        batter2Stats[currentStriker].runs += 4;
        batter2Stats[currentStriker].fours++;
        batter2Stats[currentStriker].balls++;
      } else {
        ballOutcome = '6';
        ballRuns = 6;
        batter2Stats[currentStriker].runs += 6;
        batter2Stats[currentStriker].sixes++;
        batter2Stats[currentStriker].balls++;
      }

      inn2Runs += ballRuns;
      overRuns += ballRuns;
      overBalls.push(ballOutcome);
      bowler2Stats[bowlerName].runs += ballRuns;
      bowler2Stats[bowlerName].balls++;

      if (inn2Runs >= target) {
        chaseComplete = true;
        break;
      }
    }

    if (overBalls.length > 0) {
      if (overRuns === 0) bowler2Stats[bowlerName].maidens++;
      overHistory2.push({ overNum: o, bowlerName, runs: overRuns, wickets: overWkts, balls: overBalls });
      const tmp = striker2Idx; striker2Idx = nonStriker2Idx; nonStriker2Idx = tmp;
    }
  }

  Object.values(batter2Stats).forEach(b => {
    b.strikeRate = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
  });
  Object.values(bowler2Stats).forEach(b => {
    const oFull = Math.floor(b.balls / 6);
    const oPart = b.balls % 6;
    b.overs = `${oFull}.${oPart}`;
    const totalOversDec = oFull + oPart / 6;
    b.econ = totalOversDec > 0 ? (b.runs / totalOversDec).toFixed(2) : '0.00';
  });

  const totalLegalBalls2 = overHistory2.reduce((sum, ov) => sum + ov.balls.length, 0);
  const inn2OversStr = `${Math.floor(totalLegalBalls2 / 6)}.${totalLegalBalls2 % 6}`;

  let winnerTeamName = '';
  let resultText = '';
  if (inn2Runs >= target) {
    winnerTeamName = bowlTeam.name;
    const wktsLeft = Math.max(1, 10 - inn2Wickets);
    resultText = `${bowlTeam.name} won by ${wktsLeft} wicket${wktsLeft !== 1 ? 's' : ''}`;
  } else if (inn1Runs > inn2Runs) {
    winnerTeamName = batTeam.name;
    const runDiff = inn1Runs - inn2Runs;
    resultText = `${batTeam.name} won by ${runDiff} run${runDiff !== 1 ? 's' : ''}`;
  } else {
    winnerTeamName = batTeam.name;
    resultText = 'Match tied (Super Over won by ' + batTeam.name + ')';
  }

  const team1Final = t1.name === batTeam.name
    ? { id: t1.id, name: t1.name, shortName: t1.shortName, code: t1.code, runs: inn1Runs, wickets: inn1Wickets, overs: inn1OversStr, score: `${inn1Runs}-${inn1Wickets} (${inn1OversStr})`, logoKey: t1.logoKey, color: t1.color, cardBg: t1.cardBg }
    : { id: t1.id, name: t1.name, shortName: t1.shortName, code: t1.code, runs: inn2Runs, wickets: inn2Wickets, overs: inn2OversStr, score: `${inn2Runs}-${inn2Wickets} (${inn2OversStr})`, logoKey: t1.logoKey, color: t1.color, cardBg: t1.cardBg };

  const team2Final = t2.name === bowlTeam.name
    ? { id: t2.id, name: t2.name, shortName: t2.shortName, code: t2.code, runs: inn2Runs, wickets: inn2Wickets, overs: inn2OversStr, score: `${inn2Runs}-${inn2Wickets} (${inn2OversStr})`, logoKey: t2.logoKey, color: t2.color, cardBg: t2.cardBg }
    : { id: t2.id, name: t2.name, shortName: t2.shortName, code: t2.code, runs: inn1Runs, wickets: inn1Wickets, overs: inn1OversStr, score: `${inn1Runs}-${inn1Wickets} (${inn1OversStr})`, logoKey: t2.logoKey, color: t2.color, cardBg: t2.cardBg };

  return {
    id: `match_rpl_${matchIndex}`,
    matchNumber: matchIndex,
    matchNo: matchIndex,
    stage: stage || `Match ${matchIndex}`,
    tournamentId: RAJASTHAN_LEAGUE_2026.id,
    tournamentName: RAJASTHAN_LEAGUE_2026.name,
    matchTitle: `${t1.name} vs ${t2.name}`,
    overs: 10,
    maxOvers: 10,
    venue: venue || 'Sadokan Cricket Club',
    dateStr: dateStr || '16 Sep 2026',
    date: dateStr || '16 Sep 2026',
    time: timeStr || '09:00 AM',
    timeText: timeStr || '09:00 AM',
    status: 'FINISHED',
    phase: 'result',
    winnerTeamName,
    winner: winnerTeamName,
    resultText,
    result: resultText,
    target: target,
    team1: team1Final,
    team2: team2Final,
    rawMatchData: {
      id: `match_rpl_${matchIndex}`,
      matchTitle: `${t1.name} vs ${t2.name}`,
      venue: venue || 'Sadokan Cricket Club',
      phase: 'result',
      status: 'FINISHED',
      maxOvers: 10,
      winnerTeamName,
      resultText,
      innings: [
        {
          inningNumber: 1,
          battingTeam: { name: batTeam.name, runs: inn1Runs, wickets: inn1Wickets, overs: inn1OversStr },
          bowlingTeam: { name: bowlTeam.name },
          totalLegalBalls: totalLegalBalls1,
          allBatters: Object.values(batter1Stats),
          bowling: Object.values(bowler1Stats),
          overHistory: overHistory1
        },
        {
          inningNumber: 2,
          battingTeam: { name: bowlTeam.name, runs: inn2Runs, wickets: inn2Wickets, overs: inn2OversStr },
          bowlingTeam: { name: batTeam.name },
          totalLegalBalls: totalLegalBalls2,
          allBatters: Object.values(batter2Stats),
          bowling: Object.values(bowler2Stats),
          overHistory: overHistory2
        }
      ]
    }
  };
}

/**
 * Generate 48 Complete Fixtures (45 League + 3 Playoffs) with Full Ball-by-Ball Records
 */
export function generateRajasthanLeagueFixtures() {
  const teams = RAJASTHAN_LEAGUE_2026.teams;
  const venues = RAJASTHAN_LEAGUE_2026.venues;
  const timings = ['09:00 AM', '01:30 PM'];
  const matches = [];

  let matchIndex = 1;
  const startDate = new Date(2026, 8, 16);

  // 1. Generate 45 Round-Robin Pairings
  const pairings = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      pairings.push([teams[i], teams[j]]);
    }
  }

  // Shuffle / Distribute pairings so teams get balanced rest days
  const distributed = [];
  const pairCopy = [...pairings];
  const lastPlayed = new Map();

  while (pairCopy.length > 0) {
    let bestIdx = 0;
    let minRecentSum = Infinity;

    for (let k = 0; k < pairCopy.length; k++) {
      const [tA, tB] = pairCopy[k];
      const recA = lastPlayed.get(tA.id) || -999;
      const recB = lastPlayed.get(tB.id) || -999;
      const maxRec = Math.max(recA, recB);
      if (maxRec < minRecentSum) {
        minRecentSum = maxRec;
        bestIdx = k;
      }
    }

    const [selectedA, selectedB] = pairCopy.splice(bestIdx, 1)[0];
    distributed.push([selectedA, selectedB]);
    lastPlayed.set(selectedA.id, distributed.length);
    lastPlayed.set(selectedB.id, distributed.length);
  }

  // Assign Dates, Venues, Timings across match days
  distributed.forEach((pair, idx) => {
    const [t1, t2] = pair;
    const dayOffset = Math.floor(idx / 2);
    const timeIdx = idx % 2;
    const venueIdx = idx % venues.length;

    const mDate = new Date(startDate);
    mDate.setDate(startDate.getDate() + dayOffset);

    const day = mDate.getDate();
    const month = mDate.toLocaleDateString('en-GB', { month: 'short' });
    const year = mDate.getFullYear();
    const dateStr = `${day} ${month} ${year}`;

    const finishedMatch = simulateTenOverMatch(
      t1,
      t2,
      matchIndex,
      `Match ${matchIndex}`,
      dateStr,
      timings[timeIdx],
      venues[venueIdx]
    );

    matches.push(finishedMatch);
    matchIndex++;
  });

  // Calculate league standings to resolve Semi-Finalists
  const leaguePointsTable = generateInitialPointsTable();
  const sortedTeams = [...leaguePointsTable].sort((a, b) => (b.pts - a.pts) || parseFloat(b.nrr || 0) - parseFloat(a.nrr || 0));

  const rank1Team = teams.find(t => t.name === sortedTeams[0]?.team) || teams[0];
  const rank2Team = teams.find(t => t.name === sortedTeams[1]?.team) || teams[1];
  const rank3Team = teams.find(t => t.name === sortedTeams[2]?.team) || teams[2];
  const rank4Team = teams.find(t => t.name === sortedTeams[3]?.team) || teams[3];

  // Semi-Final 1 (13 Oct 2026)
  const sf1Match = simulateTenOverMatch(rank1Team, rank4Team, matchIndex, 'Semi-Final 1', '13 Oct 2026', '01:30 PM', 'Sadokan Cricket Club');
  matches.push(sf1Match);
  matchIndex++;

  // Semi-Final 2 (14 Oct 2026)
  const sf2Match = simulateTenOverMatch(rank2Team, rank3Team, matchIndex, 'Semi-Final 2', '14 Oct 2026', '01:30 PM', 'Deh Cricket Ground');
  matches.push(sf2Match);
  matchIndex++;

  // Grand Final (15 Oct 2026)
  const finalTeam1 = teams.find(t => t.name === sf1Match.winnerTeamName) || rank1Team;
  const finalTeam2 = teams.find(t => t.name === sf2Match.winnerTeamName) || rank2Team;

  const finalMatch = simulateTenOverMatch(finalTeam1, finalTeam2, matchIndex, 'Final', '15 Oct 2026', '05:30 PM', 'Manasar Garden');
  const baseRes = finalMatch.resultText;
  const winnerTeam = finalMatch.winnerTeamName;
  finalMatch.resultText = `${winnerTeam} won by ${baseRes.includes('won by ') ? baseRes.split('won by ')[1] : '8 runs'} (Rajasthan League 2026 Champions)`;
  finalMatch.result = finalMatch.resultText;
  finalMatch.rawMatchData.resultText = finalMatch.resultText;
  matches.push(finalMatch);

  return matches;
}

/**
 * Initialize 10 Teams in 0 Points Table
 */
export function generateInitialPointsTable() {
  return RAJASTHAN_LEAGUE_2026.teams.map(t => ({
    team: t.name,
    shortName: t.shortName,
    code: t.code,
    logoKey: t.logoKey,
    color: t.color,
    p: 0,
    w: 0,
    l: 0,
    nr: 0,
    pts: 0,
    runsScored: 0,
    ballsFaced: 0,
    runsConceded: 0,
    ballsBowled: 0,
    nrr: '-',
    form: []
  }));
}

/**
 * Build the full Rajasthan League 2026 document ready for Supabase and AsyncStorage
 */
export function buildRajasthanLeagueTournament() {
  const matches = generateRajasthanLeagueFixtures();
  // Compute points table from the 45 league stage matches
  const leagueMatches = matches.slice(0, 45);
  const pointsTable = autoCalculatePointsTable(RAJASTHAN_LEAGUE_2026.teams, leagueMatches);

  const rawTourn = {
    ...RAJASTHAN_LEAGUE_2026,
    matches,
    pointsTable,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const calculatedStats = calculateTournamentStats(rawTourn);

  return {
    ...rawTourn,
    stats: calculatedStats
  };
}
