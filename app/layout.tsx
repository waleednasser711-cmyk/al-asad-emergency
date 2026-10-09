import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'شركة الأسد | إدارة المخازن والمناديب',description:'المخازن والمبيعات والتحصيلات والحسابات',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl" className="dark"><body data-asad-shell="v1">{children}</body></html>}
