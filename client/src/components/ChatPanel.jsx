import React, { useEffect, useRef, useState } from 'react'
import { useSocket } from '../provider/SocketProvider'

const ChatPanel = ({ roomId }) => {
  const { joinChat, leaveChat, sendChatMessage, onChatMessage, offChatMessage } = useSocket()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const listRef = useRef(null)

  useEffect(()=>{
    joinChat(roomId)
    const handler = (payload)=>{
      if(payload && payload.message){ setMessages(prev=> [...prev, payload]) }
    }
    onChatMessage(handler)
    return ()=>{ offChatMessage(handler); leaveChat(roomId) }
  },[roomId])

  useEffect(()=>{
    if(listRef.current){ listRef.current.scrollTop = listRef.current.scrollHeight }
  },[messages])

  const send = ()=>{
    if(text.trim().length){ sendChatMessage(roomId, text.trim()); setText('') }
  }

  return (
    <div className='bg-white border rounded-lg p-4 grid gap-3'>
      <div ref={listRef} className='h-40 overflow-y-auto border rounded-md p-2'>
        {messages.map((m,i)=> (
          <div key={i} className='text-sm text-gray-800'>
            <span className='font-semibold mr-2'>{m.id?.slice(0,5)}</span>
            <span>{m.message}</span>
          </div>
        ))}
      </div>
      <div className='flex gap-2'>
        <input value={text} onChange={e=>setText(e.target.value)} className='flex-1 border rounded-md p-2' placeholder='Type message'/>
        <button onClick={send} className='px-3 py-2 rounded-md bg-red-600 text-white'>Send</button>
      </div>
    </div>
  )
}

export default ChatPanel