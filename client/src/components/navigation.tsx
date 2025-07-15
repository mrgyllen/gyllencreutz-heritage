import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-deep-forest shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-antique-brass font-cinzel text-xl font-semibold">
                GYLLENCREUTZ
              </h1>
            </div>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <button
                onClick={() => scrollToSection('home')}
                className="text-warm-stone hover:text-antique-brass px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('tree')}
                className="text-warm-stone hover:text-antique-brass px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Family Tree
              </button>
              <button
                onClick={() => scrollToSection('legacy')}
                className="text-warm-stone hover:text-antique-brass px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Legacy
              </button>
              <button
                onClick={() => scrollToSection('gallery')}
                className="text-warm-stone hover:text-antique-brass px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Gallery
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-warm-stone hover:text-antique-brass px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                About
              </button>
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-warm-stone hover:text-antique-brass"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-burgundy">
            <button
              onClick={() => scrollToSection('home')}
              className="text-parchment hover:text-noble-gold block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('tree')}
              className="text-parchment hover:text-noble-gold block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors"
            >
              Family Tree
            </button>
            <button
              onClick={() => scrollToSection('legacy')}
              className="text-parchment hover:text-noble-gold block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors"
            >
              Legacy
            </button>
            <button
              onClick={() => scrollToSection('gallery')}
              className="text-parchment hover:text-noble-gold block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors"
            >
              Gallery
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-parchment hover:text-noble-gold block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors"
            >
              About
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
