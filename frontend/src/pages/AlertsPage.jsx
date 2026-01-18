/**
 * AlertsPage - Alert Rules Management (P0 Architecture)
 * 
 * AlertsPage = управление правилами, НЕ событиями
 * Events ≠ Alerts
 * Events — transient, Alerts — persistent rules
 */
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bell, Plus, Pause, Play, Trash2, Settings, 
  Loader2, AlertCircle, ExternalLink, Clock,
  Activity, Wallet, Users, Building
} from 'lucide-react';
import Header from '../components/Header';
import CreateAlertModal from '../components/CreateAlertModal';
import EmptyState from '../components/EmptyState';
import { alertsApi } from '../api';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import UnifiedCard, { StatusBadge, CardIcon } from '../components/UnifiedCard';
import ContextPath from '../components/ContextPath';

// Signal type with PRODUCT LANGUAGE
const SIGNAL_TYPES = {
  'accumulation': {
    emoji: '📥',
    label: 'Consistent Buying',
    insight: 'Large wallets are accumulating',
    description: 'Large wallets are accumulating this token'
  },
  'distribution': {
    emoji: '📤',
    label: 'Increasing Selling',
    insight: 'Holders are distributing',
    description: 'Holders are distributing to the market'
  },
  'large_move': {
    emoji: '💰',
    label: 'Large Movement',
    insight: 'Significant transfer detected',
    description: 'Significant token movement detected'
  },
  'smart_money_entry': {
    emoji: '🐋',
    label: 'Smart Money Entry',
    insight: 'Profitable wallets entering',
    description: 'Historically profitable wallets entering'
  },
  'smart_money_exit': {
    emoji: '🏃',
    label: 'Smart Money Exit',
    insight: 'Profitable wallets exiting',
    description: 'Historically profitable wallets exiting'
  },
  'activity_spike': {
    emoji: '⚡',
    label: 'Activity Spike',
    insight: 'Unusual activity surge',
    description: 'Sudden increase in activity'
  },
};

// Lifecycle states with UX LANGUAGE (not technical)
const LIFECYCLE_STATES = {
  active: { label: 'Monitoring', color: 'bg-emerald-100 text-emerald-700' },
  triggered: { label: 'Observed', color: 'bg-blue-100 text-blue-700' },
  repeating: { label: 'Ongoing', color: 'bg-purple-100 text-purple-700' },
  paused: { label: 'Paused', color: 'bg-gray-100 text-gray-500' },
  resolved: { label: 'Inactive', color: 'bg-gray-100 text-gray-400' },
};

// Legacy emoji map for compatibility
const SIGNAL_EMOJIS = Object.keys(SIGNAL_TYPES).reduce((acc, key) => {
  acc[key] = SIGNAL_TYPES[key].emoji;
  return acc;
}, {});

// Scope icons
const SCOPE_ICONS = {
  'token': Activity,
  'wallet': Wallet,
  'actor': Users,
  'entity': Building,
};

// Format time ago
function timeAgo(date) {
  if (!date) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Alert Rule Card - Refactored using UnifiedCard
function AlertRuleCard({ rule, onPause, onResume, onDelete, onEdit }) {
  const [loading, setLoading] = useState(false);
  
  const ScopeIcon = SCOPE_ICONS[rule.scope] || Activity;
  const isActive = rule.status === 'active';
  
  // Get target display name
  const targetDisplay = rule.watchlistItemId?.target?.symbol 
    || rule.watchlistItemId?.target?.name
    || rule.targetId?.slice(0, 10) + '...' + rule.targetId?.slice(-6);
  
  // Get trigger types display
  const triggers = rule.triggerTypes || [rule.trigger?.type];
  
  // Get condition summary
  const getConditionSummary = () => {
    const parts = [];
    if (rule.trigger?.threshold) {
      parts.push(`≥${rule.trigger.threshold.toLocaleString()}`);
    }
    if (rule.trigger?.window) {
      parts.push(`per ${rule.trigger.window}`);
    }
    return parts.length > 0 ? parts.join(' ') : null;
  };
  const conditionSummary = getConditionSummary();
  
  const handleToggleStatus = async () => {
    setLoading(true);
    try {
      if (isActive) {
        await onPause(rule._id);
      } else {
        await onResume(rule._id);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this alert rule?')) {
      setLoading(true);
      try {
        await onDelete(rule._id);
      } finally {
        setLoading(false);
      }
    }
  };

  // Render triggers badges with product copy
  const triggerBadges = (
    <div className="flex flex-wrap gap-1">
      {triggers.filter(Boolean).map((trigger, i) => {
        const signalType = SIGNAL_TYPES[trigger];
        return (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs cursor-help">
                <span>{signalType?.emoji || '🔔'}</span>
                <span>{signalType?.label || trigger.replace(/_/g, ' ')}</span>
              </span>
            </TooltipTrigger>
            {signalType?.description && (
              <TooltipContent className="bg-gray-900 text-white">
                <p className="text-xs">{signalType.description}</p>
              </TooltipContent>
            )}
          </Tooltip>
        );
      })}
    </div>
  );

  // Render meta information (channels + last triggered)
  const metaInfo = (
    <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
      {/* Channels */}
      <div className="flex items-center gap-1">
        {rule.channels?.inApp && (
          <Tooltip>
            <TooltipTrigger>
              <Bell className="w-3.5 h-3.5 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 text-white">
              <p className="text-xs">In-App notifications</p>
            </TooltipContent>
          </Tooltip>
        )}
        {rule.channels?.telegram && (
          <Tooltip>
            <TooltipTrigger>
              <svg className="w-3.5 h-3.5 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 text-white">
              <p className="text-xs">Telegram notifications</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      
      {/* Last Triggered */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 cursor-help">
            <Clock className="w-3 h-3" />
            <span>
              {rule.lastTriggeredAt 
                ? `Last observed ${timeAgo(rule.lastTriggeredAt)}`
                : 'No activity yet'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-900 text-white">
          <p className="text-xs">
            {rule.lastTriggeredAt 
              ? new Date(rule.lastTriggeredAt).toLocaleString()
              : 'No matching on-chain activity observed yet'}
          </p>
        </TooltipContent>
      </Tooltip>
      
      {/* Trigger Count */}
      {rule.triggerCount > 0 && (
        <span className="text-purple-600 font-medium">
          {rule.triggerCount} total
        </span>
      )}
    </div>
  );

  // Render actions with product copy
  const actions = [
    // Edit Button
    <Tooltip key="edit">
      <TooltipTrigger asChild>
        <button
          onClick={() => onEdit(rule)}
          disabled={loading}
          className="p-2 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors"
          data-testid={`edit-alert-${rule._id}`}
        >
          <Settings className="w-4 h-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="bg-gray-900 text-white">
        <p className="text-xs">Adjust monitoring</p>
      </TooltipContent>
    </Tooltip>,
    
    // Pause/Resume Button
    <Tooltip key="toggle">
      <TooltipTrigger asChild>
        <button
          onClick={handleToggleStatus}
          disabled={loading}
          className={`p-2 rounded-lg transition-colors ${
            isActive 
              ? 'hover:bg-amber-50 text-amber-600' 
              : 'hover:bg-emerald-50 text-emerald-600'
          }`}
          data-testid={`toggle-alert-${rule._id}`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isActive ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent className="bg-gray-900 text-white">
        <p className="text-xs">{isActive ? 'Pause monitoring' : 'Resume monitoring'}</p>
      </TooltipContent>
    </Tooltip>,
    
    // Delete Button
    <Tooltip key="delete">
      <TooltipTrigger asChild>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
          data-testid={`delete-alert-${rule._id}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="bg-gray-900 text-white">
        <p className="text-xs">Stop monitoring</p>
      </TooltipContent>
    </Tooltip>,
  ];

  return (
    <UnifiedCard
      testId={`alert-rule-${rule._id}`}
      className={!isActive ? 'opacity-60' : ''}
      icon={<CardIcon icon={ScopeIcon} className={
        rule.scope === 'token' ? 'bg-purple-100 text-purple-600' :
        rule.scope === 'wallet' ? 'bg-blue-100 text-blue-600' :
        rule.scope === 'actor' ? 'bg-emerald-100 text-emerald-600' :
        'bg-gray-100 text-gray-600'
      } />}
      header={{
        title: targetDisplay,
        badge: <StatusBadge className={isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}>
          {isActive ? 'Active' : 'Paused'}
        </StatusBadge>,
        subtitle: triggerBadges,
        link: {
          href: `/${rule.scope}s/${rule.targetId}`,
        },
      }}
      insight={conditionSummary ? (
        <div className="text-xs text-purple-600 font-medium">
          {conditionSummary}
        </div>
      ) : null}
      meta={metaInfo}
      actions={actions}
    />
  );
}

export default function AlertsPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, paused
  const [editingRule, setEditingRule] = useState(null);
  const navigate = useNavigate();

  // Load alert rules
  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await alertsApi.getAlertRules(filter === 'active');
      
      if (response?.ok) {
        let data = response.data || [];
        
        // Apply local filter for paused
        if (filter === 'paused') {
          data = data.filter(r => r.status === 'paused');
        }
        
        setRules(data);
      } else {
        setError(response?.error || 'Failed to load alert rules');
      }
    } catch (err) {
      console.error('Failed to load alert rules:', err);
      setError('Failed to load alert rules');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  // Pause rule
  const handlePause = async (ruleId) => {
    try {
      await alertsApi.updateAlertRule(ruleId, { status: 'paused' });
      loadRules();
    } catch (err) {
      console.error('Failed to pause rule:', err);
    }
  };

  // Resume rule
  const handleResume = async (ruleId) => {
    try {
      await alertsApi.updateAlertRule(ruleId, { status: 'active' });
      loadRules();
    } catch (err) {
      console.error('Failed to resume rule:', err);
    }
  };

  // Delete rule
  const handleDelete = async (ruleId) => {
    try {
      await alertsApi.deleteAlertRule(ruleId);
      loadRules();
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  // Edit rule
  const handleEdit = (rule) => {
    setEditingRule(rule);
  };

  const handleEditSuccess = () => {
    setEditingRule(null);
    loadRules();
  };

  // Stats
  const activeCount = rules.filter(r => r.status === 'active').length;
  const pausedCount = rules.filter(r => r.status === 'paused').length;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50" data-testid="alerts-page">
        <Header />
        
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          {/* Context Path */}
          <ContextPath className="mb-4">
            <ContextPath.Item href="/market">Market</ContextPath.Item>
            <ContextPath.Item current>Alerts</ContextPath.Item>
          </ContextPath>
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
              <p className="text-sm text-gray-500 mt-1">
                Market behavior monitoring
              </p>
            </div>
            <Link
              to="/tokens"
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
              data-testid="monitor-behavior-btn"
            >
              <Plus className="w-4 h-4" />
              Monitor Behavior
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 rounded-xl">
                  <Bell className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{rules.length}</div>
                  <div className="text-xs text-gray-500">Total Rules</div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 rounded-xl">
                  <Play className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-xl">
                  <Pause className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-600">{pausedCount}</div>
                  <div className="text-xs text-gray-500">Paused</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-4">
            {['all', 'active', 'paused'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filter === f
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          )}

          {/* Rules List */}
          {!loading && rules.length === 0 && (
            <EmptyState 
              title="No market behavior observed yet"
              description="Monitor accumulation, distribution, or large moves on specific tokens or wallets."
              action={{
                label: 'Monitor Behavior',
                icon: Plus,
                onClick: () => navigate('/tokens')
              }}
            />
          )}
          
          {!loading && rules.length > 0 && (
            <div className="space-y-3">
              {rules.map((rule) => (
                <AlertRuleCard
                  key={rule._id}
                  rule={rule}
                  onPause={handlePause}
                  onResume={handleResume}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </div>

        {/* Edit Alert Modal */}
        {editingRule && (
          <CreateAlertModal
            isOpen={!!editingRule}
            onClose={() => setEditingRule(null)}
            tokenAddress={editingRule.targetId}
            tokenSymbol={editingRule.watchlistItemId?.target?.symbol}
            tokenName={editingRule.watchlistItemId?.target?.name}
            chain={editingRule.watchlistItemId?.target?.chain || 'Ethereum'}
            editMode={true}
            existingRule={editingRule}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
