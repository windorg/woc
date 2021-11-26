import { PropsWithChildren } from "react";

export default function Layout({ children }: PropsWithChildren<{}>): JSX.Element {
  return (
    <>
      <div className="container mt-4">{children}</div>
      <footer className="container py-4">
        <div className="text-center text-muted small">
          made by <a href="https://twitter.com/availablegreen">Artyom Kazak</a>{" "}
          • favicon by <a href="https://loading.io/">loading.io</a>
        </div>
      </footer>
    </>
  );
}
