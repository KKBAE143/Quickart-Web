const voiceProvider = {
  async bridgeCall({ virtualNumber, from, to }) {
    console.log('DEV_VOICE_BRIDGE', { virtualNumber, from, to })
    return { success: true, callId: `dev-${Date.now()}` }
  }
}

export default voiceProvider