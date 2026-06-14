import BodygraphPanel from './bodygraph/BodygraphPanel'

export default function Sidebar() {
  return (
    <aside className="w-60 flex-shrink-0 bg-surface border-l border-border flex flex-col">
      <div className="flex flex-col flex-1 overflow-y-auto" style={{ padding: '12px' }}>
        <BodygraphPanel />
      </div>
    </aside>
  )
}
