import React from 'react';
// import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
// import "@radix-ui/themes/styles.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* header */}
      {/* chatsidebar */}
      {children}
      {/* footer */}
    </>
  );
}
