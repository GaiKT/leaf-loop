export function formatKg(kg: number) {
  return `${kg.toLocaleString("th-TH", { maximumFractionDigits: 3 })} กก.`;
}

export function formatCount(count: number) {
  return count.toLocaleString("th-TH");
}
