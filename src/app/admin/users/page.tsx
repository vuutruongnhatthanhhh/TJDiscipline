import { listAppUsers } from "@/lib/data/users";
import { UsersClient } from "./users-client";

export default async function AdminUsersPage() {
  const users = await listAppUsers();
  return <UsersClient initialUsers={users} />;
}
