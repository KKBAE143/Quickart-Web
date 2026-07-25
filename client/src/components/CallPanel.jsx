import React from 'react'
import useWebRTCCall from '../hooks/useWebRTCCall'

const CallPanel = ({ roomId }) => {
  const { startCall, acceptCall, endCall, localRef, remoteRef, status } = useWebRTCCall(roomId)
  return (
    <div className='bg-white border rounded-lg p-4 grid gap-3'>
      <div className='grid grid-cols-2 gap-3'>
        <video ref={localRef} autoPlay muted className='w-full h-40 bg-black rounded-md'/>
        <video ref={remoteRef} autoPlay className='w-full h-40 bg-black rounded-md'/>
      </div>
      <div className='flex gap-3'>
        <button onClick={startCall} className='px-3 py-2 rounded-md bg-green-600 text-white'>Start</button>
        <button onClick={acceptCall} className='px-3 py-2 rounded-md bg-blue-600 text-white'>Accept</button>
        <button onClick={endCall} className='px-3 py-2 rounded-md bg-red-600 text-white'>End</button>
        <span className='ml-auto text-sm text-gray-600'>Status: {status}</span>
      </div>
    </div>
  )
}

export default CallPanel