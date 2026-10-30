/** Mutating browser fixtures only run on the dedicated loopback test cluster.
 * Never infer authorization from a working server/.env or reusable server. */
export function assertSyntheticDatabase(){
  const value=process.env.DATABASE_URL;let parsed:URL;
  try{parsed=new URL(value??'');}catch{throw new Error('Browser fixtures require an explicitly configured synthetic database.');}
  if(process.env.LAB4_UI_TEST!=='1'||parsed.hostname!=='127.0.0.1'||parsed.port!=='55484'||!/^\/lab4_p[4567]_ui_[a-z0-9_]+$/.test(parsed.pathname))throw new Error('Refusing mutation outside dedicated loopback:55484/lab4_p[4567]_ui_* fixture.');
}
export const apiOrigin='http://127.0.0.1:55485';
