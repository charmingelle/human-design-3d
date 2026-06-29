import BodygraphPanel from './bodygraph/BodygraphPanel'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
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
        'w-60 flex-shrink-0 bg-surface border-r border-border flex flex-col',
        // mobile: fixed overlay, slides in from left
        'fixed top-0 bottom-0 left-0 z-50 transition-transform duration-300 ease-in-out',
        // desktop: back in the normal flex flow
        'md:relative md:z-auto md:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}>
        <div className="flex flex-col flex-1 overflow-y-auto" style={{ padding: '12px' }}>
          <BodygraphPanel />
        </div>
      </aside>
    </>
  )
}
