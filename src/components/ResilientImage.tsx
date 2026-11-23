import { useState } from "react";
import { HeartHandshake } from "lucide-react";

interface ResilientImageProps {
  src: string;
  alt: string;
  fallbackLabel: string;
  className?: string;
}

export function ResilientImage({
  src,
  alt,
  fallbackLabel,
  className = "",
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#FFF0F3] via-white to-[#FCE4EA] border border-[#F2D7DF] p-8 text-center ${className}`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-[#F2D7DF] text-[#B54B6E]">
          <HeartHandshake className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="font-editorial text-lg font-medium text-[#2A1F24]">
          {fallbackLabel}
        </p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
