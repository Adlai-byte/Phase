import { prisma } from "@/lib/prisma";

type DepositInput = {
  tenantId: string;
  boardingHouseId: string;
  amount: number;
  datePaid: Date;
  conditions?: string;
  notes?: string;
};

export async function createDeposit(input: DepositInput) {
  return prisma.deposit.create({
    data: {
      amount: input.amount,
      datePaid: input.datePaid,
      conditions: input.conditions || null,
      notes: input.notes || null,
      refundStatus: "HELD",
      tenantId: input.tenantId,
      boardingHouseId: input.boardingHouseId,
    },
  });
}

export async function getDepositsByTenant(tenantId: string) {
  return prisma.deposit.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function refundDeposit(depositId: string, refundAmount: number, reason: string) {
  const deposit = await prisma.deposit.findUnique({ where: { id: depositId } });
  if (!deposit) return { success: false as const, error: "Deposit not found" };

  if (deposit.refundStatus === "FULLY_REFUNDED" || deposit.refundStatus === "FORFEITED") {
    return { success: false as const, error: "Deposit already settled" };
  }

  const alreadyRefunded = deposit.refundAmount || 0;
  const remaining = deposit.amount - alreadyRefunded;

  if (refundAmount > remaining) {
    return { success: false as const, error: `Refund amount exceeds remaining balance (${remaining})` };
  }

  const newTotal = alreadyRefunded + refundAmount;
  const status = newTotal >= deposit.amount ? "FULLY_REFUNDED" : "PARTIALLY_REFUNDED";

  const updated = await prisma.deposit.update({
    where: { id: depositId },
    data: {
      refundStatus: status,
      refundAmount: newTotal,
      refundDate: new Date(),
      refundReason: reason,
    },
  });

  return { success: true as const, deposit: updated };
}
