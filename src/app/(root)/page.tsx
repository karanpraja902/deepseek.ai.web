import { redirect } from 'next/navigation';
import { createChat } from '../../util/chat-store';

// Static user ID for the demo
const STATIC_USER_ID = 'static_user_karan';

export default async function Page() {
  let id = await createChat(STATIC_USER_ID); // create a new chat with user context
  // id="21AnszSnuH4W1m2xBjDAE"
  redirect(`/chat/${id}&&${STATIC_USER_ID}`); // redirect to chat page, see below
}
// my name is karan prajapat, my age is 19years, love playing football, i am a student of computer science and engineering, i am from gujarat, india