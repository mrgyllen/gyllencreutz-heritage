import { Card, CardContent } from "@/components/ui/card";
import coatOfArms from "@assets/vapenskjöld_1752593493242.jpg";
import nobleMark from "@assets/Adelsmärrke från kopia 2_1752593493242.jpg";
import nobleHorseman from "@assets/2 Häst_1752593493242.jpg";
import { useLanguage } from "@/contexts/language-context";

export function GallerySection() {
  const { t } = useLanguage();
  
  return (
    <section id="gallery" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-deep-forest mb-4">
            {t('gallery.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('gallery.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-parchment shadow-lg border-antique-brass/20">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <img 
                  src={coatOfArms} 
                  alt="Gyllencreutz Coat of Arms" 
                  className="w-full h-48 object-contain rounded-lg" 
                />
              </div>
              <h3 className="text-xl font-playfair font-bold text-deep-forest mb-2">
                {t('gallery.coat.title')}
              </h3>
              <p className="text-gray-700">
                {t('gallery.coat.description')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-parchment shadow-lg border-antique-brass/20">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <img 
                  src={nobleMark} 
                  alt="Noble Mark" 
                  className="w-full h-48 object-contain rounded-lg" 
                />
              </div>
              <h3 className="text-xl font-playfair font-bold text-deep-forest mb-2">
                {t('gallery.mark.title')}
              </h3>
              <p className="text-gray-700">
                {t('gallery.mark.description')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-parchment shadow-lg border-antique-brass/20">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <img 
                  src={nobleHorseman} 
                  alt="Noble Horseman" 
                  className="w-full h-48 object-contain rounded-lg" 
                />
              </div>
              <h3 className="text-xl font-playfair font-bold text-deep-forest mb-2">
                {t('gallery.horseman.title')}
              </h3>
              <p className="text-gray-700">
                {t('gallery.horseman.description')}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16">
          <h3 className="text-2xl font-playfair font-bold text-deep-forest mb-8 text-center">
            {t('gallery.archive.title')}
          </h3>
          <p className="text-center text-gray-700 mb-8">
            {t('gallery.archive.subtitle')}
          </p>
          
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="bg-parchment shadow-lg border-antique-brass/20">
              <CardContent className="p-4 text-center">
                <div className="mb-4">
                  <img 
                    src="https://minerva.riddarhuset.se/wp-content/uploads/2025/06/Gyllencreutz-A0054-v3-465x464.jpg" 
                    alt="Gyllencreutz Heraldic Shield - SAK 2022"
                    className="w-full h-32 object-contain rounded-lg" 
                  />
                </div>
                <h4 className="text-sm font-playfair font-bold text-deep-forest mb-2">
                  SAK 2022
                </h4>
                <p className="text-xs text-gray-700">
                  {t('gallery.archive.modern')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-parchment shadow-lg border-antique-brass/20">
              <CardContent className="p-4 text-center">
                <div className="mb-4">
                  <img 
                    src="https://minerva.riddarhuset.se/wp-content/uploads/2024/05/A-0054-465x548.jpg" 
                    alt="Gyllencreutz - Keyser's Coat of Arms Book, 1650"
                    className="w-full h-32 object-contain rounded-lg" 
                  />
                </div>
                <h4 className="text-sm font-playfair font-bold text-deep-forest mb-2">
                  Keyser's Vapenbok
                </h4>
                <p className="text-xs text-gray-700">
                  {t('gallery.archive.keyser')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-parchment shadow-lg border-antique-brass/20">
              <CardContent className="p-4 text-center">
                <div className="mb-4">
                  <img 
                    src="https://minerva.riddarhuset.se/wp-content/uploads/2023/08/Gyllencreutz-A0054-v3-1-465x464.jpg" 
                    alt="Gyllencreutz - Sweden's Noble Calendar"
                    className="w-full h-32 object-contain rounded-lg" 
                  />
                </div>
                <h4 className="text-sm font-playfair font-bold text-deep-forest mb-2">
                  Sveriges Adelskalender
                </h4>
                <p className="text-xs text-gray-700">
                  {t('gallery.archive.calendar')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-parchment shadow-lg border-antique-brass/20">
              <CardContent className="p-4 text-center">
                <div className="mb-4">
                  <img 
                    src="https://minerva.riddarhuset.se/wp-content/uploads/2023/08/A-0054-465x591.jpg" 
                    alt="Gyllencreutz - Stiernstedt and Klingspor's Coat of Arms Book, 1865"
                    className="w-full h-32 object-contain rounded-lg" 
                  />
                </div>
                <h4 className="text-sm font-playfair font-bold text-deep-forest mb-2">
                  Stiernstedt & Klingspor
                </h4>
                <p className="text-xs text-gray-700">
                  {t('gallery.archive.stiernstedt')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
