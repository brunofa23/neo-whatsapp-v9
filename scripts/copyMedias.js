const fs = require("fs");
const path = require("path");

function copyDir(src, dest) {
  // ✅ não quebra o build se não existir (GitHub Actions geralmente não tem mídia)
  if (!fs.existsSync(src)) {
    console.log(`[copyMedias] Pasta não existe, pulando: ${src}`);
    return;
  }

  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function removeBuildTimestamp(root) {
  const adonisrcPath = path.join(root, "build", ".adonisrc.json");

  if (!fs.existsSync(adonisrcPath)) return;

  const adonisrc = JSON.parse(fs.readFileSync(adonisrcPath, "utf8"));
  delete adonisrc.lastCompiledAt;
  fs.writeFileSync(adonisrcPath, `${JSON.stringify(adonisrc, null, 2)}\n`);
}

const root = process.cwd();

// ✅ NOVO PADRÃO: Medias na raiz do projeto
const src = path.join(root, "Medias");
const dest = path.join(root, "build", "Medias"); // ajuste se seu output for outro

console.log("[copyMedias] src:", src);
console.log("[copyMedias] dest:", dest);

copyDir(src, dest);
removeBuildTimestamp(root);
console.log("[copyMedias] OK");
