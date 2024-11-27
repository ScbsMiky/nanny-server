import cipher from "../libs/cipher";
import type accounts from "../database/models/accounts";

export function getAge(birth: Date) {
  let now = new Date( );

  if(now.getMonth( ) < birth.getMonth( ) || (now.getMonth( ) == birth.getMonth( ) && now.getDate( ) < birth.getDate( ))) {
    return (now.getFullYear( ) - birth.getFullYear( )) - 1;
  };

  return (now.getFullYear( ) - birth.getFullYear( ));
};

export function compareDates(dateA: string | Date, dateB: string | Date) {
  if(typeof dateA == "string") dateA = new Date(dateA);
  if(typeof dateB == "string") dateB = new Date(dateB);

  return dateA > dateB;
};

export function weightedAverage(...data: number[ ]) {
  return (data.reduce((a, b, i) => a + (b * i + 1), 0)) / data.reduce((a, b, i) => a + b, 0);
};

export function randomUUID(dt = Date.now( )) {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (dt + Math.random()*16)%16 | 0
    
    dt = Math.floor(dt / 16);

    return (c=='x' ? r :(r&0x3|0x8)).toString(16)
  });
};

export function decryptAccount(account: typeof accounts.schema) {
  return {
    ...account,

    private: {
      ...account.private,

      address: {
        city: cipher.decrypt(account.private.address.city),
        state: cipher.decrypt(account.private.address.state),
        number: cipher.decrypt(account.private.address.number),
        landmark: cipher.decrypt(account.private.address.landmark),
        neighborhood: cipher.decrypt(account.private.address.neighborhood)
      }
    }
  } satisfies typeof account;
};