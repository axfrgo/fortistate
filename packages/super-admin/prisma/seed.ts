import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Organizations
  const org1 = await prisma.organization.create({
    data: {
      name: 'TechCorp',
      slug: 'techcorp',
      plan: 'enterprise',
      status: 'active',
      mrr: 24999,
      userCount: 45,
      universeCount: 892,
      totalApiCalls: 1250000,
      totalAiCalls: 450000,
      totalCost: 4250.50,
    },
  });

  const org2 = await prisma.organization.create({
    data: {
      name: 'StartupCo',
      slug: 'startupco',
      plan: 'pro',
      status: 'active',
      mrr: 4999,
      userCount: 12,
      universeCount: 234,
      totalApiCalls: 350000,
      totalAiCalls: 125000,
      totalCost: 1250.25,
    },
  });

  const org3 = await prisma.organization.create({
    data: {
      name: 'InnovateLabs',
      slug: 'innovatelabs',
      plan: 'pro',
      status: 'active',
      mrr: 4999,
      userCount: 8,
      universeCount: 156,
      totalApiCalls: 275000,
      totalAiCalls: 95000,
      totalCost: 925.75,
    },
  });

  const org4 = await prisma.organization.create({
    data: {
      name: 'MegaEnterprise',
      slug: 'megaenterprise',
      plan: 'enterprise',
      status: 'active',
      mrr: 0,
      userCount: 67,
      universeCount: 1450,
      totalApiCalls: 2100000,
      totalAiCalls: 750000,
      totalCost: 0,
    },
  });

  console.log('✅ Created 4 organizations');

  // Create Users
  const users = [];
  
  users.push(await prisma.user.create({
    data: {
      email: 'john@techcorp.com',
      name: 'John Smith',
      organizationId: org1.id,
      role: 'owner',
      plan: 'enterprise',
      status: 'active',
      totalApiCalls: 425000,
      totalAiCalls: 150000,
      totalCost: 1416.83,
    },
  }));

  users.push(await prisma.user.create({
    data: {
      email: 'sarah@startupco.com',
      name: 'Sarah Johnson',
      organizationId: org2.id,
      role: 'owner',
      plan: 'pro',
      status: 'active',
      totalApiCalls: 150000,
      totalAiCalls: 52500,
      totalCost: 525.10,
    },
  }));

  users.push(await prisma.user.create({
    data: {
      email: 'mike@innovatelabs.com',
      name: 'Mike Chen',
      organizationId: org3.id,
      role: 'admin',
      plan: 'pro',
      status: 'active',
      totalApiCalls: 125000,
      totalAiCalls: 43750,
      totalCost: 437.50,
    },
  }));

  users.push(await prisma.user.create({
    data: {
      email: 'abuse@example.com',
      name: 'Suspicious User',
      organizationId: org4.id,
      role: 'developer',
      plan: 'free',
      status: 'suspended',
      isAbuser: true,
      abuseScore: 87,
      totalApiCalls: 950000,
      totalAiCalls: 0,
      totalCost: 0,
      suspendedAt: new Date('2024-10-01'),
      suspendedBy: 'auto-abuse-detection',
      suspensionReason: 'Excessive API calls, SQL injection attempts',
    },
  }));

  console.log(`✅ Created ${users.length} users`);

  // Create Universes
  const universes = [
    {
      name: 'prod-api-v1',
      organizationId: org1.id,
      status: 'running',
      stateSize: 2450000,
      storeCount: 120,
      lawCount: 45,
      eventCount: 892000,
      violationCount: 0,
      totalApiCalls: 425000,
    },
    {
      name: 'staging-env',
      organizationId: org1.id,
      status: 'running',
      stateSize: 1200000,
      storeCount: 80,
      lawCount: 32,
      eventCount: 445000,
      violationCount: 2,
      totalApiCalls: 156000,
    },
    {
      name: 'game-world-alpha',
      organizationId: org2.id,
      status: 'running',
      stateSize: 8900000,
      storeCount: 450,
      lawCount: 128,
      eventCount: 3200000,
      violationCount: 1,
      totalApiCalls: 892000,
    },
    {
      name: 'test-universe',
      organizationId: org2.id,
      status: 'stopped',
      stateSize: 125000,
      storeCount: 15,
      lawCount: 8,
      eventCount: 12000,
      violationCount: 0,
      totalApiCalls: 8500,
    },
    {
      name: 'physics-sim',
      organizationId: org3.id,
      status: 'running',
      stateSize: 4200000,
      storeCount: 220,
      lawCount: 67,
      eventCount: 1800000,
      violationCount: 0,
      totalApiCalls: 540000,
    },
  ];

  for (const universeData of universes) {
    await prisma.universe.create({ data: universeData });
  }

  console.log(`✅ Created ${universes.length} universes`);

  // Create AI Usage records
  const aiUsage = [
    {
      userId: users[0].id,
      organizationId: org1.id,
      model: 'gpt-4',
      promptTokens: 125000,
      completionTokens: 87500,
      totalTokens: 212500,
      cost: 1562.50,
      requestType: 'universe_generation',
    },
    {
      userId: users[0].id,
      organizationId: org1.id,
      model: 'gpt-3.5-turbo',
      promptTokens: 325000,
      completionTokens: 228000,
      totalTokens: 553000,
      cost: 325.00,
      requestType: 'law_suggestion',
    },
    {
      userId: users[1].id,
      organizationId: org2.id,
      model: 'gpt-4',
      promptTokens: 52500,
      completionTokens: 36750,
      totalTokens: 89250,
      cost: 656.25,
      requestType: 'universe_generation',
    },
    {
      userId: users[1].id,
      organizationId: org2.id,
      model: 'claude-3-sonnet',
      promptTokens: 72500,
      completionTokens: 50750,
      totalTokens: 123250,
      cost: 593.75,
      requestType: 'state_optimization',
    },
  ];

  for (const usage of aiUsage) {
    await prisma.aiUsage.create({ data: usage });
  }

  console.log(`✅ Created ${aiUsage.length} AI usage records`);

  // Create Abuse Events
  const abuseEvents = [
    {
      timestamp: new Date('2024-10-05T14:30:00Z'),
      userId: users[3].id,
      organizationId: org4.id,
      eventType: 'excessive_requests',
      severity: 'high',
      description: 'User made 10,000 requests in 5 minutes',
      ipAddress: '192.168.1.100',
      resolved: true,
      resolvedAt: new Date('2024-10-05T15:00:00Z'),
      resolvedBy: 'admin',
      action: 'suspended',
    },
    {
      timestamp: new Date('2024-10-05T16:45:00Z'),
      userId: users[3].id,
      organizationId: org4.id,
      eventType: 'sql_injection',
      severity: 'critical',
      description: 'SQL injection attempt detected in query parameters',
      ipAddress: '192.168.1.100',
      resolved: true,
      resolvedAt: new Date('2024-10-05T17:00:00Z'),
      resolvedBy: 'admin',
      action: 'banned',
    },
    {
      timestamp: new Date(),
      userId: users[0].id,
      organizationId: org1.id,
      eventType: 'rate_limit_warning',
      severity: 'medium',
      description: 'Approaching rate limit (85% usage)',
      ipAddress: '10.0.0.50',
      resolved: false,
    },
  ];

  for (const event of abuseEvents) {
    await prisma.abuseEvent.create({ data: event });
  }

  console.log(`✅ Created ${abuseEvents.length} abuse events`);

  // Create Feature Flags
  const featureFlags = [
    {
      name: 'multiverse_support',
      description: 'Enable multi-universe synchronization',
      enabled: true,
      rolloutPercent: 100,
      createdBy: 'admin',
    },
    {
      name: 'ai_copilot',
      description: 'AI-powered state suggestions',
      enabled: true,
      rolloutPercent: 50,
      targetUserIds: `${users[0].id},${users[1].id}`,
      targetOrgIds: `${org1.id},${org2.id}`,
      createdBy: 'admin',
    },
    {
      name: 'advanced_analytics',
      description: 'Advanced analytics dashboard',
      enabled: false,
      rolloutPercent: 0,
      createdBy: 'admin',
    },
    {
      name: 'quantum_state',
      description: 'Experimental quantum state management',
      enabled: true,
      rolloutPercent: 10,
      targetUserIds: users[2].id,
      targetOrgIds: org3.id,
      createdBy: 'admin',
    },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.create({ 
      data: {
        ...flag,
        targetUserIds: flag.targetUserIds || null,
        targetOrgIds: flag.targetOrgIds || null,
      } as any 
    });
  }

  console.log(`✅ Created ${featureFlags.length} feature flags`);

  // Create Audit Logs
  const auditLogs = [
    {
      timestamp: new Date('2024-10-05T10:00:00Z'),
      adminId: users[0].id,
      action: 'user_suspended',
      targetType: 'user',
      targetId: users[3].id,
      description: 'Suspended user due to abuse detection',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    },
    {
      timestamp: new Date('2024-10-05T11:30:00Z'),
      adminId: users[0].id,
      action: 'feature_enabled',
      targetType: 'system',
      targetId: 'multiverse_support',
      description: 'Enabled multiverse support feature flag',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    },
    {
      timestamp: new Date('2024-10-05T14:15:00Z'),
      adminId: users[1].id,
      action: 'org_created',
      targetType: 'organization',
      targetId: org2.id,
      description: 'Created new organization: StartupCo',
      ipAddress: '10.0.0.25',
      userAgent: 'Chrome/118.0',
    },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({ data: log });
  }

  console.log(`✅ Created ${auditLogs.length} audit logs`);

  // Create Deployments
  const deployments = [
    {
      service: 'core',
      version: 'v2.5.1',
      environment: 'production',
      status: 'success',
      deployedBy: 'admin',
      commitHash: 'a7b3c9d',
      releaseNotes: 'Bug fixes and performance improvements',
      duration: 245,
      timestamp: new Date('2024-10-05T09:00:00Z'),
    },
    {
      service: 'inspector',
      version: 'v2.5.0',
      environment: 'production',
      status: 'success',
      deployedBy: 'admin',
      commitHash: 'f2e8d1a',
      releaseNotes: 'New analytics dashboard',
      duration: 312,
      timestamp: new Date('2024-10-03T15:30:00Z'),
    },
    {
      service: 'core',
      version: 'v2.4.9',
      environment: 'production',
      status: 'failed',
      deployedBy: 'auto-deploy',
      commitHash: 'c9b2a4f',
      releaseNotes: 'Hotfix for critical bug',
      duration: 87,
      errorMessage: 'Database migration failed',
      timestamp: new Date('2024-10-02T11:00:00Z'),
    },
    {
      service: 'admin-dashboard',
      version: 'v2.5.2-beta',
      environment: 'staging',
      status: 'success',
      deployedBy: 'developer',
      commitHash: 'd4f7e2b',
      releaseNotes: 'Testing new features',
      duration: 156,
      timestamp: new Date(),
    },
  ];

  for (const deployment of deployments) {
    await prisma.deployment.create({ data: deployment });
  }

  console.log(`✅ Created ${deployments.length} deployments`);

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
