"use client";

import * as React from "react";
import { UserButton } from "@clerk/nextjs";

const Navbar: React.FC = () => {
  return (
    <nav className="p-4 flex justify-between items-center">
      <div>
        <h1 className="font-bold">S3 UI</h1>
      </div>
      <div>
        <UserButton />
      </div>
    </nav>
  );
};

export default Navbar;
