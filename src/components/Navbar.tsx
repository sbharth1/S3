"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
// import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomUserIcon from "./UserIcon";

const Navbar: React.FC = () => {
  const { setTheme } = useTheme();
  return (
    <nav className="p-4 flex justify-between items-center">
      <h1 className="font-bold text-base leading-none">S3 UI</h1>
      <div className="flex items-center space-x-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="w-8 h-8 p-0 flex items-center justify-center">
              <Sun className="h-4 w-4 scale-100 rotate-0 transition-all hover:bg-inherit dark:scale-0 dark:-rotate-90 " />
              <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all hover:bg-inherit dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* <UserButton/> */}
        <CustomUserIcon />
      </div>
    </nav>
  );
};

export default Navbar;
