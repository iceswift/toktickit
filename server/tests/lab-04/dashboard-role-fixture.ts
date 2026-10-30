import { randomUUID,randomBytes,createHash } from 'node:crypto';
import { getPrisma } from '../../src/prisma.js';
import { newDatabase,prismaCommand } from './database-fixture.js';
export async function dashboardRoleFixture(label:string){
  const url=newDatabase(label);prismaCommand(url,['migrate','deploy']);process.env.DATABASE_URL=url;const db=getPrisma();
  const legacy=await db.developmentRequester.create({data:{displayName:'Role fixture',email:randomUUID()+'@example.test'}});
  const category=await db.category.create({data:{name:'Role fixture'}}),system=await db.relatedSystem.create({data:{name:'Role fixture'}});
  async function user(role:'REQUESTER'|'IT_STAFF'|'ADMINISTRATOR',linked=false){const u=await db.user.create({data:{name:role,email:randomUUID()+'@example.test',role,passwordHash:'NOT_A_REAL_LOGIN',mustChangePassword:false,...(linked?{developmentRequesterId:legacy.id}:{})}});const token=randomBytes(32).toString('base64url');await db.authSession.create({data:{userId:u.id,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:new Date(Date.now()+3600000)}});return {...u,cookie:'toktickit_session='+token};}
  const owner=await user('REQUESTER',true),other=await user('REQUESTER'),staff=await user('IT_STAFF'),admin=await user('ADMINISTRATOR');
  const ticket=await db.ticket.create({data:{ticketNumber:'TKT-P7-'+randomUUID(),requesterId:legacy.id,requesterUserId:owner.id,categoryId:category.id,relatedSystemId:system.id,summary:'Role fixture owned waiting',description:'PRIVATE-P7-DESCRIPTION',requestedPriority:'MEDIUM',itPriority:'URGENT',currentStatus:'WAITING_FOR_REQUESTER',ownerUserId:staff.id}});
  return {db,owner,other,staff,admin,ticket};
}
