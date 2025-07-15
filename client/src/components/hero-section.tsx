import { Button } from "@/components/ui/button";
import coatOfArms from "@assets/vapenskjöld_1752593493242.jpg";

export function HeroSection() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 heraldic-pattern"></div>
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="inline-block p-4 bg-white rounded-full shadow-2xl mb-6">
            <img 
              src={coatOfArms} 
              alt="Gyllencreutz Family Coat of Arms" 
              className="w-32 h-32 object-contain" 
            />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-playfair font-bold text-deep-forest mb-6">
          The Noble House of<br />
          <span className="text-antique-brass">Gyllencreutz</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-800 mb-8 max-w-3xl mx-auto leading-relaxed">
          <em>Adliga ätten nr 54</em> - Ennobled January 26, 1594, and introduced to the House of Nobility in 1625. The family originates from Holstein with Lars Tykesson as the earliest known ancestor.
        </p>
        
        <div className="bg-parchment bg-opacity-95 rounded-lg p-6 shadow-xl max-w-2xl mx-auto mb-8 border border-antique-brass/20">
          <blockquote className="text-gray-800 italic text-lg leading-relaxed">
            "His son, Tyke Larsson, became court master to Duke Magnus of Östergötland and district judge in Vifolka hundred. He was ennobled on January 26, 1594, at Stockholm Castle by King Sigismund."
          </blockquote>
          <p className="text-sm text-gray-600 mt-2">— Riddarhuset Official Archive</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => scrollToSection('tree')}
            className="bg-deep-forest hover:bg-deep-forest/80 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Explore Family Tree
          </Button>
          <Button
            onClick={() => window.open('https://minerva.riddarhuset.se/att/gyllencreutz/', '_blank')}
            className="bg-antique-brass hover:bg-antique-brass/80 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Riddarhuset Registry
          </Button>
        </div>
      </div>
    </section>
  );
}
