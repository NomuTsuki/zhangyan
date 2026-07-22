import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "掌眼｜民国漆木首饰盒低保真原型",
  description: "古玩鉴定与交易博弈游戏《掌眼》的首案手机竖屏交互原型。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
