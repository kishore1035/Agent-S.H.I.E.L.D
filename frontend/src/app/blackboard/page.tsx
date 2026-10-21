import React from 'react';
import AppLayout from '@/components/AppLayout';
import BlackboardHeader from '@/app/blackboard/components/BlackboardHeader';
import BlackboardExplorer from '@/app/blackboard/components/BlackboardExplorer';
import AccessLog from '@/app/blackboard/components/AccessLog';

export default function BlackboardPage() {
  return (
    <AppLayout>
      <BlackboardHeader />
      <div className="mt-8 space-y-6">
        <BlackboardExplorer />
        <AccessLog />
      </div>
    </AppLayout>
  );
}