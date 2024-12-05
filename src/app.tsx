import { render, Suspense } from "solid-js/web";
import { Route, Router } from "@solidjs/router";
import Root from "./routes/index";
import "./app.css";

const App = () => {
  return (
    <Router>
      <Suspense>
        <Route path="/" component={Root} />
      </Suspense>
    </Router>
  );
};

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?"
  );
}

render(() => <App />, root!);
