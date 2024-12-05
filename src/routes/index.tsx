import { createEffect, createSignal, For, lazy, Match, Switch } from "solid-js";
import { codeToHtml } from "shiki/bundle-web.mjs";

const getStoredUrls = (): Set<URL> => {
  const storedHistory = localStorage.getItem("request_history");
  if (!storedHistory) return new Set();

  const storedUrls = JSON.parse(storedHistory);
  if (Array.isArray(storedUrls)) {
    const dedupe = Array.from(new Set(storedUrls));
    const storedUrlObjects = dedupe.map((storedUrl) => new URL(storedUrl));
    return new Set(storedUrlObjects);
  }

  return new Set();
};

export default function Home() {
  const [loading, setLoading] = createSignal<boolean>(false);
  const [response, setResponse] = createSignal<string | null>(null);
  const [requestBody, setRequestBody] = createSignal<string>("");
  const [requestHistory, setRequestHistory] = createSignal<Set<URL>>(
    getStoredUrls()
  );

  createEffect(() => {
    const urlsToStore = Array.from(requestHistory());
    localStorage.setItem("request_history", JSON.stringify(urlsToStore));
  });

  const triggerRequest = (e: SubmitEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const requestUrlString = formData.get("request_url")?.toString();
    const method = formData.get("method")?.toString();
    const auth = formData.get("auth")?.toString();

    if (!requestUrlString) return;
    const requestUrl = new URL(requestUrlString);

    let headers: HeadersInit | undefined = undefined;
    if (auth) {
      headers = {
        Authorization: auth,
      };
    }

    setRequestHistory((prev) => {
      const newSet = new Set(prev);
      newSet.add(requestUrl);
      return newSet;
    });

    setLoading(true);
    fetch(requestUrl, {
      method: method ?? "GET",
      headers,
      body: requestBody().length > 0 ? requestBody() : undefined,
    })
      .then((res) => res.json())
      .then((data) =>
        codeToHtml(JSON.stringify(data, undefined, 2), {
          lang: "json",
          theme: "material-theme-palenight",
        })
      )
      .then((final) => setResponse(final))
      .finally(() => setLoading(false));
  };

  return (
    <main>
      <section>
        <form onSubmit={triggerRequest} autocomplete="on">
          <section class="request_url_section">
            <div class="form_control">
              <label for="method">Method</label>
              <select id="method" name="method">
                <option>GET</option>
                <option>POST</option>
              </select>
            </div>

            <div class="form_control">
              <label for="request_url">Request URL</label>
              <input
                type="text"
                id="request_url"
                name="request_url"
                list="request_history"
                value={Array.from(requestHistory())[0]?.toString()}
                required
              />
              <datalist id="request_history">
                <For each={Array.from(requestHistory())}>
                  {(item) => <option>{item.toString()}</option>}
                </For>
              </datalist>
            </div>
            <button type="submit">Go</button>
          </section>
          <section>
            <div class="form_control">
              <label for="auth">Authorization</label>
              <textarea id="auth" name="auth"></textarea>
            </div>
          </section>
          <section>
            <div class="form_control">
              <label for="body">Request Body</label>
              <textarea onInput={(e) => setRequestBody(e.target.value)}>
                {requestBody()}
              </textarea>
            </div>
          </section>
        </form>
      </section>
      <section class="response">
        <Switch fallback={<p>Make a request</p>}>
          <Match when={loading()}>
            <div>
              <p>Loading...</p>
            </div>
          </Match>
          <Match when={response()}>
            {(styled_response) => <div innerHTML={styled_response()} />}
          </Match>
        </Switch>
      </section>
    </main>
  );
}
