import React, { useEffect, useRef } from "react";
import c from "classnames";
import "./robo-avatar.scss";

export default function FuturisticIndianAvatar({ active, volume, hover, gesture }) {
  const mouthRef = useRef(null);
  const leftArmRef = useRef(null);
  const rightArmRef = useRef(null);

  useEffect(() => {
    let timeout = null;
    const update = () => {
      if (mouthRef.current) {
        // The mouth height simulates speaking by scaling with volume
        const newHeight = Math.min(24, 4 + volume * 200);
        mouthRef.current.style.height = `${newHeight}px`;
        mouthRef.current.classList.toggle("speaking", volume > 0.1);
      }
      timeout = window.setTimeout(update, 100);
    };

    update();
    return () => clearTimeout(timeout);
  }, [volume]);

  useEffect(() => {
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.className = c("arm left", gesture);
      rightArmRef.current.className = c("arm right", gesture);
    }
  }, [gesture]);

  return (
    <div className={c("futuristicAvatar", { active, hover })}>
      <div className="head">
        {/* Turban/Headpiece */}
        <div className="headpiece" />
        {/* Face */}
        <div className="face">
          <div className="eyes">
            <div className="eye left" />
            <div className="eye right" />
          </div>
          {/* Bindi accent */}
          <div className="bindi" />
          <div className="mouth" ref={mouthRef} />
        </div>
      </div>
      <div className="body">
        <div className="upperWear" />
        <div className="arms">
          <div className="arm left" ref={leftArmRef} />
          <div className="arm right" ref={rightArmRef} />
        </div>
      </div>
    </div>
  );
}
