import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to login page (will be created in Task 6)
  redirect('/auth/login');
}
