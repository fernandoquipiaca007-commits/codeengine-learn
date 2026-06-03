const fs = require('fs');
const path = require('path');

function generateSlug(title) {
  // Simple slugifier
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseNoticiaFile() {
  const noticiaPath = 'C:\\Users\\Dell\\Documents\\codeengine1.2\\noticia.md';
  const content = fs.readFileSync(noticiaPath, 'utf8');

  // 1. Parse Image URLs
  const imageRegex = /https:\/\/images\.pexels\.com\/photos\/\d+\/[^\s\n]+/g;
  const images = [];
  let imgMatch;
  while ((imgMatch = imageRegex.exec(content)) !== null) {
    images.push(imgMatch[0]);
  }
  console.log(`Found ${images.length} Pexels image URLs.`);

  // 2. Parse structured articles by splitting on "Título (PT)"
  const articleBlocks = content.split("Título (PT)\n");
  const parsedArticles = [];

  // Ignore intro block
  for (let i = 1; i < articleBlocks.length; i++) {
    const block = articleBlocks[i];
    const lines = block.split('\n').map(l => l.trim());

    const title = lines[0];

    // Find thumbnail
    let thumbUrl = "N/A";
    const thumbIdx = lines.indexOf("URL da Thumbnail (opcional)");
    if (thumbIdx !== -1 && lines[thumbIdx + 1]) {
      thumbUrl = lines[thumbIdx + 1];
    }

    if (thumbUrl === "N/A" || !thumbUrl) {
      if (i - 1 < images.length) {
        thumbUrl = images[i - 1];
      }
    }

    // Find tags
    let tags = [];
    const tagsIdx = lines.indexOf("Tags (separadas por vírgula)");
    if (tagsIdx !== -1 && lines[tagsIdx + 1]) {
      tags = lines[tagsIdx + 1].split(',').map(t => t.trim()).filter(t => t);
    }

    // Find summary
    let summary = "";
    const sumIdx = lines.indexOf("Resumo (PT)");
    if (sumIdx !== -1 && lines[sumIdx + 1]) {
      summary = lines[sumIdx + 1];
    }

    // Find content
    let contentText = "";
    const contentMarker = "Conteúdo (PT)";
    const markerIndex = block.indexOf(contentMarker);
    if (markerIndex !== -1) {
      contentText = block.substring(markerIndex + contentMarker.length).trim();
    }

    // Extract conclusion if present
    let conclusionText = "";
    const conclMarker = "Conclusão: A Transferência de Poder";
    if (contentText.includes(conclMarker)) {
      const parts = contentText.split(conclMarker);
      contentText = parts[0].trim();
      conclusionText = parts[1].trim();
    }

    // Categories available: AI, Automação, SaaS, Programação, Produtividade, Inovação
    let category = 'Inovação';
    const hasAI = tags.some(t => /IA|openai|claude|inteligência|intelligence/i.test(t));
    const hasAutomation = tags.some(t => /automação|automation|copilot|builder/i.test(t));
    const hasSaaS = tags.some(t => /saas|startups|mercado|business/i.test(t));
    const hasProgramming = tags.some(t => /programação|programming|desenvolvedor|coding/i.test(t));
    const hasProductivity = tags.some(t => /produtividade|productivity/i.test(t));

    if (hasAI) category = 'AI';
    else if (hasAutomation) category = 'Automação';
    else if (hasSaaS) category = 'SaaS';
    else if (hasProgramming) category = 'Programação';
    else if (hasProductivity) category = 'Produtividade';

    parsedArticles.push({
      title,
      slug: generateSlug(title),
      excerpt: summary,
      content: contentText,
      thumbnail_url: thumbUrl,
      tags,
      category
    });

    if (conclusionText) {
      const conclTitle = "Conclusão: A Transferência de Poder";
      const conclThumb = images[29] || images[images.length - 1];
      parsedArticles.push({
        title: conclTitle,
        slug: generateSlug(conclTitle),
        excerpt: "Uma análise profunda sobre a transferência de poder e infraestrutura na era das IAs autônomas.",
        content: conclusionText,
        thumbnail_url: conclThumb,
        tags: ["IA", "Infraestrutura", "Geopolítica", "Tendências", "Destaque"],
        category: 'Inovação'
      });
    }
  }

  console.log(`Successfully parsed ${parsedArticles.length} articles.`);
  return parsedArticles;
}

function generateSql(articles) {
  const sqlLines = [];
  sqlLines.push("-- ==========================================================");
  sqlLines.push("-- MIGRATION: SEED NEWS DATA FROM NOTICIA.MD");
  sqlLines.push("-- ==========================================================");
  sqlLines.push("");
  sqlLines.push("BEGIN;");
  sqlLines.push("");
  sqlLines.push("-- Clear existing news to prevent conflicts");
  sqlLines.push("DELETE FROM news;");
  sqlLines.push("");

  const baseTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  articles.forEach((art, idx) => {
    const titleEsc = art.title.replace(/'/g, "''");
    const slugEsc = art.slug.replace(/'/g, "''");
    const excerptEsc = art.excerpt.replace(/'/g, "''");
    const contentEsc = art.content.replace(/'/g, "''");
    const thumbEsc = art.thumbnail_url.replace(/'/g, "''");
    const categoryEsc = art.category.replace(/'/g, "''");

    const tagsFormatted = art.tags.map(t => `'${t.replace(/'/g, "''")}'`).join(', ');
    const tagsArray = tagsFormatted ? `ARRAY[${tagsFormatted}]` : 'NULL';

    // Calculate dates incrementally
    const pubDate = new Date(baseTime.getTime() + idx * 6 * 60 * 60 * 1000); // add 6 hours per article
    const pubDateStr = pubDate.toISOString();

    sqlLines.push(`-- Artigo ${idx + 1}: ${art.title}`);
    sqlLines.push("INSERT INTO news (");
    sqlLines.push("  title, slug, excerpt, content, thumbnail_url, category, tags, author, status, published_at, created_at, updated_at");
    sqlLines.push(") VALUES (");
    sqlLines.push(`  '${titleEsc}',`);
    sqlLines.push(`  '${slugEsc}',`);
    sqlLines.push(`  '${excerptEsc}',`);
    sqlLines.push(`  '${contentEsc}',`);
    sqlLines.push(`  '${thumbEsc}',`);
    sqlLines.push(`  '${categoryEsc}',`);
    sqlLines.push(`  ${tagsArray},`);
    sqlLines.push("  'Fernando JR',");
    sqlLines.push("  'published',");
    sqlLines.push(`  '${pubDateStr}',`);
    sqlLines.push(`  '${pubDateStr}',`);
    sqlLines.push(`  '${pubDateStr}'`);
    sqlLines.push(") ON CONFLICT (slug) DO UPDATE SET");
    sqlLines.push("  title = EXCLUDED.title,");
    sqlLines.push("  excerpt = EXCLUDED.excerpt,");
    sqlLines.push("  content = EXCLUDED.content,");
    sqlLines.push("  thumbnail_url = EXCLUDED.thumbnail_url,");
    sqlLines.push("  category = EXCLUDED.category,");
    sqlLines.push("  tags = EXCLUDED.tags,");
    sqlLines.push("  published_at = EXCLUDED.published_at,");
    sqlLines.push("  updated_at = NOW();");
    sqlLines.push("");
  });

  sqlLines.push("COMMIT;");
  sqlLines.push("");
  sqlLines.push("SELECT '✅ Seed completed successfully! 30 articles inserted.' AS status;");

  const sqlPath = 'C:\\Users\\Dell\\Documents\\codeengine1.2\\scratch\\insert_noticias.sql';
  fs.writeFileSync(sqlPath, sqlLines.join('\n'), 'utf8');
  console.log(`SQL script generated at: ${sqlPath}`);
}

const articles = parseNoticiaFile();
generateSql(articles);
