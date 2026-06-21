import "./globals.css";

export const metadata = {
  title: "Leads Desk",
  description: "Міні CRM для заявок на Supabase і Vercel"
};

export default function RootLayout({ children }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
