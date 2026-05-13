const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with sample data...');

  // Clear existing data
  await prisma.finding.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.review.deleteMany();
  await prisma.rule.deleteMany();
  await prisma.repository.deleteMany();
  await prisma.user.deleteMany();

  // ============================================================================
  // CREATE USERS
  // ============================================================================

  const user1 = await prisma.user.create({
    data: {
      githubId: '12345678',
      email: 'alice@example.com',
      name: 'Alice Johnson',
      avatarUrl: 'https://avatars.githubusercontent.com/u/12345678?v=4',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      githubId: '87654321',
      email: 'bob@example.com',
      name: 'Bob Smith',
      avatarUrl: 'https://avatars.githubusercontent.com/u/87654321?v=4',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      githubId: '11111111',
      email: 'charlie@example.com',
      name: 'Charlie Brown',
      avatarUrl: 'https://avatars.githubusercontent.com/u/11111111?v=4',
    },
  });

  console.log('✅ Created 3 users');

  // ============================================================================
  // CREATE REPOSITORIES
  // ============================================================================

  const repo1 = await prisma.repository.create({
    data: {
      githubRepoId: 123456789,
      fullName: 'acme-corp/backend-api',
      owner: 'acme-corp',
      name: 'backend-api',
      installationId: 999111,
      webhookSecret: 'whsec_test_12345678901234567890',
      isActive: true,
      ownerId: user1.id,
    },
  });

  const repo2 = await prisma.repository.create({
    data: {
      githubRepoId: 987654321,
      fullName: 'acme-corp/web-frontend',
      owner: 'acme-corp',
      name: 'web-frontend',
      installationId: 999222,
      webhookSecret: 'whsec_test_98765432109876543210',
      isActive: true,
      ownerId: user1.id,
    },
  });

  const repo3 = await prisma.repository.create({
    data: {
      githubRepoId: 555555555,
      fullName: 'acme-corp/data-pipeline',
      owner: 'acme-corp',
      name: 'data-pipeline',
      installationId: 999333,
      webhookSecret: 'whsec_test_55555555555555555555',
      isActive: false,
      ownerId: user2.id,
    },
  });

  console.log('✅ Created 3 repositories');

  // ============================================================================
  // CREATE GLOBAL RULES
  // ============================================================================

  const sqlInjectionRule = await prisma.rule.create({
    data: {
      name: 'SQL Injection Detection',
      description: 'Detects potential SQL injection vulnerabilities in query strings',
      category: 'SECURITY',
      severity: 'CRITICAL',
      isEnabled: true,
      pattern: "SELECT\\s+.*\\s+FROM\\s+.*\\s+WHERE",
      repositoryId: null,
    },
  });

  const hardcodedSecretsRule = await prisma.rule.create({
    data: {
      name: 'Hardcoded Secrets',
      description: 'Flags hardcoded API keys and credentials',
      category: 'SECURITY',
      severity: 'CRITICAL',
      isEnabled: true,
      pattern: "(api[_-]?key|password|secret|token)\\s*=\\s*['\"]",
      repositoryId: null,
    },
  });

  const xssRule = await prisma.rule.create({
    data: {
      name: 'XSS Vulnerability',
      description: 'Detects potential Cross-Site Scripting vulnerabilities',
      category: 'SECURITY',
      severity: 'ERROR',
      isEnabled: true,
      pattern: "innerHTML\\s*=|dangerouslySetInnerHTML",
      repositoryId: null,
    },
  });

  const nPlusOneRule = await prisma.rule.create({
    data: {
      name: 'N+1 Query Pattern',
      description: 'Detects N+1 query patterns in loops',
      category: 'PERFORMANCE',
      severity: 'WARNING',
      isEnabled: true,
      pattern: null,
      repositoryId: null,
    },
  });

  const anyTypeRule = await prisma.rule.create({
    data: {
      name: 'Avoid TypeScript any Type',
      description: 'Flags usage of `any` type in TypeScript code',
      category: 'STYLE',
      severity: 'WARNING',
      isEnabled: true,
      pattern: ":\\s*any\\b",
      repositoryId: null,
    },
  });

  const consoleLogRule = await prisma.rule.create({
    data: {
      name: 'Console Statements',
      description: 'Detects console.log/warn/error statements that should be removed',
      category: 'STYLE',
      severity: 'INFO',
      isEnabled: true,
      pattern: "console\\.(log|warn|error|debug)\\s*\\(",
      repositoryId: null,
    },
  });

  console.log('✅ Created 6 global rules');

  // ============================================================================
  // CREATE REPO-SCOPED RULES (OVERRIDE)
  // ============================================================================

  const repoSpecificRule = await prisma.rule.create({
    data: {
      name: 'Strict console.log enforcement for this repo',
      description: 'This repo has zero tolerance for console statements',
      category: 'STYLE',
      severity: 'ERROR',
      isEnabled: true,
      pattern: "console\\.(log|warn|error|debug)\\s*\\(",
      repositoryId: repo1.id,
    },
  });

  console.log('✅ Created 1 repo-scoped rule');

  // ============================================================================
  // CREATE REVIEWS
  // ============================================================================

  const review1 = await prisma.review.create({
    data: {
      prNumber: 42,
      prTitle: 'Fix: Add validation to user registration endpoint',
      prUrl: 'https://github.com/acme-corp/backend-api/pull/42',
      headSha: 'abc1234567890def',
      baseSha: 'base1234567890abc',
      status: 'COMPLETED',
      summary: 'Found 2 issues: 1 security concern, 1 style issue',
      repositoryId: repo1.id,
      authorId: user2.id,
    },
  });

  const review2 = await prisma.review.create({
    data: {
      prNumber: 156,
      prTitle: 'Feature: Dark mode support',
      prUrl: 'https://github.com/acme-corp/web-frontend/pull/156',
      headSha: 'xyz9876543210abc',
      baseSha: 'base9876543210xyz',
      status: 'IN_PROGRESS',
      summary: null,
      repositoryId: repo2.id,
      authorId: user3.id,
    },
  });

  const review3 = await prisma.review.create({
    data: {
      prNumber: 89,
      prTitle: 'Refactor: Extract database utilities',
      prUrl: 'https://github.com/acme-corp/backend-api/pull/89',
      headSha: 'def4567890abc123',
      baseSha: 'base4567890abc123',
      status: 'PENDING',
      summary: null,
      repositoryId: repo1.id,
      authorId: user1.id,
    },
  });

  const review4 = await prisma.review.create({
    data: {
      prNumber: 45,
      prTitle: 'Chore: Update dependencies',
      prUrl: 'https://github.com/acme-corp/web-frontend/pull/45',
      headSha: 'ghi6789012345jkl',
      baseSha: 'baseghi6789012345',
      status: 'FAILED',
      summary: 'Analysis failed due to timeout',
      repositoryId: repo2.id,
      authorId: user2.id,
    },
  });

  console.log('✅ Created 4 reviews');

  // ============================================================================
  // CREATE FINDINGS FOR REVIEW 1
  // ============================================================================

  const finding1 = await prisma.finding.create({
    data: {
      filePath: 'src/routes/auth/register.ts',
      lineStart: 23,
      lineEnd: 28,
      severity: 'CRITICAL',
      category: 'SECURITY',
      message: 'Potential SQL injection: User input is concatenated into query without parameterization',
      suggestion:
        'Use parameterized queries with placeholders (e.g., $1, $2 in pg library) instead of string concatenation',
      reviewId: review1.id,
      ruleId: sqlInjectionRule.id,
    },
  });

  const finding2 = await prisma.finding.create({
    data: {
      filePath: 'src/routes/auth/register.ts',
      lineStart: 5,
      lineEnd: 5,
      severity: 'INFO',
      category: 'STYLE',
      message: 'Unnecessary console.log statement found in production code',
      suggestion: 'Remove console.log or use a proper logging library',
      reviewId: review1.id,
      ruleId: consoleLogRule.id,
    },
  });

  console.log('✅ Created 2 findings for review 1');

  // ============================================================================
  // CREATE FINDINGS FOR REVIEW 3 (PENDING - NO FINDINGS YET)
  // ============================================================================

  const finding3 = await prisma.finding.create({
    data: {
      filePath: 'src/utils/database.ts',
      lineStart: 45,
      lineEnd: 55,
      severity: 'WARNING',
      category: 'PERFORMANCE',
      message: 'Potential N+1 query pattern: User entity is queried inside a loop',
      suggestion:
        'Consider using JOIN or batch loading to fetch related users in a single query',
      reviewId: review3.id,
      ruleId: nPlusOneRule.id,
    },
  });

  const finding4 = await prisma.finding.create({
    data: {
      filePath: 'src/utils/helpers.ts',
      lineStart: 10,
      lineEnd: 10,
      severity: 'WARNING',
      category: 'STYLE',
      message: 'TypeScript type is too permissive',
      suggestion: 'Replace `any` with a more specific type (e.g., `Record<string, unknown>`)',
      reviewId: review3.id,
      ruleId: anyTypeRule.id,
    },
  });

  console.log('✅ Created 2 findings for review 3');

  // ============================================================================
  // CREATE TEAM MEMBERS
  // ============================================================================

  await prisma.teamMember.create({
    data: {
      role: 'ADMIN',
      userId: user1.id,
      repositoryId: repo1.id,
    },
  });

  await prisma.teamMember.create({
    data: {
      role: 'MEMBER',
      userId: user2.id,
      repositoryId: repo1.id,
    },
  });

  await prisma.teamMember.create({
    data: {
      role: 'VIEWER',
      userId: user3.id,
      repositoryId: repo1.id,
    },
  });

  await prisma.teamMember.create({
    data: {
      role: 'ADMIN',
      userId: user1.id,
      repositoryId: repo2.id,
    },
  });

  await prisma.teamMember.create({
    data: {
      role: 'MEMBER',
      userId: user3.id,
      repositoryId: repo2.id,
    },
  });

  await prisma.teamMember.create({
    data: {
      role: 'ADMIN',
      userId: user2.id,
      repositoryId: repo3.id,
    },
  });

  console.log('✅ Created team members with roles');

  console.log('\n✨ Seeding complete! Summary:');
  console.log(`   - Users: 3`);
  console.log(`   - Repositories: 3`);
  console.log(`   - Global Rules: 6`);
  console.log(`   - Repo-scoped Rules: 1`);
  console.log(`   - Reviews: 4`);
  console.log(`   - Findings: 4`);
  console.log(`   - Team Members: 6`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
