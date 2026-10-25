// Help chat: round chat icon (bottom-right) -> ready-made questions only. One fixed answer per question (English / Bangla).
(() => {
  const L = {
    about: { href: '#about', en: 'About us', bn: 'আমাদের সম্পর্কে' },
    projects: { href: '#projects', en: 'Go to Projects', bn: 'প্রজেক্ট দেখুন' },
    hire: { href: '#hire', en: 'Hire me section', bn: 'Hire me সেকশন' },
    donate: { href: '#donate', en: 'Donate section', bn: 'Donate সেকশন' },
    supporters: { href: '#supporters', en: 'Supporters list', bn: 'Supporters তালিকা' },
    privacy: { href: 'privacy.html', en: 'Privacy Policy', bn: 'Privacy Policy' },
    email: { href: 'mailto:technexofficial12@gmail.com', en: 'Email us', bn: 'ইমেইল করুন', ext: true },
    discord: { href: 'https://discord.gg/DzrXTfEmYC', en: 'Join Discord', bn: 'Discord এ আসুন', ext: true }
  };
  // g = group, q = question, a = the one fixed answer, l = link buttons shown under the answer
  const FAQ = [
    { g: 'buy', l: ['projects'],
      q: { en: 'How do I buy a project? (A to Z guide)', bn: 'প্রজেক্ট কীভাবে কিনব? (A থেকে Z গাইড)' },
      a: { en: 'Step by step:\n1) Open Projects and find a project with the PAID tag.\n2) Click "Unlock 🔒" to see the price and our wallet address.\n3) Send the exact price in USDT to that address on an EVM network (BEP20, ERC20, Polygon…).\n4) Take a screenshot of the successful payment.\n5) In the same window enter your email or Discord, upload the screenshot and press "Submit payment proof".\n6) Save the request code you get.\n7) Wait for admin approval (up to 24 hours).\n8) Come back, enter your request code and press "Check status" to get your key.\n9) Press Unlock. The card then shows "View project".',
           bn: 'ধাপে ধাপে:\n১) Projects এ গিয়ে PAID ট্যাগওয়ালা প্রজেক্ট খুঁজুন।\n২) "Unlock 🔒" চাপুন, সেখানে মূল্য ও আমাদের ওয়ালেট অ্যাড্রেস দেখবেন।\n৩) EVM নেটওয়ার্কে (BEP20, ERC20, Polygon…) ওই অ্যাড্রেসে ঠিক মূল্য USDT পাঠান।\n৪) সফল পেমেন্টের একটি স্ক্রিনশট নিন।\n৫) একই উইন্ডোতে ইমেইল বা Discord দিন, স্ক্রিনশট আপলোড করে "Submit payment proof" চাপুন।\n৬) যে request code পাবেন সেটি সেভ করে রাখুন।\n৭) অ্যাডমিনের অ্যাপ্রুভালের জন্য অপেক্ষা করুন (সর্বোচ্চ ২৪ ঘণ্টা)।\n৮) আবার এসে request code দিয়ে "Check status" চাপুন, আপনার কী পাবেন।\n৯) Unlock চাপুন। এরপর কার্ডে "View project" দেখাবে।' } },
    { g: 'buy', l: ['projects'],
      q: { en: 'What is the difference between Free and Paid projects?', bn: 'ফ্রি আর পেইড প্রজেক্টের পার্থক্য কী?' },
      a: { en: 'Free projects open directly with "View project". Paid projects stay locked and need an access key, which you get after payment and admin approval.', bn: 'ফ্রি প্রজেক্ট "View project" চাপলেই সরাসরি খোলে। পেইড প্রজেক্ট লক করা থাকে, খুলতে অ্যাক্সেস কী লাগে। পেমেন্ট ও অ্যাডমিনের অ্যাপ্রুভালের পর কী পাওয়া যায়।' } },
    { g: 'buy', l: ['projects', 'donate'],
      q: { en: 'Where can I see the price and wallet address?', bn: 'মূল্য ও ওয়ালেট অ্যাড্রেস কোথায় দেখব?' },
      a: { en: 'The price is on the project card (PAID · amount). Click "Unlock 🔒" to see the full price and our wallet address. The same address is also in the Donate section.', bn: 'প্রজেক্ট কার্ডে মূল্য লেখা থাকে (PAID · পরিমাণ)। "Unlock 🔒" চাপলে পুরো মূল্য ও আমাদের ওয়ালেট অ্যাড্রেস দেখবেন। একই অ্যাড্রেস Donate সেকশনেও আছে।' } },
    { g: 'buy', l: [],
      q: { en: 'How do I send the payment?', bn: 'পেমেন্ট কীভাবে পাঠাব?' },
      a: { en: 'Open your crypto wallet or exchange and choose Send. Paste our wallet address, pick the network (BEP20, ERC20, Polygon…) and the token (USDT), enter the exact price and confirm. Check the first and last characters of the address before sending. Never share your seed phrase with anyone.', bn: 'আপনার ক্রিপ্টো ওয়ালেট বা এক্সচেঞ্জে গিয়ে Send চাপুন। আমাদের ওয়ালেট অ্যাড্রেস পেস্ট করুন, নেটওয়ার্ক (BEP20, ERC20, Polygon…) ও টোকেন (USDT) বেছে নিন, ঠিক মূল্য লিখে কনফার্ম করুন। পাঠানোর আগে অ্যাড্রেসের শুরু ও শেষ অংশ মিলিয়ে নিন। সিড ফ্রেজ কাউকে দেবেন না।' } },
    { g: 'buy', l: [],
      q: { en: 'What should my payment screenshot show?', bn: 'পেমেন্টের স্ক্রিনশটে কী কী থাকতে হবে?' },
      a: { en: 'It should clearly show the amount, our receiving address, the network and token, a successful or confirmed status, and the date or transaction hash.', bn: 'স্ক্রিনশটে স্পষ্টভাবে থাকতে হবে: পরিমাণ, আমাদের রিসিভিং অ্যাড্রেস, নেটওয়ার্ক ও টোকেন, সফল বা কনফার্মড স্ট্যাটাস এবং তারিখ বা ট্রানজেকশন হ্যাশ।' } },
    { g: 'buy', l: ['projects'],
      q: { en: 'How do I submit my payment proof?', bn: 'পেমেন্টের প্রুফ কীভাবে জমা দেব?' },
      a: { en: 'In the Unlock window go to "Buy access": enter your email or Discord, optionally paste the transaction hash, choose your screenshot (PNG, JPG or WEBP, up to 20 MB) and press "Submit payment proof". You will receive a request code.', bn: 'Unlock উইন্ডোর "Buy access" অংশে ইমেইল বা Discord দিন, চাইলে ট্রানজেকশন হ্যাশ পেস্ট করুন, স্ক্রিনশট (PNG, JPG বা WEBP, সর্বোচ্চ ২০ MB) বেছে নিয়ে "Submit payment proof" চাপুন। আপনি একটি request code পাবেন।' } },
    { g: 'buy', l: [],
      q: { en: 'What is the request code?', bn: 'Request code কী?' },
      a: { en: 'It is a long secret code shown after you submit your proof. It lets you check your request status and get your key. Save it somewhere safe and do not share it with anyone.', bn: 'প্রুফ জমা দেওয়ার পর যে লম্বা গোপন কোডটি দেখায় সেটিই request code। এটি দিয়ে রিকোয়েস্টের স্ট্যাটাস দেখা ও কী পাওয়া যায়। কোডটি নিরাপদ জায়গায় সেভ রাখুন এবং কাউকে দেবেন না।' } },
    { g: 'buy', l: [],
      q: { en: 'How long until I get my key?', bn: 'কী পেতে কত সময় লাগে?' },
      a: { en: 'The admin usually reviews payment screenshots within 24 hours. When it is approved, your key shows under "Check status".', bn: 'অ্যাডমিন সাধারণত ২৪ ঘণ্টার মধ্যে পেমেন্টের স্ক্রিনশট যাচাই করেন। অ্যাপ্রুভ হলে "Check status" এ আপনার কী দেখাবে।' } },
    { g: 'buy', l: ['projects'],
      q: { en: 'How do I get my key after approval?', bn: 'অ্যাপ্রুভ হওয়ার পর কী কীভাবে পাব?' },
      a: { en: 'Open the project\'s Unlock window, paste your request code in the last box and press "Check status". Your key appears and fills in automatically. This browser remembers your request code, so the project usually unlocks by itself the next time you visit.', bn: 'প্রজেক্টের Unlock উইন্ডো খুলে একদম নিচের বক্সে request code বসিয়ে "Check status" চাপুন। আপনার কী দেখাবে এবং নিজে থেকেই বসে যাবে। এই ব্রাউজারে request code সেভ থাকে, তাই পরের বার ঢুকলে সাধারণত নিজে থেকেই আনলক হয়ে যায়।' } },
    { g: 'buy', l: ['projects'],
      q: { en: 'How do I unlock the project with my key?', bn: 'কী দিয়ে প্রজেক্ট কীভাবে আনলক করব?' },
      a: { en: 'Open the project\'s Unlock window, paste your key (TNX-XXXXXX-…) in the first box and press Unlock. The "Unlock 🔒" button on the card is then replaced by "View project".', bn: 'প্রজেক্টের Unlock উইন্ডো খুলে প্রথম বক্সে আপনার কী (TNX-XXXXXX-…) পেস্ট করে Unlock চাপুন। এরপর কার্ডের "Unlock 🔒" বাটনের জায়গায় "View project" দেখাবে।' } },
    { g: 'buy', l: [],
      q: { en: 'Do I need to enter the key every time?', bn: 'প্রতিবার কি কী দিতে হবে?' },
      a: { en: 'No. This browser remembers your key, so the project stays unlocked after a refresh. If you clear browser data or use another device or browser, enter the key again. A key works on a limited number of devices.', bn: 'না। এই ব্রাউজার আপনার কী মনে রাখে, তাই রিফ্রেশ করলেও প্রজেক্ট আনলক থাকে। ব্রাউজারের ডেটা মুছলে বা অন্য ডিভাইস বা ব্রাউজার ব্যবহার করলে আবার কী দিতে হবে। একটি কী সীমিত সংখ্যক ডিভাইসে চলে।' } },
    { g: 'buy', l: ['email', 'discord'],
      q: { en: 'My key says invalid or device limit', bn: 'কী "invalid" বা ডিভাইস লিমিট দেখাচ্ছে' },
      a: { en: 'Check that you copied the full key (TNX-XXXXXX-…) for the same project. A key works on a limited number of devices (usually 2). If it was revoked or the limit is reached, email us with your request code and we will help.', bn: 'কী (TNX-XXXXXX-… আকারে) পুরোটা এবং ঠিক ওই প্রজেক্টের জন্যই কপি করেছেন কিনা দেখুন। একটি কী সীমিত সংখ্যক ডিভাইসে (সাধারণত ২টি) চলে। কী বাতিল হয়ে গেলে বা ডিভাইসের সীমা শেষ হলে আপনার request code সহ আমাদের ইমেইল করুন, আমরা সাহায্য করব।' } },
    { g: 'buy', l: ['email', 'discord'],
      q: { en: 'I lost my request code or key', bn: 'আমার request code বা কী হারিয়ে গেছে' },
      a: { en: 'Email technexofficial12@gmail.com with the contact you used, the project name and your transaction hash or payment screenshot. We will check and help you.', bn: 'technexofficial12@gmail.com এ ইমেইল করুন। যে ইমেইল বা Discord দিয়েছিলেন, প্রজেক্টের নাম এবং ট্রানজেকশন হ্যাশ বা পেমেন্টের স্ক্রিনশট সঙ্গে দিন। আমরা যাচাই করে সাহায্য করব।' } },
    { g: 'buy', l: ['projects', 'email'],
      q: { en: 'My request was rejected. What now?', bn: 'আমার রিকোয়েস্ট রিজেক্ট হয়েছে, এখন কী করব?' },
      a: { en: 'Open the Unlock window and press "Check status" to read the admin\'s note. Fix the problem (for example a missing or unclear screenshot) and submit a new proof, or contact us.', bn: 'Unlock উইন্ডোতে "Check status" চেপে অ্যাডমিনের নোট পড়ুন। সমস্যাটি ঠিক করে (যেমন স্ক্রিনশট না থাকা বা অস্পষ্ট হওয়া) নতুন প্রুফ জমা দিন, অথবা আমাদের সাথে যোগাযোগ করুন।' } },

    { g: 'crypto', l: ['donate'],
      q: { en: 'Which crypto and network can I send?', bn: 'কোন ক্রিপ্টো ও নেটওয়ার্কে পাঠাব?' },
      a: { en: 'Our wallet is an EVM address (starts with 0x). Use Ethereum, BNB Smart Chain (BEP20), Polygon, Arbitrum, Optimism or Base with tokens like USDT/USDC, ETH or BNB. Do NOT send BTC, TRON (TRC20) or Solana to it: those funds will be lost. If unsure, send a small test amount first.', bn: 'আমাদের ওয়ালেট একটি EVM অ্যাড্রেস (0x দিয়ে শুরু)। Ethereum, BNB Smart Chain (BEP20), Polygon, Arbitrum, Optimism বা Base নেটওয়ার্কে USDT/USDC, ETH বা BNB পাঠাতে পারেন। BTC, TRON (TRC20) বা Solana পাঠাবেন না, এই অ্যাড্রেসে পাঠালে টাকা হারিয়ে যাবে। নিশ্চিত না হলে আগে অল্প পরিমাণ পাঠিয়ে পরীক্ষা করুন।' } },
    { g: 'crypto', l: ['email', 'discord'],
      q: { en: 'I sent on the wrong network', bn: 'ভুল নেটওয়ার্কে পাঠিয়ে ফেলেছি' },
      a: { en: 'Contact us right away at technexofficial12@gmail.com with the transaction hash and the network you used. Funds sent on a wrong network may not be recoverable, so we cannot promise a fix, but we will check.', bn: 'এখনই technexofficial12@gmail.com এ ট্রানজেকশন হ্যাশ ও ব্যবহৃত নেটওয়ার্কের নাম সহ যোগাযোগ করুন। ভুল নেটওয়ার্কে পাঠানো টাকা ফেরত পাওয়া নাও যেতে পারে, তাই নিশ্চিত করে কিছু বলতে পারি না, তবে আমরা দেখব।' } },

    { g: 'donate', l: ['donate', 'supporters'],
      q: { en: 'How can I donate / support Technex?', bn: 'কীভাবে ডোনেট করব?' },
      a: { en: 'Go to the Donate section, copy the wallet address or scan the QR code, and send from an EVM network. Double-check the address before sending.', bn: 'Donate সেকশনে গিয়ে ওয়ালেট অ্যাড্রেস কপি করুন বা QR কোড স্ক্যান করুন, তারপর EVM নেটওয়ার্ক থেকে পাঠান। পাঠানোর আগে অ্যাড্রেস মিলিয়ে নিন।' } },
    { g: 'donate', l: ['supporters', 'discord', 'email'],
      q: { en: 'How do I get my name in the Supporters list?', bn: 'Supporters তালিকায় আমার নাম কীভাবে আসবে?' },
      a: { en: 'After you donate, message us on Discord or email with your transaction hash and the name or nickname you want shown. The admin adds it to the Supporters list.', bn: 'ডোনেট করার পর Discord বা ইমেইলে ট্রানজেকশন হ্যাশ এবং যে নাম বা ডাকনাম দেখাতে চান তা জানান। অ্যাডমিন সেটি Supporters তালিকায় যোগ করবেন।' } },

    { g: 'other', l: ['about'],
      q: { en: 'What is Technex?', bn: 'Technex কী?' },
      a: { en: 'Technex Ltd. is a website developer group. This site lists free and paid projects, tools and new releases from the Technex community. We also build Discord servers and websites.', bn: 'Technex Ltd. একটি ওয়েবসাইট ডেভেলপার গ্রুপ। এই সাইটে Technex কমিউনিটির ফ্রি ও পেইড প্রজেক্ট, টুল ও নতুন রিলিজ পাবেন। আমরা Discord সার্ভার এবং ওয়েবসাইটও বানিয়ে দিই।' } },
    { g: 'other', l: ['projects'],
      q: { en: 'How do I use a free project?', bn: 'ফ্রি প্রজেক্ট কীভাবে ব্যবহার করব?' },
      a: { en: 'Free projects have a "View project" button. Click it to open the GitHub page, then use or download the project from there.', bn: 'ফ্রি প্রজেক্টে "View project" বাটন থাকে। বাটনে ক্লিক করলে GitHub পেজ খুলবে, সেখান থেকে প্রজেক্টটি ব্যবহার বা ডাউনলোড করতে পারবেন।' } },
    { g: 'other', l: ['hire', 'discord', 'email'],
      q: { en: 'Can you build a Discord server or website for me?', bn: 'Discord সার্ভার বা ওয়েবসাইট বানিয়ে দেবেন?' },
      a: { en: 'Yes. See the Hire me section, then contact us on Discord or by email with what you need, your budget and your deadline.', bn: 'হ্যাঁ। Hire me সেকশন দেখুন, তারপর Discord বা ইমেইলে আপনার প্রয়োজন, বাজেট ও ডেডলাইন জানান।' } },
    { g: 'other', l: ['email', 'discord'],
      q: { en: 'How do I contact you?', bn: 'কীভাবে যোগাযোগ করব?' },
      a: { en: 'Email technexofficial12@gmail.com or join our Discord. For payment or key problems, include your request code.', bn: 'technexofficial12@gmail.com এ ইমেইল করুন বা আমাদের Discord এ আসুন। পেমেন্ট বা কী সংক্রান্ত সমস্যা হলে সঙ্গে request code দিন।' } },
    { g: 'other', l: ['privacy'],
      q: { en: 'Is my data safe?', bn: 'আমার তথ্য কি নিরাপদ?' },
      a: { en: 'We do not sell your data and only keep what is needed (visit country, and payment proof for paid requests). Payment screenshots are private and only admins can see them. Read the full Privacy Policy for details.', bn: 'আমরা আপনার তথ্য বিক্রি করি না, শুধু প্রয়োজনীয় তথ্য রাখি (ভিজিটের দেশ, পেইড প্রজেক্টের জন্য পেমেন্ট প্রুফ)। পেমেন্টের স্ক্রিনশট প্রাইভেট, শুধু অ্যাডমিন দেখতে পারেন। বিস্তারিত Privacy Policy তে আছে।' } },
    { g: 'other', l: [],
      q: { en: 'Can I install the site as an app?', bn: 'সাইটটি কি অ্যাপ হিসেবে ইনস্টল করা যায়?' },
      a: { en: 'Yes. On Android or PC use the "Install app" button on the home page, or the browser menu → Install app. On iPhone: Safari → Share → Add to Home Screen.', bn: 'হ্যাঁ। Android বা পিসিতে হোম পেজের "Install app" বাটন ব্যবহার করুন, অথবা ব্রাউজার মেনু থেকে Install app। iPhone এ Safari তে Share → Add to Home Screen।' } },
    { g: 'other', l: [],
      q: { en: 'Why does the site say "Under maintenance"?', bn: 'সাইটে "Under maintenance" দেখাচ্ছে কেন?' },
      a: { en: 'We are updating the site. When the countdown ends, the page returns to normal automatically.', bn: 'আমরা সাইট আপডেট করছি। কাউন্টডাউন শেষ হলে পেজ নিজে থেকেই আবার স্বাভাবিক হয়ে যাবে।' } }
  ];
  const T = {
    en: { title: 'Help Center', hi: 'Hi! Tap a question below and I will answer it.', pick: 'Pick a question', clear: 'Clear chat', open: 'Open help chat', close: 'Close',
          g: { buy: 'Buying a project (A–Z)', crypto: 'Crypto & network', donate: 'Donate & support', other: 'Other' } },
    bn: { title: 'সহায়তা কেন্দ্র', hi: 'হ্যালো! নিচের যেকোনো প্রশ্নে ট্যাপ করুন, আমি উত্তর দেব।', pick: 'একটি প্রশ্ন বেছে নিন', clear: 'চ্যাট মুছুন', open: 'হেল্প চ্যাট খুলুন', close: 'বন্ধ',
          g: { buy: 'প্রজেক্ট কেনা (A–Z)', crypto: 'ক্রিপ্টো ও নেটওয়ার্ক', donate: 'ডোনেট ও সাপোর্ট', other: 'অন্যান্য' } }
  };
  let lang = localStorage.getItem('tnx_lang') || ((navigator.language || '').toLowerCase().startsWith('bn') ? 'bn' : 'en');
  let msgs = [];
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

  const fab = el('button', 'hp-fab'); fab.type = 'button'; fab.setAttribute('aria-expanded', 'false');
  fab.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.7 8.7 0 0 1-3.6-.8L3 21l1.9-5.1A8.4 8.4 0 1 1 21 11.5z"/><circle cx="8.5" cy="11.5" r=".6" fill="currentColor"/><circle cx="12" cy="11.5" r=".6" fill="currentColor"/><circle cx="15.5" cy="11.5" r=".6" fill="currentColor"/></svg>';
  const panel = el('div', 'hp-panel hidden'); panel.setAttribute('role', 'dialog');
  const head = el('div', 'hp-head'), title = el('strong'), langs = el('div', 'hp-lang'), clearBtn = el('button', 'hp-x', '↺'), closeBtn = el('button', 'hp-x', '×');
  const bEn = el('button', '', 'EN'), bBn = el('button', '', 'বাংলা');
  [bEn, bBn, clearBtn, closeBtn].forEach(b => b.type = 'button');
  langs.append(bEn, bBn); head.append(title, langs, clearBtn, closeBtn);
  const body = el('div', 'hp-body'); panel.append(head, body); document.body.append(fab, panel);

  function render() {
    const t = T[lang];
    title.textContent = t.title; fab.setAttribute('aria-label', t.open); closeBtn.setAttribute('aria-label', t.close); clearBtn.title = t.clear; clearBtn.setAttribute('aria-label', t.clear);
    bEn.classList.toggle('on', lang === 'en'); bBn.classList.toggle('on', lang === 'bn');
    body.textContent = ''; body.append(el('div', 'hp-msg bot', t.hi));
    let lastUser = null;
    msgs.forEach(i => {
      lastUser = el('div', 'hp-msg user', FAQ[i].q[lang]); body.append(lastUser);
      const b = el('div', 'hp-msg bot'); b.append(el('div', '', FAQ[i].a[lang]));
      if (FAQ[i].l.length) { const row = el('div', 'hp-links'); FAQ[i].l.forEach(k => { const d = L[k], a = el('a', '', d[lang] + (d.ext ? ' ↗' : '')); a.href = d.href; if (d.ext) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } else a.addEventListener('click', () => toggle(false)); row.append(a); }); b.append(row); }
      body.append(b);
    });
    body.append(el('div', 'hp-sug-title', t.pick));
    Object.keys(t.g).forEach(g => {
      body.append(el('div', 'hp-group', t.g[g]));
      FAQ.forEach((f, i) => { if (f.g !== g) return; const q = el('button', 'hp-q', f.q[lang]); q.type = 'button'; q.addEventListener('click', () => { msgs.push(i); render(); }); body.append(q); });
    });
    body.scrollTop = lastUser ? Math.max(0, lastUser.offsetTop - 10) : 0;
  }
  function toggle(open) {
    const show = open === undefined ? panel.classList.contains('hidden') : open;
    panel.classList.toggle('hidden', !show); fab.setAttribute('aria-expanded', String(show));
    if (show) render();
  }
  const setLang = (l) => { lang = l; localStorage.setItem('tnx_lang', l); render(); };
  fab.addEventListener('click', () => toggle());
  closeBtn.addEventListener('click', () => toggle(false));
  clearBtn.addEventListener('click', () => { msgs = []; render(); });
  bEn.addEventListener('click', () => setLang('en')); bBn.addEventListener('click', () => setLang('bn'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.classList.contains('hidden')) toggle(false); });
  render();
})();
