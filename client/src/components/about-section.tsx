import { Card, CardContent } from "@/components/ui/card";

export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-warm-stone">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-burgundy mb-4">
            Gyllencreutz - Adlig Nr. 54
          </h2>
          <p className="text-lg text-gray-600">
            One of Sweden's oldest noble families, ennobled in 1594 and introduced to the House of Nobility in 1625.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-parchment shadow-lg border-antique-brass/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-playfair font-bold text-deep-forest mb-4">
                Family Origins
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The family originates from Holstein with Lars Tykesson (16th century) as the earliest known ancestor, who served as stable-master to the Duke of Holstein.
              </p>
              <p className="text-gray-700 leading-relaxed">
                His son, Tyke Larsson, became court master to Duke Magnus of Östergötland and later district judge in Vifolka hundred in Östergötland. He was ennobled on January 26, 1594, at Stockholm Castle by King Sigismund without mention of name.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-parchment shadow-lg border-antique-brass/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-playfair font-bold text-deep-forest mb-4">
                Noble Status
              </h3>
              <ul className="text-gray-700 space-y-2">
                <li>• <strong>Ennobled:</strong> January 26, 1594</li>
                <li>• <strong>Introduced:</strong> March 10 - April 4, 1625</li>
                <li>• <strong>House Number:</strong> 54</li>
                <li>• <strong>Class:</strong> Elevated to Knight Class in 1778</li>
                <li>• <strong>Confirmation:</strong> Royal letter June 30, 1644 by Queen Kristina</li>
                <li>• <strong>Status:</strong> Both male and female lines surviving</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 bg-parchment shadow-lg border-antique-brass/20">
          <CardContent className="p-6">
            <h3 className="text-xl font-playfair font-bold text-deep-forest mb-4">
              Heraldic Description
            </h3>
            <p className="text-gray-700 leading-relaxed italic mb-4">
              "Three red crosses in a silver field, on the shield an open tournament helmet, crown and helmet cover white and red, and on the helmet a red cross between two divided hunting horns, red and silver, as depicted in this letter..."
            </p>
            <p className="text-gray-600 text-sm">
              Original shield letter preserved in the House of Nobility since 1887. Transcription by Göran Mörner (2016) & Karin Borgkvist Ljung (2017).
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
