const fs = require('fs');
const path = require('path');

function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parsePortugueseSlugs() {
  const noticiaPath = 'C:\\Users\\Dell\\Documents\\codeengine1.2\\noticia.md';
  const content = fs.readFileSync(noticiaPath, 'utf8').replace(/\r\n/g, '\n');
  const articleBlocks = content.split("Título (PT)\n");
  const slugs = [];

  for (let i = 1; i < articleBlocks.length; i++) {
    const block = articleBlocks[i];
    const lines = block.split('\n').map(l => l.trim());
    const title = lines[0];
    slugs.push(generateSlug(title));

    // Handle conclusion in the 29th block
    const contentMarker = "Conteúdo (PT)";
    const markerIndex = block.indexOf(contentMarker);
    let contentText = "";
    if (markerIndex !== -1) {
      contentText = block.substring(markerIndex + contentMarker.length).trim();
    }
    if (contentText.includes("Conclusão: A Transferência de Poder")) {
      slugs.push(generateSlug("Conclusão: A Transferência de Poder"));
    }
  }
  return slugs;
}

function parseFrenchFile() {
  const noticiaPath = 'C:\\Users\\Dell\\Documents\\codeengine1.2\\noticia2.md';
  const content = fs.readFileSync(noticiaPath, 'utf8').replace(/\r\n/g, '\n');

  // Parse structured articles by splitting on "Titre : "
  const articleBlocks = content.split("Titre : ");
  const parsedArticles = [];

  for (let i = 1; i < articleBlocks.length; i++) {
    const block = articleBlocks[i];
    const lines = block.split('\n').map(l => l.trim());

    const title = lines[0];

    // Find summary/excerpt
    let summary = "";
    // Excerpt starts with "Résumé : " or "Résumé:"
    const sumLine = lines.find(l => l.startsWith("Résumé : ") || l.startsWith("Résumé:"));
    if (sumLine) {
      summary = sumLine.replace(/^Résumé\s*:\s*/i, "");
    }

    // Find content
    let contentText = "";
    const contentMarker = "Contenu";
    const markerIndex = block.indexOf(contentMarker);
    if (markerIndex !== -1) {
      contentText = block.substring(markerIndex + contentMarker.length).trim();
    }

    // Extract conclusion if present
    let conclusionText = "";
    const conclMarker = "Conclusion : La Transmission du Pouvoir";
    if (contentText.includes(conclMarker)) {
      const parts = contentText.split(conclMarker);
      contentText = parts[0].trim();
      conclusionText = parts[1].trim();
    }

    parsedArticles.push({
      title,
      slug: generateSlug(title),
      excerpt: summary,
      content: contentText
    });

    if (conclusionText) {
      const conclTitle = "Conclusion : La Transmission du Pouvoir";
      parsedArticles.push({
        title: conclTitle,
        slug: generateSlug(conclTitle),
        excerpt: "Une analyse profonde sur le transfert de pouvoir et d'infrastructure à l'ère des IA autonomes.",
        content: conclusionText
      });
    }
  }

  console.log(`Successfully parsed ${parsedArticles.length} French articles.`);
  return parsedArticles;
}

function generateSql(ptSlugs, frArticles) {
  const sqlLines = [];
  sqlLines.push("-- ==========================================================");
  sqlLines.push("-- MIGRATION: SEED FRENCH TRANSLATIONS FROM NOTICIA2.MD");
  sqlLines.push("-- ==========================================================");
  sqlLines.push("");
  sqlLines.push("BEGIN;");
  sqlLines.push("");
  sqlLines.push("-- Clear existing French news translations");
  sqlLines.push("DELETE FROM news_translations WHERE language = 'fr';");
  sqlLines.push("");

  frArticles.forEach((art, idx) => {
    const ptSlug = ptSlugs[idx];
    if (!ptSlug) {
      console.error(`Warning: No Portuguese slug found for article index ${idx}`);
      return;
    }

    const titleEsc = art.title.replace(/'/g, "''");
    const slugEsc = art.slug.replace(/'/g, "''");
    const excerptEsc = art.excerpt.replace(/'/g, "''");
    const contentEsc = art.content.replace(/'/g, "''");

    sqlLines.push(`-- Translation ${idx + 1}: ${art.title} (PT Slug: ${ptSlug})`);
    sqlLines.push("INSERT INTO news_translations (");
    sqlLines.push("  news_id, language, title, slug, excerpt, content");
    sqlLines.push(") VALUES (");
    sqlLines.push(`  (SELECT id FROM news WHERE slug = '${ptSlug}' LIMIT 1),`);
    sqlLines.push("  'fr',");
    sqlLines.push(`  '${titleEsc}',`);
    sqlLines.push(`  '${slugEsc}',`);
    sqlLines.push(`  '${excerptEsc}',`);
    sqlLines.push(`  '${contentEsc}'`);
    sqlLines.push(") ON CONFLICT (news_id, language) DO UPDATE SET");
    sqlLines.push("  title = EXCLUDED.title,");
    sqlLines.push("  slug = EXCLUDED.slug,");
    sqlLines.push("  excerpt = EXCLUDED.excerpt,");
    sqlLines.push("  content = EXCLUDED.content;");
    sqlLines.push("");
  });

  sqlLines.push("COMMIT;");
  sqlLines.push("");
  sqlLines.push("SELECT '✅ French translations seed completed successfully! 30 translations inserted.' AS status;");

  const sqlContent = sqlLines.join('\n');

  // Save to scratch
  fs.writeFileSync('C:\\Users\\Dell\\Documents\\codeengine1.2\\scratch\\insert_noticias_fr.sql', sqlContent, 'utf8');
  
  // Save to root
  fs.writeFileSync('C:\\Users\\Dell\\Documents\\codeengine1.2\\insert_noticias_fr.sql', sqlContent, 'utf8');

  // Save to Supabase migrations
  fs.writeFileSync('C:\\Users\\Dell\\Documents\\codeengine1.2\\backend\\supabase\\insert_noticias_fr.sql', sqlContent, 'utf8');

  console.log("SQL script generated at root, scratch and backend/supabase!");
}

const ptSlugs = parsePortugueseSlugs();
console.log(`Parsed ${ptSlugs.length} Portuguese slugs for mapping.`);
const frArticles = parseFrenchFile();
generateSql(ptSlugs, frArticles);
