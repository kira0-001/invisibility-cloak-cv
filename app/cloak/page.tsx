import { redirect } from "next/navigation";

// The /cloak page has been merged into the main app.
// Redirect all visitors to the unified experience.
export default function CloakRedirectPage() {
  redirect("/");
}
