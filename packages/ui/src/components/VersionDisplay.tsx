import { useEffect, useState } from 'react';

export function VersionDisplay() {
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    // Fonction pour récupérer la version depuis le fichier VERSION.md
    const fetchVersion = async () => {
      try {
        const response = await fetch('/VERSION.md');
        if (response.ok) {
          const text = await response.text();
          // Extraire la version du fichier markdown
          const versionMatch = text.match(/## AgenticForge v(\d+\.\d+\.\d+)/);
          if (versionMatch) {
            setVersion(versionMatch[1]);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la version:', error);
      }
    };

    fetchVersion();
  }, []);

  if (!version) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
      v{version}
    </div>
  );
}