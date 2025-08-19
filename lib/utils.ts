import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format number (assumed in USD base units) into Indonesian Rupiah string.
// You can adjust the default exchangeRate to match real conversion or store amounts directly in IDR and set exchangeRate=1.
export function toIDR(amount: number, exchangeRate: number = 15000) {
  if (amount == null || isNaN(amount)) return "Rp 0";
  const idr = Math.round(amount * exchangeRate);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(idr);
}
