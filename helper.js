/*
  All helper fn

  TODO:
  [ ] 
*/

/**
 * Compares two strings using the Dice Coefficient based on bigrams
 * and returns true if their similarity is greater than or equal to the given threshold.
 *
 * @param {string} text1 - The first string to compare.
 * @param {string} text2 - The second string to compare.
 * @param {number} [threshold=0.7] - Similarity threshold (0 to 1), default is 0.7.
 * @returns {boolean} True if similarity >= threshold, otherwise false.
 */
export const similarity = (text1, text2, threshold = 0.7) => {
    function bigrams(str) {
        if (!str) return;
        const s = str.toLowerCase();
        const pairs = [];
        for (let i = 0; i < s.length - 1; i++) {
            pairs.push(s.substring(i, i + 2));
        }
        return pairs;
    }

    function diceCoefficient(str1, str2) {
        const pairs1 = bigrams(str1);
        const pairs2 = bigrams(str2);
        const set2 = new Set(pairs2);

        let intersection = 0;
        pairs1.forEach((pair) => {
            if (set2.has(pair)) {
                intersection++;
                set2.delete(pair); // avoid double counting
            }
        });

        return (2.0 * intersection) / (pairs1.length + pairs2.length);
    }

    return diceCoefficient(text1, text2) >= threshold;
};

/**
 * Groups similar names from the input array using a similarity threshold,
 * and returns the most common group with aggregated names and sources.
 *
 * @param {Array<{ name: string, source: string }>} arr - Array of objects with `name` and `source` fields.
 * @param {number} [threshold=0.7] - Similarity threshold (0 to 1), default is 0.7.
 * @returns {{ names: string[], sources: string[] } | null} - The most common group of similar names and their sources, or null if no match found.
 */
export const mostCommon = (arr, threshold = 0.7) => {
    if (!arr.length) return null;

    const groups = [];

    for (const { name, source } of arr) {
        let found = false;

        for (const group of groups) {
            // console.log(group);
            if (similarity(name, group.representative, threshold)) {
                // Avoid adding duplicate sources
                if (!group.sources.includes(source)) {
                    group.sources.push(source);
                }
                if (!group.names.includes(name)) {
                    group.names.push(name);
                }
                found = true;
                break;
            }
        }

        if (!found) {
            groups.push({
                representative: name,
                names: [name],
                sources: [source],
            });
        }
    }

    // Find the largest group
    const bestGroup = groups.reduce((a, b) => (b.names.length > a.names.length ? b : a), groups[0]);

    if (bestGroup.names.length <= 1) return null;

    return {
        names: bestGroup.names, // array of similar names (preserve variants)
        sources: bestGroup.sources, // matched sources like 'nominatim', 'overpass_0'
    };
};
