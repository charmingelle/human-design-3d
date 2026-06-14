import Viewport from './components/Viewport'
import RightSidebar from './components/RightSidebar'
import Sidebar from './components/Sidebar'
import Tooltip from './components/Tooltip'

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <Viewport />
      <RightSidebar />
      <Tooltip />
    </div>
  )
}
