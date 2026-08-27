/**
 * Rule-based applicant ranking - decision support ONLY.
 * Does not approve or reject anyone; the organizer makes the final call.
 *
 * Score factors (weights are simple and transparent, no ML):
 * - volunteer rating (0-5)              -> 40%
 * - attendance rate (0-100%)            -> 30%
 * - programs completed (experience)     -> 15%
 * - relevance: department/faculty/interest match with program category -> 15%
 */
const scoreApplicant = (volunteerProfile, program) => {
  const ratingScore = (volunteerProfile.overallRating / 5) * 40;
  const attendanceScore = (volunteerProfile.attendanceRate / 100) * 30;

  const experienceScore = Math.min(volunteerProfile.programsCompleted / 10, 1) * 15;

  let relevanceScore = 0;
  const interests = (volunteerProfile.areasOfInterest || []).map((i) => i.toLowerCase());
  const categoryLower = (program.category || '').toLowerCase();
  const departmentLower = (volunteerProfile.department || '').toLowerCase();

  if (interests.some((i) => categoryLower.includes(i) || i.includes(categoryLower))) {
    relevanceScore += 10;
  }
  if (categoryLower.includes(departmentLower) || departmentLower.includes(categoryLower)) {
    relevanceScore += 5;
  }
  relevanceScore = Math.min(relevanceScore, 15);

  const total = ratingScore + attendanceScore + experienceScore + relevanceScore;
  return Math.round(total * 100) / 100;
};

/**
 * Ranks a list of { application, volunteerProfile } pairs for a given program.
 * Returns them sorted by score descending, with rank + score attached.
 * This is purely informational output for the organizer's UI.
 */
const rankApplicants = (applicantEntries, program) => {
  const scored = applicantEntries.map((entry) => ({
    ...entry,
    score: scoreApplicant(entry.volunteerProfile, program),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.map((entry, index) => ({ ...entry, rank: index + 1 }));
};

module.exports = { scoreApplicant, rankApplicants };
