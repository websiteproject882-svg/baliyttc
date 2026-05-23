"use client";
interface BalieytcLogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
  logoUrl?: string;
  siteName?: string;
}

export const BalieytcLogo = ({
  className = "h-12 w-12",
  showText = true,
  textClassName = "",
  logoUrl = "/images/brand/logo-512.png",
  siteName = "Bali YTTC",
}: BalieytcLogoProps) => {
  return (
    <div className="flex items-center gap-3">
      <img
        src={logoUrl}
        alt={`${siteName} logo`}
        className={`${className} object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.18)]`}
        loading="eager"
        decoding="async"
      />

      {showText && (
        <div className={`leading-tight ${textClassName}`}>
          <p className="font-serif text-[1.35rem] font-semibold leading-none tracking-[0.015em] text-current">
            {siteName}
          </p>
        </div>
      )}
    </div>
  );
};

export default BalieytcLogo;
