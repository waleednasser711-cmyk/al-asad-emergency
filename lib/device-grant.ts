/** Offline access cannot observe revocation until connectivity returns. */
export function offlineDeviceAllowed(snapshot:any,now=Date.now()){
 return snapshot?.user?.role==='rep'&&typeof snapshot.deviceGrant?.deviceId==='string'&&snapshot.deviceGrant.deviceId.length>0&&Number.isFinite(snapshot.deviceGrant.validUntil)&&snapshot.deviceGrant.validUntil>now;
}
