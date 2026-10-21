import { cache } from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// The signed-in Grower, or null. Checks the database so a deleted Grower's old session stops working.
export const getCurrentGrower = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.grower.findUnique({
    where: { id: session.user.id },
    include: { farm: true },
  });
});

export async function hasAnyGrower() {
  return (await db.grower.count()) > 0;
}
