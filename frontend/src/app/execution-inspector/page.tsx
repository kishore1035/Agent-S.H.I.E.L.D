import React from 'react';
import AppLayout from '@/components/AppLayout';
import InspectorHeader from '@/app/execution-inspector/components/InspectorHeader';
import SelfHealDiff from '@/app/execution-inspector/components/SelfHealDiff';
import SandboxTelemetry from '@/app/execution-inspector/components/SandboxTelemetry';
import LatencyWaterfall from '@/app/execution-inspector/components/LatencyWaterfall';
import ReceiptVerifier from '@/app/execution-inspector/components/ReceiptVerifier';
import AuditTrail from '@/app/execution-inspector/components/AuditTrail';

export default function ExecutionInspectorPage() {
  return (
    <AppLayout>
      <InspectorHeader />
      <div className="mt-8 space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 2xl:grid-cols-3">
          <div className="xl:col-span-2">
            <SelfHealDiff />
          </div>
          <SandboxTelemetry />
        </div>
        <LatencyWaterfall />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 2xl:grid-cols-2">
          <ReceiptVerifier />
          <AuditTrail />
        </div>
      </div>
    </AppLayout>
  );
}