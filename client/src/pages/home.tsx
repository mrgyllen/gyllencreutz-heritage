import { Navigation } from "@/components/navigation";
import { HeroSection } from "@/components/hero-section";
import { FamilyTree } from "@/components/family-tree";
import { LegacySection } from "@/components/legacy-section";
import { GallerySection } from "@/components/gallery-section";
import { AboutSection } from "@/components/about-section";

export default function Home() {
  return (
    <div className="min-h-screen bg-parchment">
      <Navigation />
      <HeroSection />
      <FamilyTree />
      <LegacySection />
      <GallerySection />
      <AboutSection />
      
      {/* Footer */}
      <footer className="bg-burgundy text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-cinzel font-semibold text-noble-gold mb-4">
                Gyllencreutz Heritage
              </h3>
              <p className="text-gray-300">
                Preserving the legacy of one of Sweden's oldest noble families since the 1500s.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-noble-gold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#home" className="hover:text-noble-gold transition-colors">Home</a></li>
                <li><a href="#tree" className="hover:text-noble-gold transition-colors">Family Tree</a></li>
                <li><a href="#legacy" className="hover:text-noble-gold transition-colors">Legacy</a></li>
                <li><a href="#gallery" className="hover:text-noble-gold transition-colors">Gallery</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-noble-gold mb-4">External Links</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <a 
                    href="https://minerva.riddarhuset.se/att/gyllencreutz/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-noble-gold transition-colors"
                  >
                    Riddarhuset Registry
                  </a>
                </li>
                <li><a href="#" className="hover:text-noble-gold transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-300">
            <p>&copy; 2024 Gyllencreutz Family Heritage. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
