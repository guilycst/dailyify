import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const screenshots = [
  {
    name: 'screenshot-1-home',
    titlePt: 'Dailyify - Seu Gerenciador de Tarefas',
    titleEn: 'Your Daily Task Manager',
    subtitle: 'Google Workspace Marketplace',
    bg: '#4F46E5',
  },
  {
    name: 'screenshot-2-tasks',
    titlePt: 'Gerencie Suas Tarefas',
    titleEn: 'Manage Your Tasks',
    subtitle: 'Google Workspace Marketplace',
    bg: '#7C3AED',
  },
  {
    name: 'screenshot-3-sync',
    titlePt: 'Sincronização com Google Calendar™',
    titleEn: 'Google Calendar™ Sync',
    subtitle: 'Google Workspace Marketplace',
    bg: '#0EA5E9',
  },
  {
    name: 'screenshot-4-notifications',
    titlePt: 'Lembretes Inteligentes',
    titleEn: 'Smart Reminders',
    subtitle: 'Google Workspace Marketplace',
    bg: '#F59E0B',
  },
  {
    name: 'screenshot-5-mobile',
    titlePt: 'Primeiro em Dispositivos Móveis',
    titleEn: 'Mobile First Design',
    subtitle: 'Google Workspace Marketplace',
    bg: '#10B981',
  }
];

const WIDTH = 1280;
const HEIGHT = 800;
const DIST_DIR = join(__dirname, '..', 'dist', 'images');

async function generateScreenshot({ name, titlePt, titleEn, subtitle, bg }) {
  const svg = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${bg};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1e1b4b;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      
      <!-- Portuguese main text -->
      <text x="640" y="320" font-family="Inter, Arial, sans-serif" font-size="52" font-weight="700" fill="white" text-anchor="middle">${titlePt}</text>
      
      <!-- English subtitle -->
      <text x="640" y="390" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="400" fill="rgba(255,255,255,0.75)" text-anchor="middle">${titleEn}</text>
      
      <!-- Footer -->
      <text x="640" y="760" font-family="Inter, Arial, sans-serif" font-size="16" fill="rgba(255,255,255,0.5)" text-anchor="middle">${subtitle}</text>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(join(DIST_DIR, `${name}.png`));
  
  console.log(`Generated: ${name}.png`);
}

async function main() {
  if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, { recursive: true });
  }

  console.log('Generating screenshots...');
  await Promise.all(screenshots.map(generateScreenshot));
  console.log('All screenshots generated!');
}

main().catch(console.error);
