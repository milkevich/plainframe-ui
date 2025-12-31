export type Scale = {
  0: string; 50: string; 100: string; 200: string; 300: string; 400: string;
  500: string; 600: string; 700: string; 800: string; 900: string;
};

export type PlainframeUITheme = {
  spacing: Record<"xxs"|"xs"|"sm"|"md"|"lg"|"xl", string|number> & Record<string, string|number>;
  radius: Record<"xxs"|"xs"|"sm"|"md"|"lg"|"xl"|"full", string|number> & Record<string, string|number>;
  componentHeights: Record<"sm"|"md"|"lg"|"border", string|number> & Record<string, string|number>;
  typography: {
    fonts: { sans: string; mono: string };
    sizes: Record<"xs"|"sm"|"md"|"lg"|"xl"|"2xl"|"3xl"|"4xl"|"5xl"|"6xl", string|number> & Record<string, string|number>;
  };
  palette: Record<string, Scale>;
  neutral: Scale;
  surface: {
    appBg: string; panelBg: string; subtleBg: string;
    panelHover: string; subtleHover: string; overlayBg: string; border: string;
  };
  text: { primary: string; secondary: string; muted: string; onColors: Record<string, string> };
};

export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export type PartialTheme = DeepPartial<PlainframeUITheme>;

export type Mode = "light" | "dark";

const spacing = { xxs:"0.15rem", xs:"0.25rem", sm:"0.5rem", md:"0.75rem", lg:"1rem", xl:"1.5rem" };
const radius = { xxs:"0.3rem", xs:"0.4rem", sm:"0.6rem", md:"0.7rem", lg:"1rem", xl:"2rem", full:"9999px" };
const componentHeights = { sm:32, md:36, lg:40, border:"1px" };
const typography = {
  fonts: {
    sans: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  },
  sizes: { xs:"12px", sm:"14px", md:"16px", lg:"18px", xl:"20px", "2xl":"24px", "3xl":"30px", "4xl":"36px", "5xl":"48px", "6xl":"60px" },
};

const neutralLight: Scale = {
  0:"#ffffff",50:"#f9f9f9",100:"#f5f5f5",200:"#eeeeee",300:"#e5e5e5",
  400:"#d7d7d7ff",500:"#b3b3b3",600:"#737373",700:"#4a4a4a",800:"#2b2b2b",900:"#111111",
};
const neutralDark: Scale = {
  0:"#050505",50:"#121212",100:"#1a1a1a",200:"#222222",300:"#2b2b2b",
  400:"#333333",500:"#444444",600:"#6e6e6e",700:"#a6a6a6",800:"#e5e5e5",900:"#ffffff",
};

const paletteLight = {
  mono:{0:"#FFFFFF",50:"#FAFAFA",100:"#F2F2F2",200:"#E6E6E6",300:"#D1D1D1",400:"#8A8A8A",500:"#2A2A2A",600:"#1A1A1A",700:"#121212",800:"#0B0B0B",900:"#000000"},
  danger:{0:"#FFFFFF",50:"#FFF1F1",100:"#FFE0E0",200:"#ffd2d5ff",300:"#FF9AA6",400:"#FF6A7B",500:"#EF2F23",600:"#E7000B",700:"#DB1424",800:"#C11225",900:"#7A0A18"},
  success:{0:"#FFFFFF",50:"#EEFFF3",100:"#D7FFE8",200:"#d6ffe7ff",300:"#8EF5BB",400:"#5BEA9A",500:"#0FD45D",600:"#00C853",700:"#109C47",800:"#0E8242",900:"#064D2B"},
  warning:{0:"#FFFFFF",50:"#FFF7EB",100:"#FFEFC6",200:"#FFE094",300:"#FFC552",400:"#FFB83A",500:"#FFA414",600:"#FF9F0A",700:"#D97500",800:"#AF5E00",900:"#6E3600"},
  info:{0:"#FFFFFF",50:"#ECFAFF",100:"#D2F2FF",200:"#AEE6FF",300:"#84D6FF",400:"#4BC1FF",500:"#2B9FFF",600:"#1093FF",700:"#0077C0",800:"#0066A8",900:"#083B61"},
  sky:{0:"#FFFFFF",50:"#ECFAFF",100:"#D2F2FF",200:"#AEE6FF",300:"#84D6FF",400:"#4BC1FF",500:"#2B9FFF",600:"#1093FF",700:"#0077C0",800:"#0066A8",900:"#083B61"},
  red:{0:"#FFFFFF",50:"#FFF1F1",100:"#FFE0E0",200:"#ffd2d5ff",300:"#FF9AA6",400:"#FF6A7B",500:"#EF2F23",600:"#E7000B",700:"#DB1424",800:"#C11225",900:"#7A0A18"},
  amber:{0:"#FFFFFF",50:"#FFF3EA",100:"#FFE3D1",200:"#FFC7A6",300:"#FFAC80",400:"#FF874D",500:"#FF6C1F",600:"#FF5A00",700:"#D24500",800:"#B63C00",900:"#6F2300"},
  orange:{0:"#FFFFFF",50:"#FFF4EB",100:"#FFE6CC",200:"#FFCE9E",300:"#FFAE66",400:"#FF8B33",500:"#FF7310",600:"#FF6B00",700:"#CC4400",800:"#AF3F00",900:"#6B2400"},
  yellow:{0:"#FFFFFF",50:"#FFFAE6",100:"#FFF2BF",200:"#FFE780",300:"#FFDB3D",400:"#FFD000",500:"#FFE03F",600:"#FFD60A",700:"#B38600",800:"#8E6D00",900:"#534300"},
  lime:{0:"#FFFFFF",50:"#F6FFE8",100:"#E7FFC2",200:"#CCFF83",300:"#A8FA3D",400:"#8BE11C",500:"#87DE10",600:"#7ACC00",700:"#4A8C00",800:"#3B7100",900:"#224300"},
  green:{0:"#FFFFFF",50:"#F0FFF5",100:"#DBFFE9",200:"#BDF7CF",300:"#8FE7A8",400:"#5BD57D",500:"#1DAE52",600:"#16A34A",700:"#168A40",800:"#136A34",900:"#0B3D1F"},
  teal:{0:"#FFFFFF",50:"#EDFFFB",100:"#D2FFF4",200:"#A6FAEA",300:"#74EEDC",400:"#41DECB",500:"#00CFAA",600:"#00BFA5",700:"#0C8C7F",800:"#0B786C",900:"#084741"},
  cyan:{0:"#FFFFFF",50:"#EFFFFF",100:"#D4FCFF",200:"#AFF5FD",300:"#7FE8F6",400:"#45D3EB",500:"#09C6E7",600:"#00B8D9",700:"#0A7C92",800:"#0B6E81",900:"#0A4250"},
  blue:{0:"#FFFFFF",50:"#EFF6FF",100:"#DBE8FF",200:"#B8D3FF",300:"#90BAFF",400:"#5E97FF",500:"#406FFF",600:"#2F66FF",700:"#2452DE",800:"#2248C8",900:"#172C80"},
  indigo:{0:"#FFFFFF",50:"#EEF2FF",100:"#E0E6FF",200:"#C5D0FF",300:"#A3B5FF",400:"#879CFF",500:"#707AF5",600:"#5A63F3",700:"#4951DA",800:"#3E40BF",900:"#2A2A82"},
  purple:{0:"#FFFFFF",50:"#F4F0FF",100:"#E8DBFF",200:"#D2B8FF",300:"#B590FF",400:"#996AF5",500:"#7A52F1",600:"#6B3CF0",700:"#592FBE",800:"#4D27A3",900:"#2F1767"},
  magenta:{0:"#FFFFFF",50:"#FFF0FE",100:"#FCE0FF",200:"#F7BCFF",300:"#F393FD",400:"#E85FF8",500:"#C645D6",600:"#C026D3",700:"#951CAB",800:"#801790",900:"#4C0C59"},
  pink:{0:"#FFFFFF",50:"#FFF0F7",100:"#FFE0F0",200:"#FFC0E2",300:"#FF9ACE",400:"#FF6CB3",500:"#ED5CA2",600:"#EC4899",700:"#AB236F",800:"#96205D",900:"#5A1238"},
  rose:{0:"#FFFFFF",50:"#FFF0F3",100:"#FFE1E9",200:"#FFC1D3",300:"#FF98B8",400:"#FF6B98",500:"#EE4278",600:"#E52E69",700:"#B52156",800:"#991A43",900:"#5B0F28"},
} as const;

const paletteDark: Record<string, Scale> = {
  mono:{0:"#0B0B0C",50:"#0F0F10",100:"#151515",200:"#1B1B1C",300:"#232323",400:"#DADADA",500:"#E0E0E0",600:"#EDEDED",700:"#F5F5F5",800:"#FCFCFC",900:"#FFFFFF"},
  danger:{0:"#17080A",50:"#1E0B0D",100:"#290F11",200:"#3A1416",300:"#4B191B",400:"#6A1D21",500:"#FF3B30",600:"#E7000B",700:"#FF2A20",800:"#FF463D",900:"#FFD9DB"},
  success:{0:"#06150B",50:"#0A1B10",100:"#0E2416",200:"#11301C",300:"#143B21",400:"#16502C",500:"#22D85A",600:"#00C853",700:"#2FE976",800:"#7FF1AE",900:"#D6FADF"},
  warning:{0:"#150E05",50:"#1C1408",100:"#261B0B",200:"#31240E",300:"#3D2C12",400:"#583C16",500:"#FFA61A",600:"#FF9F0A",700:"#FFB347",800:"#FFD089",900:"#FFF0C9"},
  info:{0:"#07131E",50:"#0A1926",100:"#0E2233",200:"#112C44",300:"#143654",400:"#184A78",500:"#1C9CFF",600:"#1093FF",700:"#4FB2FF",800:"#9DD2FF",900:"#D8ECFF"},
  sky:{0:"#07131E",50:"#0A1926",100:"#0E2233",200:"#112C44",300:"#143654",400:"#184A78",500:"#1C9CFF",600:"#1093FF",700:"#4FB2FF",800:"#9DD2FF",900:"#D8ECFF"},
  red:{0:"#17080A",50:"#1E0B0D",100:"#290F11",200:"#3A1416",300:"#4B191B",400:"#6A1D21",500:"#FF3B30",600:"#E7000B",700:"#FF2A20",800:"#FF463D",900:"#FFD9DB"},
  amber:{0:"#150D07",50:"#1C120A",100:"#26180E",200:"#311F12",300:"#3E2716",400:"#59361C",500:"#FF6A1E",600:"#FF5A00",700:"#FF8747",800:"#FFB98A",900:"#FFE2CC"},
  orange:{0:"#140D07",50:"#1B120A",100:"#25190D",200:"#302010",300:"#3B2813",400:"#553817",500:"#FF7F22",600:"#FF6B00",700:"#FF9247",800:"#FFBE8A",900:"#FFE1CC"},
  yellow:{0:"#141303",50:"#1B1906",100:"#25210A",200:"#2F2A0D",300:"#383212",400:"#524717",500:"#FFE042",600:"#FFD60A",700:"#FFE457",800:"#FFF194",900:"#FFF8CF"},
  lime:{0:"#0C1306",50:"#101A08",100:"#14210B",200:"#1A2B0F",300:"#203614",400:"#2A4A1A",500:"#86E21A",600:"#7ACC00",700:"#9EEA3B",800:"#C9F57F",900:"#EAFCC4"},
  green:{0:"#07140C",50:"#0B1B11",100:"#0E2416",200:"#112C1B",300:"#143722",400:"#17502F",500:"#20BF55",600:"#16A34A",700:"#39C964",800:"#86E5A5",900:"#D4F6E1"},
  teal:{0:"#081815",50:"#0B1F1C",100:"#0F2824",200:"#13322E",300:"#173E39",400:"#14584F",500:"#14CEBD",600:"#00BFA5",700:"#2CD6C6",800:"#7FEAE3",900:"#CFF7F3"},
  cyan:{0:"#07171C",50:"#0A1E24",100:"#0E2830",200:"#11333D",300:"#153E4A",400:"#165B6A",500:"#20CBE6",600:"#00B8D9",700:"#3FD2E9",800:"#93EBF6",900:"#D5F7FC"},
  blue:{0:"#081421",50:"#0A1829",100:"#0E2139",200:"#112A4B",300:"#153660",400:"#184A86",500:"#4A78FF",600:"#2F66FF",700:"#5A8AFF",800:"#A7C3FF",900:"#D9E7FF"},
  indigo:{0:"#0B1023",50:"#0E162C",100:"#141F3F",200:"#1C2A56",300:"#24366E",400:"#2F4894",500:"#707CF6",600:"#5A63F3",700:"#7D86FF",800:"#B5C0FF",900:"#E0E6FF"},
  purple:{0:"#100B1F",50:"#130E26",100:"#1A1638",200:"#231F4E",300:"#2E2A67",400:"#3C388D",500:"#8256F3",600:"#6B3CF0",700:"#8B66FA",800:"#C1B0FF",900:"#E4DCFF"},
  magenta:{0:"#160A18",50:"#1C0C21",100:"#25102E",200:"#321544",300:"#421A5C",400:"#58247C",500:"#CB44DB",600:"#C026D3",700:"#D960EB",800:"#F0B5FA",900:"#F9E4FE"},
  pink:{0:"#170911",50:"#1D0C18",100:"#271220",200:"#371830",300:"#462042",400:"#622C5C",500:"#F067AE",600:"#EC4899",700:"#F679BB",800:"#FFC2E1",900:"#FFE6F3"},
  rose:{0:"#17090E",50:"#1F0C13",100:"#2A121B",200:"#3A1B28",300:"#4B2636",400:"#673449",500:"#EE457B",600:"#E52E69",700:"#FF558A",800:"#FFA9C6",900:"#FFE0EA"},
} as const;

const withAliases = (p: Record<string, Scale>) => ({
  ...p,
  red: p.danger,
  error: p.danger,
  green: p.success,
  success: p.success,
  orange: p.orange,
  amber: p.amber,
  yellow: p.yellow,
  lime: p.lime,
  teal: p.teal,
  cyan: p.cyan,
  sky: p.sky,
  blue: p.blue,
  indigo: p.indigo,
  purple: p.purple,
  violet: p.purple,
  magenta: p.magenta,
  fuchsia: p.magenta,
  pink: p.pink,
  rose: p.rose,
  gray: p.mono,
  grey: p.mono,
  neutral: p.mono,
});

export const surfaceFromNeutral = (mode: Mode, n: Scale) =>
  mode === "light"
    ? { appBg:n[0], panelBg:n[0], subtleBg:n[100], panelHover:n[50], subtleHover:n[200], overlayBg:"linear-gradient(rgba(0,0,0,.15),rgba(0,0,0,.525))", border:n[300] }
    : { appBg:n[0], panelBg:n[0], subtleBg:n[50], panelHover:n[50], subtleHover:n[100], overlayBg:"linear-gradient(rgba(16, 16, 16, 0.45),rgba(27, 27, 27, 0.75))", border:n[200] };

export const textLight = (n: Scale) => ({ primary:n[900], secondary:n[600], muted:n[500], onColors:{} as Record<string,string> });
export const textDark  = (n: Scale) => ({ primary:n[900], secondary:n[700], muted:n[600], onColors:{} as Record<string,string> });

const colorKeys = ["danger","success","warning","info","red","amber","orange","yellow","lime","green","teal","cyan","sky","blue","indigo","purple","magenta","pink","rose","mono"];
const makeOnColors = (defaults: Record<string,string>) =>
  colorKeys.reduce<Record<string,string>>((acc,k)=>{ acc[k]=defaults[k] ?? "#FFFFFF"; return acc; }, {});

export const defaultLightTheme: PlainframeUITheme = {
  spacing, radius, componentHeights, typography,
  neutral: neutralLight,
  palette: { ...withAliases(paletteLight), primary: paletteLight.mono as Scale },
  surface: surfaceFromNeutral("light", neutralLight),
  text: { ...textLight(neutralLight), onColors: { primary:"#FFFFFF", ...makeOnColors({ yellow:"#000000" }) } },
};

export const defaultDarkTheme: PlainframeUITheme = {
  spacing, radius, componentHeights, typography,
  neutral: neutralDark,
  palette: { ...withAliases(paletteDark), primary: paletteDark.mono as Scale },
  surface: surfaceFromNeutral("dark", neutralDark),
  text: { ...textDark(neutralDark), onColors: { primary:"#000000", ...makeOnColors({ yellow:"#000000", mono:"#000000" }) } },
};

declare module "@emotion/react" { interface Theme extends PlainframeUITheme {} }