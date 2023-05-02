// parameters required to identify a new account in mongo
export interface NostrAccount {
  lnurlKey: string;
  email: string;
  sk: string;
  pk: string;
}
