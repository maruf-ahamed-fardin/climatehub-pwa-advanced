'use client'
import { useState, useEffect } from 'react'
export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null)
  useEffect(()=>{
    window.addEventListener('beforeinstallprompt', (e:any)=>{
      e.preventDefault()
      setPrompt(e)
    })
  },[])
  if(!prompt) return null
  return <button onClick={()=>prompt.prompt()} className="fixed bottom-5 right-5 bg-blue-600 text-white px-6 py-3 rounded-xl">Install App</button>
}