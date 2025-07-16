import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";

export function LegacySection() {
  const { t } = useLanguage();
  
  return (
    <section id="legacy" className="py-20 bg-deep-forest text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-antique-brass mb-4">
            {t('legacy.title')}
          </h2>
          <p className="text-lg text-warm-stone max-w-2xl mx-auto">
            {t('legacy.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            {/* Book Cover */}
            <Card className="bg-gradient-to-br from-antique-brass to-burgundy border-none shadow-2xl">
              <CardContent className="p-8 text-center">
                <div className="bg-parchment p-6 rounded-lg shadow-inner mb-6">
                  <img 
                    src="https://image.bokus.com/images/9789198793543_383x_makt-intriger-och-krig-en-fralsemans-levnadsode-under-wasatiden" 
                    alt="Makt, intriger och krig book cover"
                    className="w-full max-w-xs mx-auto rounded-lg shadow-lg"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-playfair font-bold text-parchment mb-2">
                    Makt, intriger och krig
                  </h3>
                  <p className="text-lg text-warm-stone mb-4">
                    En frälsemans levnadsöde under Wasatiden
                  </p>
                  <p className="text-warm-stone font-semibold mb-2">Claes Gyllencreutz</p>
                  <p className="text-warm-stone/80 text-sm">Inbunden • 304 sidor • 2024</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-historic-blue/80 border-antique-brass/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-playfair font-bold text-antique-brass mb-4">
                  {t('legacy.story.title')}
                </h3>
                <p className="text-warm-stone leading-relaxed">
                  {t('legacy.story.text')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-historic-blue/80 border-antique-brass/30">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-antique-brass mb-3">{t('legacy.context.title')}</h4>
                <p className="text-warm-stone leading-relaxed">
                  {t('legacy.context.text')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-historic-blue/80 border-antique-brass/30">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-antique-brass mb-3">{t('legacy.personal.title')}</h4>
                <p className="text-warm-stone leading-relaxed">
                  {t('legacy.personal.text')}
                </p>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="bg-antique-brass hover:bg-antique-brass/80 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                onClick={() => window.open('https://www.bokus.com/bok/9789198793543/makt-intriger-och-krig-en-fralsemans-levnadsode-under-wasatiden/', '_blank')}
              >
                {t('legacy.button.bokus')}
              </Button>
              <Button className="bg-burgundy hover:bg-burgundy/80 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                {t('legacy.button.contact')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
