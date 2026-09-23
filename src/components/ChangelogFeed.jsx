import { useEffect, useState } from 'react';

/* Changelog feed - loaded lazily (tiny file) */
export default function ChangelogFeed() {
  const [log, setLog] = useState([]);
  useEffect(() => {
    let live = true;
    import('/content/changelog.json')
      .then(m => { if (live) setLog(m.default.changelog || []); })
      .catch(() => {});
    return () => { live = false; };
  }, []);
  if (!log.length) return null;
  const tones = { module: 'green', system: 'blue', fix: 'red', note: 'warn' };
  return (<>
    <h3 className="feed-title">UPDATES &amp; ADDITIONS</h3>
    {log.slice(0, 4).map((e, i) => (
      <div key={i} className={'callout ' + (tones[e.type] || '')}>
        <strong>{e.date}</strong> · {e.title}
        {e.detail && <><br /><span className="dim small">{e.detail}</span></>}
      </div>
    ))}
  </>);
}
