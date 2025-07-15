import { Card, CardContent } from "@/components/ui/card";

export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-burgundy mb-4">
            About This Heritage Project
          </h2>
          <p className="text-lg text-gray-600">
            Preserving and presenting centuries of family history for future generations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-xl font-playfair font-bold text-burgundy mb-4">
                Project Background
              </h3>
              <p className="text-gray-600 leading-relaxed">
                This comprehensive heritage website was created to preserve and share the rich history of the Gyllencreutz family. Using modern web technologies, we've created an interactive platform that brings centuries of family history to life.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-xl font-playfair font-bold text-burgundy mb-4">
                Technical Credits
              </h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Interactive genealogy tree powered by D3.js</li>
                <li>• Responsive design using Tailwind CSS</li>
                <li>• Historical data from Riksarkivet sources</li>
                <li>• Modern React/TypeScript architecture</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 bg-white shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-xl font-playfair font-bold text-burgundy mb-4">
              Contributing Family Members
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Special thanks to Claes Gyllencreutz for his extensive historical research and book "Makt, intriger och krig," and to Cristina Palmqvist (née Gyllencreutz) for her genealogical contributions that made this digital heritage possible.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
