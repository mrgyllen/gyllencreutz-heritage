import { Card, CardContent } from "@/components/ui/card";
import coatOfArms from "@assets/vapenskjöld_1752593493242.jpg";
import nobleMark from "@assets/Adelsmärrke från kopia 2_1752593493242.jpg";
import nobleHorseman from "@assets/2 Häst_1752593493242.jpg";

export function GallerySection() {
  return (
    <section id="gallery" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-burgundy mb-4">
            Heraldic Gallery
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore the visual heritage of the Gyllencreutz family through historical imagery and noble symbols.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-gray-50 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <img 
                  src={coatOfArms} 
                  alt="Gyllencreutz Coat of Arms" 
                  className="w-full h-48 object-contain rounded-lg" 
                />
              </div>
              <h3 className="text-xl font-playfair font-bold text-burgundy mb-2">
                Family Coat of Arms
              </h3>
              <p className="text-gray-600">
                The official heraldic shield of the Gyllencreutz family, featuring the distinctive three crosses that symbolize faith, nobility, and heritage.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <img 
                  src={nobleMark} 
                  alt="Noble Mark" 
                  className="w-full h-48 object-contain rounded-lg" 
                />
              </div>
              <h3 className="text-xl font-playfair font-bold text-burgundy mb-2">
                Noble Mark
              </h3>
              <p className="text-gray-600">
                Historical noble mark (Adelsmärke) from the family archives, representing the official registration at Riddarhuset as nobility number 54.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <img 
                  src={nobleHorseman} 
                  alt="Noble Horseman" 
                  className="w-full h-48 object-contain rounded-lg" 
                />
              </div>
              <h3 className="text-xl font-playfair font-bold text-burgundy mb-2">
                Noble Horseman
              </h3>
              <p className="text-gray-600">
                Historical illustration representing the noble military tradition of the family, reflecting their service to the Swedish crown.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
