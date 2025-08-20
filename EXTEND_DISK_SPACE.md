# Procédure pour étendre l'espace disque

## Problème identifié
L'espace disque est insuffisant :
- Volume logique `/dev/mapper/ubuntu--vg--1-ubuntu--lv` de 58,6 Go est plein à 100%
- Il reste environ 58,6 Go non alloués dans le groupe de volumes
- Cela empêche le bon fonctionnement de Docker et PostgreSQL

## Solution proposée
Étendre le volume logique pour utiliser tout l'espace disponible et redimensionner le système de fichiers.

## Étapes à exécuter

### 1. Étendre le volume logique
```bash
sudo lvextend -l +100%FREE /dev/ubuntu-vg-1/ubuntu-lv
```

### 2. Redimensionner le système de fichiers
```bash
sudo resize2fs /dev/ubuntu-vg-1/ubuntu-lv
```

## Vérification après exécution
Pour vérifier que l'opération a réussi :
```bash
df -h
```

Vous devriez voir que le système de fichiers `/` a maintenant une taille beaucoup plus grande.

## Redémarrage des services
Une fois l'espace disque libéré, redémarrez les services :
```bash
cd /home/demon/agentforge/AgenticForge2/AgenticForge
docker-compose down
docker-compose up -d
```

## Nettoyage optionnel
Pour libérer davantage d'espace, vous pouvez également exécuter :
```bash
docker system prune -a -f
```

Cela supprimera tous les conteneurs, images, volumes et réseaux Docker inutilisés.