export const dynamic='force-dynamic';
const disabled=()=>Response.json({error:'استرجاع كلمة السر معطّل'},{status:403,headers:{'Cache-Control':'no-store'}});
export async function GET(){return disabled()}
export async function POST(){return disabled()}
