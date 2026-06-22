'use client';

import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Navigation } from '../components/Navigation';

export default function Home() {
  const { user } = useSelector((state: RootState) => state.auth);

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
