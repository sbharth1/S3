"use client";
import * as React from "react";
import { UserButton } from "@clerk/nextjs";



const CustomUserIcon = () => {

   return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: "w-10 h-10 border rounded-full",
        },
      }}
    />
  );
};

export default CustomUserIcon;
