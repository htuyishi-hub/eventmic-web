import React, { useState, useEffect } from 'react';
import { Clock, Sparkles } from 'lucide-react';
import { Drawer } from '../ui/Drawer.jsx';
import { OutputDeviceSection } from './settings/OutputDeviceSection.jsx';
import { ChannelRoutingSection } from './settings/ChannelRoutingSection.jsx';
import { ProcessingSection } from './settings/ProcessingSection.jsx';
import { TestToolsSection } from './settings/TestToolsSection.jsx';
import { CapabilitiesSection } from './settings/CapabilitiesSection.jsx';
import { FairModeSection } from '../admin/FairModeSection.jsx';
import { useTransport } from '../../context/TransportContext.jsx';

export function SettingsDrawer({
  isOpen,
  onClose,
  timeLimitMinutes = 0,
  onTimeLimitChange,
  audioEngine,
  liveLevels = { in: 0, out: 0, clipping: false, limiterActive: false },
  audioDevices = [],
  activeDeviceId = '',
  onSelectDevice,
  onRefreshDevices,
  onAttachMicStream
}) {
  const { transport } = useTransport();
  const [capabilities, setCapabilities] = useState({});
  const [routingConfig, setRoutingConfig] = useState(audioEngine?.routingConfig || { mode: 'both' });
  const [highPassConfig, setHighPassConfig] = useState(audioEngine?.highPassConfig || { enabled: true, hz: 80 });
  const [gateConfig, setGateConfig] = useState(audioEngine?.gateConfig || { enabled: false, thresholdDb: -45, releaseMs: 150 });
  const [limiterEnabled, setLimiterEnabled] = useState(audioEngine?.limiterEnabled ?? true);
  const [isTestingMic, setIsTestingMic] = useState(false);

  useEffect(() => {
    if (isOpen && audioEngine) {
      setCapabilities(audioEngine.getCapabilities());
      setRoutingConfig(audioEngine.routingConfig);
      setHighPassConfig(audioEngine.highPassConfig);
      setGateConfig(audioEngine.gateConfig);
      setLimiterEnabled(audioEngine.limiterEnabled);
    }
  }, [isOpen, audioEngine, activeDeviceId]);

  const handleRoutingChange = (newRouting) => {
    setRoutingConfig(newRouting);
    audioEngine?.setRouting(newRouting);
  };

  const handleHighPassChange = (newHp) => {
    setHighPassConfig(newHp);
    audioEngine?.setHighPass(newHp);
  };

  const handleGateChange = (newGate) => {
    const merged = { ...gateConfig, ...newGate };
    setGateConfig(merged);
    audioEngine?.setGate(merged);
  };

  const handleLimiterChange = (newLimiter) => {
    setLimiterEnabled(newLimiter);
    audioEngine?.setLimiter(newLimiter);
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Host Audio & Console Settings" width="max-w-lg">
      <div className="space-y-6 pb-6">
        {/* 1. Audio Output Device */}
        <OutputDeviceSection
          audioDevices={audioDevices}
          activeDeviceId={activeDeviceId}
          onSelectDevice={onSelectDevice}
          sinkIdSupported={capabilities.sinkIdSupported ?? true}
          onDevicesRefreshed={onRefreshDevices}
        />

        <hr className="border-border" />

        {/* 2. Channel Routing */}
        <ChannelRoutingSection
          routingConfig={routingConfig}
          onChangeRouting={handleRoutingChange}
          maxChannelCount={capabilities.maxChannelCount || 2}
          multiChannelSupported={capabilities.multiChannelSupported || false}
        />

        <hr className="border-border" />

        {/* 3. Audio DSP & Processing */}
        <ProcessingSection
          highPass={highPassConfig}
          onChangeHighPass={handleHighPassChange}
          gate={gateConfig}
          onChangeGate={handleGateChange}
          limiterEnabled={limiterEnabled}
          onChangeLimiter={handleLimiterChange}
        />

        <hr className="border-border" />

        {/* 4. Hardware Test Tools */}
        <TestToolsSection
          onPlayTone={(kind) => audioEngine?.playTestTone(kind)}
          maxChannelCount={capabilities.maxChannelCount || 2}
          onAttachMicStream={onAttachMicStream}
          isTestingMic={isTestingMic}
          setIsTestingMic={setIsTestingMic}
        />

        <hr className="border-border" />

        {/* 5. Capabilities Panel & Live Meters */}
        <CapabilitiesSection capabilities={capabilities} liveLevels={liveLevels} />

        <hr className="border-border" />

        {/* 6. Speaking Time Limit Option */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Clock size={16} className="text-accent" />
            <span>Speaking Time Limit</span>
          </div>
          <p className="text-xs text-muted">Automatically revoke speaker floor when limit is reached.</p>
          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 5].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => onTimeLimitChange(mins)}
                className={`py-2 rounded-lg font-bold text-xs transition-colors border ${
                  timeLimitMinutes === mins
                    ? 'bg-accent border-accent text-white shadow-md shadow-accent/25'
                    : 'bg-background border-border text-muted hover:text-white'
                }`}
              >
                {mins === 0 ? 'Off' : `${mins}m`}
              </button>
            ))}
          </div>
        </div>

        {/* Fair Mode Settings */}
        <FairModeSection />

        {/* 7. Transport Architecture Info */}
        <div className="p-4 bg-background border border-border rounded-xl space-y-1.5 text-xs text-muted">
          <div className="flex items-center gap-1.5 text-white font-bold">
            <Sparkles size={14} className="text-accent" />
            <span>Transport Architecture</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            {transport?.constructor?.name === 'LiveKitTransport'
              ? 'Connected to LiveKit Cloud WebRTC transport. Processing speech through host Web Audio engine.'
              : 'Running on BroadcastChannel mock transport. No external cloud servers required for tab-to-tab communication.'}
          </p>
        </div>
      </div>
    </Drawer>
  );
}
