const fs = require('fs');
const path = require('path');

/**
 * Script pour appliquer automatiquement les utilitaires de test à tous les scripts
 */

const testFiles = [
    'test_canvas_website.cjs',
    'test_game_display.cjs',
    'test_tesla_stock.cjs'
];

// Modifications à appliquer
const modifications = [
    {
        find: /const { chromium } = require\('playwright'\);/,
        replace: "const { chromium } = require('playwright');\nconst { TestUtils } = require('./test_utils.cjs');"
    },
    {
        find: /constructor\(\) {\s*this\.browser = null;\s*this\.context = null;\s*this\.page = null;/gs,
        replace: `constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.testUtils = new TestUtils();
        this.testName = '${TEST_NAME}';`
    },
    {
        find: /async takeScreenshot\(name, description\) {\s*const timestamp = new Date\(\)\.toISOString\(\)\.replace\(/[,:\.]/g, '-'\);\s*const filename = [`'\w+_${timestamp}_\${name}\.png'\`];/gs,
        replace: `async takeScreenshot(name, description) {
        const filename = await this.testUtils.takeScreenshot(this.page, this.testName, description);

        if (filename) {
            this.metrics.screenshots.push({
                filename,
                name,
                description,
                timestamp: Date.now()
            });
        }

        return filename;`
    },
    {
        find: /(await this\.monitor\w+\(\);\s*const results = await this\.verify\w+Results\(\);\s*const finalAnalysis = await this\.performFinalAnalysis\(\);\s*)/gs,
        replace: `$1
            // Attendre un peu pour les logs et les afficher
            await this.testUtils.waitForLogsAndDisplay('recent', 2000);

            `
    },
    {
        find: /(console\.log\('\\\\n🎉 .*? TERMINÉ AVEC SUCCÈS !'\);\s*)/gs,
        replace: `$1
            // Afficher le résumé des screenshots
            this.testUtils.displayScreenshotsSummary(this.testName);

            `
    }
];

function applyModificationsToFile(filePath, testName) {
    console.log(`🔧 Traitement de ${filePath}...`);

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    modifications.forEach(mod => {
        let find = mod.find;
        let replace = mod.replace;

        if (find.source && find.source.includes('TEST_NAME')) {
            replace = replace.replace('${TEST_NAME}', testName);
            find = new RegExp(find.source.replace('\\${TEST_NAME}', testName), find.flags);
        }

        if (content.match(find)) {
            content = content.replace(find, replace);
            modified = true;
            console.log(`  ✅ Modification appliquée: ${find.source.substring(0, 50)}...`);
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  💾 ${filePath} mis à jour`);
    } else {
        console.log(`  ⚠️ Aucune modification nécessaire pour ${filePath}`);
    }
}

// Appliquer les modifications à tous les fichiers
console.log('🚀 Application des utilitaires de test à tous les scripts...');

testFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    const testName = path.basename(file, '.cjs');

    if (fs.existsSync(filePath)) {
        applyModificationsToFile(filePath, testName);
    } else {
        console.log(`❌ Fichier non trouvé: ${filePath}`);
    }
});

console.log('\n✅ Terminé ! Tous les scripts de test ont été mis à jour.');
console.log('\n📋 Modifications appliquées:');
console.log('  - Import de TestUtils');
console.log('  - Initialisation de testUtils et testName');
console.log('  - Utilisation de testUtils.takeScreenshot()');
console.log('  - Ajout de testUtils.waitForLogsAndDisplay()');
console.log('  - Ajout de testUtils.displayScreenshotsSummary()');
console.log('\n📸 Les screenshots seront maintenant sauvegardés dans test/screenshots/');
console.log('📝 Les logs worker seront affichés automatiquement à la fin de chaque test');