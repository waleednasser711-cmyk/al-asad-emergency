import {env} from 'cloudflare:workers';
export function db():any{const d=(env as any).DB;if(!d)throw new Error('قاعدة البيانات غير متاحة');return d}
export function bucket():any{const b=(env as any).BUCKET;if(!b)throw new Error('رفع الملفات غير متاح');return b}
