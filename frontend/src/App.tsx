import React, { useState, useEffect } from 'react'
import {
  Satellite,
  Activity,
  ShieldCheck,
  Radio,
  AlertTriangle,
  Layers,
  Cpu,
  Terminal,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Sliders,
  RefreshCw,
  ExternalLink,
  Zap,
  Clock,
  Compass,
  BatteryCharging,
  Thermometer,
  Wifi,
  HardDrive,
  ShieldAlert,
} from 'lucide-react'
import { HealthResponse, AnalyzeResponse, SatelliteHealth, PriorityResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const HEALTH_API_URL = import.meta.env.VITE_HEALTH_API_URL || 'http://localhost:8001'
const PRIORITY_API_URL = import.meta.env.VITE_PRIORITY_API_URL || 'http://localhost:8002'

interface ExampleItem {
  label: string
  command: string
  type: 'single' | 'compound'
}

const EXAMPLE_COMMANDS: ExampleItem[] = [
  {
    label: 'Telemetry Query',
    command: 'send telemetry data',
    type: 'single',
  },
  {
    label: 'Data Downlink',
    command: 'transmit payload telemetry to ground station over X-band',
    type: 'single',
  },
  {
    label: 'Safehold Maneuver',
    command: 'switch to safe mode',
    type: 'single',
  },
  {
    label: 'Priority Uplink',
    command: 'set data priority to high for emergency queue',
    type: 'single',
  },
  {
    label: 'Status Diagnostic',
    command: 'request satellite health and status report',
    type: 'single',
  },
  {
    label: 'Compound: Mode + Telemetry',
    command: 'switch to safe mode and send high priority telemetry data',
    type: 'compound',
  },
  {
    label: 'Compound: Transmit + Report',
    command: 'transmit payload imagery; report system health and status',
    type: 'compound',
  },
  {
    label: 'Compound: Low-Power + Downlink',
    command: 'switch to low-power mode while sending telemetry data',
    type: 'compound',
  },
]

const INTENT_META: Record<
  string,
  { label: string; desc: string; color: string; badgeBg: string; border: string; icon: React.ReactNode }
> = {
  TELEMETRY_REQUEST: {
    label: 'Telemetry Request',
    desc: 'Requests real-time or stored spacecraft subsystem metrics',
    color: '#38bdf8', // Sky Cyan
    badgeBg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.4)',
    icon: <Activity className="w-4 h-4 text-cyan-400" />,
  },
  DATA_TRANSMISSION: {
    label: 'Data Transmission',
    desc: 'Directs payload data downlinks and ground station passes',
    color: '#818cf8', // Indigo / Purple
    badgeBg: 'rgba(129, 140, 248, 0.12)',
    border: 'rgba(129, 140, 248, 0.4)',
    icon: <Radio className="w-4 h-4 text-indigo-400" />,
  },
  MODE_SWITCH: {
    label: 'Mode Switch',
    desc: 'Reconfigures spacecraft operating states (Safe, Science, Low-Power)',
    color: '#f43f5e', // Rose / Red
    badgeBg: 'rgba(244, 63, 94, 0.12)',
    border: 'rgba(244, 63, 94, 0.4)',
    icon: <ShieldCheck className="w-4 h-4 text-rose-400" />,
  },
  DATA_PRIORITY: {
    label: 'Data Priority',
    desc: 'Alters buffer scheduling queues and transmission priorities',
    color: '#fbbf24', // Amber
    badgeBg: 'rgba(251, 191, 36, 0.12)',
    border: 'rgba(251, 191, 36, 0.4)',
    icon: <Zap className="w-4 h-4 text-amber-400" />,
  },
  STATUS_REPORT: {
    label: 'Status Report',
    desc: 'Generates consolidated subsystem health and diagnostic diagnostics',
    color: '#34d399', // Emerald
    badgeBg: 'rgba(52, 211, 153, 0.12)',
    border: 'rgba(52, 211, 153, 0.4)',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  },
}

export default function App() {
  const [command, setCommand] = useState<string>('switch to safe mode and send high priority telemetry data')
  const [threshold, setThreshold] = useState<number>(0.5)
  const [loading, setLoading] = useState<boolean>(false)
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [showJson, setShowJson] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<string>('')

  // Satellite Health Microservice State
  const [satHealth, setSatHealth] = useState<SatelliteHealth | null>(null)
  const [satHealthLoading, setSatHealthLoading] = useState<boolean>(false)
  const [satHealthError, setSatHealthError] = useState<string | null>(null)

  // Priority Microservice State
  const [priority, setPriority] = useState<PriorityResponse | null>(null)
  const [priorityLoading, setPriorityLoading] = useState<boolean>(false)
  const [priorityError, setPriorityError] = useState<string | null>(null)

  // Live UTC Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toUTCString().replace('GMT', 'UTC'))
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Check Command Service Health
  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/status`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: HealthResponse = await res.json()
      setHealth(data)
      setHealthError(null)
    } catch (err: any) {
      setHealth(null)
      setHealthError(err.message || 'Cannot connect to command service')
    }
  }

  // Fetch Live Satellite Health from Health Microservice
  const fetchSatelliteHealth = async (scenario?: string) => {
    setSatHealthLoading(true)
    setSatHealthError(null)
    try {
      const url = scenario
        ? `${HEALTH_API_URL}/satellite/status?scenario=${scenario}`
        : `${HEALTH_API_URL}/satellite/status`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: SatelliteHealth = await res.json()
      setSatHealth(data)
    } catch (err: any) {
      console.error('Failed to fetch satellite health:', err)
      setSatHealthError(err.message || 'Cannot reach Health Microservice')
    } finally {
      setSatHealthLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
    fetchSatelliteHealth()
    const intervalHealth = setInterval(checkHealth, 15000)
    const intervalSat = setInterval(() => fetchSatelliteHealth(), 8000)
    return () => {
      clearInterval(intervalHealth)
      clearInterval(intervalSat)
    }
  }, [])

  // Auto-run initial analysis on mount
  useEffect(() => {
    analyzeCommand(command)
  }, [])

  // Fetch Priority from Priority Microservice
  const fetchPriority = async (text: string, intent: string) => {
    setPriorityLoading(true)
    setPriorityError(null)
    try {
      const res = await fetch(`${PRIORITY_API_URL}/priority`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: text, intent }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: PriorityResponse = await res.json()
      setPriority(data)
    } catch (err: any) {
      console.error('Priority fetch failed:', err)
      setPriorityError(err.message || 'Cannot reach Priority Microservice')
    } finally {
      setPriorityLoading(false)
    }
  }

  const analyzeCommand = async (textToRun: string, currentThreshold = threshold) => {
    if (!textToRun.trim()) return
    setLoading(true)
    setApiError(null)
    setPriority(null)

    try {
      const res = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToRun.trim(),
          threshold: currentThreshold,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || `Server responded with status ${res.status}`)
      }

      const data: AnalyzeResponse = await res.json()
      setResult(data)
      // Chain → Priority Microservice using detected primary_intent
      fetchPriority(textToRun.trim(), data.primary_intent)
    } catch (err: any) {
      console.error('Analysis failed:', err)
      setApiError(err.message || 'Error communicating with OrbitAI backend')
    } finally {
      setLoading(false)
    }
  }

  const handlePresetSelect = (preset: ExampleItem) => {
    setCommand(preset.command)
    analyzeCommand(preset.command)
  }

  const formatPercent = (val: number) => {
    return `${(val * 100).toFixed(1)}%`
  }

  // Visual helper for overall satellite status badge
  const getStatusBadgeMeta = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return {
          color: '#f43f5e',
          bg: 'rgba(244, 63, 94, 0.15)',
          border: 'rgba(244, 63, 94, 0.5)',
          icon: <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />,
          label: 'CRITICAL',
        }
      case 'WARNING':
        return {
          color: '#fbbf24',
          bg: 'rgba(251, 191, 36, 0.15)',
          border: 'rgba(251, 191, 36, 0.5)',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          label: 'WARNING',
        }
      case 'HEALTHY':
      default:
        return {
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.5)',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          label: 'HEALTHY',
        }
    }
  }

  const statusMeta = getStatusBadgeMeta(satHealth?.overall_status || 'HEALTHY')

  return (
    <div className="orbit-container">
      {/* Space Background Canvas & Orbital Visuals */}
      <div className="space-backdrop">
        <div className="stars-layer"></div>
        <div className="stars-layer-slow"></div>
        <div className="orbital-ring ring-1"></div>
        <div className="orbital-ring ring-2"></div>
        <div className="orbital-ring ring-3"></div>
      </div>

      <div className="mission-content">
        {/* Top Mission Control Bar */}
        <header className="telemetry-bar">
          <div className="bar-left">
            <div className="brand-lockup">
              <div className="satellite-icon-box">
                <Satellite className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
              <div>
                <span className="system-tag">ORBIT AI // MISSION CONTROL</span>
                <div className="system-subtag">DISTRIBUTED AEROSPACE MICROSERVICES</div>
              </div>
            </div>
          </div>

          <div className="bar-center">
            <div className="clock-badge">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentTime || 'SYNCHRONIZING UTC...'}</span>
            </div>
          </div>

          <div className="bar-right">
            <div className={`status-pill ${health ? 'online' : 'offline'}`} title="Intent Service Port 8000">
              <span className="status-dot"></span>
              <span className="status-label">Intent API: {health ? 'ONLINE' : 'OFFLINE'}</span>
            </div>

            <div className={`status-pill ${satHealth ? 'online' : 'offline'}`} title="Health Service Port 8001">
              <span className="status-dot"></span>
              <span className="status-label">Health API: {satHealth ? 'ONLINE' : 'OFFLINE'}</span>
            </div>

            <div className={`status-pill ${health?.model_status === 'ACTIVE' ? 'active-model' : 'offline'}`}>
              <Cpu className="w-3.5 h-3.5" />
              <span className="status-label">Bi-LSTM: {health?.model_status || 'CHECKING'}</span>
            </div>

            <button onClick={() => { checkHealth(); fetchSatelliteHealth(); }} className="refresh-btn" title="Refresh Telemetry Status">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Hero Title */}
        <div className="hero-section">
          <div className="hud-badge">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>ORBITAL FLIGHT CONTROL & TELECOMMAND INTELLIGENCE</span>
          </div>
          <h1 className="hero-title">
            ORBIT <span className="text-gradient">AI</span>
          </h1>
          <p className="hero-subtitle">Satellite Command Intelligence & Subsystem Telemetry Hub</p>
          <div className="hero-meta">
            <span>Dual Microservices</span>
            <span className="dot">•</span>
            <span>PyTorch Bi-LSTM Intent Recognition</span>
            <span className="dot">•</span>
            <span>Live Vehicle Telemetry (SAT-01)</span>
          </div>
        </div>

        {/* SATELLITE HEALTH MONITORING SECTION (Microservice 2) */}
        <section className="glass-card satellite-health-panel">
          <div className="panel-header-row">
            <div className="panel-title-group">
              <div className="panel-icon-wrap">
                <Satellite className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="panel-main-title">
                  SATELLITE HEALTH TELEMETRY // {satHealth?.satellite_id || 'SAT-01'}
                </div>
                <div className="panel-sub-title">
                  Independent Microservice Stream (Port 8001) • Real-time Subsystem Metrics
                </div>
              </div>
            </div>

            <div className="panel-actions-group">
              <div
                className="overall-status-badge"
                style={{
                  backgroundColor: statusMeta.bg,
                  borderColor: statusMeta.border,
                  color: statusMeta.color,
                }}
              >
                {statusMeta.icon}
                <span className="status-badge-text">{statusMeta.label}</span>
              </div>

              <button
                className="refresh-status-btn"
                onClick={() => fetchSatelliteHealth()}
                disabled={satHealthLoading}
                title="Fetch live satellite status from Health Microservice"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${satHealthLoading ? 'animate-spin' : ''}`} />
                <span>REFRESH STATUS</span>
              </button>
            </div>
          </div>

          {satHealthError ? (
            <div className="alert-box error-alert" style={{ marginTop: '1rem' }}>
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <div>
                <strong>Health Service Offline:</strong> {satHealthError}
                <div className="sub-hint">Make sure health-service is running on {HEALTH_API_URL} (uvicorn main:app --port 8001)</div>
              </div>
            </div>
          ) : (
            <>
              {/* 4 Core Telemetry Gauges */}
              <div className="health-metrics-grid">
                {/* 1. Battery Percentage */}
                <div className={`metric-card ${satHealth && satHealth.battery < 20 ? 'metric-warn' : ''}`}>
                  <div className="metric-header">
                    <div className="metric-icon-title">
                      <BatteryCharging className="w-4 h-4 text-emerald-400" />
                      <span>BATTERY STORAGE</span>
                    </div>
                    <span className="metric-limit-tag">&lt; 20% WARN</span>
                  </div>
                  <div className="metric-value-row">
                    <span className="metric-number">
                      {satHealth ? `${satHealth.battery}%` : '--%'}
                    </span>
                    <span className="metric-state-tag">
                      {satHealth && satHealth.battery < 20 ? 'LOW' : 'NOMINAL'}
                    </span>
                  </div>
                  <div className="metric-bar-track">
                    <div
                      className="metric-bar-fill"
                      style={{
                        width: `${satHealth ? Math.min(100, Math.max(0, satHealth.battery)) : 0}%`,
                        backgroundColor: satHealth && satHealth.battery < 20 ? '#fbbf24' : '#10b981',
                      }}
                    />
                    <div className="threshold-marker-line" style={{ left: '20%' }} title="Warning threshold: 20%" />
                  </div>
                  <div className="metric-footer-note">State of charge • EPS Bus 28V</div>
                </div>

                {/* 2. Temperature */}
                <div className={`metric-card ${satHealth && satHealth.temperature > 70 ? 'metric-crit' : ''}`}>
                  <div className="metric-header">
                    <div className="metric-icon-title">
                      <Thermometer className="w-4 h-4 text-cyan-400" />
                      <span>BUS TEMPERATURE</span>
                    </div>
                    <span className="metric-limit-tag">&gt; 70°C CRIT</span>
                  </div>
                  <div className="metric-value-row">
                    <span className="metric-number">
                      {satHealth ? `${satHealth.temperature}°C` : '--°C'}
                    </span>
                    <span className="metric-state-tag">
                      {satHealth && satHealth.temperature > 70 ? 'CRITICAL' : 'THERMAL OK'}
                    </span>
                  </div>
                  <div className="metric-bar-track">
                    <div
                      className="metric-bar-fill"
                      style={{
                        width: `${satHealth ? Math.min(100, Math.max(0, (satHealth.temperature / 85) * 100)) : 0}%`,
                        backgroundColor: satHealth && satHealth.temperature > 70 ? '#f43f5e' : '#38bdf8',
                      }}
                    />
                    <div className="threshold-marker-line" style={{ left: `${(70 / 85) * 100}%` }} title="Critical threshold: 70°C" />
                  </div>
                  <div className="metric-footer-note">Core avionics thermal sensor</div>
                </div>

                {/* 3. Signal Strength */}
                <div className={`metric-card ${satHealth && satHealth.signal_strength < 30 ? 'metric-warn' : ''}`}>
                  <div className="metric-header">
                    <div className="metric-icon-title">
                      <Wifi className="w-4 h-4 text-purple-400" />
                      <span>SIGNAL STRENGTH</span>
                    </div>
                    <span className="metric-limit-tag">&lt; 30% WARN</span>
                  </div>
                  <div className="metric-value-row">
                    <span className="metric-number">
                      {satHealth ? `${satHealth.signal_strength}%` : '--%'}
                    </span>
                    <span className="metric-state-tag">
                      {satHealth && satHealth.signal_strength < 30 ? 'DEGRADED' : 'LINK STABLE'}
                    </span>
                  </div>
                  <div className="metric-bar-track">
                    <div
                      className="metric-bar-fill"
                      style={{
                        width: `${satHealth ? Math.min(100, Math.max(0, satHealth.signal_strength)) : 0}%`,
                        backgroundColor: satHealth && satHealth.signal_strength < 30 ? '#fbbf24' : '#a855f7',
                      }}
                    />
                    <div className="threshold-marker-line" style={{ left: '30%' }} title="Warning threshold: 30%" />
                  </div>
                  <div className="metric-footer-note">RF link margin • S/X-Band Ground Link</div>
                </div>

                {/* 4. Storage Used */}
                <div className={`metric-card ${satHealth && satHealth.storage_used > 90 ? 'metric-warn' : ''}`}>
                  <div className="metric-header">
                    <div className="metric-icon-title">
                      <HardDrive className="w-4 h-4 text-blue-400" />
                      <span>STORAGE USAGE</span>
                    </div>
                    <span className="metric-limit-tag">&gt; 90% WARN</span>
                  </div>
                  <div className="metric-value-row">
                    <span className="metric-number">
                      {satHealth ? `${satHealth.storage_used}%` : '--%'}
                    </span>
                    <span className="metric-state-tag">
                      {satHealth && satHealth.storage_used > 90 ? 'NEAR FULL' : 'CAPACITY OK'}
                    </span>
                  </div>
                  <div className="metric-bar-track">
                    <div
                      className="metric-bar-fill"
                      style={{
                        width: `${satHealth ? Math.min(100, Math.max(0, satHealth.storage_used)) : 0}%`,
                        backgroundColor: satHealth && satHealth.storage_used > 90 ? '#fbbf24' : '#3b82f6',
                      }}
                    />
                    <div className="threshold-marker-line" style={{ left: '90%' }} title="Warning threshold: 90%" />
                  </div>
                  <div className="metric-footer-note">On-board solid state recorder (SSR)</div>
                </div>
              </div>

              {/* Simulation Quick Scenario Triggers */}
              <div className="simulation-toolbar">
                <span className="sim-title">Demo Rule Triggers:</span>
                <button
                  className="sim-chip"
                  onClick={() => fetchSatelliteHealth()}
                  title="Simulate nominal fluctuating telemetry"
                >
                  🟢 Normal Drift
                </button>
                <button
                  className="sim-chip crit-chip"
                  onClick={() => fetchSatelliteHealth('critical')}
                  title="Trigger Temp > 70°C Rule (CRITICAL)"
                >
                  🔴 Temp &gt; 70°C (CRITICAL)
                </button>
                <button
                  className="sim-chip warn-chip"
                  onClick={() => fetchSatelliteHealth('battery_low')}
                  title="Trigger Battery < 20% Rule (WARNING)"
                >
                  🟡 Battery &lt; 20% (WARNING)
                </button>
                <button
                  className="sim-chip warn-chip"
                  onClick={() => fetchSatelliteHealth('signal_weak')}
                  title="Trigger Signal < 30% Rule (WARNING)"
                >
                  🟡 Signal &lt; 30% (WARNING)
                </button>
                <button
                  className="sim-chip warn-chip"
                  onClick={() => fetchSatelliteHealth('storage_full')}
                  title="Trigger Storage > 90% Rule (WARNING)"
                >
                  🟡 Storage &gt; 90% (WARNING)
                </button>
              </div>
            </>
          )}
        </section>

        {/* Main Command Input Console (Microservice 1: Intent Recognition) */}
        <div className="glass-card command-terminal">
          <div className="terminal-header">
            <div className="terminal-title">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>TELECOMMAND UPLINK CONSOLE (Bi-LSTM Model)</span>
            </div>
            <div className="threshold-selector">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span className="threshold-label">Threshold: {threshold.toFixed(2)}</span>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={threshold}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  setThreshold(val)
                  analyzeCommand(command, val)
                }}
                className="slider-input"
              />
            </div>
          </div>

          <div className="command-input-wrapper">
            <div className="terminal-prompt">&gt;</div>
            <textarea
              className="command-textarea"
              rows={2}
              placeholder="Enter natural language telecommand (e.g. switch to safe mode and send high priority telemetry data)..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  analyzeCommand(command)
                }
              }}
            />
            <button
              className="analyze-button"
              disabled={loading || !command.trim()}
              onClick={() => analyzeCommand(command)}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>ANALYZING...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-cyan-300" />
                  <span>ANALYZE COMMAND</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Preset Commands */}
          <div className="presets-section">
            <div className="presets-label">
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>QUICK MISSION PRESETS:</span>
            </div>
            <div className="preset-chips">
              {EXAMPLE_COMMANDS.map((preset, idx) => (
                <button
                  key={idx}
                  className={`preset-chip ${preset.type === 'compound' ? 'compound-chip' : ''}`}
                  onClick={() => handlePresetSelect(preset)}
                >
                  <span className="preset-tag">[{preset.type.toUpperCase()}]</span>
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* API Error Alert */}
        {(apiError || (!health && healthError)) && (
          <div className="alert-box error-alert">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <div>
              <strong>Uplink Inactive / Error:</strong> {apiError || healthError}
              <div className="sub-hint">Ensure Intent service is running at {API_BASE_URL} (uvicorn main:app --port 8000)</div>
            </div>
          </div>
        )}

        {/* Results Area */}
        {result && (
          <div className="results-grid">
            {/* Primary Detected Intent Banner */}
            <div className="glass-card primary-result-card">
              <div className="card-label">PRIMARY TELEMETRY INTENT</div>
              <div className="primary-intent-box">
                <div
                  className="intent-badge-large"
                  style={{
                    backgroundColor: INTENT_META[result.primary_intent]?.badgeBg || 'rgba(6,182,212,0.15)',
                    borderColor: INTENT_META[result.primary_intent]?.border || '#06b6d4',
                  }}
                >
                  {INTENT_META[result.primary_intent]?.icon}
                  <span
                    className="intent-name"
                    style={{ color: INTENT_META[result.primary_intent]?.color || '#06b6d4' }}
                  >
                    {result.primary_intent}
                  </span>
                </div>

                <div className="confidence-display">
                  <div className="confidence-number">{formatPercent(result.confidence)}</div>
                  <div className="confidence-caption">Top Sigmoid Confidence</div>
                </div>
              </div>

              <div className="detected-intents-row">
                <span className="row-title">Active Mission Intents:</span>
                <div className="intents-pills">
                  {result.intents.map((it, idx) => (
                    <span
                      key={idx}
                      className="active-intent-pill"
                      style={{
                        backgroundColor: INTENT_META[it]?.badgeBg || 'rgba(56, 189, 248, 0.1)',
                        borderColor: INTENT_META[it]?.border || 'rgba(56, 189, 248, 0.3)',
                        color: INTENT_META[it]?.color || '#38bdf8',
                      }}
                    >
                      {idx + 1}. {it}
                    </span>
                  ))}
                </div>
              </div>

              <div className="intent-desc">
                {INTENT_META[result.primary_intent]?.desc || 'Target spacecraft operational category'}
              </div>
            </div>

            {/* Compound Multi-Intent Clause Breakdown */}
            <div className="glass-card compound-card">
              <div className="card-header-row">
                <div className="card-label">
                  <Layers className="w-4 h-4 text-purple-400 inline mr-1" />
                  COMPOUND COMMAND CLAUSE ANALYSIS
                </div>
                <div className="clauses-count">
                  {result.clauses.length} {result.clauses.length === 1 ? 'Clause' : 'Clauses'}
                </div>
              </div>

              {result.clauses.length === 0 ? (
                <div className="empty-clauses">No sub-clauses isolated in command.</div>
              ) : (
                <div className="clauses-pipeline">
                  {result.clauses.map((clause, idx) => {
                    const meta = INTENT_META[clause.top]
                    return (
                      <div key={idx} className="clause-node">
                        <div className="clause-index-badge">CLAUSE {idx + 1}</div>
                        <div className="clause-body">
                          <div className="clause-text">"{clause.text}"</div>
                          <div className="clause-meta">
                            <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                            <span
                              className="clause-intent-pill"
                              style={{
                                color: meta?.color || '#38bdf8',
                                backgroundColor: meta?.badgeBg || 'rgba(56,189,248,0.1)',
                                borderColor: meta?.border || 'rgba(56,189,248,0.3)',
                              }}
                            >
                              {clause.top}
                            </span>
                            <span className="clause-confidence">
                              {formatPercent(clause.confidence)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Neural Probability Distribution (Full 5 Intents) */}
            <div className="glass-card probabilities-card full-width">
              <div className="card-header-row">
                <div className="card-label">
                  <Activity className="w-4 h-4 text-cyan-400 inline mr-1" />
                  BI-LSTM PROBABILITY SPECTRUM (ALL 5 INTENTS)
                </div>
                <div className="model-architecture-tag">
                  {result.model_architecture}
                </div>
              </div>

              <div className="probability-bars-grid">
                {Object.entries(result.whole_probabilities).map(([intentKey, prob]) => {
                  const meta = INTENT_META[intentKey]
                  const isActive = result.intents.includes(intentKey)
                  const percent = Math.min(100, Math.max(0, prob * 100))

                  return (
                    <div
                      key={intentKey}
                      className={`prob-bar-item ${isActive ? 'active-intent-bar' : ''}`}
                    >
                      <div className="prob-bar-label-row">
                        <div className="intent-title-group">
                          {meta?.icon}
                          <span className="intent-key-name">{intentKey}</span>
                        </div>
                        <span className="prob-value">{formatPercent(prob)}</span>
                      </div>

                      <div className="meter-track">
                        <div
                          className="meter-fill"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: meta?.color || '#38bdf8',
                            boxShadow: isActive ? `0 0 12px ${meta?.color || '#38bdf8'}` : 'none',
                          }}
                        />
                        <div
                          className="threshold-marker"
                          style={{ left: `${threshold * 100}%` }}
                          title={`Threshold (${formatPercent(threshold)})`}
                        />
                      </div>

                      <div className="meter-subinfo">
                        <span>{meta?.desc}</span>
                        {isActive && <span className="active-tag">TRIGGERED</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Command Priority Card (Microservice 3) */}
            {(priority || priorityLoading || priorityError) && (
              <div className="glass-card priority-card full-width">
                <div className="card-header-row">
                  <div className="card-label">
                    <Zap className="w-4 h-4 text-amber-400 inline mr-1" />
                    COMMAND PRIORITY EVALUATION
                  </div>
                  <div className="priority-service-tag">Rule Engine Microservice (Port 8002)</div>
                </div>

                {priorityLoading && (
                  <div className="priority-loading">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Evaluating priority...</span>
                  </div>
                )}

                {priorityError && (
                  <div className="priority-error">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Priority Service Offline: {priorityError}</span>
                  </div>
                )}

                {priority && !priorityLoading && (
                  <div className="priority-body">
                    {/* Pipeline Flow */}
                    <div className="priority-pipeline">
                      <div className="pipeline-step">
                        <div className="pipeline-step-label">COMMAND</div>
                        <div className="pipeline-step-value mono-small">"{result?.text.slice(0, 50)}{(result?.text.length || 0) > 50 ? '…' : ''}"</div>
                      </div>
                      <div className="pipeline-arrow">↓</div>
                      <div className="pipeline-step">
                        <div className="pipeline-step-label">DETECTED INTENT</div>
                        <div
                          className="pipeline-step-intent"
                          style={{ color: INTENT_META[result?.primary_intent || '']?.color || '#38bdf8' }}
                        >
                          {result?.primary_intent}
                        </div>
                      </div>
                      <div className="pipeline-arrow">↓</div>
                      <div className="pipeline-step priority-result-step">
                        <div className="pipeline-step-label">ASSIGNED PRIORITY</div>
                        <div
                          className={`priority-level-badge priority-${priority.priority.toLowerCase()}`}
                        >
                          {priority.priority === 'CRITICAL' && <ShieldAlert className="w-5 h-5" />}
                          {priority.priority === 'HIGH' && <AlertTriangle className="w-5 h-5" />}
                          {priority.priority === 'MEDIUM' && <Activity className="w-5 h-5" />}
                          {priority.priority === 'LOW' && <CheckCircle2 className="w-5 h-5" />}
                          <span>{priority.priority}</span>
                        </div>
                      </div>
                    </div>

                    {/* Score Gauge */}
                    <div className="priority-score-section">
                      <div className="score-header">
                        <span className="score-label">PRIORITY SCORE</span>
                        <span className={`score-number priority-score-${priority.priority.toLowerCase()}`}>
                          {priority.score} / 100
                        </span>
                      </div>
                      <div className="score-track">
                        <div
                          className="score-fill"
                          style={{
                            width: `${priority.score}%`,
                            backgroundColor:
                              priority.priority === 'CRITICAL' ? '#f43f5e' :
                              priority.priority === 'HIGH' ? '#f97316' :
                              priority.priority === 'MEDIUM' ? '#38bdf8' : '#10b981',
                            boxShadow:
                              priority.priority === 'CRITICAL' ? '0 0 16px #f43f5e' :
                              priority.priority === 'HIGH' ? '0 0 14px #f97316' :
                              priority.priority === 'MEDIUM' ? '0 0 12px #38bdf8' : '0 0 10px #10b981',
                          }}
                        />
                      </div>
                      <div className="score-zones">
                        <span className="zone-label zone-low">LOW</span>
                        <span className="zone-label zone-medium">MEDIUM</span>
                        <span className="zone-label zone-high">HIGH</span>
                        <span className="zone-label zone-critical">CRITICAL</span>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="priority-reason">
                      <div className="reason-label">OPERATIONAL RATIONALE</div>
                      <div className="reason-text">{priority.reason}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Telemetry Payload / Raw JSON Toggle */}
            <div className="glass-card telemetry-inspector full-width">
              <div className="inspector-header">
                <button
                  className="toggle-json-btn"
                  onClick={() => setShowJson(!showJson)}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{showJson ? 'HIDE RAW TELEMETRY JSON' : 'INSPECT RAW INFERENCE JSON'}</span>
                </button>
                <div className="raw-details">
                  Intent: <code>POST /analyze</code> (8000) • Priority: <code>POST /priority</code> (8002) • Health: <code>GET /satellite/status</code> (8001)
                </div>
              </div>

              {showJson && (
                <pre className="json-code-block">
                  {JSON.stringify(
                    {
                      command_inference: result,
                      command_priority: priority,
                      live_satellite_health: satHealth,
                    },
                    null,
                    2
                  )}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="footer-bar">
          <div>OrbitAI Distributed Mission Control Mesh v1.2.0</div>
          <div className="footer-links">
            <a
              href={`${API_BASE_URL}/docs`}
              target="_blank"
              rel="noreferrer"
              className="footer-link"
            >
              <span>Intent API Docs (8000)</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
            <span className="divider">|</span>
            <a
              href={`${HEALTH_API_URL}/docs`}
              target="_blank"
              rel="noreferrer"
              className="footer-link"
            >
              <span>Health API Docs (8001)</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
            <span className="divider">|</span>
            <a
              href={`${PRIORITY_API_URL}/docs`}
              target="_blank"
              rel="noreferrer"
              className="footer-link"
            >
              <span>Priority API Docs (8002)</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
            <span className="divider">|</span>
            <span>PyTorch Bi-LSTM Checkpoint: backend/model/intent_model.pt</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
