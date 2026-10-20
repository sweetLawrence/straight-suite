import { useEffect, useMemo, useRef, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Alert,
  Box,
  Button,
  Card,
  Group,
  Modal,
  NumberInput,
  Paper,
  Progress,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { ArrowLeft, Check, EyeOff, ScanLine, Search, X } from 'lucide-react';
import { ActionIcon } from '@mantine/core';
import { BarcodeScanner } from '@/components/scan/BarcodeScanner';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { StatusDot } from '@/components/StatusDot';
import { ST, TAKE_STATUS, signed, varColor } from '@/components/stock-takes/parts';
import {
  useCancelStockTake,
  useDecideStockTake,
  useSaveCounts,
  useStockTake,
  useSubmitStockTake,
} from '@/hooks/useStockTakes';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import type { StockTake, StockTakeLine } from '@/lib/api/stockTakes';
import { formatCurrency } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/stock-takes/$id')({
  component: StockTakePage,
});

function StockTakePage() {
  const { id } = Route.useParams();
  const query = useStockTake(id);
  if (query.isLoading) return <LoadingState />;
  if (query.error || !query.data) return <EmptyState title="Stock take not found" />;
  const t = query.data;
  return (
    <>
      <Button
        component={Link}
        to="/stock-takes"
        variant="subtle"
        color="gray"
        size="sm"
        leftSection={<ArrowLeft size={15} />}
        mb="xs"
        px="xs"
      >
        Back to stock takes
      </Button>
      <PageHeader
        title={`${t.store} count`}
        subtitle={`${t.take_ref}${t.property ? ` · ${t.property.code}` : ''} · ${t.counted_by?.full_name ?? ''}`}
      />
      <Group gap={6} mb="md" mt={-6}>
        <StatusDot color={TAKE_STATUS[t.status].color} />
        <Text size="sm" fw={600} style={{ color: TAKE_STATUS[t.status].color }}>
          {TAKE_STATUS[t.status].label}
        </Text>
      </Group>
      {t.status === 'counting' ? <Counting take={t} /> : <Results take={t} />}
    </>
  );
}

// ─── Counting (blind) ─────────────────────────────────────────────

function Counting({ take }: { take: StockTake }) {
  const auth = useAuth();
  const save = useSaveCounts(take.id);
  const submit = useSubmitStockTake(take.id);
  const cancel = useCancelStockTake(take.id);
  const canCount = auth.hasPermission('stock_take.count');
  const lines = take.lines ?? [];

  // Local counts; changed lines are saved after a short pause
  const [counts, setCounts] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(lines.map((l) => [l.id, l.counted_qty]))
  );
  const dirty = useRef<Set<string>>(new Set());
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [q, setQ] = useState('');
  const [onlyLeft, setOnlyLeft] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [notes, setNotes] = useState('');

  const flush = async () => {
    if (!dirty.current.size) return true;
    const ids = [...dirty.current];
    dirty.current.clear();
    setSaving('saving');
    try {
      await save.mutateAsync(ids.map((i) => ({ id: i, counted_qty: counts[i] ?? null })));
      setSaving('saved');
      return true;
    } catch (err) {
      ids.forEach((i) => dirty.current.add(i));
      setSaving('error');
      notifications.show({ color: 'red', title: 'Count not saved', message: getErrorMessage(err) });
      return false;
    }
  };

  useEffect(() => {
    if (!dirty.current.size) return;
    const h = setTimeout(flush, 900);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts]);

  const setCount = (lineId: string, v: number | null) => {
    dirty.current.add(lineId);
    setCounts((c) => ({ ...c, [lineId]: v }));
  };

  const counted = Object.values(counts).filter((v) => v != null).length;
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return lines.filter(
      (l) =>
        (!onlyLeft || counts[l.id] == null) &&
        (!needle || l.name.toLowerCase().includes(needle) || (l.code || '').toLowerCase().includes(needle))
    );
  }, [lines, q, onlyLeft, counts]);

  const doSubmit = async () => {
    if (!(await flush())) return;
    try {
      await submit.mutateAsync(notes.trim() || undefined);
      notifications.show({ color: 'green', title: 'Count submitted', message: 'A manager will review the differences.' });
      setConfirm(false);
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not submit', message: getErrorMessage(err) });
    }
  };

  return (
    <Box pb={{ base: 140, sm: 90 }}>
      <Card withBorder radius="md" p="sm" mb="sm">
        <Group justify="space-between" mb={6}>
          <Text size="sm" fw={600}>
            {counted} of {lines.length} counted
          </Text>
          <Text size="xs" style={{ color: saving === 'error' ? ST.red : ST.muted }}>
            {saving === 'saving' ? 'Saving…' : saving === 'saved' ? 'Saved' : saving === 'error' ? 'Not saved' : ''}
          </Text>
        </Group>
        <Progress value={lines.length ? (counted / lines.length) * 100 : 0} radius="xl" />
        <Group gap={6} mt="xs" wrap="nowrap">
          <EyeOff size={14} color={ST.muted} />
          <Text size="xs" c="dimmed">
            Count what you see. The system figure is shown after you submit.
          </Text>
        </Group>
      </Card>

      <Group gap="sm" mb="sm" wrap="nowrap">
        <TextInput
          placeholder="Search items"
          leftSection={<Search size={16} />}
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <ActionIcon size="lg" variant="light" aria-label="Scan barcode" onClick={() => setScanning(true)}>
          <ScanLine size={18} />
        </ActionIcon>
        <SegmentedControl
          size="xs"
          value={onlyLeft ? 'left' : 'all'}
          onChange={(v) => setOnlyLeft(v === 'left')}
          data={[
            { value: 'all', label: 'All' },
            { value: 'left', label: 'Left' },
          ]}
        />
      </Group>

      <Stack gap={6}>
        {shown.map((l) => (
          <CountRow key={l.id} line={l} value={counts[l.id] ?? null} onChange={(v) => setCount(l.id, v)} disabled={!canCount} />
        ))}
        {shown.length === 0 && (
          <Text size="sm" c="dimmed" ta="center" py="lg">
            {onlyLeft ? 'Everything is counted' : 'No items match'}
          </Text>
        )}
      </Stack>

      {canCount && (
        <Paper
          shadow="lg"
          radius={0}
          p="sm"
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 'var(--bottom-nav-height, 0px)',
            zIndex: 100,
            borderTop: '1px solid #E9ECEF',
            paddingBottom: 'calc(var(--mantine-spacing-sm) + env(safe-area-inset-bottom))',
          }}
        >
          <Group gap="sm" wrap="nowrap" maw={900} mx="auto">
            <Button variant="default" color="red" loading={cancel.isPending} onClick={() => cancel.mutate()}>
              Cancel
            </Button>
            <Button style={{ flex: 1 }} disabled={!counted} onClick={() => setConfirm(true)}>
              Submit count ({counted}/{lines.length})
            </Button>
          </Group>
        </Paper>
      )}

      <BarcodeScanner
        opened={scanning}
        onClose={() => setScanning(false)}
        onCode={(code) => {
          setScanning(false);
          const hit = lines.find((l) => l.barcode === code);
          if (hit) {
            setOnlyLeft(false);
            setQ(hit.name);
          } else {
            notifications.show({ color: 'orange', title: 'Not on this count', message: `No item here has barcode ${code}` });
          }
        }}
      />

      <Modal opened={confirm} onClose={() => setConfirm(false)} title="Submit this count?">
        <Stack>
          {counted < lines.length && (
            <Alert color="orange" variant="light">
              {lines.length - counted} item{lines.length - counted === 1 ? ' is' : 's are'} not counted and will be left as
              they are.
            </Alert>
          )}
          <Text size="sm">
            The system figure is read again now, so anything sold while you counted is not called missing. A manager then
            approves the differences.
          </Text>
          <Textarea
            label="Note"
            placeholder="e.g. Two crates in the cold room counted too"
            autosize
            minRows={2}
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirm(false)}>
              Keep counting
            </Button>
            <Button loading={submit.isPending || save.isPending} onClick={doSubmit}>
              Submit
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}

function CountRow({
  line,
  value,
  onChange,
  disabled,
}: {
  line: StockTakeLine;
  value: number | null;
  onChange: (v: number | null) => void;
  disabled: boolean;
}) {
  const done = value != null;
  return (
    <Paper withBorder radius="md" px="sm" py={8} style={{ background: done ? '#F8FFF9' : '#FFFFFF' }}>
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Box style={{ minWidth: 0 }}>
          <Group gap={6} wrap="nowrap">
            {done && <Check size={14} color={ST.green} style={{ flexShrink: 0 }} />}
            <Text size="sm" fw={600} lineClamp={2}>
              {line.name}
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            {line.unit || 'units'}
            {line.pack_size ? ` · ${line.pack_label || 'pack'} of ${line.pack_size}` : ''}
          </Text>
        </Box>
        <NumberInput
          aria-label={`Count of ${line.name}`}
          placeholder="Count"
          min={0}
          decimalScale={3}
          hideControls
          inputMode="decimal"
          w={96}
          disabled={disabled}
          value={value ?? ''}
          onChange={(v) => onChange(v === '' || v == null ? null : Number(v))}
          styles={{ input: { textAlign: 'right', fontWeight: 700 } }}
        />
      </Group>
    </Paper>
  );
}

// ─── Results and decision ─────────────────────────────────────────

function Results({ take }: { take: StockTake }) {
  const auth = useAuth();
  const decide = useDecideStockTake(take.id);
  const [onlyDiff, setOnlyDiff] = useState(true);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const canDecide =
    take.status === 'submitted' && auth.hasPermission('stock_take.approve') && take.counted_by?.id !== auth.user?.id;

  const lines = (take.lines ?? []).filter((l) => l.counted_qty != null && (!onlyDiff || Number(l.variance_qty) !== 0));
  const over = (take.lines ?? []).reduce((a, l) => a + Math.max(0, Number(l.variance_value || 0)), 0);
  const notCounted = (take.lines ?? []).filter((l) => l.counted_qty == null).length;

  const run = async (decision: 'approve' | 'reject', notes?: string) => {
    try {
      await decide.mutateAsync({ decision, notes });
      notifications.show({
        color: decision === 'approve' ? 'green' : 'orange',
        title: decision === 'approve' ? 'Approved, stock corrected' : 'Rejected',
        message: take.take_ref,
      });
      setRejecting(false);
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };

  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 2, sm: take.shortage_sell_value ? 4 : 3 }} spacing="sm">
        <Tile label="Missing (at cost)" value={formatCurrency(take.shortage_value)} color={take.shortage_value ? ST.red : ST.navy} />
        {!!take.shortage_sell_value && (
          <Tile label="Missing (at selling price)" value={formatCurrency(take.shortage_sell_value)} color={ST.red} />
        )}
        <Tile label="Extra found" value={formatCurrency(over)} color={over ? ST.green : ST.navy} />
        <Tile label="Net difference" value={formatCurrency(take.variance_value)} color={varColor(take.variance_value)} />
      </SimpleGrid>

      {(take.notes || take.decision_notes || notCounted > 0) && (
        <Card withBorder radius="md" p="sm">
          <Stack gap={4}>
            {notCounted > 0 && (
              <Text size="xs" c="dimmed">
                {notCounted} item{notCounted === 1 ? ' was' : 's were'} not counted and stay as they are.
              </Text>
            )}
            {take.notes && <Text size="sm">Counter: "{take.notes}"</Text>}
            {take.decision_notes && (
              <Text size="sm">
                {take.decided_by?.full_name}: "{take.decision_notes}"
              </Text>
            )}
            {take.decided_at && (
              <Text size="xs" c="dimmed">
                {TAKE_STATUS[take.status].label} by {take.decided_by?.full_name} · {dayjs(take.decided_at).format('D MMM HH:mm')}
              </Text>
            )}
          </Stack>
        </Card>
      )}

      <Group justify="space-between">
        <Text fw={600} size="sm">
          Items
        </Text>
        <SegmentedControl
          size="xs"
          value={onlyDiff ? 'diff' : 'all'}
          onChange={(v) => setOnlyDiff(v === 'diff')}
          data={[
            { value: 'diff', label: 'Differences' },
            { value: 'all', label: 'All counted' },
          ]}
        />
      </Group>

      <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
        {lines.length === 0 ? (
          <Text size="sm" c="dimmed" p="md">
            {onlyDiff ? 'Everything counted matches the system.' : 'Nothing counted.'}
          </Text>
        ) : (
          lines.map((l) => (
            <Group
              key={l.id}
              justify="space-between"
              align="flex-start"
              wrap="nowrap"
              gap="sm"
              px="md"
              py="sm"
              style={{ borderBottom: `1px solid ${ST.line}` }}
            >
              <Box style={{ minWidth: 0 }}>
                <Text size="sm" fw={600} lineClamp={2}>
                  {l.name}
                </Text>
                <Text size="xs" c="dimmed">
                  System {Number(l.system_qty).toLocaleString('en-KE', { maximumFractionDigits: 3 })} · Counted{' '}
                  {Number(l.counted_qty).toLocaleString('en-KE', { maximumFractionDigits: 3 })} {l.unit || ''}
                </Text>
              </Box>
              <Box ta="right" style={{ flexShrink: 0 }}>
                <Text size="sm" fw={800} style={{ color: varColor(l.variance_qty) }}>
                  {signed(l.variance_qty)}
                </Text>
                <Text size="xs" style={{ color: varColor(l.variance_value) }}>
                  {formatCurrency(l.variance_value)}
                </Text>
              </Box>
            </Group>
          ))
        )}
      </Card>

      {canDecide && (
        <Group gap="sm" wrap="nowrap">
          <Button color="green" style={{ flex: 1 }} leftSection={<Check size={16} />} loading={decide.isPending} onClick={() => run('approve')}>
            Approve and correct stock
          </Button>
          <Button variant="light" color="red" leftSection={<X size={16} />} onClick={() => setRejecting(true)}>
            Reject
          </Button>
        </Group>
      )}
      {take.status === 'submitted' && !canDecide && (
        <Text size="xs" c="dimmed" ta="center">
          Waiting for a manager (not the counter) to approve.
        </Text>
      )}

      <Modal opened={rejecting} onClose={() => setRejecting(false)} title={`Reject ${take.take_ref}`}>
        <Stack>
          <Text size="sm" c="dimmed">
            Stock is not changed. Ask for a recount if the figures look wrong.
          </Text>
          <Textarea
            label="Reason"
            required
            autosize
            minRows={2}
            placeholder="e.g. Cold room not counted, please recount"
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button color="red" disabled={reason.trim().length < 3} loading={decide.isPending} onClick={() => run('reject', reason.trim())}>
              Reject
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

function Tile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card withBorder radius="md" p="sm">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fw={800} fz={{ base: 16, sm: 20 }} style={{ color, whiteSpace: 'nowrap' }}>
        {value}
      </Text>
    </Card>
  );
}
