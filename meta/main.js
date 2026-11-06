import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Read loc.csv and convert the numeric and date columns from strings
async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line), // or just +row.line
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

// Group the line data by commit and summarize each commit
function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      // All lines in a commit share the same author, date, etc.
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/Gabriel04Perez/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        // Hour as a decimal, e.g. 2:30 PM = 14.5
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        // How many lines were modified?
        totalLines: lines.length,
      };

      // Keep the original lines, but hide them so they don't clutter console output
      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false, // hidden from console.log, Object.keys and for...in
        writable: false, // can't be reassigned
        configurable: false, // can't be deleted or redefined
      });

      return ret;
    });
}

let data = await loadData();
let commits = processCommits(data);
