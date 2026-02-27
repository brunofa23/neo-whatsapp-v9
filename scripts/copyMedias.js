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

const root = process.cwd();

// ✅ NOVO PADRÃO: Medias na raiz do projeto
const src = path.join(root, "Medias");
const dest = path.join(root, "build", "Medias"); // ajuste se seu output for outro

console.log("[copyMedias] src:", src);
console.log("[copyMedias] dest:", dest);

copyDir(src, dest);
console.log("[copyMedias] OK");
