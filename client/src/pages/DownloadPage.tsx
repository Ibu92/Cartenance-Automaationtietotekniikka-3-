import { Archive, FileDown } from "lucide-react";
import { Shell } from "../components/Shell";

export function DownloadPage() {
  return (
    <Shell>
      <section className="page-head">
        <div><h1>Exports</h1><p>Download backups and portable project files.</p></div>
      </section>
      <section className="cards-grid">
        <article className="vehicle-card">
          <div className="vehicle-icon"><Archive size={24} /></div>
          <div className="vehicle-main"><h2>Project ZIP</h2><p>Source archive without node_modules, uploads, or local database data.</p></div>
          <a className="button" href="/api/export"><FileDown size={16} />Download</a>
        </article>
      </section>
    </Shell>
  );
}
