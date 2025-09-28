import Link from 'next/link'

interface NavigationProps {
  currentPage?: string
}

const NAV_ITEMS = [
  { href: '/', label: 'Home', key: 'home' },
  { href: '/blocks', label: 'Blocks', key: 'blocks' },
  { href: '/transactions', label: 'Transactions', key: 'transactions' },
  { href: '/mempool', label: 'Mempool', key: 'mempool' },
  { href: '/scheduled', label: 'Scheduled', key: 'scheduled' },
  { href: '/async', label: 'Async', key: 'async' },
  { href: '/analytics', label: 'Analytics', key: 'analytics' },
  { href: '/gas-tracker', label: 'Gas Tracker', key: 'gas-tracker' },
  { href: '/settings', label: 'Settings', key: 'settings' },
] as const

export function Navigation({ currentPage }: NavigationProps) {
  return (
    <header className="border-b border-lime-500/20 bg-black/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-lime-400 hover:text-lime-300 transition-colors">
              Shrinenet Explorer
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            {NAV_ITEMS.map((item) => (
              currentPage === item.key ? (
                <span 
                  key={item.key}
                  className="text-white border-b-2 border-lime-400 px-3 py-2 text-sm font-medium"
                >
                  {item.label}
                </span>
              ) : (
                <Link 
                  key={item.key}
                  href={item.href} 
                  className="text-lime-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-lime-400 hover:text-lime-300">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
