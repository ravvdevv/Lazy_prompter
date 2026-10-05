import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Layout from './components/Layout/Layout';

function App() {
  return (
    <>
      <Layout />
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default App;