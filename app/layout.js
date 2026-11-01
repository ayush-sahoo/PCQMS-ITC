export const metadata = {
  title: "PCQMS App",
  description: "Process & Chapati Quality Management System",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Tailwind Play CDN — matches the original Apps Script app exactly */}
        <script src="https://cdn.tailwindcss.com/3.4.14" async={false}></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.tailwind) {
                tailwind.config = {
                  theme: {
                    extend: {
                      keyframes: {
                        fadeIn: {
                          '0%': { opacity: '0', transform: 'translateY(4px)' },
                          '100%': { opacity: '1', transform: 'translateY(0)' },
                        },
                      },
                    },
                  },
                };
              }
            `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body { overscroll-behavior-y: contain; -webkit-font-smoothing: antialiased; }
              .glass-nav { backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
              input[type="number"]::-webkit-inner-spin-button,
              input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
              input[type="number"], input[type="date"], input[type="time"], input[type="text"] { -moz-appearance: textfield; min-width: 0; }
              .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
              @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
