const fs = require('fs');
const path = require('path');

const updateFile = (filePath, logicStr) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('setDashboardData')) {
    // Add useEffect fetch logic right after the component declaration
    const componentRegex = /function\s+(\w+Page)\s*\([^)]*\)\s*\{/;
    const match = content.match(componentRegex);
    
    if (match) {
      const injectString = `
  const [dashboardData, setDashboardData] = useState<any>(null);
  useEffect(() => {
    fetch("http://localhost:5000/api/dashboard/summary")
      .then(res => res.json())
      .then(res => { if (res.success) setDashboardData(res.data); });
  }, []);
`;
      content = content.replace(componentRegex, match[0] + injectString);
    }
  }

  // Replace variables
  content = logicStr(content);

  fs.writeFileSync(filePath, content);
};

const pagesDir = path.join(__dirname, 'src', 'pages');

// Analytics
updateFile(path.join(pagesDir, 'Analytics.tsx'), (content) => {
  return content
    .replace(/data=\{mccData\}/g, 'data={dashboardData?.mccData || mccData}')
    .replace(/\{mccData\.map/g, '{(dashboardData?.mccData || mccData).map')
    .replace(/data=\{monthlyTrend\}/g, 'data={dashboardData?.monthlyTrend || monthlyTrend}')
    .replace(/pjpList\.map/g, '(dashboardData?.top5 || pjpList).map')
    .replace(/pjpVolumes\[pjp\.name\]\?\.\[6\] \?\? 2/g, 'pjp.vol') // Since pjp already has vol from our API
    .replace(/pjp\.tier/g, 'pjp.tier || 1');
});

// Ranking
updateFile(path.join(pagesDir, 'Ranking.tsx'), (content) => {
  return content
    .replace(/const ranked = pjpList[\s\S]*?map\(d => \(\{ \.\.\.d, done: Math\.floor\(d\.vol \* 0\.88\) \}\)\);/, 
      `const ranked = (dashboardData?.top5 || pjpList)
    .map((pjp: any) => ({ ...pjp, vol: pjp.vol || 2 }))
    .sort((a: any, b: any) => b.vol - a.vol)
    .slice(0, 10)
    .map((d: any) => ({ ...d, done: Math.floor(d.vol * 0.88), tier: d.tier || 1, type: d.type || 'Bank' }));`);
});

console.log('Pages synchronized with dashboardData');
