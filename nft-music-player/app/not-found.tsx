import Link from "next/link";

// This is a "404 Not Found" page for a web application.

// NOTE: When a user navigates to a route or URL that does not exist or is not defined in the application, this page is displayed. It informs the user that the requested page could not be found, and provides a link to navigate back to the home page.
export default function NotFound() {
  return (
    <div className="flex flex-col justify-center items-center p-6 gap-6">
      <h2 className="text-2xl">Page not found 🥲</h2>
      <p>Could not find requested resource</p>
      <Link href="/">Home</Link>
    </div>
  );
}
