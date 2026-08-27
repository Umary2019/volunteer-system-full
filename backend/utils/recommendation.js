/**
 * Rule-based program recommendation - only affects display prominence/ordering.
 * Never restricts which programs a volunteer can apply to.
 */
const relevanceScoreForProgram = (volunteerProfile, program) => {
  let score = 0;
  const interests = (volunteerProfile.areasOfInterest || []).map((i) => i.toLowerCase());
  const categoryLower = (program.category || '').toLowerCase();
  const titleLower = (program.title || '').toLowerCase();
  const departmentLower = (volunteerProfile.department || '').toLowerCase();
  const facultyLower = (volunteerProfile.faculty || '').toLowerCase();

  interests.forEach((interest) => {
    if (categoryLower.includes(interest) || titleLower.includes(interest)) {
      score += 3;
    }
  });

  if (categoryLower.includes(departmentLower) || departmentLower.includes(categoryLower)) {
    score += 2;
  }
  if (categoryLower.includes(facultyLower) || facultyLower.includes(categoryLower)) {
    score += 1;
  }

  // Slight boost for programs similar to ones the volunteer previously participated in
  if (
    volunteerProfile.previousVolunteerParticipation &&
    titleLower &&
    volunteerProfile.previousVolunteerParticipation.toLowerCase().includes(titleLower)
  ) {
    score += 1;
  }

  return score;
};

/**
 * Sorts programs for a given volunteer by relevance score (descending).
 * All programs are still included and applicable - this only affects ordering.
 */
const sortProgramsByRelevance = (programs, volunteerProfile) => {
  return [...programs]
    .map((program) => ({
      program,
      relevance: relevanceScoreForProgram(volunteerProfile, program),
    }))
    .sort((a, b) => b.relevance - a.relevance)
    .map((entry) => entry.program);
};

module.exports = { relevanceScoreForProgram, sortProgramsByRelevance };
