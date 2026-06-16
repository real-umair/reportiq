function renderVideo(url: string): string {
  url = url.trim();
  
  // Detect YouTube
  let youtubeId = '';
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    youtubeId = ytMatch[1];
  }
  
  if (youtubeId) {
    return `<div class="relative w-full pb-[56.25%] h-0 my-6 rounded-2xl overflow-hidden shadow-2xs border border-slate-200">
      <iframe class="absolute top-0 left-0 w-full h-full" src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>`;
  }
  
  // Detect Vimeo
  let vimeoId = '';
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    vimeoId = vimeoMatch[1];
  }
  
  if (vimeoId) {
    return `<div class="relative w-full pb-[56.25%] h-0 my-6 rounded-2xl overflow-hidden shadow-2xs border border-slate-200">
      <iframe class="absolute top-0 left-0 w-full h-full" src="https://player.vimeo.com/video/${vimeoId}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
    </div>`;
  }
  
  // Direct video source
  return `<div class="my-6 rounded-2xl overflow-hidden shadow-2xs border border-slate-200 bg-slate-950">
    <video src="${url}" controls class="w-full max-h-[450px] outline-none"></video>
  </div>`;
}

function renderHtmlTable(rows: string[][], alignment: string[]): string {
  if (rows.length === 0) return '';
  
  const headers = rows[0];
  const dataRows = rows.slice(1);
  
  let headerHtml = '<thead>\n<tr class="bg-indigo-600 text-white font-semibold uppercase tracking-wider text-xs sm:text-sm">';
  headers.forEach((header, idx) => {
    const align = alignment[idx] || 'left';
    const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
    headerHtml += `<th class="py-3 px-4 border border-indigo-700/50 ${alignClass}">${header}</th>`;
  });
  headerHtml += '\n</tr>\n</thead>';
  
  let bodyHtml = '<tbody class="divide-y divide-slate-200 text-slate-700 text-xs sm:text-sm">';
  dataRows.forEach((row, rowIdx) => {
    const bgClass = rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
    bodyHtml += `<tr class="${bgClass} hover:bg-indigo-50/10 transition-colors">`;
    headers.forEach((_, colIdx) => {
      const cell = row[colIdx] || '';
      const align = alignment[colIdx] || 'left';
      const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
      bodyHtml += `<td class="py-2.5 px-4 border border-slate-200 ${alignClass}">${cell}</td>`;
    });
    bodyHtml += '</tr>';
  });
  bodyHtml += '</tbody>';
  
  return `<div class="overflow-x-auto w-full my-6 rounded-2xl border border-slate-250 shadow-2xs">
<table class="w-full border-collapse text-left font-sans">
${headerHtml}
${bodyHtml}
</table>
</div>`;
}

export function parseMarkdown(md: string): string {
  if (!md) return '';
  let html = md;

  // Escape HTML entities minimally to prevent syntax breakage but keep tags
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Restore linebreaks for markdown matching
  html = html.replace(/\r\n/g, '\n');

  // Video tags: ![video](url) or @[video](url)
  // Run this BEFORE general images so they don't capture the video markdown
  html = html.replace(/@\[video\]\((.*?)\)/gi, (match, url) => renderVideo(url));
  html = html.replace(/!\[video\]\((.*?)\)/gi, (match, url) => renderVideo(url));

  // Images: ![alt text](url)
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<div class="my-6 rounded-2xl overflow-hidden shadow-2xs border border-slate-200"><img src="$2" alt="$1" class="w-full object-cover max-h-[450px]" /></div>');

  // Headers: ###, ##, #
  html = html.replace(/^### (.*?)$/gm, '<h3 class="text-base sm:text-lg font-bold text-slate-900 mt-6 mb-2 font-display">$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2 class="text-lg sm:text-xl font-bold text-slate-950 mt-8 mb-3 border-b border-slate-150 pb-1.5 font-display">$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1 class="text-2xl sm:text-3xl font-black text-slate-955 mt-10 mb-4 font-display">$1</h1>');

  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic: *text*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Links: [text](url) - FIX text/url capture groups
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-indigo-600 hover:underline font-semibold" target="_blank" rel="noopener noreferrer">$1</a>');

  // Unordered Lists: - item or * item
  html = html.replace(/^\s*[-*]\s+(.*?)$/gm, '<li class="ml-5 list-disc leading-relaxed mt-1.5 text-slate-700 text-sm sm:text-base font-sans">$1</li>');

  // Blockquotes: > text
  html = html.replace(/^>\s+(.*?)$/gm, '<blockquote class="border-l-4 border-indigo-500 pl-4 py-2 my-5 bg-slate-50 rounded-r-2xl italic text-slate-655 text-xs sm:text-sm">$1</blockquote>');

  // Tables parsing
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let alignment: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('|')) {
      const isSeparator = /^[|\s-:]+$/.test(line) && line.replace(/[^\s-:]/g, '').length > 0;
      
      let cols = line.split('|').map(c => c.trim());
      if (line.startsWith('|')) cols.shift();
      if (line.endsWith('|')) cols.pop();

      if (isSeparator) {
        alignment = cols.map(col => {
          if (col.startsWith(':') && col.endsWith(':')) return 'center';
          if (col.endsWith(':')) return 'right';
          return 'left';
        });
        inTable = true;
      } else {
        if (!inTable) {
          const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
          const nextIsSeparator = nextLine.includes('|') && /^[|\s-:]+$/.test(nextLine) && nextLine.replace(/[^\s-:]/g, '').length > 0;
          if (nextIsSeparator) {
            inTable = true;
            tableRows = [cols];
          } else {
            processedLines.push(lines[i]);
          }
        } else {
          tableRows.push(cols);
        }
      }
    } else {
      if (inTable) {
        processedLines.push(renderHtmlTable(tableRows, alignment));
        inTable = false;
        tableRows = [];
        alignment = [];
      }
      processedLines.push(lines[i]);
    }
  }
  if (inTable) {
    processedLines.push(renderHtmlTable(tableRows, alignment));
  }
  html = processedLines.join('\n');

  // Paragraph splitting by double newline
  const segments = html.split(/\n\n+/);
  html = segments.map(seg => {
    const trimmed = seg.trim();
    if (!trimmed) return '';
    // Skip wrapping block elements in paragraph tags
    if (
      trimmed.startsWith('<h') || 
      trimmed.startsWith('<li') || 
      trimmed.startsWith('<blockquote') || 
      trimmed.startsWith('<ul') || 
      trimmed.startsWith('<ol') || 
      trimmed.startsWith('<div')
    ) {
      return trimmed;
    }
    return `<p class="leading-relaxed mb-4.5 text-slate-700 text-sm sm:text-base font-sans">${trimmed.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');

  return html;
}
