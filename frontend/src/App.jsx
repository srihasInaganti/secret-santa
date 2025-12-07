import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { SnowBackground, SnowForeground } from './components/Snow';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
        <SnowBackground />
        <h1 style={{color : 'red'}}>Random Text</h1>
        <SnowForeground />
    </>
  )
}

export default App
