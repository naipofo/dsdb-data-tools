import type { Route } from "./+types/home";
import App from "../app/App";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "DSDB Data tools" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <App />;
}
