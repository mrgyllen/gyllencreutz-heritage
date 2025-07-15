import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={language === 'sv' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('sv')}
        className={language === 'sv' 
          ? 'bg-antique-brass text-white hover:bg-antique-brass/80' 
          : 'text-warm-stone hover:text-antique-brass hover:bg-transparent'
        }
      >
        SV
      </Button>
      <Button
        variant={language === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('en')}
        className={language === 'en' 
          ? 'bg-antique-brass text-white hover:bg-antique-brass/80' 
          : 'text-warm-stone hover:text-antique-brass hover:bg-transparent'
        }
      >
        EN
      </Button>
    </div>
  );
}