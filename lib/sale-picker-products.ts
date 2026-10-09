export function salePickerProducts<T extends {id:string,saleAllowed?:boolean}>(
 products:T[],stocks:Record<string,Record<string,number>>,kind:string,
 user:{id:string,role:string},
):T[]{
 if(user.role!=='rep')return products;
 // Loading uses permitted warehouse products, even before the rep has stock.
 if(kind==='load')return products.filter(product=>product.saleAllowed!==false);
 if(kind!=='sale')return products;
 const car=stocks[user.id]||{};
 return products.filter(product=>product.saleAllowed!==false&&(car[product.id]||0)>0);
}
