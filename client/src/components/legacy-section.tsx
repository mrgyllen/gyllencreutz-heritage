import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function LegacySection() {
  return (
    <section id="legacy" className="py-20 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-noble-gold mb-4">
            Legacy & Intrigue
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Discover the gripping story of power, conflict, and family legacy in 16th-century Sweden through our historical biography.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            {/* Book Cover */}
            <Card className="bg-gradient-to-br from-amber-800 to-amber-900 border-none shadow-2xl">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-playfair font-bold text-noble-gold mb-4">
                  Makt, intriger och krig
                </h3>
                <p className="text-lg text-amber-100 mb-6">
                  En frälsemans levnadsöde under Wasatiden
                </p>
                <p className="text-amber-200 font-semibold">Claes Gyllencreutz</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-xl font-playfair font-bold text-noble-gold mb-4">
                  The Story of Tyke Larsson
                </h3>
                <blockquote className="text-gray-300 italic text-lg leading-relaxed">
                  "Discover the gripping story of Tyke Larsson — from his noble beginnings in Schleswig to his entanglements in Nordic wars, court politics, and noble life in 16th-century Sweden. This book is a window into a forgotten era of power, conflict, and family legacy."
                </blockquote>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-noble-gold mb-3">From the Preface:</h4>
                <p className="text-gray-300 leading-relaxed">
                  Lars Tykesson served as stable-master under Duke Adolf of Holstein at Gottorp Castle. When he fell in battle at Dithmarschen in 1559, his widow Marina made the fateful decision to send their young son Tyke to Sweden, where he would eventually be ennobled and found one of the oldest noble houses in Swedish history.
                </p>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-noble-gold hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-semibold transition-colors">
                Download PDF
              </Button>
              <Button className="bg-burgundy hover:bg-red-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Purchase Book
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
