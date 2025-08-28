import { redirect } from 'next/navigation';
import { ChatApiService } from '../../services/api/chat';

// Static user ID for the demo


export default async function Page() {
const STATIC_USER_ID = 'static_user_karana';
// Use LangChain to load and split the PDF document.et 
const response = await ChatApiService.createChat(STATIC_USER_ID); 
// create a new chat with user context
console.log("chatdata:",response.data)
console.log("loadid:",response.data.chat.id)
  let id=response.data.chat.id;
  redirect(`/chat/${id}`); // redirect to chat page, see below
}
// my name is karan prajapat, my age is 19years, love playing football, i am a student of computer science and engineering, i am from gujarat, india