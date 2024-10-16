import type { Metadata } from 'next';
import localFont from 'next/font/local';
import "../../style/common.scss";

const geistSans = localFont({
  src: '../../shared/assets/fonts/Roboto-Black.ttf',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: '../../shared/assets/fonts/Roboto-BlackItalic.ttf',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
