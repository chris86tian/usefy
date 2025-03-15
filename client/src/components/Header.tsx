import React, { ReactNode } from "react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  rightElement?: ReactNode;
}

export default function Header({ title, subtitle, rightElement }: HeaderProps) {
  return (
    <div className="flex items-center justify-between p-2">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-gray-500">{subtitle}</p>
      </div>
      {rightElement && <div>{rightElement}</div>}
    </div>
  );
};