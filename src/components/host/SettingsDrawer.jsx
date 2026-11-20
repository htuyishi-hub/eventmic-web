import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Drawer } from '../ui/Drawer.jsx';
import { OutputDeviceSection } from './settings/OutputDeviceSection.jsx';
import { ChannelRoutingSection } from './settings/ChannelRoutingSection.jsx';
import { ProcessingSection } from './settings/ProcessingSection.jsx';
import { TestToolsSection } from './settings/TestToolsSection.jsx';
import { CapabilitiesSection } from './settings/CapabilitiesSection.jsx';
import { FairModeSection } from '../admin/FairModeSection.jsx';
import { FloorRulesSection } from './settings/FloorRulesSection.jsx';
import { ConnectModeSection } from './settings/ConnectModeSection.jsx';
import { PhotoSettingsSection } from './settings/PhotoSettingsSection.jsx';
import { useTransport } from '../../context/TransportContext.jsx';

export function SettingsDrawer({
  isOpen, onClose, audioEngine,
  liveLevels = { in: 0, out: 0, clipping: false, limiterActive: false },
  audioDevices = [], activeDeviceId = '', onSelectDevice, onRefreshDevices, onAttachMicStream
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

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Host Audio & Console Settings" width="max-w-lg">
      <div className="space-y-6 pb-6">
        <OutputDeviceSection
          audioDevices={audioDevices} activeDeviceId={activeDeviceId}
          onSelectDevice={onSelectDevice} sinkIdSupported={capabilities.sinkIdSupported ?? true}
          onDevicesRefreshed={onRefreshDevices}
        />
        <hr className="border-border" />
        <ChannelRoutingSection
          routingConfig={routingConfig}
          onChangeRouting={(r) => { setRoutingConfig(r); audioEngine?.setRouting(r); }}
          maxChannelCount={capabilities.maxChannelCount || 2}
          multiChannelSupported={capabilities.multiChannelSupported || false}
        />
        <hr className="border-border" />
        <ProcessingSection
          highPass={highPassConfig} onChangeHighPass={(hp) => { setHighPassConfig(hp); audioEngine?.setHighPass(hp); }}
          gate={gateConfig} onChangeGate={(g) => { const m = { ...gateConfig, ...g }; setGateConfig(m); audioEngine?.setGate(m); }}
          limiterEnabled={limiterEnabled} onChangeLimiter={(l) => { setLimiterEnabled(l); audioEngine?.setLimiter(l); }}
        />
        <hr className="border-border" />
        <TestToolsSection
          onPlayTone={(kind) => audioEngine?.playTestTone(kind)} maxChannelCount={capabilities.maxChannelCount || 2}
          onAttachMicStream={onAttachMicStream} isTestingMic={isTestingMic} setIsTestingMic={setIsTestingMic}
        />
        <hr className="border-border" />
        <CapabilitiesSection capabilities={capabilities} liveLevels={liveLevels} />
        <hr className="border-border" />
        <FairModeSection />
        <hr className="border-border" />
        <FloorRulesSection />
        <hr className="border-border" />
        <ConnectModeSection />
        <hr className="border-border" />
        <PhotoSettingsSection />
        <hr className="border-border" />
        <div className="p-4 bg-background border border-border rounded-xl space-y-1.5 text-xs text-muted">
          <div className="flex items-center gap-1.5 text-white font-bold">
            <Sparkles size={14} className="text-accent" />
            <span>Transport Architecture</span>
          </div>
          <p className="text-xs leading-relaxed">
            {transport?.isDemo
              ? 'Running in Demo Mode with simulated realistic multi-role event data and timer state transitions.'
              : transport?.constructor?.name === 'LiveKitTransport'
              ? 'Connected to LiveKit Cloud WebRTC transport. Processing speech through host Web Audio engine.'
              : 'Running on BroadcastChannel mock transport. No external cloud servers required for tab-to-tab communication.'}
          </p>
        </div>
      </div>
    </Drawer>
  );
}
