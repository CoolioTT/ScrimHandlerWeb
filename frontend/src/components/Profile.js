import React, { useState } from 'react';
import axios from 'axios';
import { 
  User, 
  Target, 
  Star, 
  Trophy, 
  Mail,
  Crown,
  ArrowUp,
  Clock,
  Settings
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const Profile = ({ user, setUser }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [upgradeForm, setUpgradeForm] = useState({
    requested_tier: 3
  });

  const handleTierUpgradeRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(`${API_BASE_URL}/api/user/request-tier-upgrade`, upgradeForm);
      setSuccess('Tier upgrade request submitted successfully! An admin will review your request.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit tier upgrade request');
    }
    
    setLoading(false);
  };

  const getRankBadgeColor = (rank) => {
    if (rank.includes('Iron')) return 'bg-gray-600 text-gray-200';
    if (rank.includes('Bronze')) return 'bg-yellow-800 text-yellow-200';
    if (rank.includes('Silver')) return 'bg-gray-400 text-gray-900';
    if (rank.includes('Gold')) return 'bg-yellow-500 text-yellow-900';
    if (rank.includes('Platinum')) return 'bg-cyan-500 text-cyan-900';
    if (rank.includes('Diamond')) return 'bg-purple-500 text-purple-100';
    if (rank.includes('Ascendant')) return 'bg-green-500 text-green-900';
    if (rank.includes('Immortal')) return 'bg-red-500 text-red-100';
    if (rank.includes('Radiant')) return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-yellow-900';
    return 'bg-gray-600 text-gray-200';
  };

  const getTierDescription = (tier) => {
    const descriptions = {
      public: 'Basic access to public scrims and features',
      tier_3: 'Access to Tier 3+ scrims and enhanced features',
      tier_2: 'Access to Tier 2+ scrims and premium features',
      tier_1: 'Full access to all scrims and exclusive features'
    };
    return descriptions[tier] || 'Unknown tier';
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Player Profile</h1>
            <p className="text-gray-400">Manage your account and upgrade requests</p>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-card p-6 border-red-500/20">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="glass-card p-6 border-green-500/20">
          <p className="text-green-400">{success}</p>
        </div>
      )}

      {/* Profile Info */}
      <div className="glass-card p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Account Information</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Picture & Basic Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{user.username}</h3>
                <p className="text-gray-400 flex items-center space-x-1">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Current Tier</span>
                  <div className="flex items-center space-x-2">
                    <span className={`tier-badge tier-${user.tier}`}>
                      {user.tier.replace('_', ' ').toUpperCase()}
                    </span>
                    {user.is_admin && <Crown className="w-4 h-4 text-yellow-400" />}
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {getTierDescription(user.tier)}
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Current Rank</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRankBadgeColor(user.rank)}`}>
                    {user.rank}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Team Status</span>
                  <span className={`text-sm font-medium ${user.team_id ? 'text-green-400' : 'text-yellow-400'}`}>
                    {user.team_id ? 'In Team' : 'No Team'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Valorant Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Valorant Account</span>
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <span className="text-gray-300 block mb-2">Riot ID</span>
                <span className="text-white font-mono">
                  {user.valorant_username}#{user.valorant_tag}
                </span>
              </div>

              <div className="p-4 bg-white/5 rounded-lg">
                <span className="text-gray-300 block mb-2">Statistics</span>
                <div className="text-sm text-gray-400">
                  <p>• Player stats will be available when Riot API is integrated</p>
                  <p>• Last 20 games average performance</p>
                  <p>• Rank progression tracking</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Upgrade Section */}
      {user.tier === 'public' && (
        <div className="glass-card p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <ArrowUp className="w-5 h-5" />
            <span>Request Tier Upgrade</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Tier Benefits</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="font-semibold text-blue-400 mb-2">Tier 3</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Access to Tier 3 exclusive scrims</li>
                    <li>• Priority scrim matching</li>
                    <li>• Enhanced profile features</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
                  <h4 className="font-semibold text-purple-400 mb-2">Tier 2</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• All Tier 3 benefits</li>
                    <li>• Advanced statistics tracking</li>
                    <li>• Premium scrim features</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg">
                  <h4 className="font-semibold text-yellow-400 mb-2">Tier 1</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• All previous benefits</li>
                    <li>• Exclusive Tier 1 scrims</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Submit Request</h3>
              <form onSubmit={handleTierUpgradeRequest} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Requested Tier
                  </label>
                  <select
                    value={upgradeForm.requested_tier}
                    onChange={(e) => setUpgradeForm({ requested_tier: parseInt(e.target.value) })}
                    className="glass-input"
                  >
                    <option value={3}>Tier 3</option>
                    <option value={2}>Tier 2</option>
                    <option value={1}>Tier 1</option>
                  </select>
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Clock className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-400 mb-1">Review Process</h4>
                      <p className="text-sm text-gray-300">
                        Your request will be reviewed by an admin. This process typically takes 1-3 business days. 
                        You'll be notified once your request has been processed.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="glass-button w-full flex items-center justify-center space-x-2 py-3 bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30"
                >
                  {loading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <>
                      <Star className="w-5 h-5" />
                      <span>Submit Upgrade Request</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin Badge */}
      {user.is_admin && (
        <div className="glass-card p-6 border-yellow-500/20">
          <div className="flex items-center space-x-3">
            <Crown className="w-6 h-6 text-yellow-400" />
            <div>
              <h3 className="font-semibold text-white">Administrator Access</h3>
              <p className="text-gray-400 text-sm">
                You have administrative privileges. Access the admin dashboard to manage tier requests.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;