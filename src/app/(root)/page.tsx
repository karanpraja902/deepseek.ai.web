import { redirect } from 'next/navigation';
import { createChat } from '../../util/chat-store';

export default async function Page() {
  let id = await createChat(); // create a new chat
  // id="21AnszSnuH4W1m2xBjDAE"
  redirect(`/chat/${id}`); // redirect to chat page, see below
}