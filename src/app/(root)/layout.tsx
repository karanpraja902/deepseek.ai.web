import React from 'react';
import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
// import "@radix-ui/themes/styles.css";
import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* header */}
        <Toaster position="top-left" />
 
        {/* chatsidebar */}
        {children}
        {/* footer */}
      </body>
    </html>
  );
}
