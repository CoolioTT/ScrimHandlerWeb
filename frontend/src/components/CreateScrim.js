import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Target, 
  Calendar, 
  Clock, 
  MapPin, 
  Settings,
  Plus,
  X,
  Save
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const CreateScrim = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [maps, setMaps] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    maps: [],
    max_rounds: 13,
    num_games: 1,
    scheduled_time: '',
    max_participants: 2
  });

  useEffect(() => {
    // Check if user has a team
    if (!user.team_id) {
      navigate('/team');
      return;
    }

    // Fetch available maps
    const fetchMaps = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/maps`);
        setMaps(response.data.maps);
      } catch (err) {
        console.error('Failed to fetch maps:', err);
      }
    };

    fetchMaps();

    // Set default scheduled time to 1 hour from now
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0, 0, 0); // Round to the nearest hour
    const timeString = now.toISOString().slice(0, 16);
    setFormData(prev => ({ ...prev, scheduled_time: timeString }));
  }, [user.team_id, navigate]);

  const handleMapToggle = (map) => {
    setFormData(prev => ({
      ...prev,
      maps: prev.maps.includes(map)
        ? prev.maps.filter(m => m !== map)
        : [...prev.maps, map]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.maps.length === 0) {
      setError('Please select at least one map');
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/scrims/create`, {
        ...formData,
        scheduled_time: new Date(formData.scheduled_time).toISOString()
      });
      
      navigate('/scrims');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create scrim');
    }
    
    setLoading(false);
  };

  const selectAllMaps = () => {
    setFormData(prev => ({ ...prev, maps: [...maps] }));
  };

  const clearAllMaps = () => {
    setFormData(prev => ({ ...prev, maps: [] }));
  };

  if (!user.team_id) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Create Scrim</h1>
            <p className="text-gray-400">Post a new scrim request for your team</p>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
            <Plus className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-card p-6 border-red-500/20">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Create Form */}
      <div className="glass-card p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Basic Information</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Scrim Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="glass-input"
                  placeholder="e.g., Evening Practice Scrim"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Participants
                </label>
                <select
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                  className="glass-input"
                >
                  <option value={2}>2 Teams</option>
                  <option value={4}>4 Teams</option>
                  <option value={6}>6 Teams</option>
                  <option value={8}>8 Teams</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="glass-input min-h-[100px] resize-none"
                placeholder="Describe what you're looking for in this scrim..."
                required
              />
            </div>
          </div>

          {/* Game Settings */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Game Settings</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Games
                </label>
                <select
                  value={formData.num_games}
                  onChange={(e) => setFormData({ ...formData, num_games: parseInt(e.target.value) })}
                  className="glass-input"
                >
                  <option value={1}>1 Game</option>
                  <option value={2}>2 Games</option>
                  <option value={3}>3 Games</option>
                  <option value={5}>Best of 5</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Rounds
                </label>
                <select
                  value={formData.max_rounds}
                  onChange={(e) => setFormData({ ...formData, max_rounds: parseInt(e.target.value) })}
                  className="glass-input"
                >
                  <option value={13}>MR13 (First to 13)</option>
                  <option value={24}>MR24 (Play all rounds)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Scheduled Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  className="glass-input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Map Selection */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Map Selection ({formData.maps.length} selected)</span>
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={selectAllMaps}
                  className="glass-button px-3 py-1 text-sm"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearAllMaps}
                  className="glass-button px-3 py-1 text-sm"
                >
                  Clear All
                </button>
              </div>
            </div>
            
            <div className="map-selector">
              {maps.map((map) => (
                <div
                  key={map}
                  onClick={() => handleMapToggle(map)}
                  className={`map-option ${formData.maps.includes(map) ? 'selected' : ''}`}
                >
                  {map}
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Preview</h2>
            <div className="p-6 bg-white/5 rounded-lg border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">T</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{formData.title || 'Your Team'}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-orange-400 font-semibold">4.5</span>
                      <span className={`tier-badge tier-${user.tier}`}>
                        {user.tier.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="mb-2">
                    <span className="text-white font-semibold">
                      {formData.num_games} Game{formData.num_games > 1 ? 's' : ''} - MR{formData.max_rounds}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mb-2">
                    {formData.maps.length === 0 ? 'No maps selected' : 
                     formData.maps.length > 3 ? 'Any Map' : formData.maps.join(', ')}
                  </div>
                  <span className="status-open font-semibold">OPEN</span>
                </div>
              </div>
              
              {formData.scheduled_time && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(formData.scheduled_time).toLocaleDateString()} at{' '}
                      {new Date(formData.scheduled_time).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={() => navigate('/scrims')}
              className="glass-button flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="glass-button flex items-center space-x-2 bg-green-500/20 border-green-500/30 hover:bg-green-500/30"
            >
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Create Scrim</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateScrim;