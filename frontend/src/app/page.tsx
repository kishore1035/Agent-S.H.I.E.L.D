import React from 'react';
import AppLayout from '@/components/AppLayout';
import PageHeading from '@/app/components/PageHeading';
import TaskComposer from '@/app/components/TaskComposer';
import MetricsBentoGrid from '@/app/components/MetricsBentoGrid';
import ExecutionDag from '@/app/components/ExecutionDag';
import AgentRoster from '@/app/components/AgentRoster';
import ActivityFeed from '@/app/components/ActivityFeed';
import RunHistoryTable from '@/app/components/RunHistoryTable';

export default function WorkspacePage() {
  return (
    <AppLayout>
      <PageHeading />
      <div className="mt-8 space-y-6">
        <MetricsBentoGrid />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 2xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <TaskComposer />
            <ExecutionDag />
          </div>
          <div className="space-y-6">
            <AgentRoster />
            <ActivityFeed />
          </div>
        </div>
        <RunHistoryTable />
      </div>
    </AppLayout>
  );
}