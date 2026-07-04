import React from "react";

function BannerStrip({ bannerMessages, bannerIndex }) {
  if (bannerMessages.length === 0) return null;

  return (
    <div className="info-banner-strip">
      <i
        className={`fa-solid ${bannerMessages[bannerIndex].icon} info-banner-icon`}
      ></i>

      <span key={bannerIndex} className="info-banner-text">
        {bannerMessages[bannerIndex].text}
      </span>
    </div>
  );
}

export default BannerStrip;