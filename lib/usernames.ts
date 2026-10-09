export const usernameHelp='اسم المستخدم من 2 إلى 40 حرفًا؛ يقبل الحروف والأرقام والرموز، بدون مسافات داخل الاسم';
export function normalizeUsername(value:unknown){return typeof value==='string'?value.trim().toLowerCase():'';}
export function validUsername(value:unknown){return typeof value==='string'&&/^[\p{L}\p{M}\p{N}\p{P}\p{S}]{2,40}$/u.test(value);}
