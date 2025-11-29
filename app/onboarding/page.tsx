import { currentUser } from "@clerk/nextjs/server";

export default async function Dashboard() {
  const user = await currentUser();

  const firstName = user?.firstName;
  const lastName = user?.lastName;
  const fullName = user?.fullName; // Clerk combines first + last

  return <div>Hello {fullName}</div>;
}
