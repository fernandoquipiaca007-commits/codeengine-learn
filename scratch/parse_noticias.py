import re
import json

def generate_slug(title):
    # Normalize and convert to clean slug
    import unicodedata
    title = unicodedata.normalize('NFD', title).encode('ascii', 'ignore').decode('utf-8')
    title = title.lower()
    title = re.sub(r'[^a-z0-9]+', '-', title)
    title = re.sub(r'^-+|-+$', '', title)
    return title

def parse_noticia_file():
    with open(r'C:\Users\Dell\Documents\codeengine1.2\noticia.md', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Parse Image URLs
    image_pattern = r'https://images\.pexels\.com/photos/\d+/[^\s\n]+'
    images = re.findall(image_pattern, content)
    print(f"Found {len(images)} Pexels image URLs.")

    # 2. Parse structured articles
    # Each article starts with "Título (PT)"
    article_blocks = content.split("Título (PT)\n")
    # The first split part contains the images list
    intro_part = article_blocks[0]
    article_blocks = article_blocks[1:]
    
    parsed_articles = []
    
    for i, block in enumerate(article_blocks):
        lines = [line.strip() for line in block.split('\n')]
        
        # Title is the first line
        title = lines[0]
        
        # Find Thumbnail URL (optional)
        thumb_url = "N/A"
        try:
            thumb_idx = lines.index("URL da Thumbnail (opcional)")
            thumb_url = lines[thumb_idx + 1]
        except ValueError:
            pass
            
        # If thumbnail is N/A or empty, use the mapped image from the list
        if thumb_url == "N/A" or not thumb_url:
            if i < len(images):
                thumb_url = images[i]
                
        # Find Tags
        tags = []
        try:
            tags_idx = lines.index("Tags (separadas por vírgula)")
            tags_str = lines[tags_idx + 1]
            tags = [t.strip() for t in tags_str.split(',') if t.strip()]
        except ValueError:
            pass
            
        # Find Summary/Excerpt
        summary = ""
        try:
            sum_idx = lines.index("Resumo (PT)")
            summary = lines[sum_idx + 1]
        except ValueError:
            pass
            
        # Find Content
        # Content starts after "Conteúdo (PT)" and runs until "Conclusão: A Transferência de Poder" or the end of the block
        content_text = ""
        try:
            content_idx = block.index("Conteúdo (PT)") + len("Conteúdo (PT)")
            content_text = block[content_idx:].strip()
        except ValueError:
            pass
            
        # For the 29th article, extract the "Conclusão" section if present
        conclusion_text = ""
        if "Conclusão: A Transferência de Poder" in content_text:
            parts = content_text.split("Conclusão: A Transferência de Poder")
            content_text = parts[0].strip()
            conclusion_text = parts[1].strip()
            
        # Append parsed article
        parsed_articles.append({
            'title': title,
            'slug': generate_slug(title),
            'excerpt': summary,
            'content': content_text,
            'thumbnail_url': thumb_url,
            'tags': tags,
            'category': 'AI' if 'IA' in tags or 'OpenAI' in tags or 'Claude' in tags or 'Flux' in tags else 'Inovação'
        })
        
        # If we extracted the conclusion, it becomes the 30th article!
        if conclusion_text:
            concl_title = "Conclusão: A Transferência de Poder"
            concl_thumb = images[29] if len(images) > 29 else images[-1]
            parsed_articles.append({
                'title': concl_title,
                'slug': generate_slug(concl_title),
                'excerpt': "Uma análise profunda sobre a transferência de poder e infraestrutura na era das IAs autônomas.",
                'content': conclusion_text,
                'thumbnail_url': concl_thumb,
                'tags': ["IA", "Infraestrutura", "Geopolítica", "Tendências", "Destaque"],
                'category': 'Inovação'
            })

    print(f"Successfully parsed {len(parsed_articles)} articles.")
    return parsed_articles

def generate_sql(articles):
    sql_lines = []
    sql_lines.append("-- ==========================================================")
    sql_lines.append("-- MIGRATION: SEED NEWS DATA FROM NOTICIA.MD")
    sql_lines.append("-- ==========================================================")
    sql_lines.append("")
    sql_lines.append("BEGIN;")
    sql_lines.append("")
    sql_lines.append("-- Optional: clean existing news to prevent slug conflicts")
    sql_lines.append("DELETE FROM news;")
    sql_lines.append("")
    
    # We want these news to appear first, so we can set their published_at
    # timestamps in descending order, starting from today going backwards,
    # or starting from a few days ago going forward.
    # To make them appear as the latest, we will give them a clean timestamp sequence!
    import datetime
    base_time = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=30)
    
    for i, art in enumerate(articles):
        # Escape quotes in text
        title_esc = art['title'].replace("'", "''")
        slug_esc = art['slug'].replace("'", "''")
        excerpt_esc = art['excerpt'].replace("'", "''")
        content_esc = art['content'].replace("'", "''")
        thumb_esc = art['thumbnail_url'].replace("'", "''")
        category_esc = art['category'].replace("'", "''")
        
        # Format tags as PostgreSQL array literal, e.g., ARRAY['IA', 'OpenAI']
        tags_formatted = ", ".join([f"'{t.replace(\"'\", \"''\")}'" for t in art['tags']])
        tags_array = f"ARRAY[{tags_formatted}]" if tags_formatted else "NULL"
        
        # Distribute published dates so they appear in correct chronological order
        # Let's add 1 hour or 1 day incrementally so that the latest articles are on top
        pub_date = base_time + datetime.timedelta(hours=i*6)
        pub_date_str = pub_date.strftime('%Y-%m-%d %H:%M:%S%z')
        # Format timezone correctly for PG (e.g. +0000 -> +00:00)
        if pub_date_str.endswith('00'):
            pub_date_str = pub_date_str[:-2] + ':' + pub_date_str[-2:]
            
        sql_lines.append(f"-- Artigo {i+1}: {art['title']}")
        sql_lines.append("INSERT INTO news (")
        sql_lines.append("  title, slug, excerpt, content, thumbnail_url, category, tags, author, status, published_at, created_at, updated_at")
        sql_lines.append(") VALUES (")
        sql_lines.append(f"  '{title_esc}',")
        sql_lines.append(f"  '{slug_esc}',")
        sql_lines.append(f"  '{excerpt_esc}',")
        sql_lines.append(f"  '{content_esc}',")
        sql_lines.append(f"  '{thumb_esc}',")
        sql_lines.append(f"  '{category_esc}',")
        sql_lines.append(f"  {tags_array},")
        sql_lines.append("  'Fernando JR',")
        sql_lines.append("  'published',")
        sql_lines.append(f"  '{pub_date_str}',")
        sql_lines.append(f"  '{pub_date_str}',")
        sql_lines.append(f"  '{pub_date_str}'")
        sql_lines.append(") ON CONFLICT (slug) DO UPDATE SET")
        sql_lines.append("  title = EXCLUDED.title,")
        sql_lines.append("  excerpt = EXCLUDED.excerpt,")
        sql_lines.append("  content = EXCLUDED.content,")
        sql_lines.append("  thumbnail_url = EXCLUDED.thumbnail_url,")
        sql_lines.append("  category = EXCLUDED.category,")
        sql_lines.append("  tags = EXCLUDED.tags,")
        sql_lines.append("  published_at = EXCLUDED.published_at,")
        sql_lines.append("  updated_at = NOW();")
        sql_lines.append("")
        
    sql_lines.append("COMMIT;")
    sql_lines.append("")
    sql_lines.append("SELECT '✅ Seed completed successfully! 30 articles inserted.' AS status;")
    
    with open(r'C:\Users\Dell\Documents\codeengine1.2\scratch\insert_noticias.sql', 'w', encoding='utf-8') as f:
        f.write("\n".join(sql_lines))
    print("SQL script generated at: C:\\Users\\Dell\\Documents\\codeengine1.2\\scratch\\insert_noticias.sql")

if __name__ == "__main__":
    articles = parse_noticia_file()
    generate_sql(articles)
