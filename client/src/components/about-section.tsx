import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";

export function AboutSection() {
  const { t } = useLanguage();
  
  return (
    <section id="about" className="py-20 bg-warm-stone">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-burgundy mb-4">
            {t('about.title')}
          </h2>
          <p className="text-lg text-gray-600">
            {t('about.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-parchment shadow-lg border-antique-brass/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-playfair font-bold text-deep-forest mb-4">
                {t('about.origins.title')}
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('about.origins.text1')}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t('about.origins.text2')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-parchment shadow-lg border-antique-brass/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-playfair font-bold text-deep-forest mb-4">
                {t('about.status.title')}
              </h3>
              <ul className="text-gray-700 space-y-2">
                <li>• <strong>{t('about.status.ennobled')}</strong> 26 januari 1594</li>
                <li>• <strong>{t('about.status.introduced')}</strong> 10 mars - 4 april 1625</li>
                <li>• <strong>{t('about.status.houseNumber')}</strong> 54</li>
                <li>• <strong>{t('about.status.class')}</strong> {t('about.status.classText')}</li>
                <li>• <strong>{t('about.status.confirmation')}</strong> {t('about.status.confirmationText')}</li>
                <li>• <strong>{t('about.status.status')}</strong> {t('about.status.statusText')}</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 bg-parchment shadow-lg border-antique-brass/20">
          <CardContent className="p-6">
            <h3 className="text-xl font-playfair font-bold text-deep-forest mb-4">
              {t('about.heraldic.title')}
            </h3>
            <p className="text-gray-700 leading-relaxed italic mb-4">
              "{t('about.heraldic.description')}"
            </p>
            <p className="text-gray-600 text-sm">
              {t('about.heraldic.source')}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
