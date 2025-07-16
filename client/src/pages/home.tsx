import { Navigation } from "@/components/navigation";
import { HeroSection } from "@/components/hero-section";
import { FamilyTree } from "@/components/family-tree";
import { LegacySection } from "@/components/legacy-section";
import { GallerySection } from "@/components/gallery-section";
import { AboutSection } from "@/components/about-section";
import { TestPortraits } from "@/components/test-portraits";
import { useLanguage } from "@/contexts/language-context";

export default function Home() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-parchment">
      <Navigation />
      <HeroSection />
      <TestPortraits />
      <FamilyTree />
      <LegacySection />
      <GallerySection />
      <AboutSection />
      
      {/* Footer */}
      <footer className="bg-deep-forest text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-cinzel font-semibold text-antique-brass mb-4">
                {t('footer.title')}
              </h3>
              <p className="text-parchment">
                {t('footer.description')}
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-antique-brass mb-4">{t('footer.quickLinks')}</h4>
              <ul className="space-y-2 text-parchment">
                <li><a href="#home" className="hover:text-antique-brass transition-colors">{t('nav.home')}</a></li>
                <li><a href="#tree" className="hover:text-antique-brass transition-colors">{t('nav.familyTree')}</a></li>
                <li><a href="#legacy" className="hover:text-antique-brass transition-colors">{t('nav.legacy')}</a></li>
                <li><a href="#gallery" className="hover:text-antique-brass transition-colors">{t('nav.gallery')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-antique-brass mb-4">{t('footer.externalLinks')}</h4>
              <ul className="space-y-2 text-parchment">
                <li>
                  <a 
                    href="https://minerva.riddarhuset.se/att/gyllencreutz/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-antique-brass transition-colors"
                  >
                    {t('footer.riddarhuset')}
                  </a>
                </li>
                <li><a href="#" className="hover:text-antique-brass transition-colors">{t('footer.contact')}</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-warm-stone/30 text-center text-parchment">
            <p>{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
