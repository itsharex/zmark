import fs from "node:fs";

function bump(v) {
  const [a, b, c] = v.split(".").map(Number);
  return `${a}.${b}.${c + 1}`;
}

// package.json
const pkg = JSON.parse(fs.readFileSync("package.json"));
pkg.version = bump(pkg.version);
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));

// tauri.conf.json
const tauriPath = "src-tauri/tauri.conf.json";
const tauri = JSON.parse(fs.readFileSync(tauriPath));

if (tauri.package?.version) {
  tauri.package.version = pkg.version;
} else {
  tauri.version = pkg.version;
}

fs.writeFileSync(tauriPath, JSON.stringify(tauri, null, 2));

// Cargo.toml
const cargoPath = "src-tauri/Cargo.toml";
let cargo = fs.readFileSync(cargoPath, "utf-8");

cargo = cargo.replace(
  /(\[package\][\s\S]*?version\s*=\s*")([^"]+)(")/,
  `$1${pkg.version}$3`,
);

fs.writeFileSync(cargoPath, cargo);
