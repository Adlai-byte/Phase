import { prisma } from "@/lib/prisma";

type TicketInput = {
  userId: string;
  subject: string;
  message: string;
  priority?: string;
};

export async function createSupportTicket(input: TicketInput) {
  return prisma.supportTicket.create({
    data: {
      userId: input.userId,
      subject: input.subject,
      message: input.message,
      priority: input.priority || "NORMAL",
      status: "OPEN",
    },
  });
}

export async function getTickets(filters: { status?: string }) {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;

  return prisma.supportTicket.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTicketsByUser(userId: string) {
  return prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function resolveTicket(ticketId: string, response: string) {
  return prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: "RESOLVED", response, resolvedAt: new Date() },
  });
}
