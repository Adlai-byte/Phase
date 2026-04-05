import { prisma } from "@/lib/prisma";

type AuditInput = {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
};

export async function createAuditEntry(input: AuditInput) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entityType: input.entityType || null,
      entityId: input.entityId || null,
      details: input.details || null,
      ipAddress: input.ipAddress || null,
    },
  });
}

export async function getAuditLogs(filters: {
  userId?: string;
  action?: string;
  entityType?: string;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = filters.action;
  if (filters.entityType) where.entityType = filters.entityType;

  return prisma.auditLog.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: filters.limit || 50,
  });
}
