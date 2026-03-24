import { useState } from "react";
import goodsRecyclingLogo from "../assets/logo.svg";
import goodsRecyclingMark from "../assets/logo-mark.svg";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  panelClassName?: string;
};

export function BrandLogo({
  className = "",
  imageClassName = "",
  panelClassName = "",
}: BrandLogoProps) {
  const [logoSrc, setLogoSrc] = useState(goodsRecyclingLogo);

  return (
    <div className={`flex ${className}`.trim()}>
      <div
        className={`inline-flex w-fit max-w-full items-center justify-center rounded-2xl ${panelClassName}`.trim()}
      >
        <img
          src={logoSrc}
          alt="Goods Recycling logo"
          loading="eager"
          className={`block h-auto w-[320px] max-w-[92vw] object-contain object-center ${imageClassName}`.trim()}
          onError={() => setLogoSrc(goodsRecyclingMark)}
        />
      </div>
    </div>
  );
}