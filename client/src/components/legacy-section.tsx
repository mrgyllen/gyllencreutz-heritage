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
                  The Story of Tyke Larsson
                </h3>
                <p className="text-warm-stone leading-relaxed">
                  Claes Gyllencreutz has written a family chronicle with ancestor Tyke Larsson (Gyllencreutz) at the center, which is also a piece of Swedish history. The Gyllencreutz family's fates are intertwined with the power-historical events in Sweden and the Nordic region.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-historic-blue/80 border-antique-brass/30">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-antique-brass mb-3">Historical Context:</h4>
                <p className="text-warm-stone leading-relaxed">
                  The events take place mainly in the provinces of Småland, Västergötland, Östergötland (Nordic Seven Years' War) and Stockholm. In the 1580s, he was employed by the Eastern Göta military area as a recruiter of soldiers and cavalry to Östan- and Westanstång in Östergötland. He later became councilor and kitchen master to Duke Magnus Vasa at Kungsbrogård near Vreta Monastery.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-historic-blue/80 border-antique-brass/30">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-antique-brass mb-3">Personal Life:</h4>
                <p className="text-warm-stone leading-relaxed">
                  Tyke married at his estate Wiby outside Östra Ryd south of Norrköping and had 10 children with two wives, Kirsten Trulsdotter and Brita Alfsdotter Ikorn. He was fortunate to become one of Duke Karl's favorites and received courier assignments during Karl's dispute with Hogenskild Bielke and later also with King Sigismund.
                </p>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="bg-antique-brass hover:bg-antique-brass/80 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                onClick={() => window.open('https://www.bokus.com/bok/9789198793543/makt-intriger-och-krig-en-fralsemans-levnadsode-under-wasatiden/', '_blank')}
              >
                View on Bokus
              </Button>
              <Button className="bg-burgundy hover:bg-burgundy/80 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Contact Author
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
