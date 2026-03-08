export interface Country {
  code: string;  // ISO 3166-1 alpha-2
  name: string;
  flag: string;  // emoji flag
}

export const COUNTRIES: Country[] = [
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "CU", name: "Cuba", flag: "🇨🇺" },
  { code: "DO", name: "República Dominicana", flag: "🇩🇴" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "PA", name: "Panamá", flag: "🇵🇦" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "PE", name: "Perú", flag: "🇵🇪" },
  { code: "PR", name: "Puerto Rico", flag: "🇵🇷" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "ES", name: "España", flag: "🇪🇸" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸" },
  { code: "CA", name: "Canadá", flag: "🇨🇦" },
  { code: "DE", name: "Alemania", flag: "🇩🇪" },
  { code: "FR", name: "Francia", flag: "🇫🇷" },
  { code: "IT", name: "Italia", flag: "🇮🇹" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "JP", name: "Japón", flag: "🇯🇵" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "ZA", name: "Sudáfrica", flag: "🇿🇦" },
  { code: "MA", name: "Marruecos", flag: "🇲🇦" },
  { code: "OTHER", name: "Otro", flag: "🌍" },
];

// Remove duplicates by code
const seen = new Set<string>();
export const UNIQUE_COUNTRIES = COUNTRIES.filter(c => {
  if (seen.has(c.code)) return false;
  seen.add(c.code);
  return true;
});

export function getCountryByCode(code: string): Country | undefined {
  return UNIQUE_COUNTRIES.find(c => c.code === code);
}

export function getCountryFlag(code: string): string {
  return getCountryByCode(code)?.flag ?? "🌍";
}
