import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Shield, 
  Users, 
  Check, 
  X, 
  Clock,
  Eye,
  AlertCircle,
  UserPlus,
  Crown
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDashboard = ({ user }) => {
  const [tierRequests, setTierRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTierRequests();
  }, []);

  const fetchTierRequests = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/tier-requests`);
      setTierRequests(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load tier requests');
      console.error('Error fetching tier requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    setProcessing(prev => ({ ...prev, [requestId]: 'approving' }));
    
    try {
      await axios.post(`${API_BASE_URL}/api/admin/tier-requests/${requestId}/approve`);
      await fetchTierRequests();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to approve request');
    }
    
    setProcessing(prev => {
      const newState = { ...prev };
      delete newState[requestId];
      return newState;
    });
  };

  const handleRejectRequest = async (requestId) => {
    setProcessing(prev => ({ ...prev, [requestId]: 'rejecting' }));
    
    try {
      await axios.post(`${API_BASE_URL}/api/admin/tier-requests/${requestId}/reject`);
      await fetchTierRequests();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reject request');
    }
    
    setProcessing(prev => {
      const newState = { ...prev };
      delete newState[requestId];
      return newState;
    });
  };

  const getTierBadgeClass = (tier) => {
    const classes = {
      tier_3: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      tier_2: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      tier_1: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    };
    return classes[tier] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (!user.is_admin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="glass-card p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">You don't have administrator privileges.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="glass-card p-8 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center space-x-2">
              <Shield className="w-8 h-8" />
              <span>Admin Dashboard</span>
            </h1>
            <p className="text-gray-400">Manage tier upgrade requests and system administration</p>
          </div>
          <div className="flex items-center space-x-2">
            <Crown className="w-6 h-6 text-yellow-400" />
            <span className="text-yellow-400 font-semibold">Administrator</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-card p-6 border-red-500/20">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Pending Requests</p>
              <p className="text-2xl font-bold text-white">{tierRequests.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Users</p>
              <p className="text-2xl font-bold text-white">--</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Active Scrims</p>
              <p className="text-2xl font-bold text-white">--</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tier Upgrade Requests */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <UserPlus className="w-5 h-5" />
            <span>Tier Upgrade Requests</span>
          </h2>
          <button
            onClick={fetchTierRequests}
            className="glass-button flex items-center space-x-2"
          >
            <Clock className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {tierRequests.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No pending requests</h3>
            <p className="text-gray-400">All tier upgrade requests have been processed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tierRequests.map((request) => (
              <div key={request.request_id} className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold">
                        {request.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-lg">{request.username}</h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-sm text-gray-400">
                          Current: <span className="tier-badge tier-public">PUBLIC</span>
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-sm text-gray-400">
                          Requested: <span className={`px-2 py-1 rounded text-xs font-medium border ${getTierBadgeClass(request.requested_tier)}`}>
                            {request.requested_tier.replace('_', ' ').toUpperCase()}
                          </span>
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Requested {new Date(request.created_at).toLocaleDateString()} at{' '}
                        {new Date(request.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleApproveRequest(request.request_id)}
                      disabled={processing[request.request_id]}
                      className="glass-button flex items-center space-x-2 bg-green-500/20 border-green-500/30 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing[request.request_id] === 'approving' ? (
                        <div className="loading-spinner w-4 h-4"></div>
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => handleRejectRequest(request.request_id)}
                      disabled={processing[request.request_id]}
                      className="glass-button flex items-center space-x-2 bg-red-500/20 border-red-500/30 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing[request.request_id] === 'rejecting' ? (
                        <div className="loading-spinner w-4 h-4"></div>
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-8">
        <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors text-left">
            <Users className="w-6 h-6 text-blue-400 mb-2" />
            <h3 className="font-semibold text-white mb-1">Manage Users</h3>
            <p className="text-sm text-gray-400">View and manage all users</p>
          </button>

          <button className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors text-left">
            <Eye className="w-6 h-6 text-green-400 mb-2" />
            <h3 className="font-semibold text-white mb-1">View Scrims</h3>
            <p className="text-sm text-gray-400">Monitor all scrim activities</p>
          </button>

          <button className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors text-left">
            <Shield className="w-6 h-6 text-purple-400 mb-2" />
            <h3 className="font-semibold text-white mb-1">System Settings</h3>
            <p className="text-sm text-gray-400">Configure system preferences</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;