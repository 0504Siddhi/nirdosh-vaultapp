const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Dark to Light mapping
  content = content.replace(/bg-navy-950/g, 'bg-[#f6f5f0]');
  content = content.replace(/bg-navy-900/g, 'bg-white');
  content = content.replace(/text-slate-100/g, 'text-slate-800');
  content = content.replace(/text-slate-200/g, 'text-slate-700');
  content = content.replace(/text-slate-300/g, 'text-slate-600');
  content = content.replace(/text-slate-400/g, 'text-slate-500');
  content = content.replace(/text-white/g, 'text-navy-950'); 
  content = content.replace(/bg-white\/5/g, 'bg-white');
  content = content.replace(/bg-white\/10/g, 'bg-slate-100');
  content = content.replace(/border-white\/10/g, 'border-slate-200');
  content = content.replace(/border-white\/20/g, 'border-slate-300');
  content = content.replace(/border-white\/5/g, 'border-slate-100');

  // Specific fixes
  content = content.replace(/text-navy-950 bg-gradient/g, 'text-white bg-gradient'); // Restore gradient text if we messed it up
  content = content.replace(/className="w-8 h-8 rounded-full bg-white text-navy-950/g, 'className="w-8 h-8 rounded-full bg-navy-900 text-white');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
