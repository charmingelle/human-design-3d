import { useEffect } from 'react'
import DataPanel from './bodygraph/DataPanel'

interface RightSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function RightSidebar({ isOpen, onClose }: RightSidebarProps) {
  // Blur any focused input when the panel closes so iOS releases its viewport zoom.
  useEffect(() => {
    if (!isOpen && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }, [isOpen])

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={[
        'w-60 flex-shrink-0 bg-surface border-l border-border flex flex-col',
        // mobile: fixed overlay, slides in from right
        'fixed inset-y-0 right-0 z-50 transition-transform duration-300 ease-in-out',
        // desktop: back in the normal flex flow
        'md:relative md:z-auto md:translate-x-0',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      ].join(' ')}>
        <div className="flex flex-col flex-1 overflow-y-auto" style={{ padding: '12px' }}>
          <DataPanel />
        </div>
      </aside>
    </>
  )
}
