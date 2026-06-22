'use client';

import { Navigation } from '../components/Navigation';

export default function Home() {
  return (
    <Navigation>
      {/* Your page content goes here */}
      <div className="bg-background">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        {/* Add your dashboard content here */}
      </div>
    </Navigation>
  );
}
