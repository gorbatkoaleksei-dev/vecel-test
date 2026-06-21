import "./globals.css";

export const metadata = {
  title: "Leads Desk",
  description: "A small Supabase and Vercel leads tracker"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
