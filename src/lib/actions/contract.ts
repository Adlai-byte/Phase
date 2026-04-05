import { prisma } from "@/lib/prisma";

type ContractInput = {
  tenantId: string;
  boardingHouseId: string;
  startDate: Date;
  endDate: Date;
  monthlyRate: number;
  depositAmount?: number;
  terms?: string;
  notes?: string;
};

export async function createContract(input: ContractInput) {
  if (input.endDate <= input.startDate) {
    throw new Error("End date must be after start date");
  }

  return prisma.contract.create({
    data: {
      startDate: input.startDate,
      endDate: input.endDate,
      monthlyRate: input.monthlyRate,
      depositAmount: input.depositAmount || null,
      terms: input.terms || null,
      notes: input.notes || null,
      status: "DRAFT",
      tenantId: input.tenantId,
      boardingHouseId: input.boardingHouseId,
    },
  });
}

export async function getContractsByTenant(tenantId: string) {
  return prisma.contract.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getContractsByHouse(boardingHouseId: string) {
  return prisma.contract.findMany({
    where: { boardingHouseId },
    include: { tenant: { select: { id: true, name: true, email: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function signContract(contractId: string, party: "OWNER" | "TENANT") {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) throw new Error("Contract not found");

  if (contract.status !== "DRAFT") {
    throw new Error(`Cannot sign a contract in ${contract.status} status`);
  }

  const data: Record<string, unknown> = {};
  if (party === "OWNER") data.signedByOwner = true;
  if (party === "TENANT") data.signedByTenant = true;

  // Check if both will have signed after this update
  const willBothSign =
    (party === "OWNER" && contract.signedByTenant) ||
    (party === "TENANT" && contract.signedByOwner) ||
    (party === "OWNER" && (data.signedByTenant as boolean));

  if (willBothSign) {
    data.status = "ACTIVE";
    data.signedDate = new Date();
  }

  return prisma.contract.update({
    where: { id: contractId },
    data,
  });
}

const validTransitions: Record<string, string[]> = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["EXPIRED", "TERMINATED"],
  EXPIRED: [],
  TERMINATED: [],
};

export async function updateContractStatus(contractId: string, newStatus: string) {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) return { success: false as const, error: "Contract not found" };

  const allowed = validTransitions[contract.status] || [];
  if (!allowed.includes(newStatus)) {
    return { success: false as const, error: `Cannot transition from ${contract.status} to ${newStatus}` };
  }

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: { status: newStatus },
  });

  return { success: true as const, contract: updated };
}
