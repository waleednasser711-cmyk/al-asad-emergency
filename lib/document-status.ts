// Missing status remains posted for legacy documents.
export const isPosted=(d:any)=>d.status!=='pending'&&d.status!=='rejected';
export const documentAt=(d:any)=>d.postedAt||d.at;
