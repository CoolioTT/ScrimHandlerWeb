import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Target, 
  Users, 
  Plus, 
  Calendar, 
  Trophy, 
  ArrowUpRight,
  Clock,
  MapPin,
  Star
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalScrims: 0,
    activeScrims: 0,
    teamMembers: user.team ? 1 : 0
  });
  const [recentScrims, setRecentScrims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const scrimsResponse = await axios.get(`${API_BASE_URL}/api/scrims`);
        const scrims = scrimsResponse.data;
        
        setRecentScrims(scrims.slice(0, 5));
        setStats(prev => ({
          ...prev,
          totalScrims: scrims.length,
          activeScrims: scrims.filter(s => s.status === 'open').length
        }));
        
        if (user.team_id) {
          try {
            const teamResponse = await axios.get(`${API_BASE_URL}/api/teams/my-team`);
            setStats(prev => ({
              ...prev,
              teamMembers: teamResponse.data.members.length
            }));
          } catch (error) {
            console.error('Failed to fetch team data:', error);
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user.team_id]);

  const quickActions = [
    {
      title: 'Browse Scrims',
      description: 'Find teams to scrim with',
      href: '/scrims',
      icon: Target,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: user.team_id ? 'Manage Team' : 'Create Team',
      description: user.team_id ? 'View team members' : 'Start your own team',
      href: '/team',
      icon: Users,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Create Scrim',
      description: 'Post a new scrim request',
      href: '/create-scrim',
      icon: Plus,
      color: 'from-green-500 to-emerald-500',
      disabled: !user.team_id
    }
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="glass-card p-8 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="glass-card p-8 fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, <span className="gradient-text">{user.username}</span>
            </h1>
            <p className="text-gray-400 flex items-center space-x-2">
              <span>Current Tier:</span>
              <span className={`tier-badge tier-${user.tier}`}>
                {user.tier.replace('_', ' ').toUpperCase()}
              </span>
              <span>•</span>
              <span>Rank: {user.rank}</span>
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Available Scrims</p>
              <p className="text-2xl font-bold text-white">{stats.activeScrims}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Team Members</p>
              <p className="text-2xl font-bold text-white">{stats.teamMembers}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Scrims</p>
              <p className="text-2xl font-bold text-white">{stats.totalScrims}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-8">
        <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.href}
                className={`group p-6 rounded-xl border transition-all duration-300 ${
                  action.disabled
                    ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed opacity-50'
                    : 'border-purple-500/20 bg-gradient-to-br from-white/5 to-white/10 hover:border-purple-500/40 hover-lift'
                }`}
                onClick={action.disabled ? (e) => e.preventDefault() : undefined}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {!action.disabled && (
                    <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
                <p className="text-gray-400 text-sm">{action.description}</p>
                {action.disabled && (
                  <p className="text-yellow-400 text-xs mt-2">⚠️ Requires team membership</p>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Scrims */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Recent Scrims</h2>
          <Link to="/scrims" className="glass-button px-4 py-2 text-sm">
            View All
          </Link>
        </div>

        {recentScrims.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No scrims available yet</p>
            <p className="text-gray-500 text-sm">Check back later or create your own!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentScrims.map((scrim) => (
              <div key={scrim.scrim_id} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-white">{scrim.title}</h3>
                      <span className={`tier-badge tier-${scrim.tier}`}>
                        {scrim.tier.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="status-open text-sm">● OPEN</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{scrim.team_name}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{scrim.maps.length} maps</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>MR{scrim.max_rounds}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      {new Date(scrim.scheduled_time).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(scrim.scheduled_time).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tier Upgrade Notice */}
      {user.tier === 'public' && (
        <div className="glass-card p-6 border-yellow-500/20">
          <div className="flex items-center space-x-3">
            <Star className="w-6 h-6 text-yellow-400" />
            <div>
              <h3 className="font-semibold text-white">Upgrade to Higher Tiers</h3>
              <p className="text-gray-400 text-sm">
                Request an upgrade to access Tier 1-3 exclusive scrims and features.
              </p>
            </div>
            <Link to="/profile" className="glass-button px-4 py-2 text-sm ml-auto">
              Request Upgrade
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;