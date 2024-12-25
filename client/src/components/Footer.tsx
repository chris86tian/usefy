import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <div className="footer">
      {/* link to my name, link to my company */}
      <div className="flex flex-row items-center justify-center gap-2">
        <p> &copy; 2025 All rights reserved.</p>
        <Link href="https://www.linkedin.com/in/arslankamchybekov/" className="underline">
          Arslan Kamchybekov
        </Link>
        <Link href="https://growthhungry.life" className="underline">
          GrowthHungry
        </Link>
      </div>
      <div className="footer__links">
        {["About", "Privacy Policy", "Licensing", "Contact"].map((item) => (
          <Link
            key={item}
            href={`/${item.toLowerCase().replace(" ", "-")}`}
            className="footer__link"
            scroll={false}
          >
            {item}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Footer;