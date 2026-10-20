import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Box, Button, Group, Select, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { Download, ExternalLink, Printer } from 'lucide-react';
import { tradingToday } from '@/components/accounts/AccountsParts';
import { useProperties } from '@/hooks/useCore';
import { downloadSummary } from '@/lib/api/daySummary';
import { getErrorMessage } from '@/lib/api/client';
import { openPrint } from '@/lib/print';

/** The end-of-day summary sheet, for the accountant: pick the day, download or print it */
export function DailySummaryCard({ groupLevel, propertyId }: { groupLevel: boolean; propertyId: string | null }) {
  const properties = useProperties(1, 20);
  const [date, setDate] = useState<string>(tradingToday().format('YYYY-MM-DD'));
  const [own, setOwn] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const list = properties.data?.data ?? [];
  const pid = groupLevel ? propertyId || own || list[0]?.id || null : null;
  const params = { date, ...(pid ? { property_id: pid } : {}) };

  const excel = async () => {
    setBusy(true);
    try {
      await downloadSummary('daily', params);
    } catch (err) {
      notifications.show({ color: 'red', title: 'Download failed', message: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box mb="md" p="sm" style={{ border: '1px solid #DEE2E6', borderRadius: 8, backgroundColor: '#FFFFFF' }}>
      <Group justify="space-between" align="flex-end" gap="sm">
        <Box style={{ flex: '1 1 220px', minWidth: 0 }}>
          <Text fw={700} size="sm" c="#1F3A5F">Daily summary</Text>
          <Text size="xs" c="dimmed">The end-of-day sheet: sales by person, cash brought and carried forward, shortages and stock values.</Text>
        </Box>
        <Group gap="xs" align="flex-end" wrap="wrap">
          <DatePickerInput
            size="xs"
            w={{ base: '100%', xs: 150 }}
            valueFormat="D MMM YYYY"
            maxDate={new Date()}
            value={date}
            onChange={(v) => v && setDate(dayjs(v).format('YYYY-MM-DD'))}
          />
          {groupLevel && !propertyId && (
            <Select size="xs" w={{ base: '100%', xs: 170 }} allowDeselect={false} value={pid} onChange={setOwn} data={list.map((p) => ({ value: p.id, label: p.name }))} />
          )}
          <Button size="xs" color="#2B8A3E" leftSection={<Download size={14} />} loading={busy} disabled={groupLevel && !pid} onClick={excel}>Excel</Button>
          <Button size="xs" variant="default" leftSection={<Printer size={14} />} disabled={groupLevel && !pid}
            onClick={() => openPrint(`/summary-print?layout=daily&date=${date}${pid ? `&property_id=${pid}` : ''}`, 'Daily summary')}>Print</Button>
          <Button size="xs" variant="subtle" leftSection={<ExternalLink size={14} />} component={Link} to="/day-summary">Open</Button>
        </Group>
      </Group>
    </Box>
  );
}
