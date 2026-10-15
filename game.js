import { db } from "./supabase.js";

const FLAG = "FLAG{y0u_cr4ck3d_th3_s1mpl3_b0x}";

// ===========================================================================
//  TERMINAL GAME  —  find the vault, find the key, find the code
//
//  You play a read-only guest session on a small simulated machine.
//  Somewhere in the tree there is a vault. Somewhere else there is the key
//  and the code that open it. You get there with four commands: ls, cd,
//  cat and unlock.
//
//  To start, you pick a 3-character handle (A-Z, 0-9). It shows up in every
//  prompt, the way a real machine prints your username.
//
//  Pick the right difficulty when prompted — each level you clear unlocks a
//  bigger, messier tree for the next run, so the game gets harder every time.
// ===========================================================================


// ===========================================================================
//  THE FILESYSTEM
//  A plain nested object. A string is a file; an object is a directory.
//  That one rule is the whole data model, which is why `cat` can tell a file
//  from a directory with `typeof`.
// ===========================================================================
function makeTree(level) {

  // ---- level 1: a tidy little machine -------------------------------------
  if (level === 1) {
    const t = {
      home: {
        "readme.txt": "the vault is somewhere in this tree. it needs a key and a code.",
        notes: {
          "todo.txt": "1. find the vault   2. find the key   3. find the code"
        }
      },
      var: {
        log: { "auth.log": "user guest logged in\nuser guest denied: /var/vault" },
        vault: {
          "READ_ME": "be standing in this directory, then run secret.",
          "secret": "VAULT SEALED - need key + code"
        }
      },
      etc: {
        config: {
          "keys.txt": "KEY = blue-otter-77",
          "codes.txt": "CODE = 0815"
        }
      }
    };
    t.__vaultPath = "/var/vault";
    t.__keyText   = "blue-otter-77";
    t.__codeText  = "0815";
    return t;
  }

  // ---- level 2: deeper, split, with decoy branches -------------------------
  if (level === 2) {
    const t = {
      home: {
        "readme.txt": "deeper machine. the vault is no longer next to its key.",
        ops: {
          "handover.txt": "vault moved under /srv. key went to /etc, codes stayed home.",
          "old": { "notes.bak": "ignore this, it predates the move." }
        },
        archive: {
          "index": "1 entry. unremarkable.",
          codes: { "codes.txt": "CODE = 7-voltaic-ray" }
        }
      },
      etc: {
        config: { "keys.txt": "KEY = amber-wolf-214" },
        cron: { "rotate.log": "last rotation 2026-01-02: no changes." }
      },
      srv: {
        "README": "storage tier. two directories, one of them is the goal.",
        media: { "cat.jpg": "not a real image. just a name.", "cat2.jpg": "nor this." },
        deep: {
          vault: {
            "READ_ME": "stand in /srv/deep/vault, then run secret.",
            "secret": "VAULT SEALED - need key + code"
          }
        }
      },
      var: { log: { "auth.log": "guest read /srv/deep ... nothing to see." } }
    };
    t.__vaultPath = "/srv/deep/vault";
    t.__keyText   = "amber-wolf-214";
    t.__codeText  = "7-voltaic-ray";
    return t;
  }

  // ---- level 3+: generated. bigger every time you clear it. ---------------
  // Names come from mundane pools so nothing stands out, and each run is
  // filled with dead ends that look exactly like the real ones.
  let seed = (0x9E3779B1 ^ Math.imul(level, 2654435761)) | 0;
  const rnd = () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = arr => arr[Math.floor(rnd() * arr.length)];

  // Names taken from what real machines actually contain. Grouped so the mix
  // in any one tree covers several kinds of system rather than one flavour.
  const DIRS = [
    // core unix filesystem
    "bin","sbin","lib","lib64","libexec","share","include","local","opt","srv",
    "mnt","media","run","tmp","var","usr","etc","proc","sys","dev","boot","root",
    // classic /var and /etc children
    "log","logs","spool","mail","crash","lock","cache","tmpfiles.d","cron.d",
    "cron.daily","cron.hourly","systemd","init.d","default","alternatives",
    "apt","dpkg","yum.repos.d","pkgconfig","ssl","certs","ssh","pam.d","sudoers.d",
    // home / windows profile shapes
    "Desktop","Documents","Downloads","Pictures","Music","Videos","Public",
    "AppData","Local","Roaming","Application Data","ProgramData","Program Files",
    "Users","Profiles","Favorites","Contacts","Templates","Recent","Start Menu",
    // build, cache and package trees
    "node_modules","dist","build","out","target","vendor","obj","binaries",
    "packages","pkg","wheels","gems","site-packages","__pycache__","coverage",
    "releases","artifacts","staging","deploy","installers","patches","updates",
    // data, storage and databases
    "data","db","sqlite","postgres","mysql","mongo","redis","elasticsearch",
    "indexes","shards","partitions","segments","chunks","blobs","objects",
    "snapshots","backups","backup","archive","archives","cold","warm","hot",
    "volumes","mounts","images","containers","overlay2","layers","manifests",
    // networking and services
    "net","network","interfaces","routes","firewall","iptables","nginx","apache2",
    "sites-available","sites-enabled","conf.d","vhosts","proxy","dns","dhcp",
    // misc plausible filler
    "queue","jobs","workers","tasks","agents","nodes","cluster","fleet","registry",
    "telemetry","audit","reports","exports","imports","incoming","outgoing",
    "processed","pending","failed","retry","orphaned","trash","quarantine",
    "plugins","extensions","modules","themes","assets","static","fonts","locale",
    "i18n","docs","man","info","examples","samples","fixtures","templates",
    "legacy","deprecated","unused","scratch","sandbox","test","tests","spec",
  ];
  const FILES = ["README","README.md","TODO","NOTES","CHANGELOG","VERSION","LICENSE",
                 "MANIFEST","Makefile","Dockerfile","config","config.bak","config.old",
                 "settings","defaults","schema","index","index.bak","data","data.1",
                 "payload","segment","access.log","error.log","debug.log","syslog",
                 "audit.log","stdout","stderr","pid","lock","state","status","health",
                 "metrics","cache.db","store.db","queue.db","session.db","journal",
                 "known_hosts","hosts","resolv.conf","fstab","crontab","env",
                 "dump.sql","dump.sql.gz","export.csv","export.json","snapshot.tar"];
  const TEXT = ["nothing of interest here.", "deprecated. kept for audit.",
                "see change request CR-2291.", "generated during provisioning.",
                "if you are reading this, you are probably lost.",
                "do not trust the timestamps.", "superseded by the 2026 migration.",
                "retained for compliance. not restored.", "owner left the company.",
                "safe to delete once the audit closes."];

  const decoyText = () => rnd() < 0.5
    ? pick(TEXT)
    : Array.from({length: ri(2, 7)}, () => pick(["status=ok","retries=3","timeout=30",
        "owner=sre","buffer=8192","workers=4","last_run=2026-03-02 01:12"])).join("\n");

  // build a directory: filler files, plus deeper filler if depth allows
  function fill(depth, width) {
    const kids = {};
    const n = ri(1, width);
    for (let i = 0; i < n; i++) {
      let name = pick(DIRS);
      const style = rnd();
      if      (style < 0.10) name += "-" + ri(0, 99);            // cache-07
      else if (style < 0.16) name += "." + pick(["old","bak","orig","save","rpmnew","dpkg-new"]);
      else if (style < 0.21) name += "_" + ri(2023, 2026);       // backup_2024
      else if (style < 0.26) name += "-" + pick(["prod","stage","dev","test","eu","us"]);
      else if (style < 0.29) name += ".d";                       // conf.d style
      if (kids[name]) continue;
      const d = {};
      for (let f = 0; f < ri(0, 4); f++) {
        let fn = pick(FILES);
        if (d[fn]) fn += "-" + ri(0, 999);
        d[fn] = decoyText();
      }
      if (depth > 1) Object.assign(d, fill(depth - 1, width));
      kids[name] = d;
    }
    return kids;
  }

  const depth = 2 + Math.min(level - 2, 4);
  const width = 2 + Math.min(level, 5);

  // where things live this run. the vault is always under /srv, but at a
  // different depth each time; the key and code go into other branches.
  const vaultSteps = Array.from({length: ri(2, Math.min(2 + level, 6))}, () => pick(DIRS));
  const keySteps   = Array.from({length: ri(1, 3)}, () => pick(DIRS));
  const codeSteps  = Array.from({length: ri(1, 3)}, () => pick(DIRS));

  const GATE = "gate-" + ri(100, 999);
  const PASS = ri(1000, 9999);

  const srv = {};
  // noise on every other branch
  const tree = { home: {}, etc: {}, srv: srv, var: {}, opt: {}, usr: {} };
  for (const top of ["home","etc","srv","var","opt","usr"]) {
    Object.assign(tree[top], fill(depth, width));
  }

  // the vault at the end of a random /srv path
  let cur = srv;
  for (const step of vaultSteps) {
    if (typeof cur[step] !== "object") cur[step] = {};
    cur = cur[step];
    Object.assign(cur, fill(1, width));
  }
  cur["vault"] = {
    "READ_ME": "stand in this directory, then run secret.",
    "secret": "VAULT SEALED - need key + code"
  };

  // the key, somewhere in /etc
  let k = tree.etc;
  for (const step of keySteps) {
    if (typeof k[step] !== "object") k[step] = {};
    k = k[step];
  }
  k["keys.txt"] = "KEY = " + GATE;

  // the code, somewhere in /var
  let c = tree.var;
  for (const step of codeSteps) {
    if (typeof c[step] !== "object") c[step] = {};
    c = c[step];
  }
  c["codes.txt"] = "CODE = " + PASS;

  // a handover note naming the branches, so the search is fair
  tree.home["handover.txt"] =
    "vault: under /srv, deeper than you think.\n" +
    "key:   somewhere in /etc.\n" +
    "code:  somewhere in /var.\n" +
    "this note is the only thing here that is not a copy of a copy.";

  tree.__vaultPath = "/srv/" + vaultSteps.join("/") + "/vault";
  tree.__keyText   = GATE;
  tree.__codeText  = PASS;
  return tree;
}


// ===========================================================================
//  DIFFICULTY — each level uses different words for the same four actions,
//  so muscle memory stops carrying you. The actions themselves never change.
// ===========================================================================
const TIERS = [
  { icon: "▁", list: "ls",        enter: "cd",      read: "cat",   open: "unlock"  },
  { icon: "▂", list: "list",      enter: "goto",    read: "show",  open: "breach"  },
  { icon: "▃", list: "dir",       enter: "enter",   read: "read",  open: "crack"   },
  { icon: "▄", list: "index",     enter: "move",    read: "print", open: "force"   },
  { icon: "▅", list: "scan",      enter: "travel",  read: "open",  open: "unseal"  },
  { icon: "▆", list: "enumerate", enter: "descend", read: "dump",  open: "shatter" },
];
const tierOf = level => TIERS[Math.min(level - 1, TIERS.length - 1)];

// every word accepted for each action, across all tiers — so a player who
// remembers an earlier level's word is not punished for it
const COMMON = {
  list:  ["ls", "dir", "ll", "list", "index", "scan", "enumerate"],
  enter: ["cd", "go", "goto", "enter", "move", "travel", "descend"],
  read:  ["cat", "read", "type", "show", "print", "dump"],
  open:  ["unlock", "open", "breach", "crack", "force", "unseal", "shatter"],
  run:   ["run", "exec", "execute", "./"],
  help:  ["help", "?", "man"],
  who:   ["whoami", "user"],
  wipe:  ["clear", "cls"],
};
const inList = (word, key) => COMMON[key].includes(word);


// ===========================================================================
//  STATE
// ===========================================================================
const START = ["home"];          // where a fresh run drops you

let level = 1;                   // difficulty; rises every time you win
let fs = makeTree(level);
let cwd = [...START];

let USER = "GUEST";              // the 3-character handle
const MAXNAME = 3;

// the game runs in phases: "name" -> "brief" -> "play" -> "repeat" -> "over"
let phase = "name";

let hasKey = false, hasCode = false, unlocked = false;
let runStart = 0;                // when this run started (ms)
let runCommands = 0;             // commands typed this run
let vaultPath = "/var/vault";    // where the vault is THIS run
let gateText = "blue-otter-77";  // what the key file contains THIS run
let codeText = "0815";           // what the code file contains THIS run

let CMD = { list: "ls", enter: "cd", read: "cat", open: "unlock" };

const screenEl = document.getElementById("screen");
const cmdEl = document.getElementById("cmd");
const promptEl = document.getElementById("prompt");


// ===========================================================================
//  OUTPUT
// ===========================================================================
function print(text, cls) {
  const line = document.createElement("span");
  line.className = cls || "";
  line.textContent = (text === undefined ? "" : text) + "\n";
  screenEl.appendChild(line);
  screenEl.scrollTop = screenEl.scrollHeight;
}

// Writes text one character at a time — about 4ms per character, which reads
// as a fast typewriter rather than a wait.
function printTyped(text, cls, speed) {
  const span = document.createElement("span");
  span.className = cls || "";
  screenEl.appendChild(span);
  const delay = speed || 4;
  let i = 0;
  (function step() {
    if (i >= text.length) {
      span.textContent += "\n";
      screenEl.scrollTop = screenEl.scrollHeight;
      return;
    }
    span.textContent += text[i++];
    screenEl.scrollTop = screenEl.scrollHeight;
    setTimeout(step, delay);
  })();
}

// A block of lines, typed in sequence.
function printBlock(lines, speed) {
  let i = 0;
  (function next() {
    if (i >= lines.length) return;
    const item = lines[i++];
    const text = item[0], cls = item[1];
    printTyped(text, cls, speed);
    setTimeout(next, text.length * (speed || 4) + 20);
  })();
}


// ===========================================================================
//  PATH HELPERS
// ===========================================================================
function nodeAt(path) {
  let n = fs;
  for (const part of path) {
    if (n[part] === undefined) return undefined;
    n = n[part];
  }
  return n;
}
const here = () => nodeAt(cwd);
const isDir = node => node !== undefined && typeof node !== "string";
const visibleNames = node => Object.keys(node).filter(n => !n.startsWith("__"));

function parsePath(str) {
  if (str === undefined || str === "") return [...cwd];
  if (str === "~") return [...START];
  if (str === "/") return [];

  const absolute = str.startsWith("/");
  const raw = str.startsWith("~") ? str.slice(1) : str;

  // split on slashes ONLY. ".." and "." are meaningful whole segments, and a
  // dot inside a name (readme.txt) must not be treated as a separator.
  const out = absolute ? [] : [...cwd];
  for (const seg of raw.split("/")) {
    if (seg === "" || seg === ".") continue;      // empty and "here" do nothing
    if (seg === "..") { out.pop(); continue; }    // up one level
    out.push(seg);
  }
  return out;
}

const pathStr = path => (path.length ? "/" + path.join("/") : "/");
const userTag = () => "W:" + USER;

function promptText() {
  if (phase === "name")   { promptEl.textContent = "new user >"; return; }
  if (phase === "brief")  { promptEl.textContent = userTag() + " >"; return; }
  if (phase === "repeat") { promptEl.textContent = "again? (y/n) >"; return; }
  if (phase === "over")   { promptEl.textContent = "session closed >"; return; }
  promptEl.textContent = userTag() + " " + pathStr(cwd) + " >";
}


// ===========================================================================
//  COMMANDS
// ===========================================================================
function cmdLs(arg) {
  const target = arg ? parsePath(arg) : cwd;
  const node = nodeAt(target);

  if (node === undefined) return print("no such path: " + arg, "error");
  if (!isDir(node)) return print(pathStr(target), "output");

  const names = visibleNames(node);
  if (!names.length) return print("(empty)");

  const dirs  = names.filter(n => isDir(node[n]));
  const files = names.filter(n => !isDir(node[n]));
  if (dirs.length)  print(dirs.map(n => n + "/").join("   "), "dir");
  if (files.length) print(files.join("   "), "output");
}

function cmdCd(arg) {
  const target = arg ? parsePath(arg) : [...START];
  const node = nodeAt(target);

  if (node === undefined) {
    print("no such path: " + (arg || ""), "error");
    return print("    try  " + CMD.list + "  to see what is here, or  tree  for the whole map.", "hint");
  }
  if (!isDir(node)) {
    print(pathStr(target) + " is a file, not a directory.", "error");
    return print("    did you mean:  " + CMD.read + " " + pathStr(target), "hint");
  }
  cwd = target;
  promptText();
}

function cmdCat(arg) {
  if (!arg) {
    const files = visibleNames(here()).filter(n => !isDir(here()[n]));
    if (!files.length) return print("there are no files here. try  " + CMD.list + "  or  cd ..", "error");
    print("which file? files here:");
    return print("     " + files.join("   "), "hint");
  }

  const target = parsePath(arg);
  const node = nodeAt(target);
  if (node === undefined) return print("no such file: " + arg, "error");
  if (isDir(node)) {
    print(pathStr(target) + " is a directory.", "error");
    return print("    did you mean:  " + CMD.enter + " " + pathStr(target), "hint");
  }

  print(node, "output");

  if (node.includes(gateText) && !hasKey) { hasKey = true; print(">> key acquired", "flag"); }
  if (node.includes(codeText) && !hasCode) { hasCode = true; print(">> code acquired", "flag"); }
}

// Streams a block of text one character at a time, so long output arrives the
// way the opening briefing does rather than appearing all at once.
function printStream(text, cls, speed) {
  const lines = String(text).split("\n");
  let i = 0;
  (function next() {
    if (i >= lines.length) return;
    const line = lines[i++];
    printTyped(line, cls, speed || 6);
    setTimeout(next, line.length * (speed || 6) + 40);
  })();
}

const isLog = name => /\.(log|out|err)$/i.test(name);

function cmdRun(arg) {
  if (!arg) {
    const files = visibleNames(here()).filter(n => !isDir(here()[n]));
    if (!files.length) return print("nothing here to run. try  " + CMD.list + "  or  cd ..", "error");
    print("run which file? files here:");
    return print("     " + files.join("   "), "hint");
  }

  const target = parsePath(arg);
  const node = nodeAt(target);

  if (node === undefined) return print("no such file: " + arg, "error");
  if (isDir(node)) {
    print(pathStr(target) + " is a directory.", "error");
    return print("    did you mean:  " + CMD.enter + " " + pathStr(target), "hint");
  }

  const name = target[target.length - 1] || "";

  // the vault artefact — running it is what opens the vault
  if (pathStr(target) === vaultPath + "/secret") return openVault();

  // key and code files
  const isGate = node.includes(gateText);
  const isCode = node.includes(codeText);

  if (isLog(name)) {
    // logs stream line by line
    printStream(node, "output", 5);
  } else {
    print(node, "output");
  }

  if (isGate && !hasKey) { hasKey = true; print(">> key acquired", "flag"); }
  if (isCode && !hasCode) { hasCode = true; print(">> code acquired", "flag"); }
}

function cmdUnlock() {
  if (unlocked) return print("the vault is already open.", "flag");

  // you have to be standing in the vault's own directory
  if (pathStr(cwd) !== vaultPath) {
    print("there is no vault in this directory.", "error");
    return print("    get to the vault's directory first, then try again.", "hint");
  }

  openVault();
}

// shared by the open word and by  run <vault file>
function openVault() {
  if (unlocked) return print("the vault is already open.", "flag");

  const missing = [];
  if (!hasKey)  missing.push("key    — it is in another branch");
  if (!hasCode) missing.push("code   — it is somewhere else again");
  if (missing.length) {
    print("the vault resists. still missing:", "error");
    missing.forEach(m => print("     " + m, "hint"));
    return;
  }

  unlocked = true;
  print("");
  print("key accepted.", "ok");
  print("code accepted.", "ok");
  print("executing " + vaultPath + "/secret ...");
  print("");
  printStream("  ***  GOOD JOB  ***", "flag", 14);
  const seconds = Math.max(1, Math.round((Date.now() - runStart) / 1000));
  const commands = Math.max(1, runCommands);
  const clearedLevel = level;
  setTimeout(async () => {
    print("  " + FLAG, "flag");
    print("");
    print("  difficulty " + clearedLevel + " cleared in " + seconds + "s, " + commands + " commands.", "hint");
    print("");
    await saveScore(clearedLevel, seconds, commands);
    await showScores(clearedLevel, 5);
    setTimeout(afterWin, 400);
  }, 420);
}

function cmdTree(arg) {
  // addons, written with the // prefix:   tree //f   tree /srv //1
  const flags = [];
  const real = [];
  for (const a of String(arg || "").split(/\s+/)) {
    if (!a) continue;
    if (a.startsWith("//")) flags.push(a.slice(2).toLowerCase());
    else real.push(a);
  }
  const showFiles = flags.includes("f") || flags.includes("files") || flags.includes("all");
  const maxDepth  = flags.includes("1") ? 1 : (flags.includes("2") ? 2 : Infinity);

  const base = real.length ? parsePath(real.join(" ")) : [];
  const node = nodeAt(base);
  if (node === undefined) return print("no such path: " + real.join(" "), "error");
  if (!isDir(node)) return print(pathStr(base) + " is a file, not a directory", "error");

  print(pathStr(base) || "/");
  let dirs = 0, files = 0, hidden = 0;

  (function walk(cur, prefix, depth) {
    const names = visibleNames(cur).sort();
    const shown = names.filter(n => showFiles || isDir(cur[n]));
    hidden += names.length - shown.length;

    shown.forEach((name, i) => {
      const last = i === shown.length - 1;
      const child = cur[name];
      const branch = prefix + (last ? "└── " : "├── ");
      if (isDir(child)) {
        dirs++;
        print(branch + name + "/", "dir");
        if (depth < maxDepth) walk(child, prefix + (last ? "    " : "│   "), depth + 1);
      } else {
        files++;
        print(branch + name, "output");
      }
    });
  })(node, "", 1);

  print("");
  print("  " + dirs + " directories" + (showFiles ? ", " + files + " files" : ""), "hint");
  if (!showFiles && hidden) print("  " + hidden + " files hidden — add  //f  to show them", "hint");
}

function cmdHelp(arg) {
  // "help <command>" — a full page for that command
  if (arg) {
    const asked = arg.trim().toLowerCase();
    // accept this run's word, or any of the aliases, or a bare action name
    const action = ["list","enter","read","open","run","tree","help","who","wipe"].find(k =>
      k === asked || inList(asked, k));
    if (!action) {
      print("no help for '" + arg + "'.", "error");
      return print("    try:  help  " + CMD.list + "  |  help  " + CMD.enter +
                   "  |  help  " + CMD.read + "  |  help  " + CMD.open + "  |  help tree", "hint");
    }
    return HELP_PAGES[action]();
  }

  // bare "help" — man-page shaped index, the way busybox and coreutils do it
  const rows = [
    [CMD.list,  "list directory contents"],
    [CMD.enter, "change the working directory"],
    [CMD.read,  "print the contents of a file"],
    [CMD.open,  "open the sealed vault"],
    ["run",     "execute a file (logs print line by line)"],
    ["tree",    "draw the filesystem as a tree"],
    ["scores",  "leaderboard (scores 2 = difficulty 2)"],
    ["help",    "explain a command"],
    ["whoami",  "print the current user tag"],
    ["clear",   "clear the terminal screen"],
  ];
  const w = Math.max(...rows.map(r => r[0].length)) + 2;

  print("NAME", "warn");
  print("    help — list commands, or explain one");
  print("");
  print("SYNOPSIS", "warn");
  print("    help [command]");
  print("");
  print("DESCRIPTION", "warn");
  print("    With no argument, prints the commands available in this session.");
  print("    With a command as its argument, prints that command's page.");
  print("");
  print("COMMANDS", "warn");
  rows.forEach(([n, d]) => print("    " + n.padEnd(w) + d));
  print("");
  print("ADDONS", "warn");
  print("    A command takes a second word (a subcommand) or an addon.");
  print("    Addons use a double slash and adjust how a command runs:");
  print("");
  print("        tree /var //f        show files too");
  print("        tree //1             one level deep");
  print("        clear //h            clear, then reprint this index");
  print("");
  print("SEE ALSO", "warn");
  print("    " + [CMD.list, CMD.enter, CMD.read, CMD.open, "tree", "help"].join(",  "));
  print("");
  print("EXAMPLES", "warn");
  print("    " + CMD.list + "                 what is in this directory");
  print("    " + CMD.read + " keys.txt        read a file here");
  print("    tree //1              the top level of the machine");
  print("");
  print("    this session's four core commands:", "hint");
  print("        " + CMD.list + "  |  " + CMD.enter + "  |  " + CMD.read + "  |  " + CMD.open,
        "hint");

}


// ===========================================================================
//  HELP PAGES — one per action, with the subcommands and addons for that action
//  A "subcommand" is a second word ( ls /srv , tree 3 ).  An "addon" is written
//  with the // prefix ( tree //f ) and only ever adjusts how the command runs.
// ===========================================================================
const HELP_PAGES = {

  list: () => {
    print("NAME", "warn");
    print("    " + CMD.list + " — list directory contents");
    print("");
    print("SYNOPSIS", "warn");
    print("    " + CMD.list + " [path] [//addon]");
    print("");
    print("DESCRIPTION", "warn");
    print("    Lists the entries at a path. Directories print first with a");
    print("    trailing slash; files follow. With no path it lists the");
    print("    directory you are standing in.");
    print("");
    print("SUBCOMMANDS", "warn");
    print("    " + CMD.list + "              the directory you are in");
    print("    " + CMD.list + " /srv         another directory, by full path");
    print("    " + CMD.list + " ..           the directory above this one");
    print("    " + CMD.list + " ~            your home directory");
    print("");
    print("ADDONS", "warn");
    print("    //a          also show hidden entries (names starting with .)");
    print("    //d          directories only");
    print("    //f          files only");
    print("    //l          one entry per line");
    print("");
    print("EXAMPLES", "warn");
    print("    " + CMD.list + "                 what is right here");
    print("    " + CMD.list + " /etc //a      everything in /etc, hidden included");
    print("");
    print("SEE ALSO", "warn");
    print("    help " + CMD.enter + ",  help tree");
  },

  enter: () => {
    print("NAME", "warn");
    print("    " + CMD.enter + " — change the working directory");
    print("");
    print("SYNOPSIS", "warn");
    print("    " + CMD.enter + " [path] [//addon]");
    print("");
    print("DESCRIPTION", "warn");
    print("    Moves you to another directory. Paths are absolute internally,");
    print("    so a full path works from wherever you are standing.");
    print("");
    print("SUBCOMMANDS", "warn");
    print("    " + CMD.enter + "              no argument: go home");
    print("    " + CMD.enter + " notes        go into a folder here");
    print("    " + CMD.enter + " /etc/config  jump straight to a full path");
    print("    " + CMD.enter + " ..           go up one level");
    print("    " + CMD.enter + " /            go to the root");
    print("    " + CMD.enter + " ~            go home");
    print("");
    print("ADDONS", "warn");
    print("    //p          print the path you landed on");
    print("    //v          note whether a vault is in that directory");
    print("");
    print("EXAMPLES", "warn");
    print("    " + CMD.enter + " /srv         jump to /srv from anywhere");
    print("    " + CMD.enter + " ..           step back out");
    print("");
    print("NOTES", "warn");
    print("    Path parts are separated by slashes only:");
    print("        " + CMD.enter + " /etc/config     (not  " + CMD.enter + " etc.config )");
    print("    A dot inside a name is part of the name — readme.txt is one file.");
    print("");
    print("SEE ALSO", "warn");
    print("    help " + CMD.list + ",  help tree");
  },

  read: () => {
    print("NAME", "warn");
    print("    " + CMD.read + " — print the contents of a file");
    print("");
    print("SYNOPSIS", "warn");
    print("    " + CMD.read + " <file> [//addon]");
    print("");
    print("DESCRIPTION", "warn");
    print("    Prints a file to the screen. Reading the right files is how you");
    print("    pick up the key and the code; the game says so when it happens.");
    print("");
    print("SUBCOMMANDS", "warn");
    print("    " + CMD.read + " keys.txt              read a file in this directory");
    print("    " + CMD.read + " /etc/config/keys.txt  read any file, by full path");
    print("    " + CMD.read + "                       alone: lists the files here");
    print("");
    print("ADDONS", "warn");
    print("    //n          number every line");
    print("    //1          only the first line");
    print("    //h          only lines containing KEY");
    print("    //c          only lines containing CODE");
    print("");
    print("EXAMPLES", "warn");
    print("    " + CMD.read + " /etc/config/keys.txt");
    print("    " + CMD.read + " notes/todo.txt //n     numbered lines");
    print("");
    print("SEE ALSO", "warn");
    print("    help " + CMD.list + ",  help " + CMD.open);
  },

  open: () => {
    print("NAME", "warn");
    print("    " + CMD.open + " — open the sealed vault");
    print("");
    print("SYNOPSIS", "warn");
    print("    " + CMD.open + " [//addon]");
    print("");
    print("DESCRIPTION", "warn");
    print("    Opens the vault. Three requirements, and it refuses until all");
    print("    of them are met:");
    print("");
    print("        1. you must be standing IN the vault's own directory");
    print("        2. you must have read the key file");
    print("        3. you must have read the code file");
    print("");
    print("    A refusal tells you which requirement is missing.");
    print("");
    print("SUBCOMMANDS", "warn");
    print("    (none — the vault is opened where it stands)");
    print("");
    print("ADDONS", "warn");
    print("    //s          status only: say what is still missing");
    print("    //v          say whether this directory holds the vault");
    print("");
    print("EXAMPLES", "warn");
    print("    " + CMD.open + "         attempt to open");
    print("    " + CMD.open + " //s     check what you still need");
    print("");
    print("SEE ALSO", "warn");
    print("    help " + CMD.read + ",  help tree");
  },

  tree: () => {
    print("NAME", "warn");
    print("    tree — draw the filesystem as a tree");
    print("");
    print("SYNOPSIS", "warn");
    print("    tree [path] [//addon]");
    print("");
    print("DESCRIPTION", "warn");
    print("    Draws directories as a nested tree. Files are NOT shown unless");
    print("    you ask, so the map stays readable on a large machine.");
    print("");
    print("SUBCOMMANDS", "warn");
    print("    tree              the whole tree, from the root");
    print("    tree /etc         only the /etc branch");
    print("    tree /srv/cold    any path you like");
    print("");
    print("ADDONS", "warn");
    print("    //f          also show files");
    print("    //1          one level deep only");
    print("    //2          two levels deep only");
    print("");
    print("EXAMPLES", "warn");
    print("    tree                directories, whole machine");
    print("    tree /var //f       every file under /var");
    print("    tree /srv //1       just the first level of /srv");
    print("");
    print("SEE ALSO", "warn");
    print("    help " + CMD.list + ",  help " + CMD.enter);
  },

  run: () => {
    print("NAME", "warn");
    print("    run — execute a file");
    print("");
    print("SYNOPSIS", "warn");
    print("    run <file> [//addon]");
    print("");
    print("DESCRIPTION", "warn");
    print("    Runs a file and prints what it produces. Log files stream their");
    print("    lines out one character at a time, the way the briefing does.");
    print("    Running the vault artefact is what opens the vault.");
    print("");
    print("SUBCOMMANDS", "warn");
    print("    run secret             run a file in this directory");
    print("    run /var/log/auth.log  run any file, by full path");
    print("    run                    alone: lists the files you could run");
    print("");
    print("ADDONS", "warn");
    print("    //q          quiet: print the whole file at once");
    print("");
    print("EXAMPLES", "warn");
    print("    run /var/log/auth.log");
    print("    run secret             (standing in the vault's directory)");
    print("");
    print("SEE ALSO", "warn");
    print("    help " + CMD.read + ",  help " + CMD.open);
  },

  who: () => {
    print("NAME", "warn");
    print("    whoami — print the current user tag");
    print("");
    print("SYNOPSIS", "warn");
    print("    whoami");
    print("");
    print("DESCRIPTION", "warn");
    print("    Prints the 3-character handle you chose at the start of the");
    print("    session, in the W:XXX form the prompt uses.");
    print("");
    print("SEE ALSO", "warn");
    print("    help");
  },

  wipe: () => {
    print("NAME", "warn");
    print("    clear — clear the terminal screen");
    print("");
    print("SYNOPSIS", "warn");
    print("    clear [//addon]");
    print("");
    print("DESCRIPTION", "warn");
    print("    Wipes everything printed so far.");
    print("");
    print("ADDONS", "warn");
    print("    //h          clear, then reprint the command index");
    print("");
    print("SEE ALSO", "warn");
    print("    help");
  },

  help: () => {
    print("NAME", "warn");
    print("    help — explain a command");
    print("");
    print("SYNOPSIS", "warn");
    print("    help [command]");
    print("");
    print("DESCRIPTION", "warn");
    print("    With no argument, prints the command index. With a command as");
    print("    its argument, prints that command's page. An alias from any");
    print("    difficulty level is accepted, so  help ls  and  help dir  both");
    print("    reach the listing command.");
    print("");
    print("SUBCOMMANDS", "warn");
    print("    help              the index of every command");
    print("    help <command>    the page for one command");
    print("");
    print("EXAMPLES", "warn");
    print("    help tree");
    print("    help " + CMD.read);
    print("");
    print("SEE ALSO", "warn");
    print("    every other  help  page");
  },
};


// ===========================================================================
//  LEADERBOARD (Supabase) — one row per cleared run: handle, level, time
// ===========================================================================
const OFFLINE = "leaderboard offline: Supabase is not configured (see .env.example).";

async function saveScore(lvl, seconds, commands) {
  if (!db) return print(OFFLINE, "error");
  print("saving score ...", "hint");
  const { error } = await db.from("scores").insert({
    name: USER, level: lvl, seconds: seconds, commands: commands
  });
  if (error) return print("could not save score: " + error.message, "error");
  print("score saved as " + userTag() + ".", "ok");
}

// best times for one difficulty: fastest first, fewer commands breaks ties
async function showScores(lvl, limit) {
  if (!db) return print(OFFLINE, "error");
  const { data, error } = await db
    .from("scores")
    .select("name, level, seconds, commands")
    .eq("level", lvl)
    .order("seconds", { ascending: true })
    .order("commands", { ascending: true })
    .limit(limit || 10);
  if (error) return print("scores: " + error.message, "error");

  print("");
  print("LEADERBOARD — difficulty " + lvl, "warn");
  if (!data.length) return print("    no scores yet. be the first.", "hint");
  data.forEach((r, i) => {
    const me = r.name === USER ? "   <- you" : "";
    print("    " + String(i + 1).padStart(2) + ".  W:" + r.name.padEnd(5) +
          String(r.seconds).padStart(5) + "s   " + String(r.commands).padStart(3) + " cmds" + me,
          me ? "flag" : "output");
  });
  print("");
}

function cmdScores(arg) {
  const n = parseInt(arg, 10);
  const lvl = n >= 1 && n <= TIERS.length ? n : level;
  return showScores(lvl, 10);
}

// ===========================================================================
//  DISPATCH
// ===========================================================================
function run(raw) {
  print(userTag() + " " + pathStr(cwd) + " >" + raw, "input");

  const parts = raw.split(/\s+/);
  const name = parts[0].toLowerCase();
  const arg = parts.slice(1).join(" ") || undefined;

  if (inList(name, "help"))  return cmdHelp(arg);
  if (inList(name, "list"))  return cmdLs(arg);
  if (inList(name, "enter")) return cmdCd(arg);
  if (inList(name, "read"))  return cmdCat(arg);
  if (inList(name, "run"))   return cmdRun(arg);
  if (inList(name, "open"))  return cmdUnlock(arg);
  if (inList(name, "who"))   return print(userTag() + "  (3-char handle)", "output");
  if (inList(name, "wipe"))  {
    screenEl.innerHTML = "";
    if (arg && arg.toLowerCase().startsWith("//h")) cmdHelp();
    return;
  }
  if (name === "tree" || name === "where" || name === "map") return cmdTree(arg);
  if (name === "scores" || name === "top" || name === "leaderboard") return cmdScores(arg);

  print("unknown command: " + name, "error");
  print("    this run, that is:  " + CMD.list + "  " + CMD.enter + "  " + CMD.read +
        "  run  " + CMD.open + "   (help for the rest)", "hint");
}


// ===========================================================================
//  LEVELS AND FLOW
// ===========================================================================
function loadLevel() {
  fs = makeTree(level);
  vaultPath = fs.__vaultPath || "/var/vault";
  gateText  = fs.__keyText   || "blue-otter-77";
  codeText  = fs.__codeText  || "0815";

  cwd = [...START];
  hasKey = hasCode = unlocked = false;

  const t = tierOf(level);
  CMD = { list: t.list, enter: t.enter, read: t.read, open: t.open };
}

function startRun() {
  loadLevel();
  phase = "play";
  runStart = Date.now();
  runCommands = 0;

  const t = tierOf(level);
  print("");
  printTyped("difficulty " + level + "  " + t.icon + "   words this run:  " +
             t.list + " · " + t.enter + " · " + t.read + " · " + t.open, "warn", 3);
  print("");
  print("find the vault. find the key and the code. then stand IN the vault's");
  print("directory and type  " + CMD.open + ".");
  print("");
  print("  " + CMD.list.padEnd(11) + " see what is here");
  print("  " + (CMD.enter + " <dir>").padEnd(11) + " step into a folder");
  print("  " + (CMD.read + " <file>").padEnd(11) + " read a file");
  print("  help" + " ".repeat(7) + " every command");
  print("");
  promptText();
  cmdEl.focus();
}

function afterWin() {
  phase = "repeat";
  const next = Math.min(level + 1, TIERS.length);
  print("try again?  the next run is difficulty " + next +
        (next === level ? " (already the hardest)" : " — deeper tree, more dead ends."), "warn");
  print("  y  = harder run        n  = stop here");
  print("");
  promptText();
  cmdEl.focus();
}

function handleRepeat(raw) {
  const answer = raw.trim().toLowerCase();
  if (answer === "y" || answer === "yes") {
    level = Math.min(level + 1, TIERS.length);
    print("");
    printTyped("spinning up difficulty " + level + " …", "warn", 8);
    setTimeout(startRun, 500);
    return;
  }
  phase = "over";
  print("");
  print("run over. you cleared difficulty " + level + " of " + TIERS.length + ".", "flag");
  print("reload the page for a fresh handle and another go.", "hint");
  print("");
  cmdEl.disabled = true;
  promptText();
}


// ===========================================================================
//  TAB COMPLETION
// ===========================================================================
function allPaths() {
  const out = [];
  (function walk(node, path) {
    if (!isDir(node)) return;
    for (const name of visibleNames(node)) {
      const next = [...path, name];
      const dirChild = isDir(node[name]);
      out.push({ path: next, dir: dirChild });
      if (dirChild) walk(node[name], next);
    }
  })(fs, []);
  return out;
}

function complete() {
  const parts = cmdEl.value.split(/\s+/);
  const isFirstWord = parts.length === 1;
  const stem = parts[parts.length - 1] || "";

  const words = [CMD.list, CMD.enter, CMD.read, CMD.open, "run", "tree", "scores", "help", "whoami", "clear"];
  let shown;

  if (isFirstWord) {
    shown = words.filter(w => w.startsWith(stem.toLowerCase()));
  } else {
    const base = stem.includes("/") ? stem.slice(0, stem.lastIndexOf("/") + 1) : "";
    const leaf = stem.slice(base.length);
    shown = allPaths()
      .filter(({ path }) => {
        const full = pathStr(path).slice(1);
        if (base && !full.startsWith(base.replace(/^\//, ""))) return false;
        return path[path.length - 1].startsWith(leaf);
      })
      .map(({ path, dir }) => pathStr(path) + (dir ? "/" : ""));
  }

  if (!shown.length) return print("(nothing to complete)", "hint");

  const common = shown.reduce((a, b) => {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return a.slice(0, i);
  });

  if (shown.length === 1) {
    parts[parts.length - 1] = shown[0];
    cmdEl.value = parts.join(" ") + (shown[0].endsWith("/") ? "" : " ");
    return;
  }
  print(shown.join("   "), "input");
  if (common.length > stem.length) {
    parts[parts.length - 1] = common;
    cmdEl.value = parts.join(" ");
  }
}


// ===========================================================================
//  HISTORY
// ===========================================================================
const history = [];
let histPos = 0;


// ===========================================================================
//  KEY HANDLING — one listener, switched by the current phase
// ===========================================================================
const CONTROL_KEYS = ["Backspace","Delete","ArrowLeft","ArrowRight","Home","End","Tab"];
const isControl = key => key.length > 1 && CONTROL_KEYS.includes(key);

cmdEl.addEventListener("keydown", e => {

  // ---- phase 1: choose the handle ----------------------------------------
  if (phase === "name") {
    // Enter submits early, if only one or two characters were typed
    if (e.key === "Enter") {
      e.preventDefault();
      const name = cmdEl.value.trim().toUpperCase();
      if (name.length !== MAXNAME) {
        print("  the handle must be exactly " + MAXNAME + " characters (A–Z, 0–9).", "error");
        cmdEl.value = "";
        return;
      }
      acceptName(name);
      return;
    }

    const allowed = e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key);
    if (!allowed && !isControl(e.key)) { e.preventDefault(); return; }
    if (!allowed) return;                       // backspace etc: let it through

    // the line is already full, so this keystroke would be a fourth character
    if (cmdEl.value.length >= MAXNAME) { e.preventDefault(); return; }

    // appending this character completes the handle — take it and move on
    const full = (cmdEl.value + e.key).toUpperCase();
    if (full.length === MAXNAME) {
      e.preventDefault();
      acceptName(full);
    }
    return;
  }

  // ---- phase 2: the briefing is still typing — keys are free, commands are not
  if (phase === "brief") {
    if (e.key === "Enter") { e.preventDefault(); cmdEl.value = ""; }
    return;
  }

  // ---- phase 3: playing ---------------------------------------------------
  if (phase === "play") {
    if (e.key === "Enter") {
      const raw = cmdEl.value.trim();
      cmdEl.value = "";
      if (raw) { history.push(raw); histPos = 0; runCommands++; run(raw); }
    } else if (e.key === "Tab") {
      e.preventDefault();
      complete();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (histPos < history.length) { histPos++; cmdEl.value = history[history.length - histPos]; }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histPos > 1) { histPos--; cmdEl.value = history[history.length - histPos]; }
      else { histPos = 0; cmdEl.value = ""; }
    }
    return;
  }

  // ---- phase 4: play again? ----------------------------------------------
  if (phase === "repeat") {
    if (e.key === "Enter") {
      e.preventDefault();
      const raw = cmdEl.value.trim();
      cmdEl.value = "";
      if (raw) handleRepeat(raw);
    } else if (e.key.length === 1 && !/^[ynYN]$/.test(e.key)) {
      e.preventDefault();
    }
  }
});

document.addEventListener("click", () => { if (!cmdEl.disabled) cmdEl.focus(); });


// ===========================================================================
//  ACCEPTING THE HANDLE
//  Called as soon as the third character arrives (or on Enter). It clears the
//  input, re-enables normal typing, and starts the briefing.
// ===========================================================================
function acceptName(name) {
  USER = name;
  cmdEl.value = "";
  phase = "brief";                 // no longer collecting a name
  cmdEl.maxLength = 524288;        // console lines can be as long as they like
  print("");
  print("  logged in as " + userTag(), "flag");
  print("");
  showBrief();
}

// ===========================================================================
//  BRIEFING — typed in as the game opens, then the difficulty menu
// ===========================================================================
function showBrief() {
  const lines = [
    ["TERMINAL GAME  —  a small machine, and a vault in it", "warn"],
    ["", ""],
    ["  You are a read-only guest on a simulated computer. The whole", ""],
    ["  filesystem is yours to walk. Two things in it matter:", ""],
    ["", ""],
    ["     1. the vault   — a sealed file, somewhere in the tree", ""],
    ["     2. its key, plus the code — in two other places entirely", ""],
    ["", ""],
    ["  Four commands get you there. They are named below — because", ""],
    ["  every level you clear renames them and builds a bigger, messier", ""],
    ["  tree, so the game gets harder each time you win.", ""],
    ["", ""],
    ["  starting at difficulty 1 of " + TIERS.length + " …", "warn"],
    ["", ""],
  ];
  printBlock(lines, 3);

  // when the briefing has finished typing, the run begins
  const totalTime = lines.reduce((n, l) => n + l[0].length * 3 + 20, 0);
  setTimeout(() => {
    level = 1;
    startRun();
  }, totalTime + 150);
}


// ===========================================================================
//  OPENING — ask for the handle first
// ===========================================================================
printTyped("TERMINAL GAME", "warn", 12);
print("");
print("  choose your handle — exactly 3 characters (A–Z, 0–9).");
print("  it appears in every prompt, the way a real machine shows a username:");
print("");
print("     W:AAA /home >");
print("");
promptText();
cmdEl.focus();
