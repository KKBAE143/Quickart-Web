import { useEffect, useRef, useState } from 'react'
import { useSocket } from '../provider/SocketProvider'

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' }
]

export default function useWebRTCCall(roomId) {
  const { joinCall, leaveCall, sendCallSignal, onCallSignal, offCallSignal, onCallEnded } = useSocket()
  const pcRef = useRef(null)
  const localRef = useRef(null)
  const remoteRef = useRef(null)
  const [status, setStatus] = useState('idle')

  useEffect(()=>{
    return ()=>{
      endCall()
    }
  },[])

  const setupPeer = ()=>{
    const pc = new RTCPeerConnection({ iceServers })
    pc.onicecandidate = (e)=>{
      if(e.candidate){
        sendCallSignal(roomId,'ice',e.candidate)
      }
    }
    pc.ontrack = (e)=>{
      if(remoteRef.current){
        remoteRef.current.srcObject = e.streams[0]
      }
    }
    pcRef.current = pc
    return pc
  }

  const startCall = async()=>{
    setStatus('starting')
    const stream = await navigator.mediaDevices.getUserMedia({ audio:true, video:true })
    if(localRef.current){ localRef.current.srcObject = stream }
    const pc = setupPeer()
    stream.getTracks().forEach(t=> pc.addTrack(t, stream))
    joinCall(roomId)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    sendCallSignal(roomId,'offer',offer)
    setStatus('calling')
    const onSig = async ({ type, data })=>{
      if(type==='answer'){ await pc.setRemoteDescription(new RTCSessionDescription(data)); setStatus('connected') }
      if(type==='ice'){ try{ await pc.addIceCandidate(new RTCIceCandidate(data)) }catch{} }
    }
    onCallSignal(onSig)
  }

  const acceptCall = async()=>{
    setStatus('accepting')
    const stream = await navigator.mediaDevices.getUserMedia({ audio:true, video:true })
    if(localRef.current){ localRef.current.srcObject = stream }
    const pc = setupPeer()
    stream.getTracks().forEach(t=> pc.addTrack(t, stream))
    joinCall(roomId)
    const onSig = async ({ type, data })=>{
      if(type==='offer'){
        await pc.setRemoteDescription(new RTCSessionDescription(data))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        sendCallSignal(roomId,'answer',answer)
        setStatus('connected')
      }
      if(type==='ice'){ try{ await pc.addIceCandidate(new RTCIceCandidate(data)) }catch{} }
    }
    onCallSignal(onSig)
  }

  const endCall = ()=>{
    leaveCall(roomId)
    if(pcRef.current){ pcRef.current.close(); pcRef.current = null }
    if(localRef.current?.srcObject){ localRef.current.srcObject.getTracks().forEach(t=>t.stop()); localRef.current.srcObject=null }
    setStatus('idle')
  }

  onCallEnded(()=>{ endCall() })

  return { startCall, acceptCall, endCall, localRef, remoteRef, status }
}