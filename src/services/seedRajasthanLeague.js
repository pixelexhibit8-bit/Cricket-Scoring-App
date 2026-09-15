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
  ballType: 'tennis',
  pitchType: 'turf',
  overs: 10,
  maxOvers: 10,
  entryFee: '2000',
  organiserName: 'Tarun Bardawa',
  organiserPhone: '+91 98290 12345',
  organiserEmail: 'tarun.bardawa@cricflow.live',
  startDate: '16 Sep 2026',
  endDate: '15 Oct 2026',
  duration: '16 Sep 2026 - 15 Oct 2026',
  bannerUri: 'rpl_banner',
  logoUri: 'rpl_logo',
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

/**
 * Generate 48 Complete Fixtures for Rajasthan League 2026:
 * - 45 Single Round-Robin League Matches (16 Sep to 12 Oct)
 * - Semi-Final 1 (13 Oct)
 * - Semi-Final 2 (14 Oct)
 * - Grand Final (15 Oct)
 */
export function generateRajasthanLeagueFixtures() {
  const teams = RAJASTHAN_LEAGUE_2026.teams;
  const venues = RAJASTHAN_LEAGUE_2026.venues;
  const timings = ['09:00 AM', '01:30 PM', '05:30 PM'];
  const matches = [];

  let matchIndex = 1;
  const startDate = new Date(2026, 8, 16); // 16 Sep 2026 (Month 8 is Sept)

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

  // Assign Dates, Venues, Timings across ~26 match days
  distributed.forEach((pair, idx) => {
    const [t1, t2] = pair;
    const dayOffset = Math.floor(idx / 2); // 2 matches per day
    const timeIdx = idx % 2; // 09:00 AM or 01:30 PM
    const venueIdx = idx % venues.length;

    const mDate = new Date(startDate);
    mDate.setDate(startDate.getDate() + dayOffset);

    const day = mDate.getDate();
    const month = mDate.toLocaleDateString('en-GB', { month: 'short' });
    const year = mDate.getFullYear();
    const dateStr = `${day} ${month} ${year}`;

    matches.push({
      id: `match_rpl_${matchIndex}`,
      matchNumber: matchIndex,
      matchNo: matchIndex,
      stage: `Match ${matchIndex}`,
      tournamentId: RAJASTHAN_LEAGUE_2026.id,
      tournamentName: RAJASTHAN_LEAGUE_2026.name,
      matchTitle: `${t1.name} vs ${t2.name}`,
      team1: {
        id: t1.id,
        name: t1.name,
        shortName: t1.shortName,
        code: t1.code,
        logoKey: t1.logoKey,
        color: t1.color,
        cardBg: t1.cardBg
      },
      team2: {
        id: t2.id,
        name: t2.name,
        shortName: t2.shortName,
        code: t2.code,
        logoKey: t2.logoKey,
        color: t2.color,
        cardBg: t2.cardBg
      },
      dateStr: dateStr,
      date: dateStr,
      time: timings[timeIdx],
      timeText: timings[timeIdx],
      venue: venues[venueIdx],
      overs: 10,
      maxOvers: 10,
      ballType: 'tennis',
      status: 'UPCOMING',
      phase: 'upcoming'
    });

    matchIndex++;
  });

  // 2. Playoff Fixtures
  // Semi-Final 1 (13 Oct 2026)
  matches.push({
    id: `match_rpl_${matchIndex}`,
    matchNumber: matchIndex,
    matchNo: matchIndex,
    stage: 'Semi-Final 1',
    tournamentId: RAJASTHAN_LEAGUE_2026.id,
    tournamentName: RAJASTHAN_LEAGUE_2026.name,
    matchTitle: 'Rank 1 (League Topper) vs Rank 4 (League)',
    team1: { name: 'Rank 1 (League Topper)', shortName: 'TBC', isPlaceholder: true },
    team2: { name: 'Rank 4 (League)', shortName: 'TBC', isPlaceholder: true },
    dateStr: '13 Oct 2026',
    date: '13 Oct 2026',
    time: '01:30 PM',
    timeText: '01:30 PM',
    venue: 'Sadokan Cricket Club',
    overs: 10,
    maxOvers: 10,
    ballType: 'tennis',
    status: 'UPCOMING',
    phase: 'upcoming'
  });
  matchIndex++;

  // Semi-Final 2 (14 Oct 2026)
  matches.push({
    id: `match_rpl_${matchIndex}`,
    matchNumber: matchIndex,
    matchNo: matchIndex,
    stage: 'Semi-Final 2',
    tournamentId: RAJASTHAN_LEAGUE_2026.id,
    tournamentName: RAJASTHAN_LEAGUE_2026.name,
    matchTitle: 'Rank 2 (League) vs Rank 3 (League)',
    team1: { name: 'Rank 2 (League)', shortName: 'TBC', isPlaceholder: true },
    team2: { name: 'Rank 3 (League)', shortName: 'TBC', isPlaceholder: true },
    dateStr: '14 Oct 2026',
    date: '14 Oct 2026',
    time: '01:30 PM',
    timeText: '01:30 PM',
    venue: 'Deh Cricket Ground',
    overs: 10,
    maxOvers: 10,
    ballType: 'tennis',
    status: 'UPCOMING',
    phase: 'upcoming'
  });
  matchIndex++;

  // Grand Final (15 Oct 2026)
  matches.push({
    id: `match_rpl_${matchIndex}`,
    matchNumber: matchIndex,
    matchNo: matchIndex,
    stage: 'Final',
    tournamentId: RAJASTHAN_LEAGUE_2026.id,
    tournamentName: RAJASTHAN_LEAGUE_2026.name,
    matchTitle: 'Winner Semi-Final 1 vs Winner Semi-Final 2',
    team1: { name: 'Winner Semi-Final 1', shortName: 'TBC', isPlaceholder: true },
    team2: { name: 'Winner Semi-Final 2', shortName: 'TBC', isPlaceholder: true },
    dateStr: '15 Oct 2026',
    date: '15 Oct 2026',
    time: '05:30 PM',
    timeText: '05:30 PM',
    venue: 'Manasar Garden',
    overs: 10,
    maxOvers: 10,
    ballType: 'tennis',
    status: 'UPCOMING',
    phase: 'upcoming'
  });

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
    nrr: '+0.000',
    form: []
  }));
}

/**
 * Build the full Rajasthan League 2026 document ready for Supabase and AsyncStorage
 */
export function buildRajasthanLeagueTournament() {
  const matches = generateRajasthanLeagueFixtures();
  const pointsTable = generateInitialPointsTable();

  return {
    ...RAJASTHAN_LEAGUE_2026,
    matches,
    pointsTable,
    stats: {
      totalMatches: matches.length,
      completedMatches: 0,
      liveMatches: 0,
      upcomingMatches: matches.length,
      topScorer: null,
      topWicketTaker: null,
      highestSixes: null,
      mvpPlayer: null
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
