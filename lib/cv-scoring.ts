/**
 * Critères d'évaluation pour obtenir un score CV ≥ 75%
 * 
 * SYSTÈME DE SCORING INTELLIGENT
 * ==============================
 * 
 * 1. COMPÉTENCES TECHNIQUES (40 points max)
 *    - Correspondance exacte avec les compétences requises : +10 points par compétence
 *    - Compétences connexes/similaires : +5 points par compétence
 *    - Technologies modernes et demandées : +5 points bonus
 * 
 * 2. EXPÉRIENCE PROFESSIONNELLE (30 points max)
 *    - 0-1 an : 5 points
 *    - 1-3 ans : 15 points
 *    - 3-5 ans : 25 points
 *    - 5+ ans : 30 points
 *    - Expérience dans le même secteur : +5 points bonus
 * 
 * 3. FORMATION ET CERTIFICATIONS (15 points max)
 *    - Diplôme pertinent (Bac+3/5 en informatique) : 10 points
 *    - Certifications professionnelles : +3 points par certification
 *    - Formation continue récente : +2 points
 * 
 * 4. PROJETS ET RÉALISATIONS (10 points max)
 *    - Portfolio/GitHub actif : 5 points
 *    - Projets open source : +3 points
 *    - Projets d'entreprise significatifs : +2 points
 * 
 * 5. QUALITÉ DU CV (5 points max)
 *    - Structure claire et professionnelle : 3 points
 *    - Absence de fautes : 2 points
 * 
 * SEUILS DE QUALIFICATION :
 * - 85-100 points : Excellent candidat (★)
 * - 75-84 points : Qualifié pour le test technique
 * - 60-74 points : Profil intéressant mais non qualifié
 * - <60 points : Non qualifié
 * 
 * EXEMPLES CONCRETS :
 * 
 * Candidat A (Score: 82/100) ✅ QUALIFIÉ
 * - React, Node.js, TypeScript (3 compétences exactes) : 30 pts
 * - 4 ans d'expérience en développement web : 25 pts
 * - Master en informatique : 10 pts
 * - GitHub actif avec 20+ repos : 5 pts
 * - CV bien structuré : 5 pts
 * - Certifications AWS : 3 pts
 * - Projets open source : 3 pts
 * - Secteur e-commerce (même que l'offre) : 5 pts
 * 
 * Candidat B (Score: 68/100) ❌ NON QUALIFIÉ
 * - HTML, CSS, jQuery (1 compétence connexe) : 5 pts
 * - 2 ans d'expérience : 15 pts
 * - BTS informatique : 8 pts
 * - Quelques projets personnels : 3 pts
 * - CV correct : 4 pts
 * - Pas de certifications : 0 pt
 * - Secteur différent : 0 pt bonus
 */

export interface CVScoringCriteria {
  // Compétences techniques (40 points max)
  requiredSkillsMatch: number;      // 10 pts par compétence exacte
  relatedSkillsMatch: number;       // 5 pts par compétence connexe
  modernTechBonus: number;          // 5 pts bonus pour techs modernes
  
  // Expérience (30 points max)
  yearsOfExperience: number;        // Selon barème ci-dessus
  relevantSectorBonus: number;      // 5 pts si même secteur
  
  // Formation (15 points max)
  educationLevel: number;           // 10 pts pour diplôme pertinent
  certifications: number;           // 3 pts par certification
  continuousLearning: number;       // 2 pts pour formation récente
  
  // Projets (10 points max)
  portfolioQuality: number;         // 5 pts pour portfolio/GitHub
  openSourceContrib: number;        // 3 pts pour contributions
  significantProjects: number;      // 2 pts pour projets d'entreprise
  
  // Qualité CV (5 points max)
  cvStructure: number;              // 3 pts pour structure claire
  languageQuality: number;          // 2 pts sans fautes
}

export function calculateCVScore(criteria: CVScoringCriteria): number {
  const totalScore = 
    criteria.requiredSkillsMatch +
    criteria.relatedSkillsMatch +
    criteria.modernTechBonus +
    criteria.yearsOfExperience +
    criteria.relevantSectorBonus +
    criteria.educationLevel +
    criteria.certifications +
    criteria.continuousLearning +
    criteria.portfolioQuality +
    criteria.openSourceContrib +
    criteria.significantProjects +
    criteria.cvStructure +
    criteria.languageQuality;

  return Math.min(100, Math.max(0, totalScore));
}

export function getScoreCategory(score: number): {
  category: string;
  description: string;
  qualified: boolean;
  color: string;
} {
  if (score >= 85) {
    return {
      category: 'Excellent',
      description: 'Candidat exceptionnel avec toutes les compétences requises',
      qualified: true,
      color: 'text-green-600'
    };
  } else if (score >= 75) {
    return {
      category: 'Qualifié',
      description: 'Profil solide, qualifié pour le test technique',
      qualified: true,
      color: 'text-blue-600'
    };
  } else if (score >= 60) {
    return {
      category: 'Intéressant',
      description: 'Profil avec du potentiel mais ne répond pas aux critères minimums',
      qualified: false,
      color: 'text-orange-600'
    };
  } else {
    return {
      category: 'Non qualifié',
      description: 'Profil ne correspondant pas aux exigences du poste',
      qualified: false,
      color: 'text-red-600'
    };
  }
}

// Exemple d'utilisation dans l'analyse IA
export function simulateAIAnalysis(jobDescription: string, cvText: string): CVScoringCriteria {
  // Cette fonction simule l'analyse IA en extrayant des informations du CV
  // Dans un vrai système, ceci serait fait par l'IA (GPT-4, Claude, etc.)
  
  const requiredSkills = extractSkillsFromJobDescription(jobDescription);
  const cvSkills = extractSkillsFromCV(cvText);
  
  return {
    requiredSkillsMatch: calculateSkillsMatch(requiredSkills, cvSkills) * 10,
    relatedSkillsMatch: calculateRelatedSkills(requiredSkills, cvSkills) * 5,
    modernTechBonus: hasModernTech(cvSkills) ? 5 : 0,
    yearsOfExperience: extractExperienceYears(cvText),
    relevantSectorBonus: isRelevantSector(jobDescription, cvText) ? 5 : 0,
    educationLevel: extractEducationLevel(cvText),
    certifications: extractCertifications(cvText) * 3,
    continuousLearning: hasRecentLearning(cvText) ? 2 : 0,
    portfolioQuality: hasPortfolio(cvText) ? 5 : 0,
    openSourceContrib: hasOpenSource(cvText) ? 3 : 0,
    significantProjects: extractProjectsCount(cvText) * 2,
    cvStructure: evaluateStructure(cvText),
    languageQuality: evaluateLanguage(cvText)
  };
}

// Fonctions utilitaires (simplifiées pour l'exemple)
function extractSkillsFromJobDescription(description: string): string[] {
  const commonSkills = ['React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'SQL'];
  return commonSkills.filter(skill => 
    description.toLowerCase().includes(skill.toLowerCase())
  );
}

function extractSkillsFromCV(cvText: string): string[] {
  const commonSkills = ['React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'SQL', 'HTML', 'CSS'];
  return commonSkills.filter(skill => 
    cvText.toLowerCase().includes(skill.toLowerCase())
  );
}

function calculateSkillsMatch(required: string[], cvSkills: string[]): number {
  return required.filter(skill => cvSkills.includes(skill)).length;
}

function calculateRelatedSkills(required: string[], cvSkills: string[]): number {
  // Logique simplifiée pour les compétences connexes
  return Math.max(0, cvSkills.length - calculateSkillsMatch(required, cvSkills));
}

function hasModernTech(skills: string[]): boolean {
  const modernTechs = ['React', 'TypeScript', 'Node.js', 'Docker', 'Kubernetes'];
  return skills.some(skill => modernTechs.includes(skill));
}

function extractExperienceYears(cvText: string): number {
  // Simulation basée sur des mots-clés
  if (cvText.includes('5+ ans') || cvText.includes('senior')) return 30;
  if (cvText.includes('3-5 ans')) return 25;
  if (cvText.includes('1-3 ans')) return 15;
  return 5; // Junior
}

function isRelevantSector(jobDesc: string, cvText: string): boolean {
  const sectors = ['e-commerce', 'fintech', 'startup', 'web'];
  return sectors.some(sector => 
    jobDesc.toLowerCase().includes(sector) && cvText.toLowerCase().includes(sector)
  );
}

function extractEducationLevel(cvText: string): number {
  if (cvText.toLowerCase().includes('master') || cvText.toLowerCase().includes('ingénieur')) return 10;
  if (cvText.toLowerCase().includes('licence') || cvText.toLowerCase().includes('bachelor')) return 8;
  if (cvText.toLowerCase().includes('bts') || cvText.toLowerCase().includes('dut')) return 6;
  return 3;
}

function extractCertifications(cvText: string): number {
  const certKeywords = ['certification', 'certified', 'aws', 'google cloud', 'azure'];
  return certKeywords.filter(keyword => 
    cvText.toLowerCase().includes(keyword)
  ).length;
}

function hasRecentLearning(cvText: string): boolean {
  const learningKeywords = ['formation', 'cours', 'bootcamp', '2023', '2024'];
  return learningKeywords.some(keyword => 
    cvText.toLowerCase().includes(keyword)
  );
}

function hasPortfolio(cvText: string): boolean {
  return cvText.toLowerCase().includes('github') || 
         cvText.toLowerCase().includes('portfolio') ||
         cvText.toLowerCase().includes('projet');
}

function hasOpenSource(cvText: string): boolean {
  return cvText.toLowerCase().includes('open source') || 
         cvText.toLowerCase().includes('contribution') ||
         cvText.toLowerCase().includes('github');
}

function extractProjectsCount(cvText: string): number {
  const projectMatches = cvText.toLowerCase().match(/projet/g);
  return Math.min(5, projectMatches ? projectMatches.length : 0);
}

function evaluateStructure(cvText: string): number {
  // Évaluation simplifiée de la structure
  const hasHeaders = cvText.includes('Expérience') || cvText.includes('Formation');
  const hasContact = cvText.includes('@') || cvText.includes('tel');
  return (hasHeaders ? 2 : 0) + (hasContact ? 1 : 0);
}

function evaluateLanguage(cvText: string): number {
  // Évaluation simplifiée de la qualité linguistique
  const hasErrors = cvText.includes('erreur') || cvText.length < 100;
  return hasErrors ? 1 : 2;
}
