import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'sv' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  sv: {
    // Navigation
    'nav.home': 'Hem',
    'nav.familyTree': 'Familjeträd',
    'nav.legacy': 'Arv',
    'nav.gallery': 'Galleri',
    'nav.about': 'Om',
    
    // Hero Section
    'hero.title': 'Adelsätten',
    'hero.subtitle': 'Adlade 26 januari 1594 och introducerade i Riddarhuset 1625. Familjen härstammar från Holstein med Lars Tykesson som den äldsta kända anfadern.',
    'hero.quote': 'Hans son, Tyke Larsson, blev hovmästare hos hertig Magnus av Östergötland och häradshövding i Vifolka härad. Han adlades 26 januari 1594 på Stockholms slott av konung Sigismund.',
    'hero.quote.source': '— Riddarhusets officiella arkiv',
    'hero.button.tree': 'Utforska familjeträd',
    'hero.button.riddarhuset': 'Riddarhuset register',
    
    // About Section
    'about.title': 'Gyllencreutz - Adlig Nr. 54',
    'about.subtitle': 'En av Sveriges äldsta adelsätter, adlad 1594 och introducerad i Riddarhuset 1625.',
    'about.origins.title': 'Familjens ursprung',
    'about.origins.text1': 'Familjen härstammar från Holstein med Lars Tykesson (1500-talet) som den äldsta kända anfadern, som tjänstgjorde som stallmästare hos hertig av Holstein.',
    'about.origins.text2': 'Hans son, Tyke Larsson, blev hovmästare hos hertig Magnus av Östergötland och senare häradshövding i Vifolka härad i Östergötland. Han adlades 26 januari 1594 på Stockholms slott av konung Sigismund utan namngivning.',
    'about.status.title': 'Adelsstatus',
    'about.status.ennobled': 'Adlad:',
    'about.status.introduced': 'Introducerad:',
    'about.status.houseNumber': 'Husnummer:',
    'about.status.class': 'Klass:',
    'about.status.confirmation': 'Bekräftelse:',
    'about.status.status': 'Status:',
    'about.status.classText': 'Upphöjd till riddarklassen 1778',
    'about.status.confirmationText': 'Kungligt brev 30 juni 1644 av drottning Kristina',
    'about.status.statusText': 'Både manliga och kvinnliga linjer lever',
    'about.heraldic.title': 'Heraldisk beskrivning',
    'about.heraldic.description': '"Tre röda kors i silverfält, på skölden en öppen turnérhjälm, krona och hjälmtäcke vitt och rött, och på hjälmen ett rött kors mellan två delade jakthorn, röda och silver, såsom avbildat i detta brev..."',
    'about.heraldic.source': 'Ursprungligt sköldebrev bevarat i Riddarhuset sedan 1887. Transkription av Göran Mörner (2016) & Karin Borgkvist Ljung (2017).',
    
    // Legacy Section
    'legacy.title': 'Makt, intriger och krig',
    'legacy.subtitle': 'En frälsemans levnadsöde under Vasatiden - En omfattande historisk biografi av Claes Gyllencreutz',
    'legacy.story.title': 'Berättelsen om Tyke Larsson',
    'legacy.story.text': 'Claes Gyllencreutz har skrivit en familjekrönika med anfadern Tyke Larsson (Gyllencreutz) i centrum, som också är ett stycke svensk historia. Familjen Gyllencreutz öden är sammanflätade med de makthistoriska händelserna i Sverige och Norden.',
    'legacy.context.title': 'Historisk kontext:',
    'legacy.context.text': 'Händelserna utspelar sig huvudsakligen i landskapen Småland, Västergötland, Östergötland (Nordiska sjuårskriget) och Stockholm. På 1580-talet var han anställd av Östra Göta militärområde som värvare av soldater och kavalleri till Östan- och Westanstång i Östergötland. Han blev senare rådherre och köksmästare hos hertig Magnus Vasa på Kungsbrogård nära Vreta kloster.',
    'legacy.personal.title': 'Personligt liv:',
    'legacy.personal.text': 'Tyke gifte sig på sitt gods Wiby utanför Östra Ryd söder om Norrköping och fick 10 barn med två fruar, Kirsten Trulsdotter och Brita Alfsdotter Ikorn. Han hade turen att bli en av hertig Karls favoriter och fick kuriruppgifter under Karls tvister med Hogenskild Bielke och senare även med konung Sigismund.',
    'legacy.button.bokus': 'Visa på Bokus',
    'legacy.button.contact': 'Kontakta författaren',
    
    // Gallery Section
    'gallery.title': 'Heraldiskt galleri',
    'gallery.subtitle': 'Utforska Gyllencreutz familjens visuella arv genom historisk bildkonst och adelssymboler.',
    'gallery.coat.title': 'Familjens vapen',
    'gallery.coat.description': 'Det officiella heraldiska skölden för familjen Gyllencreutz, med de karakteristiska tre korsen som symboliserar tro, adelskap och arv.',
    'gallery.mark.title': 'Adelsmärke',
    'gallery.mark.description': 'Historiskt adelsmärke (Adelsmärke) från familjens arkiv, som representerar den officiella registreringen vid Riddarhuset som adelsnummer 54.',
    'gallery.horseman.title': 'Adlig ryttare',
    'gallery.horseman.description': 'Historisk illustration som representerar familjens adelsmilitära tradition, återspeglar deras tjänst för den svenska kronan.',
    'gallery.archive.title': 'Officiellt heraldiskt arkiv',
    'gallery.archive.subtitle': 'Från Riddarhusets arkiv - Officiella heraldiska representationer genom historien',
    'gallery.archive.modern': 'Modern heraldisk representation',
    'gallery.archive.keyser': '1650 heraldisk post',
    'gallery.archive.calendar': 'Adelskkalender post',
    'gallery.archive.stiernstedt': '1865 heraldisk sammanställning',
    
    // Family Tree
    'tree.title': 'Familjeträd',
    'tree.subtitle': 'Utforska 450 år av familjehistoria genom vårt interaktiva släktträd.',
    'tree.search.placeholder': 'Sök familjemedlemmar...',
    'tree.search.button': 'Sök',
    'tree.member.born': 'Född:',
    'tree.member.died': 'Död:',
    'tree.member.age': 'Ålder:',
    'tree.member.monarchs': 'Monark under livet:',
    'tree.member.notes': 'Anteckningar:',
    'tree.member.male': 'Man',
    'tree.member.female': 'Kvinna',
    'tree.member.unknown': 'Okänt',
    'tree.generations.timeline': 'Generationer Tidslinje',
    'tree.generations.total': 'generationer',
    
    // Footer Section
    'footer.title': 'Gyllencreutz Arv',
    'footer.description': 'Bevarar arvet från en av Sveriges äldsta adelsätter sedan 1500-talet.',
    'footer.quickLinks': 'Snabblänkar',
    'footer.externalLinks': 'Externa länkar',
    'footer.contact': 'Kontakt',
    'footer.riddarhuset': 'Riddarhuset register',
    'footer.copyright': '© 2025 Gyllencreutz Familjarv. Alla rättigheter förbehållna.'
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.familyTree': 'Family Tree',
    'nav.legacy': 'Legacy',
    'nav.gallery': 'Gallery',
    'nav.about': 'About',
    
    // Hero Section
    'hero.title': 'The Noble House of',
    'hero.subtitle': 'Ennobled January 26, 1594, and introduced to the House of Nobility in 1625. The family originates from Holstein with Lars Tykesson as the earliest known ancestor.',
    'hero.quote': 'His son, Tyke Larsson, became court master to Duke Magnus of Östergötland and district judge in Vifolka hundred. He was ennobled on January 26, 1594, at Stockholm Castle by King Sigismund.',
    'hero.quote.source': '— Riddarhuset Official Archive',
    'hero.button.tree': 'Explore Family Tree',
    'hero.button.riddarhuset': 'Riddarhuset Registry',
    
    // About Section
    'about.title': 'Gyllencreutz - Noble Nr. 54',
    'about.subtitle': 'One of Sweden\'s oldest noble families, ennobled in 1594 and introduced to the House of Nobility in 1625.',
    'about.origins.title': 'Family Origins',
    'about.origins.text1': 'The family originates from Holstein with Lars Tykesson (16th century) as the earliest known ancestor, who served as stable-master to the Duke of Holstein.',
    'about.origins.text2': 'His son, Tyke Larsson, became court master to Duke Magnus of Östergötland and later district judge in Vifolka hundred in Östergötland. He was ennobled on January 26, 1594, at Stockholm Castle by King Sigismund without mention of name.',
    'about.status.title': 'Noble Status',
    'about.status.ennobled': 'Ennobled:',
    'about.status.introduced': 'Introduced:',
    'about.status.houseNumber': 'House Number:',
    'about.status.class': 'Class:',
    'about.status.confirmation': 'Confirmation:',
    'about.status.status': 'Status:',
    'about.status.classText': 'Elevated to Knight Class in 1778',
    'about.status.confirmationText': 'Royal letter June 30, 1644 by Queen Kristina',
    'about.status.statusText': 'Both male and female lines surviving',
    'about.heraldic.title': 'Heraldic Description',
    'about.heraldic.description': '"Three red crosses in a silver field, on the shield an open tournament helmet, crown and helmet cover white and red, and on the helmet a red cross between two divided hunting horns, red and silver, as depicted in this letter..."',
    'about.heraldic.source': 'Original shield letter preserved in the House of Nobility since 1887. Transcription by Göran Mörner (2016) & Karin Borgkvist Ljung (2017).',
    
    // Legacy Section
    'legacy.title': 'Power, Intrigue and War',
    'legacy.subtitle': 'A nobleman\'s fate during the Vasa period - A comprehensive historical biography by Claes Gyllencreutz',
    'legacy.story.title': 'The Story of Tyke Larsson',
    'legacy.story.text': 'Claes Gyllencreutz has written a family chronicle with ancestor Tyke Larsson (Gyllencreutz) at the center, which is also a piece of Swedish history. The Gyllencreutz family\'s fates are intertwined with the power-historical events in Sweden and the Nordic region.',
    'legacy.context.title': 'Historical Context:',
    'legacy.context.text': 'The events take place mainly in the provinces of Småland, Västergötland, Östergötland (Nordic Seven Years\' War) and Stockholm. In the 1580s, he was employed by the Eastern Göta military area as a recruiter of soldiers and cavalry to Östan- and Westanstång in Östergötland. He later became councilor and kitchen master to Duke Magnus Vasa at Kungsbrogård near Vreta Monastery.',
    'legacy.personal.title': 'Personal Life:',
    'legacy.personal.text': 'Tyke married at his estate Wiby outside Östra Ryd south of Norrköping and had 10 children with two wives, Kirsten Trulsdotter and Brita Alfsdotter Ikorn. He was fortunate to become one of Duke Karl\'s favorites and received courier assignments during Karl\'s dispute with Hogenskild Bielke and later also with King Sigismund.',
    'legacy.button.bokus': 'View on Bokus',
    'legacy.button.contact': 'Contact Author',
    
    // Gallery Section
    'gallery.title': 'Heraldic Gallery',
    'gallery.subtitle': 'Explore the visual heritage of the Gyllencreutz family through historical imagery and noble symbols.',
    'gallery.coat.title': 'Family Coat of Arms',
    'gallery.coat.description': 'The official heraldic shield of the Gyllencreutz family, featuring the distinctive three crosses that symbolize faith, nobility, and heritage.',
    'gallery.mark.title': 'Noble Mark',
    'gallery.mark.description': 'Historical noble mark (Adelsmärke) from the family archives, representing the official registration at Riddarhuset as nobility number 54.',
    'gallery.horseman.title': 'Noble Horseman',
    'gallery.horseman.description': 'Historical illustration representing the noble military tradition of the family, reflecting their service to the Swedish crown.',
    'gallery.archive.title': 'Official Heraldic Archive',
    'gallery.archive.subtitle': 'From the Riddarhuset (House of Nobility) Archive - Official heraldic representations throughout history',
    'gallery.archive.modern': 'Modern heraldic representation',
    'gallery.archive.keyser': '1650 heraldic record',
    'gallery.archive.calendar': 'Noble calendar entry',
    'gallery.archive.stiernstedt': '1865 heraldic compilation',
    
    // Family Tree
    'tree.title': 'Family Tree',
    'tree.subtitle': 'Explore 450 years of family history through our interactive genealogical tree.',
    'tree.search.placeholder': 'Search family members...',
    'tree.search.button': 'Search',
    'tree.member.born': 'Born:',
    'tree.member.died': 'Died:',
    'tree.member.age': 'Age:',
    'tree.member.monarchs': 'Monarchs during life:',
    'tree.member.notes': 'Notes:',
    'tree.member.male': 'Male',
    'tree.member.female': 'Female',
    'tree.member.unknown': 'Unknown',
    'tree.generations.timeline': 'Generation Timeline',
    'tree.generations.total': 'generations',
    
    // Footer Section
    'footer.title': 'Gyllencreutz Heritage',
    'footer.description': 'Preserving the legacy of one of Sweden\'s oldest noble families since the 1500s.',
    'footer.quickLinks': 'Quick Links',
    'footer.externalLinks': 'External Links',
    'footer.contact': 'Contact',
    'footer.riddarhuset': 'Riddarhuset Registry',
    'footer.copyright': '© 2025 Gyllencreutz Family Heritage. All rights reserved.'
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('sv');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'sv' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    const translation = translations[language] as Record<string, string>;
    return translation[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}