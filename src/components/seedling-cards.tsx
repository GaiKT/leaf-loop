import { AlarmClock, LayoutGrid, Leaf, Shovel, Sprout } from "lucide-react";
import Link from "next/link";
import { Meta } from "@/components/meta";
import { daysBetween, formatThaiDate, type IsoDate } from "@/lib/dates";
import { formatCount } from "@/lib/format";
import type { Seedling } from "@/lib/seedlings";

const STAGES = [
  { stage: "GERMINATION", title: "ถาดเพาะ", Icon: LayoutGrid },
  { stage: "NURSERY", title: "อนุบาล", Icon: Leaf },
] as const;

function Row({ seedling, name, today }: { seedling: Seedling; name: string; today: IsoDate }) {
  const toNursery = daysBetween(today, seedling.nurseryFrom);
  const toTransplant = daysBetween(today, seedling.transplantDate);
  return (
    <li className="py-2">
      <p className="font-medium">
        <Link href={`/batches/${seedling.batchId}`} className="link link-primary">
          {name}
        </Link>{" "}
        · {formatCount(seedling.plants)} ต้น
      </p>
      <p className="flex flex-wrap items-center gap-x-3 text-sm text-soft">
        <Meta icon={Sprout} label="เพาะ">
          {formatThaiDate(seedling.sowDate)}
        </Meta>
        {seedling.stage === "GERMINATION" ? (
          <Meta icon={Leaf} label="ลงอนุบาลอีก">
            {toNursery} วัน
          </Meta>
        ) : seedling.kept ? (
          <span>เหลือจากการย้ายปลูก</span>
        ) : seedling.late ? (
          <Meta icon={AlarmClock} tone="error" label="เลยกำหนดย้ายปลูก">
            {-toTransplant} วัน
          </Meta>
        ) : (
          <Meta icon={Shovel} label="ย้ายปลูก">
            {toTransplant === 0 ? "วันนี้" : `อีก ${toTransplant} วัน`}
          </Meta>
        )}
      </p>
      {!seedling.kept && (
        <p className="text-sm text-soft">คาดว่าย้ายได้ {formatCount(seedling.expectedPlants)} ต้น</p>
      )}
    </li>
  );
}

/** What is still in the sowing tray and the nursery, by stage, with the seedling count of each. */
export function SeedlingCards({
  seedlings,
  names,
  today,
}: {
  seedlings: Seedling[];
  names: Map<string, string>;
  today: IsoDate;
}) {
  if (seedlings.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-soft">ต้นกล้า</h2>
      {STAGES.map(({ stage, title, Icon }) => {
        const rows = seedlings.filter((s) => s.stage === stage);
        if (rows.length === 0) return null;
        const total = rows.reduce((sum, s) => sum + s.plants, 0);
        return (
          <div key={stage} className="card bg-base-100">
            <div className="card-body gap-1 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="inline-flex items-center gap-2 font-semibold">
                  <Icon aria-hidden="true" className="size-5 text-primary" strokeWidth={1.8} />
                  {title}
                </h3>
                <p className="text-sm">
                  <span className="font-semibold">{formatCount(total)}</span> ต้น
                </p>
              </div>
              <ul className="divide-y divide-base-300">
                {rows.map((seedling) => (
                  <Row key={seedling.batchId} seedling={seedling} name={names.get(seedling.varietyId) ?? ""} today={today} />
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </section>
  );
}
