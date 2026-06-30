import React from "react";
import logoImg from "../assets/images/socotra_logo.jpg";

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = "", size = 200 }: LogoProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <img
        src={logoImg}
        alt="Socotra Coffee Logo"
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className="drop-shadow-md select-none transition-transform duration-300 hover:scale-105 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
