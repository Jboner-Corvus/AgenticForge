#!/usr/bin/env tsx

/**
 * Script de test pour les outils de préférences de développement
 *
 * Ce script teste les nouveaux outils set_development_preferences et get_development_preferences
 * pour s'assurer qu'ils fonctionnent correctement.
 */

import { setDevelopmentPreferencesTool } from './src/modules/tools/definitions/system/setDevelopmentPreferences.tool.ts';
import { getDevelopmentPreferencesTool } from './src/modules/tools/definitions/system/getDevelopmentPreferences.tool.ts';

// Contexte de test simulé
const mockContext: any = {
  job: {
    session: {
      metadata: {},
    },
  },
  log: {
    info: console.log,
    error: console.error,
  },
};

async function runTests() {
  console.log(
    '🚀 Démarrage des tests pour les outils de préférences de développement\n',
  );

  try {
    // Test 1: Définir les préférences pour les jeux
    console.log('📝 Test 1: Définition des préférences pour les jeux');
    const setGamePrefsResult = await setDevelopmentPreferencesTool.execute(
      {
        projectType: 'game',
        preferredTechnologies: {
          framework: 'PixiJS',
          language: 'TypeScript',
        },
        instructions:
          'Utiliser les meilleures pratiques de développement de jeux 2D',
      },
      mockContext,
    );

    console.log('✅ Résultat:', setGamePrefsResult);

    // Test 2: Définir les préférences pour les sites web
    console.log('\n📝 Test 2: Définition des préférences pour les sites web');
    const setWebPrefsResult = await setDevelopmentPreferencesTool.execute(
      {
        projectType: 'website',
        preferredTechnologies: {
          framework: 'React',
          language: 'TypeScript',
          styling: 'Tailwind CSS',
        },
        instructions:
          'Utiliser React avec TypeScript et Tailwind CSS pour tous les sites web',
      },
      mockContext,
    );

    console.log('✅ Résultat:', setWebPrefsResult);

    // Test 3: Récupérer les préférences pour les jeux
    console.log('\n📝 Test 3: Récupération des préférences pour les jeux');
    const getGamePrefsResult = await getDevelopmentPreferencesTool.execute(
      {
        projectType: 'game',
      },
      mockContext,
    );

    console.log('✅ Résultat:', getGamePrefsResult);

    // Test 4: Récupérer les préférences pour les sites web
    console.log('\n📝 Test 4: Récupération des préférences pour les sites web');
    const getWebPrefsResult = await getDevelopmentPreferencesTool.execute(
      {
        projectType: 'website',
      },
      mockContext,
    );

    console.log('✅ Résultat:', getWebPrefsResult);

    // Test 5: Récupérer toutes les préférences
    console.log('\n📝 Test 5: Récupération de toutes les préférences');
    const getAllPrefsResult = await getDevelopmentPreferencesTool.execute(
      {},
      mockContext,
    );

    console.log('✅ Résultat:', getAllPrefsResult);

    // Test 6: Récupérer les préférences pour un type non défini
    console.log(
      '\n📝 Test 6: Récupération des préférences pour un type non défini (api)',
    );
    const getApiPrefsResult = await getDevelopmentPreferencesTool.execute(
      {
        projectType: 'api',
      },
      mockContext,
    );

    console.log('✅ Résultat:', getApiPrefsResult);

    console.log('\n🎉 Tous les tests ont été exécutés avec succès!');
  } catch (error) {
    console.error("❌ Erreur lors de l'exécution des tests:", error);
    process.exit(1);
  }
}

// Exécuter les tests
runTests().catch(console.error);
