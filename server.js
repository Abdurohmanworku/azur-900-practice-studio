/*
 * AZ-900 Practice Studio, BACKEND (UNOFFICIAL community study tool)
 * Zero dependencies. Needs Node 18 or newer. The frontend lives in ./public
 *
 *   Run:     node server.js        then open http://localhost:3000
 *   Config:  PORT=8080 DATA_FILE=/path/progress.json ANTHROPIC_API_KEY=sk-... node server.js
 *
 * Backend : Node http server + REST API + JSON file storage (answers are graded
 *           on the server, so correct answers never reach the browser early).
 * Frontend: vanilla JS single page served from this same file.
 * API     : GET  /api/questions?mode=topic|weak|mock&topic=&learner=
 *           POST /api/answer   {learner,id,choice}
 *           GET  /api/progress?learner=
 *           POST /api/reset    {learner}
 *           POST /api/plan     {learner,examDate,hoursPerWeek}  weighted weekly study plan
 *           POST /api/buddy    {learner,message,language,history}  AZ-900 assistant (Claude, multi-turn) or offline fallback
 *           GET  /api/cards?learner=            flashcards, weakest first (12 per session)
 *           POST /api/card     {learner,id,known}  moves a card up a box, or back to 0
 *
 * All questions are original and based on the public AZ-900 skills outline.
 * Not affiliated with or endorsed by Microsoft. No exam questions are used.
 */
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 3000;
const DATA = process.env.DATA_FILE || path.join(__dirname, 'az900-progress.json');

/* ---------- Content: topics (exam weights are midpoints of the public ranges) ---------- */
const TOPICS = {
  cloud: { name: 'Cloud concepts', w: 27.5 },
  arch: { name: 'Azure architecture and services', w: 37.5 },
  mgmt: { name: 'Management and governance', w: 32.5 }
};

/* [topic, question, options, correctIndex, explanation] */
const BANK = [
  ['cloud', 'A start-up avoids buying servers and pays a monthly bill that rises and falls with usage. What kind of spending is this?', ['Capital expenditure (CapEx)', 'Operational expenditure (OpEx)', 'A fixed one-time licence fee'], 1, 'Pay-as-you-go cloud is OpEx: ongoing spend that follows consumption. CapEx is up-front spending on hardware, which this start-up is avoiding.'],
  ['cloud', 'Your company uses a SaaS email service. Which item is always still your responsibility?', ['The physical datacenter', 'The operating system patches', 'The data and who has access to it'], 2, 'In every model you stay responsible for your data, accounts and devices. The provider covers the datacenter, and in SaaS also the OS and application.'],
  ['cloud', 'A bank keeps customer records in its own datacenter but rents public cloud capacity during busy seasons. Which model is this?', ['Hybrid cloud', 'Public cloud only', 'Private cloud only'], 0, 'Using private and public resources together, connected, is hybrid. Public-only or private-only would use just one side.'],
  ['cloud', 'Traffic jumps, so you add three more identical VMs behind a load balancer. What is this called?', ['Vertical scaling (scale up)', 'Horizontal scaling (scale out)', 'Disaster recovery'], 1, 'Adding more instances is scaling out (horizontal). Scaling up would make one VM bigger with more CPU or RAM.'],
  ['cloud', 'Which benefit describes a system that recovers from failures and keeps working?', ['Reliability', 'Elasticity', 'Predictability'], 0, 'Reliability is recovery from failure. Elasticity is adjusting capacity to demand; predictability is knowing cost and performance ahead of time.'],
  ['cloud', 'A team moves its existing servers to the cloud with almost no redesign. Which service type fits best?', ['SaaS', 'IaaS', 'Serverless only'], 1, 'Lift-and-shift copies servers as they are, which is IaaS. SaaS would replace them with a finished app.'],
  ['cloud', 'In a PaaS offering, who patches the underlying operating system?', ['The customer', 'The cloud provider', 'Nobody, it is not patched'], 1, 'PaaS hands the OS and runtime to the provider. You manage your application and data. The OS is yours to patch only in IaaS.'],
  ['cloud', 'Which SLA allows the LEAST downtime per year?', ['99%', '99.9%', '99.99%'], 2, 'More nines means less allowed downtime: 99% is about 3.65 days a year, 99.9% about 8.76 hours, 99.99% about 52 minutes.'],

  ['arch', 'You delete an Azure resource group. What happens to the resources inside it?', ['They move to the default group', 'They are deleted too', 'Nothing, only the label is removed'], 1, 'Deleting a resource group deletes everything in it, which is why groups work well for temporary environments.'],
  ['arch', 'What do region pairs mainly provide?', ['Cheaper bandwidth between any two regions', 'Disaster recovery and staggered updates between two far-apart regions', 'A way to choose any two regions to link'], 1, 'Region pairs sit at least 300 miles apart in one geography. One is prioritised for recovery and updates roll out one at a time.'],
  ['arch', 'What is the minimum number of availability zones in a region that supports them?', ['Two', 'Three', 'Five'], 1, 'Zone-enabled regions have at least three physically separate zones so one failure leaves two running.'],
  ['arch', 'Which compute option runs your code only when an event triggers it and bills for run time?', ['Azure Functions', 'Virtual Machines', 'Availability sets'], 0, 'Azure Functions is event-driven and serverless. VMs run and bill continuously; availability sets are a VM resiliency feature.'],
  ['arch', 'Which service orchestrates and manages a fleet of containers?', ['Azure Kubernetes Service (AKS)', 'Azure DNS', 'Azure File Sync'], 0, 'AKS handles container lifecycle at scale. DNS resolves names and File Sync keeps file shares in sync.'],
  ['arch', 'Which Blob access tier is cheapest for long-term backups that are rarely read?', ['Hot', 'Cool', 'Archive'], 2, 'Archive has the lowest storage cost but slow, costly retrieval. Hot is for frequent access.'],
  ['arch', 'What makes ExpressRoute different from a site-to-site VPN?', ['It encrypts traffic over the internet', 'It is a private connection that does not use the public internet', 'It only works inside Azure'], 1, 'ExpressRoute uses a connectivity provider for a private link. A VPN gateway tunnels encrypted traffic across the public internet.'],
  ['arch', 'A fingerprint scan during sign-in is which type of authentication factor?', ['Something you know', 'Something you have', 'Something you are'], 2, 'Biometrics are something you are. Passwords are something you know; a phone or key is something you have.'],

  ['mgmt', 'What is the main purpose of resource tags?', ['Encrypt resources', 'Add metadata to organise resources and report costs', 'Increase VM speed'], 1, 'Tags are name and value pairs for grouping, cost reporting and automation. They do not change performance or encryption.'],
  ['mgmt', 'Which tool estimates the cost of a design before you deploy anything?', ['Azure Pricing Calculator', 'Azure Monitor', 'Azure Service Health'], 0, 'The Pricing Calculator gives estimates without provisioning. Monitor and Service Health look at running resources.'],
  ['mgmt', 'You want an email when monthly spend reaches 80% of a limit. What do you create?', ['A resource lock', 'A budget with an alert', 'A region pair'], 1, 'Budgets in Cost Management trigger alerts at thresholds you define. Locks stop deletion or edits, not spending.'],
  ['mgmt', 'You want to stop anyone creating resources outside approved regions. Which service enforces this?', ['Azure Policy', 'Azure Advisor', 'Azure Migrate'], 0, 'Azure Policy evaluates and can block non-compliant resources. Advisor only recommends; Migrate moves workloads.'],
  ['mgmt', 'A ReadOnly lock is applied to a resource group. What can an Owner do to its resources?', ['Delete but not read', 'Read, but not change or delete until the lock is removed', 'Everything, Owners ignore locks'], 1, 'Locks apply regardless of role. Even an Owner must remove the lock first.'],
  ['mgmt', 'Which service lets you manage on-premises servers and other clouds from Azure?', ['Azure Arc', 'Azure DNS', 'Azure Disks'], 0, 'Azure Arc projects non-Azure resources into Azure Resource Manager for consistent governance.'],
  ['mgmt', 'Which approach deploys Azure resources from declarative files such as Bicep?', ['Manual portal clicks', 'Infrastructure as code', 'Region pairing'], 1, 'Declarative ARM templates and Bicep describe the desired end state, which makes deployments repeatable.'],
  ['mgmt', 'Which view tells you about Azure problems affecting the services and regions YOU use?', ['Azure Status', 'Service Health', 'Azure Advisor'], 1, 'Service Health is personalised to your services and regions. Azure Status is the global view; Advisor gives recommendations.'],
  ["cloud", "Which is a benefit of the consumption-based model?", ["No up-front purchase of hardware", "A fixed bill whatever you use", "Predicting capacity years ahead"], 0, "You pay for what you use, so there is no hardware purchase and no idle capacity to fund in advance."],
  ["cloud", "Which cloud model keeps resources dedicated to a single organisation?", ["Public cloud", "Private cloud", "Multicloud"], 1, "A private cloud is used by one entity. Public cloud is open to anyone who buys it."],
  ["cloud", "A company uses two different public cloud providers. What is this called?", ["Hybrid cloud", "Private cloud", "Multicloud"], 2, "Two or more public providers is multicloud. Hybrid mixes private and public."],
  ["cloud", "Who is always responsible for physical datacenter security in a cloud model?", ["The cloud provider", "The customer", "An external auditor"], 0, "Physical security, power, cooling and network connectivity belong to the provider in every model."],
  ["cloud", "Which service type is quickest to start using and needs the least technical knowledge?", ["IaaS", "SaaS", "PaaS"], 1, "SaaS is a finished application you simply use. IaaS leaves the most setup to you."],
  ["cloud", "Which is an example of SaaS?", ["A bare virtual machine", "A rack of physical servers", "A web-based email service"], 2, "Email, messaging and finance tools are typical SaaS. A bare VM is IaaS."],
  ["cloud", "Why does elasticity help control cost?", ["You can release resources when demand drops", "It guarantees 100% uptime", "It removes the need for monitoring"], 0, "Scaling in after a peak stops you paying for idle capacity. It does not guarantee uptime."],
  ["cloud", "What does a service level agreement (SLA) describe?", ["How to write cloud applications", "The uptime or performance a provider commits to", "The format of your monthly invoice"], 1, "An SLA is an uptime or performance guarantee, such as 99.9%."],
  ["cloud", "Autoscaling and load balancing mainly support which cloud benefit?", ["Physical security", "Lower licence fees", "Performance predictability"], 2, "They add resources and spread traffic so users get consistent performance."],
  ["cloud", "Which habit supports sustainability in the cloud?", ["Turning off or deallocating resources you do not use", "Running every workload at peak capacity all day", "Leaving test servers on all weekend"], 0, "Matching resources to demand cuts waste in both energy and cost."],
  ["cloud", "What helps you forecast cloud costs?", ["Buying hardware in bulk", "Tracking resource use in real time and analysing trends", "Ignoring usage reports"], 1, "Real-time tracking and analytics let you predict future spend and adjust."],
  ["cloud", "In an on-premises datacenter, who replaces failed servers and pays for cooling?", ["A cloud provider", "The internet provider", "The company that owns it"], 2, "On-premises, you are responsible for everything. Cloud shifts some of that to the provider."],
  ["arch", "Which statement about Azure subscriptions is correct?", ["A subscription is a billing and access boundary", "An account can have only one subscription", "Subscriptions sit below resource groups"], 0, "Subscriptions hold resource groups and give separate billing reports and access rules."],
  ["arch", "Where can you apply policy and access rules to many subscriptions at once?", ["Resource tags", "Management groups", "Blob access tiers"], 1, "Management groups sit above subscriptions and pass settings down to them."],
  ["arch", "Which VM feature avoids rebooting every VM together during planned maintenance?", ["Resource locks", "Resource tags", "Availability sets with update domains"], 2, "Update domains stagger reboots and fault domains separate power and network failure points."],
  ["arch", "Which VM family suits memory-heavy workloads such as in-memory databases?", ["E-series", "B-series", "N-series"], 0, "E-series is memory optimised. B is burstable and N is GPU enabled."],
  ["arch", "Which service delivers Windows desktops and apps from the cloud to any device?", ["Azure DNS", "Azure Virtual Desktop", "Azure Migrate"], 1, "Azure Virtual Desktop keeps desktops and apps in Azure and integrates with Microsoft Entra ID."],
  ["arch", "Which service runs a container without managing any virtual machines, with the least setup?", ["Azure Kubernetes Service", "Availability sets", "Azure Container Instances"], 2, "ACI is the fastest, simplest PaaS way to run a container. AKS adds full orchestration."],
  ["arch", "Which storage redundancy keeps three copies inside a single datacenter?", ["Locally redundant storage (LRS)", "Zone-redundant storage (ZRS)", "Geo-redundant storage (GRS)"], 0, "LRS copies three times in one datacenter. ZRS spreads across three zones."],
  ["arch", "Which Azure Storage service holds messages up to 64 KB for asynchronous processing?", ["Azure Tables", "Azure Queues", "Azure Disks"], 1, "Queue storage holds large numbers of messages and is often paired with Azure Functions."],
  ["arch", "You must move tens of terabytes and your internet is slow. Which service fits?", ["AzCopy over the internet", "Azure DNS", "Azure Data Box"], 2, "Data Box is a shipped physical device of up to 80 TB for offline bulk transfer."],
  ["arch", "Which tool filters traffic with allow and deny rules by IP address, port and protocol?", ["Network security group", "Azure DNS", "ExpressRoute"], 0, "NSG rules are evaluated by priority. A DNS service only resolves names."],
  ["arch", "Which sign-in approach removes the password completely?", ["A longer password", "Passwordless authentication", "Reusing one password everywhere"], 1, "Windows Hello, the Authenticator app and FIDO2 keys replace passwords with a device plus biometric or PIN."],
  ["arch", "What does Conditional Access use to decide allow, require MFA or block?", ["The VM size", "The storage tier", "Sign-in signals such as location, device and risk"], 2, "It evaluates each sign-in against your policies in real time."],
  ["mgmt", "Which factor can change the price of the same VM?", ["The Azure region you deploy it in", "The portal colour theme", "The resource group name"], 0, "Power, labour and taxes differ by location, so the same resource can cost differently by region."],
  ["mgmt", "Which option commits you to an hourly compute spend instead of a specific VM type?", ["Spot Virtual Machines", "Azure savings plan for compute", "Pay-as-you-go"], 1, "A savings plan trades commitment for flexibility across eligible compute services."],
  ["mgmt", "Which option uses spare capacity at a large discount but can be evicted?", ["Reservations", "Savings plan for compute", "Spot Virtual Machines"], 2, "Spot suits interruptible workloads because Azure can reclaim the capacity."],
  ["mgmt", "Do resources automatically inherit tags from their resource group?", ["No, tags are not inherited", "Yes, always", "Only in production subscriptions"], 0, "Tags applied at one level do not appear at another unless you apply them there, for example with Azure Policy."],
  ["mgmt", "Which alert tells you an Azure Prepayment is nearly used up?", ["A resource lock", "A credit alert", "A region pair alert"], 1, "Credit alerts fire at 90% and 100% of the balance for Enterprise Agreement customers."],
  ["mgmt", "Which tool gives recommendations for reliability, security, performance, operational excellence and cost?", ["Azure Arc", "Azure DNS", "Azure Advisor"], 2, "Advisor is a personalised best-practice guide in the portal."],
  ["mgmt", "Where do you write and run queries on the data Azure Monitor collects?", ["Log Analytics", "Azure Policy", "Azure Data Box"], 0, "Log Analytics queries logs for errors, trends and more."],
  ["mgmt", "Which Azure Monitor feature tracks request rates, response times and failures of a web app?", ["Azure Migrate", "Application Insights", "Resource locks"], 1, "Application Insights monitors web app performance and usage, in Azure or elsewhere."],
  ["mgmt", "Which Service Health view shows whether one particular VM is running normally?", ["Azure Status", "Azure Pricing Calculator", "Resource Health"], 2, "Resource Health zooms in on a single resource. Azure Status is global."],
  ["mgmt", "Which tool is a browser-based shell that supports both PowerShell and the Azure CLI?", ["Azure Cloud Shell", "Azure Data Box", "Azure Policy"], 0, "Cloud Shell needs no local install and is authenticated to your account."],
  ["mgmt", "What does Azure Resource Manager do with requests from the portal, CLI or SDKs?", ["Replaces the resource group", "Authenticates, authorises and forwards them", "Only handles billing"], 1, "All tools go through the same API, so results are consistent."],
  ["mgmt", "Where can you find Microsoft audit reports and compliance documents?", ["Azure Cloud Shell", "The pricing calculator", "The Service Trust Portal"], 2, "The Service Trust Portal holds security, privacy and compliance resources, some behind sign-in and an NDA."]
].map((r, i) => ({ id: i + 1, topic: r[0], q: r[1], options: r[2], answer: r[3], explain: r[4] }));

/* [topic, term, definition] for the Flashcard Coach */
const FLASH = [
  ['cloud', 'CapEx', 'Up-front spending on physical assets such as servers.'],
  ['cloud', 'OpEx', 'Ongoing spending on services as you use them. Cloud is mostly OpEx.'],
  ['cloud', 'Scale out', 'Add more instances to share the load (horizontal scaling).'],
  ['cloud', 'Scale up', 'Give one machine more CPU or RAM (vertical scaling).'],
  ['cloud', 'Shared responsibility', 'The provider secures the cloud itself. You always secure your data, accounts and devices.'],
  ['cloud', 'Hybrid cloud', 'Private and public cloud used together and connected.'],
  ['arch', 'Region pair', 'Two regions 300+ miles apart in one geography, used for disaster recovery.'],
  ['arch', 'Availability zone', 'A physically separate datacenter group inside a region with its own power, cooling and network.'],
  ['arch', 'Azure Functions', 'Serverless, event-driven code you pay for only while it runs.'],
  ['arch', 'AKS', 'Managed Kubernetes service for orchestrating containers.'],
  ['arch', 'ExpressRoute', 'Private connection to Azure that bypasses the public internet.'],
  ['arch', 'Blob Archive tier', 'Cheapest storage for rarely read data, with slow and costly retrieval.'],
  ['arch', 'Microsoft Entra ID', "Microsoft's cloud identity and access management service."],
  ['arch', 'GZRS', 'Zone-redundant in the primary region plus a copy in a secondary region. At least 16 nines durability.'],
  ['mgmt', 'Resource tag', 'Name and value metadata used to organise resources and report costs.'],
  ['mgmt', 'Azure Policy', 'Rules that audit or block non-compliant resources.'],
  ['mgmt', 'Resource lock', 'Delete or ReadOnly protection that applies even to Owners.'],
  ['mgmt', 'Azure Arc', 'Manages on-premises and other-cloud resources through Azure.'],
  ['mgmt', 'Bicep', 'Declarative language for deploying Azure resources as code.'],
  ['mgmt', 'Azure Advisor', 'Personalised recommendations for reliability, security, performance, operational excellence and cost.']
].map((r, i) => ({ id: i + 1, topic: r[0], term: r[1], def: r[2] }));

/* ---------- Storage ---------- */
let db = { learners: {} };
try { db = JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch (e) { /* first run */ }
const save = () => { const t = DATA + '.tmp'; fs.writeFileSync(t, JSON.stringify(db)); fs.renameSync(t, DATA); };
const learner = id => (db.learners[id] = db.learners[id] || { a: {} });
const latest = (L, qid) => { const x = L.a[qid]; return x && x[x.length - 1]; };

function progress(id) {
  const L = learner(id), wsum = Object.values(TOPICS).reduce((s, t) => s + t.w, 0);
  let readiness = 0, answered = 0, weak = [];
  const topics = Object.keys(TOPICS).map(k => {
    const qs = BANK.filter(q => q.topic === k);
    const done = qs.filter(q => latest(L, q.id)), right = done.filter(q => latest(L, q.id).c);
    const pct = Math.round(100 * right.length / qs.length);
    readiness += (TOPICS[k].w / wsum) * pct; answered += done.length;
    qs.forEach(q => { const l = latest(L, q.id); if (l && !l.c) weak.push(q.id); });
    return { key: k, name: TOPICS[k].name, weight: TOPICS[k].w, total: qs.length, answered: done.length, correct: right.length, pct };
  });
  return { readiness: Math.round(readiness), answered, total: BANK.length, topics, weakCount: weak.length };
}

const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const strip = q => ({ id: q.id, topic: q.topic, topicName: TOPICS[q.topic].name, q: q.q, options: q.options });

function pick(mode, topic, id) {
  const L = learner(id);
  if (mode === 'topic') return shuffle(BANK.filter(q => q.topic === topic));
  if (mode === 'weak') {
    const wrong = BANK.filter(q => { const l = latest(L, q.id); return l && !l.c; });
    return shuffle(wrong.length ? wrong : BANK.filter(q => !latest(L, q.id))).slice(0, 10);
  }
  return shuffle(Object.keys(TOPICS).flatMap(k => shuffle(BANK.filter(q => q.topic === k)).slice(0, 4)));
}

/* ---------- HTTP API ---------- */
const okId = s => typeof s === 'string' && /^[\w-]{8,64}$/.test(s);
function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': (type || 'application/json') + '; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(type ? body : JSON.stringify(body));
}
function readBody(req, cb) {
  let s = ''; req.on('data', c => { s += c; if (s.length > 10000) req.destroy(); });
  req.on('end', () => { try { cb(JSON.parse(s || '{}')); } catch (e) { cb(null); } });
}


/* ---------- Study planner: hours are split by exam weight, boosted for weak topics ---------- */
function makePlan(topics, days, hpw) {
  const weeks = Math.min(12, Math.max(1, Math.ceil(days / 7))), total = Math.round(weeks * hpw);
  const need = topics.map(t => t.weight * (0.5 + (100 - (t.answered ? t.pct : 0)) / 100)), sum = need.reduce((a, b) => a + b, 0);
  const split = topics.map((t, i) => ({ key: t.key, name: t.name, pct: t.pct, answered: t.answered, hours: Math.round(total * need[i] / sum * 10) / 10 }));
  const left = {}; split.forEach(x => { left[x.key] = x.hours; });
  const plan = [];
  for (let w = 1; w <= weeks; w++) {
    if (w === weeks) {
      plan.push({ week: w, focus: 'Mixed practice and review', tasks: ['Take two 12-question mixed practice sets', 'Repeat "Practise weak spots" until it is empty', 'Revise flashcards marked "Still learning"', 'Rest the day before the exam'] });
      continue;
    }
    const x = split.slice().sort((a, b) => left[b.key] - left[a.key])[0]; left[x.key] -= hpw;
    plan.push({ week: w, focus: x.name, tasks: ['Study the Microsoft Learn units for this area', 'Practise its quiz until you reach 80%', 'Revise its flashcards'] });
  }
  return { days, weeks, totalHours: total, hoursPerWeek: hpw, split, plan };
}

/* ---------- AI Study Buddy (Claude via the Anthropic API; offline glossary fallback) ---------- */
const LANGS = ['English', 'Kiswahili', 'Hausa', 'Yoruba', 'Amharic', 'French', 'Portuguese', 'Arabic'];
const BUDDY_PROMPT = [
  "You are an unofficial AZ-900 (Microsoft Azure Fundamentals) study buddy for learners across Africa. Answer ANY request that is about AZ-900, Azure fundamentals, the Azure Fundamentals certification, or how to prepare for it.",
  "You can: explain concepts and Azure services; compare options (IaaS/PaaS/SaaS, LRS/ZRS/GRS, VPN/ExpressRoute and similar); suggest which service fits a scenario; explain why an answer to a practice question is right or wrong; write NEW original practice questions with answers when asked; give mnemonics, summaries and study plans; and describe the three exam areas (cloud concepts 25-30%, Azure architecture and services 35-40%, management and governance 30-35%).",
  "Style: friendly, plain language, short sentences, define jargon. Usually under 150 words, up to 250 for comparisons or plans. Short lists are fine. When you explain a concept, include ONE accurate real-life African example (mobile money, a market stall, a bus network, a bank with branches in several cities) and end with one short check question without the answer.",
  "Facts that change (exam price, duration, number of questions, passing score, languages, retirement dates): say you are not certain and point to the official exam page on Microsoft Learn.",
  "Never reproduce real exam questions or brain-dump content. Original practice questions are fine; label them as unofficial practice.",
  "If a request is unrelated to AZ-900 or Azure fundamentals, politely say you only help with AZ-900 and offer an AZ-900 topic instead. Do not invent prices, limits, service names or features; if unsure, say so.",
  "If a learner progress line is given, use it to tailor study advice."
].join('\n');
const ANALOGY = { cloud: 'topping up airtime or data only when you need it, instead of building your own phone network.', arch: 'a bank with branches in several cities, so when one branch loses power the others keep serving customers.', mgmt: 'a market association that sets rules, puts an owner name on every stall and watches the accounts.' };
const INTENTS = [
  [/exam|domain|weight|skills|outline|pass|certif/i, 'The AZ-900 outline has three areas: cloud concepts (25-30%), Azure architecture and services (35-40%), and management and governance (30-35%). Check Microsoft Learn for current exam details such as duration, price and passing score.'],
  [/study|plan|tips|prepare|revise|how (do|should) i/i, 'Study tip: take a topic quiz, revisit every missed question, then revise flashcards you marked Still learning. Give most time to architecture and services, which carries the most weight.'],
  [/quiz me|test me|practice question/i, 'Open the Dashboard and start a topic quiz or Practise weak spots. When the AI is online, the buddy can also write extra practice questions for you.']
];
function offlineAnswer(message) {
  const m = message.toLowerCase(), out = [];
  FLASH.filter(c => m.includes(c.term.toLowerCase())).slice(0, 3).forEach(c => out.push(c.term + ': ' + c.def + ' Think of it like ' + ANALOGY[c.topic]));
  INTENTS.forEach(i => { if (i[0].test(message)) out.push(i[1]); });
  if (!out.length) out.push('Offline I know these terms: ' + FLASH.map(c => c.term).join(', ') + '.');
  return out.join('\n\n') + ' (Offline mode: set ANTHROPIC_API_KEY for the full AI buddy.)';
}
const hits = {};
function cleanHistory(h) {
  const out = [];
  (Array.isArray(h) ? h.slice(-8) : []).forEach(x => {
    if (!x || (x.role !== 'user' && x.role !== 'assistant') || typeof x.content !== 'string') return;
    if (!out.length && x.role !== 'user') return;
    if (out.length && out[out.length - 1].role === x.role) return;
    out.push({ role: x.role, content: x.content.slice(0, 1500) });
  });
  if (out.length && out[out.length - 1].role === 'user') out.pop();
  return out;
}
async function buddy(message, language, history, progressNote) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (key) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', signal: AbortSignal.timeout(25000),
        headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: 800, system: BUDDY_PROMPT + '\nReply in ' + language + '.' + (progressNote ? '\n' + progressNote : ''), messages: history.concat([{ role: 'user', content: message }]) })
      });
      const j = await r.json(), t = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
      if (t) return { reply: t, source: 'ai' };
    } catch (e) { /* fall through to offline mode */ }
  }
  return { source: 'offline', reply: offlineAnswer(message) };
}

const PUB = path.join(__dirname, 'public'), MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
function serveStatic(p, res) {
  const f = path.join(PUB, p === '/' ? 'index.html' : path.normalize(p));
  if (!f.startsWith(PUB)) return send(res, 403, { error: 'forbidden' });
  fs.readFile(f, (e, data) => {
    if (e) return send(res, 404, { error: 'not found' });
    res.writeHead(200, { 'Content-Type': (MIME[path.extname(f)] || 'application/octet-stream') + '; charset=utf-8' }); res.end(data);
  });
}

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost'), p = u.pathname, q = u.searchParams;
  if (req.method === 'GET' && !p.startsWith('/api/')) return serveStatic(p, res);
  if (req.method === 'GET' && p === '/api/progress') {
    return okId(q.get('learner')) ? send(res, 200, progress(q.get('learner'))) : send(res, 400, { error: 'bad learner id' });
  }
  if (req.method === 'GET' && p === '/api/questions') {
    if (!okId(q.get('learner'))) return send(res, 400, { error: 'bad learner id' });
    return send(res, 200, pick(q.get('mode'), q.get('topic'), q.get('learner')).map(strip));
  }
  if (req.method === 'POST' && (p === '/api/answer' || p === '/api/reset')) {
    return readBody(req, b => {
      if (!b || !okId(b.learner)) return send(res, 400, { error: 'bad request' });
      if (p === '/api/reset') { delete db.learners[b.learner]; save(); return send(res, 200, { ok: true }); }
      const item = BANK.find(x => x.id === b.id);
      if (!item || !Number.isInteger(b.choice) || b.choice < 0 || b.choice >= item.options.length) return send(res, 400, { error: 'bad question or choice' });
      const L = learner(b.learner), c = b.choice === item.answer;
      (L.a[item.id] = L.a[item.id] || []).push({ c, t: Date.now() }); save();
      send(res, 200, { correct: c, answer: item.answer, explain: item.explain });
    });
  }
  if (req.method === 'GET' && p === '/api/cards') {
    if (!okId(q.get('learner'))) return send(res, 400, { error: 'bad learner id' });
    const f = learner(q.get('learner')).f || {};
    const box = c => (f[c.id] ? f[c.id].box : -1); // -1 = never seen, 0 = missed, 3 = mastered
    const rank = c => (box(c) === 0 ? 0 : box(c) === -1 ? 1 : box(c) + 1); // missed, new, then boxes 1-2
    const deck = shuffle(FLASH).filter(c => box(c) < 3).sort((a, b) => rank(a) - rank(b)).slice(0, 12);
    return send(res, 200, deck.map(c => ({ id: c.id, term: c.term, def: c.def, topicName: TOPICS[c.topic].name, box: box(c) })));
  }
  if (req.method === 'POST' && p === '/api/card') {
    return readBody(req, b => {
      if (!b || !okId(b.learner) || !FLASH.some(c => c.id === b.id)) return send(res, 400, { error: 'bad request' });
      const L = learner(b.learner); L.f = L.f || {};
      const cur = L.f[b.id] ? L.f[b.id].box : 0;
      L.f[b.id] = { box: b.known ? Math.min(3, cur + 1) : 0, t: Date.now() }; save();
      send(res, 200, { box: L.f[b.id].box });
    });
  }
  if (req.method === 'POST' && p === '/api/plan') {
    return readBody(req, b => {
      if (!b || !okId(b.learner)) return send(res, 400, { error: 'bad request' });
      const days = Math.ceil((new Date(b.examDate) - Date.now()) / 864e5), hpw = Number(b.hoursPerWeek);
      if (!(days >= 1) || !(hpw > 0 && hpw <= 60)) return send(res, 400, { error: 'Choose a future exam date and 1 to 60 hours per week.' });
      send(res, 200, makePlan(progress(b.learner).topics, days, hpw));
    });
  }
  if (req.method === 'POST' && p === '/api/buddy') {
    return readBody(req, async b => {
      const msg = b && typeof b.message === 'string' ? b.message.trim().slice(0, 800) : '';
      if (!b || !okId(b.learner) || !msg) return send(res, 400, { error: 'Type a question first.' });
      const now = Date.now(), h = (hits[b.learner] = (hits[b.learner] || []).filter(t => now - t < 3600000));
      if (h.length >= 20) return send(res, 429, { error: 'Limit reached: 20 questions per hour. Take a short break.' });
      h.push(now);
      const pr = progress(b.learner), weakest = pr.topics.slice().sort((x, y) => x.pct - y.pct)[0];
      const note = pr.answered ? 'Learner progress: readiness ' + pr.readiness + '%, weakest topic ' + weakest.name + ' (' + weakest.pct + '%).' : '';
      send(res, 200, await buddy(msg, LANGS.includes(b.language) ? b.language : 'English', cleanHistory(b.history), note));
    });
  }
  if (req.method === 'GET' && p === '/api/languages') return send(res, 200, LANGS);
  send(res, 404, { error: 'not found' });
}).listen(PORT, () => console.log('AZ-900 Practice Studio (unofficial) on http://localhost:' + PORT));
//--------------------
// ... keep your existing server creation code up here ...

const server = http.createServer((req, res) => {
    // Your existing request handling logic
});

// ONLY listen locally if not running on Vercel
if (process.env.NODE_ENV !== 'production') {
    server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

// Export the server for Vercel's serverless runtime
module.exports = server;
