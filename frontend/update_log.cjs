const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'LogAktivitas.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('setDashboardData')) {
  const componentRegex = /function\s+LogPage\s*\([^)]*\)\s*\{/;
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

content = content.replace(/\{activityLog\.map/g, '{(dashboardData?.activityLog || activityLog).map');

fs.writeFileSync(filePath, content);
console.log('LogAktivitas synced');
