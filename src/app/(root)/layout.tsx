import React from 'react';
import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
// import "@radix-ui/themes/styles.css";
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {/* header */}
          <Toaster position="top-left" />
   
          {/* chatsidebar */}
          {children}
          {/* footer */}
        </AuthProvider>
      </body>
    </html>
  );
}
