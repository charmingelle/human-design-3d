import DataPanel from './bodygraph/DataPanel'

export default function RightSidebar() {
  return (
    <aside className="w-60 flex-shrink-0 bg-surface border-r border-border flex flex-col">
      <div className="flex flex-col flex-1 overflow-y-auto" style={{ padding: '12px' }}>
        <DataPanel />
      </div>
    </aside>
  )
}
