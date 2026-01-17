import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronLeft, Wallet, Building, TrendingUp, TrendingDown, ExternalLink, Activity,
  ArrowUpRight, ArrowDownRight, PieChart, BarChart3, Users, Coins, AlertTriangle,
  Check, X, Info, ChevronDown, ChevronUp, Bell, Eye, Target, Zap, Filter, ArrowRight,
  Percent, Clock, BarChart2, ArrowLeftRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, PieChart as RechartPie, Pie, Cell } from 'recharts';
import Header from '../components/Header';
import StatusBanner from '../components/StatusBanner';
import KnownAddresses from '../components/KnownAddresses';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`bg-white border border-gray-200 rounded-xl ${hover ? 'hover:border-gray-900 cursor-pointer' : ''} ${className}`}>
    {children}
  </div>
);

// Entity Intelligence Data (Decision Layer)
const getEntityIntelligence = (entityId) => {
  const data = {
    binance: {
      verdict: 'SUPPORTIVE',
      confidence: 82,
      verdictColor: 'bg-green-500/20 border-green-500/30 text-green-400',
      decisionScore: 78,
      state: 'Accumulating → Stable',
      statePeriod: 'last 7d',
      why: [
        { positive: true, text: 'Sustained net inflows over 7d (+$420M cumulative)' },
        { positive: true, text: 'Increased stablecoin reserves (+12%)' },
        { positive: true, text: 'No abnormal outflow spikes detected' },
        { positive: false, text: 'Minor BTC distribution detected (-$56M)' }
      ],
      actionBias: {
        primary: 'Accumulate ETH/SOL',
        actions: [
          { type: 'positive', text: 'Consider ETH accumulation (aligned with entity)' },
          { type: 'negative', text: 'Reduce BTC exposure (entity distributing)' },
          { type: 'neutral', text: 'Monitor ARB for confirmation (medium confidence)' }
        ],
        timing: '24-48h window optimal',
        riskNote: 'Risk-adjusted based on entity flow, historical impact, market regime'
      },
      alignedEntities: [
        { name: 'Kraken', action: 'Net inflow', token: 'ETH', confidence: 74 },
        { name: 'a16z Crypto', action: 'Accumulating', token: 'ETH', confidence: 82 },
        { name: 'Grayscale', action: 'Adding', token: 'ETH', confidence: 88 }
      ],
      confidenceBoost: 12,
      tokenImpact: [
        { token: 'ETH', direction: 'accumulation', strength: 'High', confidence: 82, impactScore: 8.4 },
        { token: 'BTC', direction: 'distribution', strength: 'Medium', confidence: 68, impactScore: 5.2 },
        { token: 'SOL', direction: 'accumulation', strength: 'High', confidence: 79, impactScore: 7.1 },
        { token: 'ARB', direction: 'accumulation', strength: 'Medium', confidence: 71, impactScore: 4.8 },
        { token: 'USDT', direction: 'neutral', strength: 'Low', confidence: 45, impactScore: 2.1 }
      ],
      historicalEffect: {
        condition: 'Net inflow > $100M in 24h',
        occurrences: 47,
        marketUpPct: 72,
        avgLagDays: 1.3,
        medianMove: '+3.2%',
        bestResponse: 'Early accumulation within 24h window'
      },
      marketImpact: {
        accumulatingTokens: ['ETH', 'SOL', 'ARB'],
        netFlowVsMarket: '+42%',
        leadTime: '~1.3 days',
        regimeAlignment: 'Risk-On'
      }
    },
    coinbase: {
      verdict: 'NEUTRAL',
      confidence: 68,
      verdictColor: 'bg-gray-500/20 border-gray-500/30 text-gray-300',
      decisionScore: 62,
      state: 'Mixed → Rotating',
      statePeriod: 'last 7d',
      why: [
        { positive: true, text: 'Stable overall holdings' },
        { positive: false, text: 'Net outflow detected (-$45M 24h)' },
        { positive: true, text: 'Institutional custody remains strong' },
        { positive: false, text: 'Rotation between BTC and altcoins' }
      ],
      actionBias: {
        primary: 'Wait for confirmation',
        actions: [
          { type: 'negative', text: 'Reduce BTC exposure (distribution signal)' },
          { type: 'neutral', text: 'Hold ETH position (mixed signals)' },
          { type: 'neutral', text: 'Wait 24-48h for direction clarity' }
        ],
        timing: 'Wait for confirmation',
        riskNote: 'Lower confidence — avoid aggressive positioning'
      },
      alignedEntities: [
        { name: 'Jump Trading', action: 'Distributing', token: 'BTC', confidence: 71 }
      ],
      confidenceBoost: -5,
      tokenImpact: [
        { token: 'ETH', direction: 'neutral', strength: 'Medium', confidence: 58, impactScore: 4.2 },
        { token: 'BTC', direction: 'distribution', strength: 'Medium', confidence: 65, impactScore: 5.8 },
        { token: 'LINK', direction: 'accumulation', strength: 'Low', confidence: 52, impactScore: 3.1 }
      ],
      historicalEffect: {
        condition: 'Net outflow > $50M in 24h',
        occurrences: 34,
        marketUpPct: 38,
        avgLagDays: 0.8,
        medianMove: '-1.8%',
        bestResponse: 'Wait for confirmation or reduce exposure'
      },
      marketImpact: {
        accumulatingTokens: ['USDC', 'LINK'],
        netFlowVsMarket: '-8%',
        leadTime: '~0.5 days',
        regimeAlignment: 'Neutral'
      }
    }
  };
  return data[entityId] || data.binance;
};

// Alert types for Entity
const entityAlertTypes = [
  {
    id: 'structural_shift',
    name: 'Structural Shift',
    category: 'Structural',
    description: 'Alert on fundamental behavior changes',
    triggers: ['Accumulation → Distribution switch', 'Confidence drops below threshold', 'Token alignment changes'],
    icon: Activity,
    categoryColor: 'bg-gray-900'
  },
  {
    id: 'impact_threshold',
    name: 'Impact Threshold',
    category: 'Impact-based',
    description: 'Alert when entity exceeds impact levels',
    triggers: ['Net flow > historical 90th percentile', 'Token impact score > 7/10', 'Flow > X% of daily volume'],
    icon: Target,
    isNew: true,
    categoryColor: 'bg-teal-500'
  },
  {
    id: 'cross_entity',
    name: 'Cross-Entity Signal',
    category: 'Cross-Entity',
    description: 'Alert when multiple entities align',
    triggers: ['2+ entities aligned on same token', 'Exchange + Smart Money same direction', 'Entity cluster forming'],
    icon: Users,
    isNew: true,
    categoryColor: 'bg-purple-500'
  },
  {
    id: 'behavior_shift',
    name: 'Behavior Shift',
    category: 'Structural',
    description: 'Alert on activity pattern changes',
    triggers: ['Tx frequency change > 50%', 'New token exposure', 'Risk profile shift'],
    icon: AlertTriangle,
    categoryColor: 'bg-gray-900'
  }
];

const txFilterTypes = [
  { id: 'all', label: 'All' },
  { id: 'market_moving', label: 'Market-Moving' },
  { id: 'first_entry', label: 'First Entry' },
  { id: 'cross_entity', label: 'Cross-Entity' }
];

// Entity Intelligence Header
const EntityIntelligence = ({ entity, intelligence, onTrack, onAlert, isTracked }) => {
  return (
    <div className="bg-gray-900 text-white rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Entity Intelligence</div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl font-bold">{intelligence.verdict}</span>
            <span className={`px-3 py-1 border rounded-lg text-sm font-semibold ${intelligence.verdictColor}`}>
              {intelligence.confidence >= 75 ? 'High Confidence' : intelligence.confidence >= 50 ? 'Moderate' : 'Low Confidence'}
            </span>
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-2 mb-2">
            Decision Score: <span className="font-bold text-white">{intelligence.decisionScore}/100</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-0.5 hover:bg-white/10 rounded">
                  <Info className="w-3 h-3 text-gray-400" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white max-w-xs border border-white/20">
                <p className="font-semibold mb-2">Decision Score Formula:</p>
                <ul className="text-xs space-y-1">
                  <li>• 30% Net Flow Consistency</li>
                  <li>• 25% Holdings Stability</li>
                  <li>• 25% Market Alignment</li>
                  <li>• 20% Historical Reliability</li>
                </ul>
              </TooltipContent>
            </Tooltip>
            • {entity.type}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Current State:</span>
            <span className="font-semibold text-white">{intelligence.state}</span>
            <span className="text-gray-500">({intelligence.statePeriod})</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 mb-1">Confidence</div>
          <div className="text-3xl font-bold">{intelligence.confidence}<span className="text-xl text-gray-500">%</span></div>
          <div className="text-xs text-gray-400 mt-1">{entity.addressCount} addresses</div>
        </div>
      </div>

      <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Why This Verdict?</div>
        <div className="space-y-2 text-sm">
          {intelligence.why.map((reason, i) => (
            <div key={i} className="flex items-start gap-2">
              {reason.positive ? (
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              )}
              <span className={reason.positive ? 'text-white' : 'text-gray-300'}>{reason.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-white/10">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onTrack}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isTracked
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}
            >
              {isTracked ? <Check className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isTracked ? 'Tracking' : 'Track Entity'}
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 text-white max-w-xs border border-white/20">
            <p className="text-xs">{isTracked ? 'Click to stop tracking' : 'Add to watchlist • Get alerts • See in Market activity'}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onAlert}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-colors"
            >
              <Bell className="w-4 h-4" />
              Alert on Changes
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 text-white max-w-xs border border-white/20">
            <p className="text-xs">Get notified on net flow flips, token exits, and market impact events</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

// Action Panel
const EntityActionPanel = ({ actionBias, entityName }) => {
  return (
    <GlassCard className="p-5 mb-6 border-2 border-gray-900">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-gray-900" />
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">What Should I Do?</h3>
      </div>

      <div className="p-4 bg-gray-900 text-white rounded-xl mb-4">
        <div className="text-xs text-gray-400 mb-1">ACTION BIAS</div>
        <div className="text-xl font-bold">{actionBias.primary}</div>
        <div className="text-xs text-gray-400 mt-1">Optimal timing: {actionBias.timing}</div>
      </div>

      <div className="space-y-2 mb-4">
        {actionBias.actions.map((action, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            {action.type === 'positive' && <TrendingUp className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0" />}
            {action.type === 'negative' && <TrendingDown className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />}
            {action.type === 'neutral' && <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />}
            <span className="text-sm text-gray-700">{action.text}</span>
          </div>
        ))}
      </div>

      <div className="p-3 border border-gray-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500">{actionBias.riskNote}</p>
        </div>
      </div>
    </GlassCard>
  );
};

// Cross-Entity Context
const CrossEntityContext = ({ alignedEntities, confidenceBoost, currentEntity }) => {
  const isPositiveBoost = confidenceBoost > 0;

  return (
    <GlassCard className="p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-700" />
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Cross-Entity Context</h3>
        </div>
        <div className={`px-3 py-1 rounded-lg text-sm font-bold ${isPositiveBoost ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
          Confidence {isPositiveBoost ? '+' : ''}{confidenceBoost}%
        </div>
      </div>

      {alignedEntities.length > 0 ? (
        <>
          <div className="text-xs text-gray-500 mb-3">Entities behaving similarly to {currentEntity}:</div>
          <div className="space-y-2">
            {alignedEntities.map((entity, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Building className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{entity.name}</div>
                    <div className="text-xs text-gray-500">{entity.action} • {entity.token}</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700">{entity.confidence}%</div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-gray-900 text-white rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium">
                {alignedEntities.length + 1} entities aligned → Signal strength increased
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <div className="text-gray-500 text-sm">No aligned entities detected</div>
          <div className="text-xs text-gray-400 mt-1">This entity is acting independently</div>
        </div>
      )}
    </GlassCard>
  );
};

// Token Impact Matrix
const TokenImpactMatrix = ({ tokenImpact, entityName }) => {
  const getDirectionIcon = (direction) => {
    switch(direction) {
      case 'accumulation': return <TrendingUp className="w-4 h-4" />;
      case 'distribution': return <TrendingDown className="w-4 h-4" />;
      default: return <ArrowLeftRight className="w-4 h-4" />;
    }
  };

  const getDirectionStyle = (direction) => {
    switch(direction) {
      case 'accumulation': return 'text-gray-900';
      case 'distribution': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <GlassCard className="p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-gray-700" />
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Token Impact Matrix</h3>
        </div>
        <span className="text-xs text-gray-500">If {entityName} acts → which tokens move?</span>
      </div>

      <div className="grid grid-cols-5 gap-4 pb-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
        <div>Token</div>
        <div>Direction</div>
        <div>Strength</div>
        <div>Confidence</div>
        <div className="text-right">Impact</div>
      </div>

      <div className="divide-y divide-gray-100">
        {tokenImpact.map((item, i) => (
          <div key={i} className="grid grid-cols-5 gap-4 py-3 items-center">
            <div className="font-semibold text-gray-900">{item.token}</div>
            <div className={`flex items-center gap-1.5 ${getDirectionStyle(item.direction)}`}>
              {getDirectionIcon(item.direction)}
              <span className="capitalize text-sm">{item.direction}</span>
            </div>
            <div>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                item.strength === 'High' ? 'bg-gray-900 text-white' :
                item.strength === 'Medium' ? 'bg-gray-200 text-gray-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {item.strength}
              </span>
            </div>
            <div className="text-sm text-gray-700">{item.confidence}%</div>
            <div className="text-right">
              <span className={`font-bold ${item.impactScore >= 7 ? 'text-gray-900' : item.impactScore >= 4 ? 'text-gray-700' : 'text-gray-400'}`}>
                {item.impactScore.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400">/10</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-xs text-gray-600">
          <span className="font-semibold">Actionable Insight:</span> When {entityName} accumulates ETH/SOL, consider early entry within 24h.
        </div>
      </div>
    </GlassCard>
  );
};

// Historical Effect
const HistoricalEffect = ({ historicalEffect, entityName }) => {
  return (
    <GlassCard className="p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-gray-700" />
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Historical Effect</h3>
        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">STATISTICS</span>
      </div>

      <div className="p-4 bg-gray-900 text-white rounded-xl mb-4">
        <div className="text-xs text-gray-400 mb-1">WHEN</div>
        <div className="text-lg font-bold">{entityName} {historicalEffect.condition}</div>
        <div className="text-xs text-gray-400 mt-1">{historicalEffect.occurrences} occurrences in last 180 days</div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-gray-50 rounded-xl text-center">
          <div className="text-2xl font-bold text-gray-900">{historicalEffect.marketUpPct}%</div>
          <div className="text-xs text-gray-500 mt-1">Market moved up after</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl text-center">
          <div className="text-2xl font-bold text-gray-900">{historicalEffect.avgLagDays}d</div>
          <div className="text-xs text-gray-500 mt-1">Avg lag to market reaction</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl text-center">
          <div className="text-2xl font-bold text-gray-900">{historicalEffect.medianMove}</div>
          <div className="text-xs text-gray-500 mt-1">Median price move</div>
        </div>
      </div>

      <div className="p-4 border border-gray-200 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-gray-700" />
          <span className="text-sm font-semibold text-gray-900">Best Response</span>
        </div>
        <div className="text-sm text-gray-700">{historicalEffect.bestResponse}</div>
      </div>
    </GlassCard>
  );
};

const HoldingsBreakdown = ({ holdings }) => {
  const COLORS = ['#1F2937', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB'];

  return (
    <GlassCard className="p-4 h-full">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Holdings Breakdown</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RechartPie>
              <Pie
                data={holdings}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {holdings.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value) => `$${(value / 1e6).toFixed(1)}M`} />
            </RechartPie>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 overflow-y-auto max-h-48">
          {holdings.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <img src={item.logo} alt={item.symbol} className="w-5 h-5 rounded-full" />
                <span className="font-semibold text-sm text-gray-900">{item.symbol}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">${(item.value / 1e6).toFixed(1)}M</div>
                <div className="text-xs text-gray-500">{item.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
};

const NetflowChart = ({ netflowData }) => {
  const [period, setPeriod] = useState('7D');

  return (
    <GlassCard className="p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Flow History</h3>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {['24H', '7D', '30D'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                period === p ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={netflowData}>
            <defs>
              <linearGradient id="netflowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#374151" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#374151" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="0" stroke="rgba(0,0,0,0.03)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} stroke="transparent" tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} stroke="transparent" tickLine={false} tickFormatter={(v) => `${v > 0 ? '+' : ''}${(v/1e6).toFixed(0)}M`} width={55} />
            <Area type="monotone" dataKey="netflow" stroke="#374151" strokeWidth={2.5} fill="url(#netflowGradient)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};

const RecentTransactions = ({ transactions }) => {
  const [txFilter, setTxFilter] = useState('all');

  const filteredTx = transactions.filter(tx => {
    if (txFilter === 'all') return true;
    if (txFilter === 'market_moving') return tx.isMarketMoving;
    if (txFilter === 'first_entry') return tx.isFirstEntry;
    if (txFilter === 'cross_entity') return tx.isCrossEntity;
    return true;
  });

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Transactions</h3>
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-0.5">
          {txFilterTypes.map(filter => (
            <button
              key={filter.id}
              onClick={() => setTxFilter(filter.id)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                txFilter === filter.id
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Token</th>
              <th className="py-2 px-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
              <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Counterparty</th>
              <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Flag</th>
              <th className="py-2 px-3 text-right text-xs font-semibold text-gray-500 uppercase">Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredTx.map((tx, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 px-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                    tx.type === 'inflow' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {tx.type === 'inflow' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    {tx.type.toUpperCase()}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <img src={tx.logo} alt={tx.token} className="w-5 h-5 rounded-full" />
                    <span className="font-semibold">{tx.token}</span>
                  </div>
                </td>
                <td className="py-2 px-3 text-right font-bold text-gray-900">{tx.amount}</td>
                <td className="py-2 px-3">
                  <code className="text-xs text-gray-600">{tx.counterparty}</code>
                </td>
                <td className="py-2 px-3">
                  {tx.flag && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      tx.flag === 'Market-Moving' ? 'bg-gray-900 text-white' :
                      tx.flag === 'First Entry' ? 'bg-teal-100 text-teal-700' :
                      tx.flag === 'Cross-Entity' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {tx.flag}
                    </span>
                  )}
                </td>
                <td className="py-2 px-3 text-right text-xs text-gray-500">{tx.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};

const EntityAlertModal = ({ onClose, entityName }) => {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [threshold, setThreshold] = useState('0.15');

  const alertsByCategory = entityAlertTypes.reduce((acc, alert) => {
    const cat = alert.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(alert);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-bold text-gray-900">Create Entity Alert</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Monitor {entityName} activity — choose alert type based on what matters to you
        </p>

        {Object.entries(alertsByCategory).map(([category, alerts]) => (
          <div key={category} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${
                category === 'Structural' ? 'bg-gray-900' :
                category === 'Impact-based' ? 'bg-teal-500' :
                category === 'Cross-Entity' ? 'bg-purple-500' : 'bg-gray-500'
              }`}>
                {category}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {alerts.map((alert) => {
                const Icon = alert.icon;
                return (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert.id)}
                    className={`p-3 border rounded-xl transition-colors cursor-pointer ${
                      selectedAlert === alert.id ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                        selectedAlert === alert.id ? 'bg-gray-900' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-3.5 h-3.5 ${selectedAlert === alert.id ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-semibold text-gray-900 text-xs">{alert.name}</h4>
                          {alert.isNew && <span className="px-1 py-0.5 bg-teal-500 text-white rounded text-[10px]">NEW</span>}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{alert.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">Alerts work automatically</div>
          <button
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              selectedAlert
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!selectedAlert}
          >
            Create Alert
          </button>
        </div>
      </div>
    </div>
  );
};

export default function EntityDetail() {
  const { entityId } = useParams();
  const [entity, setEntity] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [isTracked, setIsTracked] = useState(false);
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(true);

  useEffect(() => {
    const mockEntity = {
      id: entityId || 'binance',
      name: entityId === 'coinbase' ? 'Coinbase' : 'Binance',
      type: 'Exchange',
      typeColor: 'bg-gray-100 text-gray-700',
      logo: entityId === 'coinbase'
        ? 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/89.png'
        : 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/270.png',
      description: entityId === 'coinbase'
        ? 'US-based cryptocurrency exchange, publicly traded (COIN)'
        : 'World\'s largest cryptocurrency exchange by trading volume',
      firstSeen: 'Jul 2017',
      addressCount: 1247,
      totalHoldings: '$28.4B',
      holdingsChange: 2.4,
      netFlow24h: 125000000,
      netFlow24hFormatted: '$125M',
      marketShare: 14.2,
    };

    const mockHoldings = [
      { symbol: 'BTC', name: 'Bitcoin', value: 12500000000, percentage: 44.0, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png' },
      { symbol: 'ETH', name: 'Ethereum', value: 8900000000, percentage: 31.3, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
      { symbol: 'USDT', name: 'Tether', value: 3400000000, percentage: 12.0, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png' },
      { symbol: 'BNB', name: 'BNB', value: 2100000000, percentage: 7.4, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png' },
      { symbol: 'SOL', name: 'Solana', value: 890000000, percentage: 3.1, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png' },
    ];

    const mockNetflow = [
      { date: 'Mon', netflow: 45000000 },
      { date: 'Tue', netflow: -23000000 },
      { date: 'Wed', netflow: 67000000 },
      { date: 'Thu', netflow: 12000000 },
      { date: 'Fri', netflow: -34000000 },
      { date: 'Sat', netflow: 89000000 },
      { date: 'Sun', netflow: 125000000 },
    ];

    const mockTransactions = [
      { type: 'inflow', token: 'ETH', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png', amount: '$12.5M', counterparty: '0x742d...f0bEb', time: '2m ago', isMarketMoving: true, flag: 'Market-Moving' },
      { type: 'outflow', token: 'BTC', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png', amount: '$8.9M', counterparty: '0x1bc9...whale', time: '15m ago', isCrossEntity: true, flag: 'Cross-Entity' },
      { type: 'inflow', token: 'SOL', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png', amount: '$4.2M', counterparty: '0xa3f8...e2d4', time: '32m ago', isFirstEntry: true, flag: 'First Entry' },
      { type: 'outflow', token: 'USDT', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png', amount: '$2.1M', counterparty: '0x5678...abcd', time: '1h ago', flag: null },
      { type: 'inflow', token: 'ARB', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png', amount: '$1.8M', counterparty: '0x9abc...ijkl', time: '2h ago', isMarketMoving: true, flag: 'Market-Moving' },
    ];

    setEntity({
      ...mockEntity,
      holdings: mockHoldings,
      netflowData: mockNetflow,
      transactions: mockTransactions,
    });
  }, [entityId]);

  if (!entity) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-xl font-semibold text-gray-600">Loading...</div>
    </div>
  );

  const intelligence = getEntityIntelligence(entityId || 'binance');

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white">
        <Header />

        <div className="px-4 py-3 flex items-center justify-between">
          <Link to="/entities" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
            <ChevronLeft className="w-4 h-4" />
            Back to Entities
          </Link>
          <StatusBanner compact />
        </div>

        <div className="px-4 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <img src={entity.logo} alt={entity.name} className="w-16 h-16 rounded-2xl" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{entity.name}</h1>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${entity.typeColor}`}>
                  {entity.type.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-600">{entity.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                <span>First seen: {entity.firstSeen}</span>
                <span>•</span>
                <span>{entity.addressCount} addresses</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl mb-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Total Holdings</div>
              <div className="text-2xl font-bold text-gray-900">{entity.totalHoldings}</div>
              <div className={`text-xs font-semibold ${entity.holdingsChange >= 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                {entity.holdingsChange >= 0 ? '+' : ''}{entity.holdingsChange}% (7d)
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Net Flow (24h)</div>
              <div className={`text-2xl font-bold ${entity.netFlow24h >= 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                {entity.netFlow24h >= 0 ? '+' : ''}{entity.netFlow24hFormatted}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Market Share</div>
              <div className="text-2xl font-bold text-gray-900">{entity.marketShare}%</div>
            </div>
          </div>
        </div>

        <div className="px-4">
          <EntityIntelligence
            entity={entity}
            intelligence={intelligence}
            onTrack={() => setIsTracked(!isTracked)}
            onAlert={() => setShowAlertModal(true)}
            isTracked={isTracked}
          />
        </div>

        <div className="px-4">
          <EntityActionPanel actionBias={intelligence.actionBias} entityName={entity.name} />
        </div>

        <div className="px-4">
          <CrossEntityContext
            alignedEntities={intelligence.alignedEntities}
            confidenceBoost={intelligence.confidenceBoost}
            currentEntity={entity.name}
          />
        </div>

        <div className="px-4">
          <TokenImpactMatrix tokenImpact={intelligence.tokenImpact} entityName={entity.name} />
        </div>

        <div className="px-4">
          <HistoricalEffect historicalEffect={intelligence.historicalEffect} entityName={entity.name} />
        </div>

        {/* Known Addresses - Attribution Layer */}
        <div className="px-4 pb-4">
          <KnownAddresses 
            subjectType="entity" 
            subjectId={entityId || 'binance'} 
          />
        </div>

        <div className="px-4 pb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Core Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-[320px]"><HoldingsBreakdown holdings={entity.holdings} /></div>
            <div className="h-[320px]"><NetflowChart netflowData={entity.netflowData} /></div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors mb-4"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">FACT</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {showAdvancedAnalytics ? 'Hide' : 'Show'}
              {showAdvancedAnalytics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showAdvancedAnalytics && (
            <RecentTransactions transactions={entity.transactions} />
          )}
        </div>

        {showAlertModal && <EntityAlertModal onClose={() => setShowAlertModal(false)} entityName={entity.name} />}
      </div>
    </TooltipProvider>
  );
}
