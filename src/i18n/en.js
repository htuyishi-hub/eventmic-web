/**
 * English translation dictionary for EventMic.
 */
export const en = {
  common: {
    appName: 'DM', live: 'Live', ended: 'Ended',
    connecting: 'Connecting...', connected: 'Connected',
    reconnecting: 'Reconnecting...', disconnected: 'Disconnected',
    offline: 'Offline', dismiss: 'Dismiss', cancel: 'Cancel',
    confirm: 'Confirm', save: 'Save', saving: 'Saving...',
    loading: 'Loading...', close: 'Close', error: 'Error',
    retry: 'Retry', back: 'Back', send: 'Send', ok: 'OK'
  },
  roles: {
    admin: 'Admin', principal: 'Speaker', attendee: 'Attendee', host: 'Admin'
  },
  reasons: {
    question: 'Question', comment: 'Comment', compliment: 'Compliment',
    clarification: 'Clarification', urgent: 'Urgent', cant_hear: "Can't hear", other: 'Other'
  },
  status: {
    idle: 'Idle', on_deck: 'Next Up', on_air: 'On Air',
    live: 'Live', muted: 'Muted', queued: 'Queued', spoken: 'Spoke', dropped: 'Dropped'
  },
  admin: {
    title: 'Admin Console', shortcuts: 'Shortcuts', stageAudio: 'Stage Audio',
    liveStage: 'Live Stage', stageOpen: 'Stage Open', endFloor: 'End Floor',
    muteSpeaker: 'Mute Speaker', unmuteSpeaker: 'Unmute Speaker',
    tabs: {
      queue: 'Queue', urgent: 'Urgent', attendees: 'Attendees',
      spoke: 'Spoke', principals: 'Speakers'
    },
    announcement: {
      title: 'Room Announcement',
      broadcast: 'Broadcast to Room',
      broadcastNow: 'Broadcast Now',
      preview: 'Preview (10s)',
      placeholder: 'Type an announcement for all attendees...',
      activeLabel: 'Active Broadcast (10s)'
    },
    messages: {
      title: 'Backstage Chat',
      placeholder: 'Send message to speakers...',
      replyOk: 'OK',
      replyWrapUp: 'Wrap up please',
      reply1Min: '1 min remaining'
    },
    settings: {
      title: 'Session Settings',
      fairMode: 'Fair Mode',
      fairModeDesc: 'Prioritizes attendees who haven\'t spoken yet',
      fairFrom: 'Fair Mode Delay (min)',
      scheduledEnd: 'Scheduled End Time',
      allowUrgent: 'Allow Urgent Blips',
      attendeeTurnCap: 'Attendee Turn Cap',
      principalConnectMode: 'Principal Connect Mode'
    },
    principals: {
      title: 'Speakers (Principals)',
      addSpeaker: 'Add Speaker',
      pin: 'PIN',
      revealPin: 'Reveal PIN',
      regeneratePin: 'Regenerate PIN',
      revoke: 'Revoke Access'
    }
  },
  speaker: {
    join: {
      title: 'Speaker Stage Access',
      nameLabel: 'Your Name or Title',
      pinLabel: '6-Digit PIN',
      pinHint: 'Given by event organizers',
      enterStage: 'Enter Stage',
      pinLocked: 'Too many incorrect PIN attempts. Locked for 60 seconds.',
      invalidPin: 'Invalid PIN. Please check with your event admin.'
    },
    micCheck: {
      title: 'Mic Check & Levels',
      selectInput: 'Select Microphone',
      testMic: 'Test My Mic',
      speakingPrompt: 'Speak into your microphone to verify input level',
      continueToStage: 'Continue to Stage',
      goodLevel: 'Level looks good'
    },
    station: {
      youAreLive: 'YOU ARE LIVE', youAreMuted: 'YOU ARE MUTED', nextUp: 'YOU ARE NEXT UP',
      takeFloor: 'Take the Floor', releaseFloor: 'Release Floor', requestFloor: 'Request to Speak',
      requestedWaiting: 'Requested (Waiting)', handoverReq: 'requested to speak',
      allow60s: 'Allow (60s)', later: 'Later',
      questionsClosed: 'Audience Q&A Closed', questionsOpen: 'Audience Q&A Active'
    }
  },
  attendee: {
    join: {
      enterName: 'Enter Your Name', joinEvent: 'Join Event', codeLabel: 'Event Code'
    },
    listening: {
      stageReinforced: 'Stage Audio Reinforced',
      stageSub: 'Listen to the live presentation or raise your hand to speak.',
      reasonLabel: 'Reason for Speaking',
      raiseHand: 'Raise Hand',
      urgentBlip: 'Urgent (5s Blip)',
      micOffNotice: 'Your mic stays muted until granted the floor.'
    },
    handRaised: {
      inLine: 'You are in line', position: 'Queue Position', reason: 'Reason',
      lowerHand: 'Lower Hand',
      beReady: 'Please stay on this screen. When granted, your mic connects instantly.'
    },
    urgent: {
      title: 'Urgent Interruption',
      warning: 'This briefly interrupts the speaker for up to 5 seconds. Use only for sound issues or immediate clarifications.',
      confirm: 'Interrupt Speaker (5s)',
      reasonPrompt: 'What is the urgent issue?'
    },
    preparing: {
      heading: 'Preparing your microphone...',
      sub: 'Connecting to venue sound. You will be live in a moment.'
    },
    onAir: {
      live: 'You Are Live',
      stopSpeaking: 'Stop Speaking',
      warning15s: 'Turn ending in 15 seconds',
      venueListening: 'Speak clearly. The entire venue is listening.'
    },
    turnEnded: 'Your speaking turn has ended.',
    sessionEnded: 'This event session has ended. Thank you for attending!',
    errors: {
      invalidCode: 'Session code not found',
      full: 'Session is full',
      micDenied: 'Microphone permission was denied. Enable microphone in browser settings to speak.',
      connectionLost: 'Lost connection to venue server. Reconnecting...'
    }
  },
  avatar: {
    title: 'Profile Photo',
    optionalNotice: 'Add a profile photo (optional).',
    consent: 'Shown to the organizers and, while you speak, to the room. Deleted when the session ends.',
    setPhoto: 'Set Photo',
    removePhoto: 'Remove Photo',
    takePhoto: 'Take Photo',
    uploadFile: 'Upload File',
    skip: 'Skip for now',
    saveAndContinue: 'Save & Continue'
  }
};
