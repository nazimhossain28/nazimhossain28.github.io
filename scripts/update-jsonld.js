// Regenerates the JSON-LD Person schema block in index.html from the
// content of the page. Run by .github/workflows/update-jsonld.yml on
// push, or locally with: node scripts/update-jsonld.js
//
// What gets auto-derived:
//   name, jobTitle, description    from the hero section
//   alumniOf                       from #education timeline (higher ed only:
//                                  entries whose degree mentions B.Sc., M.Sc.,
//                                  Diploma, or PGD — HSC/SSC are filtered out)
//   knowsAbout                     from interest cards + research keywords
//                                  (publications + theses), deduplicated
//   email, telephone, sameAs       from contact card hrefs
//   identifier (ORCID)             extracted from the ORCID contact link
//
// Stable fields (image URL, alternateName, nationality) are constants below.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML_PATH = path.join(ROOT, 'index.html');
const SITE_URL = 'https://nazimhossain28.github.io/';

// Known sameAs URLs for institutions that appear in the education timeline.
// Add a new entry here when joining a new university so the JSON-LD alumniOf
// entry links to the official site.
const UNIVERSITY_URLS = {
  'Bangladesh University of Textiles': 'https://butex.edu.bd/',
  'Institute of Business Administration, University of Dhaka': 'https://iba.du.ac.bd/',
};

const html = fs.readFileSync(HTML_PATH, 'utf8');

function section(id) {
  const re = new RegExp(`id="${id}"[\\s\\S]*?<\\/section>`);
  return (html.match(re) || [''])[0];
}

function pickFirst(re, source = html) {
  const m = source.match(re);
  return m ? m[1].trim() : '';
}

function pickAll(re, source = html) {
  const out = [];
  let m;
  while ((m = re.exec(source)) !== null) out.push(m[1].trim());
  return out;
}

const name = pickFirst(/id="heroName"[^>]*>([^<]+)</);
const jobTitle = pickFirst(/id="heroHeadline"[^>]*>([^<]+)</);
const description = pickFirst(/class="hero-subheadline"[^>]*>([^<]+)</);

// Interests
const interests = pickAll(/class="interest-card"[\s\S]*?<span>([^<]+)<\/span>/g);

// Research keywords (from publications and theses)
const researchSection = section('research');
const keywords = pickAll(/class="keyword">([^<]+)</g, researchSection);

// Merge interests + research keywords, deduplicated, original case preserved
const seen = new Set();
const knowsAbout = [];
for (const topic of [...interests, ...keywords]) {
  const key = topic.toLowerCase();
  if (!seen.has(key)) {
    seen.add(key);
    knowsAbout.push(topic);
  }
}

// alumniOf — only higher education (filter by degree title)
const eduSection = section('education');
const alumniOf = [];
const itemRe = /<div class="timeline-item">[\s\S]*?<\/div>\s*<\/div>/g;
let im;
while ((im = itemRe.exec(eduSection)) !== null) {
  const item = im[0];
  const degree = pickFirst(/<h3>([^<]+)</, item);
  const inst = pickFirst(/class="timeline-institution"[^>]*>([^<]+)</, item);
  const isHigherEd = /B\.Sc\.|M\.Sc\.|Diploma|PGD|Ph\.D\.|MBA|Master/i.test(degree);
  if (inst && isHigherEd && !alumniOf.some((a) => a.name === inst)) {
    const entry = { '@type': 'CollegeOrUniversity', name: inst };
    if (UNIVERSITY_URLS[inst]) entry.sameAs = UNIVERSITY_URLS[inst];
    alumniOf.push(entry);
  }
}

// Contact links
const contactSection = section('contact');
const hrefRe = /<a\s+href="([^"]+)"[^>]*class="contact-card[^"]*"/g;
const hrefs = pickAll(hrefRe, contactSection);

let email = '';
let telephone = '';
let orcid = '';
const sameAs = [];
for (const href of hrefs) {
  if (href.includes('mail.google.com')) {
    const m = href.match(/[?&]to=([^&]+)/);
    if (m) email = 'mailto:' + decodeURIComponent(m[1]);
  } else if (href.startsWith('tel:')) {
    telephone = href.replace('tel:', '');
  } else if (href.startsWith('http')) {
    if (href.includes('orcid.org/')) {
      const m = href.match(/orcid\.org\/([^/?#]+)/);
      if (m) orcid = m[1];
    }
    sameAs.push(href);
  }
}

const data = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name,
  alternateName: 'Nazim Hossain',
  jobTitle,
  description,
  image: SITE_URL + 'profile.png',
  url: SITE_URL,
  email,
  telephone,
  nationality: 'Bangladeshi',
  alumniOf,
  knowsAbout,
  identifier: orcid
    ? { '@type': 'PropertyValue', propertyID: 'ORCID', value: orcid }
    : undefined,
  sameAs,
};

if (!data.identifier) delete data.identifier;

const jsonStr = JSON.stringify(data, null, 2)
  .split('\n')
  .map((line, i) => (i === 0 ? line : '  ' + line))
  .join('\n');

const newBlock =
  '<script type="application/ld+json">\n  ' + jsonStr + '\n  </script>';

const blockRe = /<script type="application\/ld\+json">[\s\S]*?<\/script>/;
if (!blockRe.test(html)) {
  console.error('No existing JSON-LD block found in index.html');
  process.exit(1);
}

const updated = html.replace(blockRe, newBlock);

if (updated === html) {
  console.log('JSON-LD already in sync — no changes written.');
  process.exit(0);
}

fs.writeFileSync(HTML_PATH, updated, 'utf8');
console.log('JSON-LD regenerated from portfolio content.');
