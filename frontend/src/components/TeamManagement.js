import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Plus, 
  Crown, 
  Star, 
  UserPlus, 
  Settings,
  Trophy,
  Target
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const TeamManagement = ({ user, setUser }) => {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');

  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    max_members: 5
  });

  useEffect(() => {
    const fetchTeamData = async () => {
      if (user.team_id) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/teams/my-team`);
          setTeam(response.data);
        } catch (err) {
          console.error('Failed to fetch team:', err);
          setError('Failed to load team data');
        }
      }
      setLoading(false);
    };

    fetchTeamData();
  }, [user.team_id]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE_URL}/api/teams/create`, createForm);
      
      // Refresh user data
      const profileResponse = await axios.get(`${API_BASE_URL}/api/user/profile`);
      setUser(profileResponse.data);
      
      // Fetch new team data
      const teamResponse = await axios.get(`${API_BASE_URL}/api/teams/my-team`);
      setTeam(teamResponse.data);
      
      setShowCreateForm(false);
      setCreateForm({ name: '', description: '', max_members: 5 });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create team');
    }
    
    setCreateLoading(false);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="glass-card p-8 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-400">Loading team data...</p>
        </div>
      </div>
    );
  }

  // Check if user can create teams
  const canCreateTeam = !['tier_1', 'tier_2'].includes(user.tier);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Team Management</h1>
            <p className="text-gray-400">
              {team ? 'Manage your team and members' : 'Create or join a team to start scrimming'}
            </p>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-card p-6 border-red-500/20">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {!team ? (
        // No Team - Show Create Form
        <div className="glass-card p-8">
          {!canCreateTeam ? (
            <div className="text-center py-8">
              <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Team Creation Restricted</h2>
              <p className="text-gray-400 mb-6">
                Tier 1 and Tier 2 users cannot create teams. You can join existing teams instead.
              </p>
              <div className={`tier-badge tier-${user.tier} text-lg py-2 px-4`}>
                {user.tier.replace('_', ' ').toUpperCase()}
              </div>
            </div>
          ) : !showCreateForm ? (
            <div className="text-center py-8">
              <Target className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">You're not in a team</h2>
              <p className="text-gray-400 mb-6">
                Create a team to start posting scrims and competing with other teams.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="glass-button flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Create Team</span>
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Create New Team</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateTeam} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="glass-input"
                    placeholder="Enter team name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="glass-input min-h-[100px] resize-none"
                    placeholder="Describe your team..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Maximum Members
                  </label>
                  <select
                    value={createForm.max_members}
                    onChange={(e) => setCreateForm({ ...createForm, max_members: parseInt(e.target.value) })}
                    className="glass-input"
                  >
                    <option value={5}>5 Members</option>
                    <option value={6}>6 Members</option>
                    <option value={7}>7 Members</option>
                    <option value={10}>10 Members</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={createLoading}
                  className="glass-button w-full flex items-center justify-center space-x-2 py-3"
                >
                  {createLoading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <>
                      <Users className="w-5 h-5" />
                      <span>Create Team</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        // Has Team - Show Team Details
        <div className="space-y-8">
          {/* Team Info Card */}
          <div className="glass-card p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{team.name}</h2>
                  <p className="text-gray-400">{team.description}</p>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className={`tier-badge tier-${team.tier}`}>
                      {team.tier.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRankBadgeColor(team.average_rank)}`}>
                      {team.average_rank}
                    </span>
                  </div>
                </div>
              </div>
              
              {team.owner_id === user.user_id && (
                <button className="glass-button flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium text-gray-300">Members</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {team.members.length}/{team.max_members}
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium text-gray-300">Created</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {new Date(team.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium text-gray-300">Status</span>
                </div>
                <p className="text-lg font-semibold text-green-400">Active</p>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Team Members</h3>
              {team.owner_id === user.user_id && team.members.length < team.max_members && (
                <button className="glass-button flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Invite Member</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {team.members_details?.map((member) => (
                <div key={member.user_id} className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold">
                          {member.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-white">{member.username}</h4>
                          {member.user_id === team.owner_id && (
                            <Crown className="w-4 h-4 text-yellow-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          {member.valorant_username}#{member.valorant_tag}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getRankBadgeColor(member.rank)}`}>
                            {member.rank}
                          </span>
                          <span className={`tier-badge tier-${member.tier} text-xs`}>
                            {member.tier.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-400">
                        {member.user_id === team.owner_id ? 'Owner' : 'Member'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;