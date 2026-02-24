import type { Appearance } from "@clerk/types";

export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: "#ff980a",
    colorBackground: "#0a0a0a",
    colorInputBackground: "#171717",
    colorText: "#fafafa",
    colorTextSecondary: "#a3a3a3",
    borderRadius: "0.625rem",
    fontFamily: "var(--font-dm-sans), sans-serif",
  },
  elements: {
    card: "bg-transparent shadow-none",
    headerTitle: "font-heading text-white",
    formButtonPrimary:
      "bg-[#ff980a] text-black hover:bg-[#ffad33] font-medium",
    socialButtonsBlockButton:
      "border border-[#262626] bg-transparent text-white hover:bg-white/5",
    socialButtonsBlockButtonText: "text-white font-normal",
    formFieldInput:
      "bg-[#171717] border-[#262626] text-white placeholder:text-neutral-500",
    footerActionLink: "text-[#ffad33] hover:text-[#ff980a]",
    identityPreviewEditButton: "text-[#ffad33] hover:text-[#ff980a]",
    formFieldLabel: "text-neutral-300",
    dividerLine: "bg-[#262626]",
    dividerText: "text-neutral-500",
  },
};
