import { useMemo } from 'react';

/**
 * Hook to determine if a thought should be prominently displayed based on its content
 * @param content The thought content to analyze
 * @returns Boolean indicating if the thought should be prominently displayed
 */
export const useThoughtHighlight = (content: string): boolean => {
  return useMemo(() => {
    if (!content) return false;

    // Keywords that indicate important thoughts
    const importantKeywords = [
      // Planning and strategy
      'plan',
      'strategy',
      'approach',
      'solution',
      'design',
      'architecture',
      'planning',
      'stratégie',
      'approche',
      'solution',
      'conception',
      'architecture',

      // Decision making
      'decision',
      'choose',
      'select',
      'decide',
      'option',
      'alternative',
      'décision',
      'choisir',
      'sélectionner',
      'décider',
      'option',
      'alternative',

      // Problem solving
      'problem',
      'issue',
      'challenge',
      'difficulty',
      'obstacle',
      'problème',
      'difficulté',
      'défi',
      'obstacle',

      // Important actions
      'important',
      'critical',
      'essential',
      'key',
      'crucial',
      'vital',
      'important',
      'critique',
      'essentiel',
      'clé',
      'crucial',
      'vital',

      // Progress indicators
      'step',
      'phase',
      'stage',
      'next',
      'finally',
      'ultimately',
      'étape',
      'phase',
      'ensuite',
      'finalement',
      'ultimement',
    ];

    // Check if content contains any important keywords
    const lowerContent = content.toLowerCase();
    return importantKeywords.some((keyword) =>
      lowerContent.includes(keyword.toLowerCase()),
    );
  }, [content]);
};
