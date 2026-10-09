export const DEFAULT_PRODUCT_CATEGORY='kazan';
export const DEFAULT_PRODUCT_CATEGORY_NAME='كازان للمنظفات ومستحضرات التجميل';
export function productCategories(settings:any):{id:string,name:string,supplierId?:string}[]{return settings.productCategories??[{id:DEFAULT_PRODUCT_CATEGORY,name:DEFAULT_PRODUCT_CATEGORY_NAME}]}
export function productCategory(product:{categoryId?:string}){return product.categoryId||DEFAULT_PRODUCT_CATEGORY}
