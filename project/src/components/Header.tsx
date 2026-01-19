import { Sparkles } from 'lucide-react';

interface HeaderProps {
  onGenerateSummary: () => void;
}

export default function Header({ onGenerateSummary }: HeaderProps) {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo and Business Name */}
          <div className="flex flex-col min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate" style={{ color: '#1e3a5f' }}>
              Business Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 truncate">Powered by Àpínlẹ̀rọ</p>
          </div>

          {/* Date - Hidden on very small screens */}
          <div className="hidden sm:block text-center flex-shrink-0">
            <p className="text-xs sm:text-sm text-gray-600">{today}</p>
          </div>

          {/* AI Summary Button */}
          <button
            onClick={onGenerateSummary}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg text-white text-xs sm:text-sm font-medium transition-all hover:opacity-90 flex-shrink-0"
            style={{ backgroundColor: '#0d9488' }}
          >
            <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden xs:inline">AI</span> Summary
          </button>
        </div>
      </div>
    </header>
  );
}
