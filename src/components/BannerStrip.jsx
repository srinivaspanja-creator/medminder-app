import React from "react";

function BannerStrip({ bannerMessages, bannerIndex }) {
  if (!bannerMessages?.length) return null;

  const currentBanner =
    bannerMessages[bannerIndex] ?? bannerMessages[0];

  return (
    <div className="info-banner-strip">
      <i
        className={`fa-solid ${currentBanner.icon} info-banner-icon`}
      ></i>

      <span key={bannerIndex} className="info-banner-text">
        {currentBanner.text}
      </span>
    </div>
  );
}
export default BannerStrip;