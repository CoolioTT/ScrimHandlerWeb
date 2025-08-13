import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Target, 
  Clock, 
  MapPin, 
  Users, 
  Filter,
  Calendar,
  Search,
  RefreshCw,
  ChevronDown
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const ScrimBoard = ({ user }) => {
  const [scrims, setScrims] = useState([]);
  const [filteredScrims, setFilteredScrims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    day: 'all',
    time: 'all',
    format: 'all',
    map: 'all',
    tier: 'all'
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchScrims();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [scrims, filters]);

  const fetchScrims = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/scrims`);
      setScrims(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load scrims');
      console.error('Error fetching scrims:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchScrims();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...scrims];
    
    // Filter by day
    if (filters.day !== 'all') {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      filtered = filtered.filter(scrim => {
        const scrimDate = new Date(scrim.scheduled_time);
        if (filters.day === 'today') {
          return scrimDate.toDateString() === today.toDateString();
        } else if (filters.day === 'tomorrow') {
          return scrimDate.toDateString() === tomorrow.toDateString();
        }
        return true;
      });
    }

    // Filter by format
    if (filters.format !== 'all') {
      filtered = filtered.filter(scrim => {
        if (filters.format === '1game') return scrim.num_games === 1;
        if (filters.format === '2games') return scrim.num_games === 2;
        if (filters.format === 'mr13') return scrim.max_rounds === 13;
        if (filters.format === 'mr24') return scrim.max_rounds === 24;
        return true;
      });
    }

    // Filter by tier
    if (filters.tier !== 'all') {
      filtered = filtered.filter(scrim => scrim.tier === filters.tier);
    }

    // Sort by scheduled time
    filtered.sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));

    setFilteredScrims(filtered);
  };

  const getTimeFromDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getDateFromDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const groupScrimsByDate = (scrims) => {
    const groups = {};
    scrims.forEach(scrim => {
      const dateKey = getDateFromDate(scrim.scheduled_time);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(scrim);
    });
    return groups;
  };

  const handleApplyToScrim = async (scrimId) => {
    if (!user.team_id) {
      alert('You need to be in a team to apply to scrims');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/scrims/${scrimId}/apply`, {
        selected_maps: [],
        preferred_rounds: 13,
        preferred_games: 1,
        message: 'Looking forward to a good scrim!'
      });
      
      alert('Applied to scrim successfully!');
      await fetchScrims();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to apply to scrim');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="glass-card p-8 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-400">Loading scrims...</p>
        </div>
      </div>
    );
  }

  const groupedScrims = groupScrimsByDate(filteredScrims);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Scrim Board</h1>
            <p className="text-gray-400">Find teams to scrim with</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="glass-button flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="glass-button flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="glass-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Day</label>
              <select
                value={filters.day}
                onChange={(e) => setFilters({ ...filters, day: e.target.value })}
                className="glass-input"
              >
                <option value="all">All Days</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
              <select
                value={filters.format}
                onChange={(e) => setFilters({ ...filters, format: e.target.value })}
                className="glass-input"
              >
                <option value="all">All Formats</option>
                <option value="1game">1 Game</option>
                <option value="2games">2+ Games</option>
                <option value="mr13">MR13</option>
                <option value="mr24">MR24</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tier</label>
              <select
                value={filters.tier}
                onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
                className="glass-input"
              >
                <option value="all">All Tiers</option>
                <option value="public">Public</option>
                <option value="tier_3">Tier 3</option>
                <option value="tier_2">Tier 2</option>
                <option value="tier_1">Tier 1</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ day: 'all', time: 'all', format: 'all', map: 'all', tier: 'all' })}
                className="glass-button w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="glass-card p-6 border-red-500/20">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Scrims List */}
      {Object.keys(groupedScrims).length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No scrims found</h2>
          <p className="text-gray-400">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        Object.entries(groupedScrims).map(([date, dateStrims]) => (
          <div key={date} className="space-y-4">
            {/* Date Header */}
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-bold text-white">{date}</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-transparent"></div>
            </div>

            {/* Scrims for this date */}
            <div className="space-y-3">
              {dateStrims.map((scrim) => (
                <div key={scrim.scrim_id} className="glass-card p-6 hover-lift">
                  <div className="flex items-center justify-between">
                    {/* Time */}
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
                        <span className="text-white font-bold text-lg">
                          {getTimeFromDate(scrim.scheduled_time)}
                        </span>
                      </div>

                      {/* Team Info */}
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {scrim.team_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">{scrim.team_name}</h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-orange-400 font-semibold">4.5</span>
                            <span className={`tier-badge tier-${scrim.tier}`}>
                              {scrim.tier.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Scrim Details */}
                    <div className="text-right">
                      <div className="mb-2">
                        <span className="text-white font-semibold">
                          {scrim.num_games} Game{scrim.num_games > 1 ? 's' : ''} - MR{scrim.max_rounds}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
                        {scrim.maps.length > 3 ? 'Any Map' : scrim.maps.join(', ')}
                      </div>
                      <div className="flex items-center justify-end space-x-3">
                        <span className="status-open font-semibold">OPEN</span>
                        {user.team_id && scrim.team_id !== user.team_id && (
                          <button
                            onClick={() => handleApplyToScrim(scrim.scrim_id)}
                            className="glass-button px-4 py-2 text-sm"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{scrim.applications?.length || 0} applications</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Posted {new Date(scrim.created_at).toLocaleDateString()}</span>
                      </span>
                    </div>
                    {scrim.description && (
                      <p className="text-gray-300 text-sm mt-2">{scrim.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ScrimBoard;