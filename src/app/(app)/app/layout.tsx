import BottomNav from '@/components/BottomNav'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 overflow-visible">
      <div className="max-w-md mx-auto bg-white min-h-screen overflow-visible">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 safe-top">
          <div className="px-4 py-4">
            <h1 className="text-xl font-semibold text-gray-900">Bubble Finance</h1>
          </div>
        </header>
        <main className="px-4 py-6 overflow-visible">{children}</main>
        <BottomNav />
      </div>
    </div>
  )
}

