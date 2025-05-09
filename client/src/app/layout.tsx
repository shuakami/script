import './globals.css';
import Provider from '../components/AuthProvider';

export const metadata = {
  title: 'Script Guardian Admin',
  description: '极简安全脚本管理',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 text-gray-900">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
