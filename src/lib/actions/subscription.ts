import { prisma } from "@/lib/prisma";

type PlanLimits = {
  plan: string;
  maxRooms: number;
  maxTenants: number;
  emailSms: boolean;
  analytics: boolean;
};

type LimitCheck = {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
};

export async function getPlanLimits(ownerId: string): Promise<PlanLimits | null> {
  const sub = await prisma.subscription.findUnique({ where: { userId: ownerId } });
  if (!sub) return null;

  return {
    plan: sub.plan,
    maxRooms: sub.maxRooms,
    maxTenants: sub.maxTenants,
    emailSms: sub.emailSms,
    analytics: sub.analytics,
  };
}

export async function canCreateRoom(ownerId: string): Promise<LimitCheck> {
  const limits = await getPlanLimits(ownerId);
  if (!limits) return { allowed: false, reason: "No active subscription" };

  const houses = await prisma.boardingHouse.findMany({
    where: { ownerId },
    select: { id: true },
  });
  const houseIds = houses.map((h) => h.id);

  const currentRooms = await prisma.room.count({
    where: { boardingHouseId: { in: houseIds } },
  });

  if (currentRooms >= limits.maxRooms) {
    return {
      allowed: false,
      reason: `Room limit reached (${currentRooms}/${limits.maxRooms}). Please upgrade your plan.`,
      current: currentRooms,
      limit: limits.maxRooms,
    };
  }

  return { allowed: true, current: currentRooms, limit: limits.maxRooms };
}

export async function canCreateTenant(ownerId: string): Promise<LimitCheck> {
  const limits = await getPlanLimits(ownerId);
  if (!limits) return { allowed: false, reason: "No active subscription" };

  const houses = await prisma.boardingHouse.findMany({
    where: { ownerId },
    select: { id: true },
  });
  const houseIds = houses.map((h) => h.id);

  const currentTenants = await prisma.tenant.count({
    where: { boardingHouseId: { in: houseIds }, status: "ACTIVE" },
  });

  if (currentTenants >= limits.maxTenants) {
    return {
      allowed: false,
      reason: `Tenant limit reached (${currentTenants}/${limits.maxTenants}). Please upgrade your plan.`,
      current: currentTenants,
      limit: limits.maxTenants,
    };
  }

  return { allowed: true, current: currentTenants, limit: limits.maxTenants };
}

export async function canSendNotification(ownerId: string): Promise<LimitCheck> {
  const limits = await getPlanLimits(ownerId);
  if (!limits) return { allowed: false, reason: "No active subscription" };

  if (!limits.emailSms) {
    return {
      allowed: false,
      reason: "Email/SMS notifications require Professional or Enterprise plan. Please upgrade.",
    };
  }

  return { allowed: true };
}
