import { useState } from 'react'
import Viewport from './components/Viewport'
import RightSidebar from './components/RightSidebar'
import Sidebar from './components/Sidebar'
import Tooltip from './components/Tooltip'

export default function App() {
  const [leftOpen,        setLeftOpen]        = useState(false)
  const [rightOpen,       setRightOpen]       = useState(false)
  const [leftPlanetOpen,  setLeftPlanetOpen]  = useState(false)
  const [rightPlanetOpen, setRightPlanetOpen] = useState(false)

  const toggleLeft  = () => { setLeftOpen(o => !o); setRightOpen(false) }
  const toggleRight = () => { setRightOpen(o => !o); setLeftOpen(false) }

  const toggleLeftPlanet  = () => setLeftPlanetOpen(o => !o)
  const toggleRightPlanet = () => setRightPlanetOpen(o => !o)

  return (
    <div className="flex overflow-hidden" style={{ height: '100dvh' }}>
      <Sidebar isOpen={leftOpen} onClose={() => setLeftOpen(false)} />
      <Viewport
        onToggleLeft={toggleLeft}
        onToggleRight={toggleRight}
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        onToggleLeftPlanet={toggleLeftPlanet}
        onToggleRightPlanet={toggleRightPlanet}
        leftPlanetOpen={leftPlanetOpen}
        rightPlanetOpen={rightPlanetOpen}
      />
      <RightSidebar isOpen={rightOpen} onClose={() => setRightOpen(false)} />
      <Tooltip />
    </div>
  )
}
