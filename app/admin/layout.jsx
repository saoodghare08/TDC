import AdminLayoutShell from '@/components/admin/AdminLayoutShell';

export const metadata = {
    title: {
        default: 'TDC Admin',
        template: '%s | TDC Admin',
    },
    manifest: '/admin-manifest.webmanifest',
    appleWebApp: {
        capable: true,
        title: 'TDC Admin',
        statusBarStyle: 'default',
    },
    robots: {
        index: false,
        follow: false,
    },
};

export default function AdminLayout({ children }) {
    return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
