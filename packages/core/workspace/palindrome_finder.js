/**
 * Solution complète pour trouver le plus grand palindrome dans une chaîne de caractères
 * Implémente deux approches : O(n²) et O(n) (Manacher's algorithm)
 */

class PalindromeFinder {
    /**
     * APPROCHE O(n²) - Expand Around Center
     * 
     * Principe : Pour chaque caractère (et entre chaque paire), on étend vers l'extérieur
     * tant que les caractères sont identiques.
     * 
     * Complexité : O(n²) en temps, O(1) en espace
     * 
     * @param {string} s - La chaîne de caractères d'entrée
     * @returns {string} - Le plus grand palindrome trouvé
     */
    static longestPalindromeExpandAroundCenter(s) {
        if (!s || s.length < 1) return "";
        
        let start = 0, end = 0;
        
        for (let i = 0; i < s.length; i++) {
            // Cas 1 : palindrome de longueur impaire (centre sur un caractère)
            const len1 = this.expandAroundCenter(s, i, i);
            
            // Cas 2 : palindrome de longueur paire (centre entre deux caractères)
            const len2 = this.expandAroundCenter(s, i, i + 1);
            
            // On prend le plus long des deux
            const maxLen = Math.max(len1, len2);
            
            if (maxLen > end - start) {
                start = i - Math.floor((maxLen - 1) / 2);
                end = i + Math.floor(maxLen / 2);
            }
        }
        
        return s.substring(start, end + 1);
    }
    
    /**
     * Fonction utilitaire pour étendre autour d'un centre
     */
    static expandAroundCenter(s, left, right) {
        while (left >= 0 && right < s.length && s[left] === s[right]) {
            left--;
            right++;
        }
        return right - left - 1;
    }
    
    /**
     * APPROCHE OPTIMISÉE O(n) - Manacher's Algorithm
     * 
     * Principe : Utilise la symétrie des palindromes pour éviter les calculs redondants.
     * Transforme la chaîne pour gérer les palindromes de longueur paire et impaire uniformément.
     * 
     * Complexité : O(n) en temps, O(n) en espace
     * 
     * @param {string} s - La chaîne de caractères d'entrée
     * @returns {string} - Le plus grand palindrome trouvé
     */
    static longestPalindromeManacher(s) {
        if (!s || s.length < 1) return "";
        
        // Étape 1 : Transformer la chaîne
        // Ajoute des caractères spéciaux pour gérer uniformément les cas pairs/impairs
        // Exemple : "abba" -> "^#a#b#b#a#$"
        const transformed = this.transformString(s);
        
        const n = transformed.length;
        const palindromeRadii = new Array(n).fill(0);
        let center = 0;
        let rightBoundary = 0;
        
        for (let i = 1; i < n - 1; i++) {
            // Position miroir de i par rapport au centre
            const mirror = 2 * center - i;
            
            // Si i est dans la limite droite, on utilise la valeur du miroir
            if (i < rightBoundary) {
                palindromeRadii[i] = Math.min(rightBoundary - i, palindromeRadii[mirror]);
            }
            
            // Tente d'étendre le palindrome centré en i
            while (transformed[i + palindromeRadii[i] + 1] === 
                   transformed[i - palindromeRadii[i] - 1]) {
                palindromeRadii[i]++;
            }
            
            // Si le palindrome centré en i s'étend au-delà de rightBoundary,
            // on met à jour le centre et rightBoundary
            if (i + palindromeRadii[i] > rightBoundary) {
                center = i;
                rightBoundary = i + palindromeRadii[i];
            }
        }
        
        // Trouver le palindrome le plus long
        let maxLen = 0;
        let centerIndex = 0;
        for (let i = 1; i < n - 1; i++) {
            if (palindromeRadii[i] > maxLen) {
                maxLen = palindromeRadii[i];
                centerIndex = i;
            }
        }
        
        // Retourner le palindrome original
        const start = Math.floor((centerIndex - maxLen) / 2);
        return s.substring(start, start + maxLen);
    }
    
    /**
     * Transforme la chaîne pour Manacher's algorithm
     */
    static transformString(s) {
        let transformed = "^";
        for (let char of s) {
            transformed += `#${char}`;
        }
        transformed += "#$";
        return transformed;
    }
    
    /**
     * Fonction utilitaire pour tester les deux approches
     */
    static testBothApproaches(testString) {
        console.log(`\nTest avec: "${testString}"`);
        console.log("=".repeat(50));
        
        // Test approche O(n²)
        const start1 = performance.now();
        const result1 = this.longestPalindromeExpandAroundCenter(testString);
        const end1 = performance.now();
        console.log(`Approche O(n²) (Expand Around Center):`);
        console.log(`  Résultat: "${result1}"`);
        console.log(`  Temps: ${(end1 - start1).toFixed(4)}ms`);
        
        // Test approche O(n)
        const start2 = performance.now();
        const result2 = this.longestPalindromeManacher(testString);
        const end2 = performance.now();
        console.log(`Approche O(n) (Manacher's Algorithm):`);
        console.log(`  Résultat: "${result2}"`);
        console.log(`  Temps: ${(end2 - start2).toFixed(4)}ms`);
        
        // Vérification
        const areEqual = result1 === result2;
        console.log(`  Résultats identiques: ${areEqual ? '✅' : '❌'}`);
        
        return {
            expandAroundCenter: result1,
            manacher: result2,
            timeExpandAroundCenter: end1 - start1,
            timeManacher: end2 - start2
        };
    }
}

// Tests et exemples
function runTests() {
    console.log("🔍 RECHERCHE DU PLUS GRAND PALINDROME");
    console.log("=".repeat(60));
    
    const testCases = [
        "babad",
        "cbbd",
        "a",
        "ac",
        "racecar",
        "abacdfgdcaba",
        "abacdedcaba",
        "aaaa",
        "abccba",
        "forgeeksskeegfor"
    ];
    
    testCases.forEach(testCase => {
        PalindromeFinder.testBothApproaches(testCase);
    });
    
    // Test de performance avec une chaîne plus longue
    console.log("\n🚀 TEST DE PERFORMANCE");
    console.log("=".repeat(60));
    
    const longString = "a".repeat(1000) + "b" + "a".repeat(1000);
    PalindromeFinder.testBothApproaches(longString);
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PalindromeFinder;
}

// Exécuter les tests si ce fichier est lancé directement
if (typeof window === 'undefined') {
    runTests();
}