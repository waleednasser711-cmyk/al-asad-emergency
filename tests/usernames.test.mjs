import assert from 'node:assert/strict';
import {normalizeUsername,validUsername} from '../lib/usernames.ts';
for(const v of ['ab','a@','@@','سع','س#',"'@",'[]','😀😁','a'.repeat(40),'OLD_User-1'])assert.equal(validUsername(normalizeUsername(v)),true,v);
for(const v of ['', 'a','@','a b','a\nb','ab\0','a'.repeat(41),null,{}])assert.equal(validUsername(normalizeUsername(v)),false,String(v));
assert.equal(normalizeUsername(' Ab@ '),'ab@');
console.log('PASS: two-character, Arabic, symbol and legacy usernames; consistent case/trim normalization, length and whitespace/control validation');
